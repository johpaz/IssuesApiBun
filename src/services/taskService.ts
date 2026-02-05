import { db } from '../db';
import { tasks, users, comments as commentsSchema } from '../models/schema';
import { eq, desc, and, sql, count, or, asc, like } from 'drizzle-orm';
import { NotificationService } from './notificationService';
import { EmailService } from './emailService';
import { logger } from '../config/logger';
import type { GetTasksFilters, NewCommentPayload } from '../types';

export class TaskService {
    notificationService: NotificationService;
    emailService: EmailService;

    constructor() {
        this.notificationService = new NotificationService();
        this.emailService = new EmailService();
    }

    convertDates(task: any, toISO: boolean) {
        if (!task) return task;
        const newTask = { ...task };
        if (newTask.startDate) {
            newTask.startDate = toISO ? newTask.startDate.toISOString() : new Date(newTask.startDate);
        }
        if (newTask.endDate) {
            newTask.endDate = toISO ? newTask.endDate.toISOString() : new Date(newTask.endDate);
        }
        return newTask;
    }

    parseNumericId(idString: string, paramName = 'ID'): number {
        const numericId = parseInt(idString, 10);
        if (isNaN(numericId)) {
            throw Object.assign(new Error(`${paramName} debe ser un número válido. Recibido: '${idString}'`), { statusCode: 400 });
        }
        return numericId;
    }

    async getTasks(filters: GetTasksFilters) {
        const {
            status, priority, assignedTo, client, type, search,
            sortBy = 'createdAt', sortOrder = 'desc',
            page = 1, pageSize = 10,
        } = filters;

        const conditions: any[] = [];
        if (Array.isArray(status)) {
            conditions.push(sql`status IN (${status.join(',')})`);
        } else if (status) {
            conditions.push(eq(tasks.status, status));
        }
        if (priority) conditions.push(eq(tasks.priority, priority));
        if (assignedTo) conditions.push(eq(tasks.assignedTo, assignedTo));
        if (client) conditions.push(eq(tasks.client, parseInt(client, 10)));
        if (type) conditions.push(eq(tasks.type, type));

        if (search) {
            const searchTerm = `%${search}%`;
            conditions.push(or(like(tasks.title, searchTerm), like(tasks.description, searchTerm)));
        }

        const sortColumn = (tasks as any)[sortBy];

        let query = db.select().from(tasks)
            .where(and(...conditions));

        if (sortColumn) {
            query = (query as any).orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn));
        } else {
            query = (query as any).orderBy(desc(tasks.createdAt));
        }

        query = (query as any).limit(pageSize).offset((page - 1) * pageSize);

        const resultTasks = (await query).map((task: any) => this.convertDates(task, false));

        const totalResult = await db.select({ count: sql`count(*)` }).from(tasks).where(and(...conditions));
        const total = Number(totalResult[0]?.count) || 0;

        return { data: resultTasks, total, page, pageSize };
    }

    async getTasksByUser(userId: number) {
        const userTasks = await db.select().from(tasks).where(eq(tasks.assignedBy, userId.toString()));
        return userTasks.map((task: any) => this.convertDates(task, false));
    }

    async createTask(taskData: any) {
        const dataToInsert = this.convertDates(taskData, true);
        const [createdTask] = await db.insert(tasks).values(dataToInsert).returning();

        if (!createdTask) {
            throw new Error('Fallo al crear la tarea.');
        }

        try {
            const collaborators = await db.select().from(users).where(eq(users.role, 'collaborator')).limit(1);
            if (collaborators.length > 0) {
                const assignedToId = collaborators[0].id;
                await db.update(tasks).set({ assignedTo: assignedToId.toString() }).where(eq(tasks.id, createdTask.id));
                createdTask.assignedTo = assignedToId.toString();
            }

            const admins = await db.select().from(users).where(eq(users.role, 'admin'));
            for (const admin of admins) {
                await this.notificationService.createNotification({
                    userId: admin.id,
                    type: 'new_task',
                    message: `Se ha creado una nueva tarea: "${createdTask.title}"`,
                    entityId: createdTask.id.toString(),
                    entityType: 'task',
                });
            }

            const clientUser = await db.select().from(users).where(eq(users.id, parseInt(createdTask.client?.toString() || '0', 10))).limit(1);
            if (clientUser.length > 0) {
                await this.emailService.sendTaskConfirmationEmail(clientUser[0], createdTask);
            }

        } catch (error) {
            logger.error({ err: error }, 'Error en el proceso de post-creación de tarea');
        }

        return this.convertDates(createdTask, false);
    }

    async getTaskById(idParam: string) {
        const id = parseInt(idParam, 10);
        const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
        if (!task) return undefined;
        return this.convertDates(task, false);
    }

    async updateTask(idParam: string, updateData: any, changer: any) {
        const id = parseInt(idParam, 10);
        const dataToUpdate = this.convertDates(updateData, true);
        const payloadWithTimestamp = { ...dataToUpdate, updatedAt: sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))` };

        const [updatedTask] = await db.update(tasks)
            .set(payloadWithTimestamp)
            .where(eq(tasks.id, id))
            .returning();

        if (updatedTask) {
            const clientUser = await this.getClientByTaskId(updatedTask.id);
            if (clientUser) {
                await this.emailService.sendEmail(
                    clientUser.email,
                    `Task Updated: ${updatedTask.title}`,
                    `The task "${updatedTask.title}" has been updated.`
                );
            }

            // Generate notification for status change if applicable
            if (updateData.status) {
                await this.notificationService.notifyTaskStatusChange(updatedTask, changer);
            }

            // Generate notification for assignment change if applicable
            if (updateData.assignedTo) {
                const assignedToUser = await db.select().from(users).where(eq(users.id, parseInt(updateData.assignedTo, 10))).limit(1);
                if (assignedToUser.length > 0) {
                    await this.notificationService.notifyTaskAssigned(updatedTask, assignedToUser[0], changer);
                }
            }
        }

        return this.convertDates(updatedTask, false);
    }

    async getClientByTaskId(taskId: number) {
        const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
        if (task && task.client) {
            const [clientUser] = await db.select().from(users).where(eq(users.id, task.client)).limit(1);
            return clientUser;
        }
        return null;
    }

    async deleteTask(idParam: string) {
        const id = parseInt(idParam, 10);
        const result = await db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
        return result.length > 0;
    }

    async updateTaskStatus(idParam: string, statusInput: any, changer: any) {
        const id = parseInt(idParam, 10);
        const [updatedTask] = await db.update(tasks)
            .set({
                status: statusInput.status,
                updatedAt: sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`
            })
            .where(eq(tasks.id, id))
            .returning();

        if (updatedTask) {
            await this.notificationService.notifyTaskStatusChange(updatedTask, changer);
        }

        return updatedTask;
    }

    async addComment(commentData: NewCommentPayload) {
        const [newComment] = await db.insert(commentsSchema).values(commentData).returning();
        if (!newComment) {
            throw new Error('Fallo al añadir comentario.');
        }
        return newComment;
    }

    async getCommentsByTaskId(taskIdParam: string) {
        const taskId = parseInt(taskIdParam, 10);
        return db.select()
            .from(commentsSchema)
            .where(eq(commentsSchema.taskId, taskId))
            .orderBy(desc(commentsSchema.createdAt));
    }

    async getAllTasks() {
        return db.select().from(tasks);
    }
}
