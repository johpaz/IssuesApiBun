import { TaskService } from '../services/taskService';
import { TaskClassifierService } from '../ai/services/taskClassifierService';
import { TimeEstimator } from '../ai/services/timeEstimator';
import type { CreateTaskControllerInput, UpdateTaskControllerInput, UpdateTaskStatusControllerInput, AddCommentControllerInput } from '../types';

export class TaskController {
    taskService: TaskService;
    taskClassifierService: TaskClassifierService;
    timeEstimator: TimeEstimator;

    constructor() {
        this.taskService = new TaskService();
        this.taskClassifierService = new TaskClassifierService();
        this.timeEstimator = new TimeEstimator();
    }

    parseNumericId(idString: string, paramName = 'ID'): number {
        if (idString === undefined) {
            throw Object.assign(new Error(`${paramName} es requerido.`), { statusCode: 400 });
        }
        const id = parseInt(idString, 10);
        if (isNaN(id)) {
            throw Object.assign(new Error(`${paramName} debe ser un número válido. Recibido: '${idString}'`), { statusCode: 400 });
        }
        return id;
    }

    async getTasks(query: any) {
        const filters = {
            status: query.status,
            priority: query.priority,
            assignedTo: query.assignedTo ? query.assignedTo : undefined,
            client: query.client ? query.client : undefined,
            type: query.type,
            search: query.search,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            page: query.page ? parseInt(query.page, 10) : 1,
            pageSize: query.pageSize ? parseInt(query.pageSize, 10) : 10,
        };

        if (filters.page && filters.page < 1) filters.page = 1;
        if (filters.pageSize && (filters.pageSize < 1 || filters.pageSize > 100)) filters.pageSize = 10;

        if (filters.status === 'non-completed') {
            filters.status = ['pendiente', 'en_progreso', 'revision'];
        }

        const result = await this.taskService.getTasks(filters);
        return result;
    }

    async getMyTasks(userId: string) {
        const userIdNum = this.parseNumericId(userId, 'ID de usuario');
        const tasks = await this.taskService.getTasksByUser(userIdNum);
        return { tasks };
    }

    async createTask(body: any, userRole: string, userId: string) {
        const creatorId = this.parseNumericId(userId, 'ID del creador');
        let servicePayload: any;

        if (userRole === 'client') {
            const classification = await this.taskClassifierService.classifyTask({
                title: body.title,
                description: body.description,
            });

            const estimation = await this.timeEstimator.estimateTime({
                taskTitle: body.title,
                taskDescription: body.description,
            });

            const priorityMap: Record<string, string> = { low: 'low', medium: 'medium', high: 'high' };

            servicePayload = {
                title: body.title,
                description: body.description,
                type: body.type,
                status: 'pendiente',
                priority: priorityMap[classification.suggestedPriority] || 'medium',
                assignedBy: creatorId.toString(),
                client: creatorId.toString(),
                startDate: new Date(),
                endDate: null,
                estimatedHours: estimation.estimatedTimeHours || null,
                tags: classification.suggestedTags || [],
                assignedTo: creatorId.toString(),
                actualHours: 0,
                attachments: [],
            };

        } else {
            servicePayload = {
                title: body.title,
                description: body.description,
                type: body.type,
                status: body.status || 'pendiente',
                priority: body.priority || 'medium',
                assignedBy: creatorId.toString(),
                assignedTo: body.assignedTo ? this.parseNumericId(body.assignedTo.toString(), 'assignedTo').toString() : '',
                client: body.client ? this.parseNumericId(body.client.toString(), 'client').toString() : '',
                startDate: body.startDate || new Date(),
                endDate: body.endDate || null,
                estimatedHours: body.estimatedHours ?? null,
                actualHours: body.actualHours ?? 0,
                tags: body.tags ?? [],
                attachments: body.attachments ?? [],
            };
        }

        const newTask = await this.taskService.createTask(servicePayload);
        return newTask;
    }

    async getTaskById(id: string) {
        const task = await this.taskService.getTaskById(id);
        if (!task) {
            throw new Error('Tarea no encontrada.');
        }
        return task;
    }

    async updateTask(id: string, body: any, user: any) {
        const servicePayload: any = {};
        Object.keys(body).forEach((key) => {
            const K = key;
            if (body[K] !== undefined) {
                if ((K === 'startDate' || K === 'endDate') && body[K]) {
                    servicePayload[K] = body[K] instanceof Date ? body[K].toISOString() : body[K];
                } else {
                    servicePayload[K] = body[K];
                }
            }
        });
        if ('assignedTo' in body) servicePayload.assignedTo = body.assignedTo === undefined ? undefined : (body.assignedTo?.toString() || '');
        if ('client' in body) servicePayload.client = body.client === undefined ? undefined : (body.client ? body.client.toString() : '');

        const updatedTask = await this.taskService.updateTask(id, servicePayload, user);
        if (!updatedTask) {
            throw new Error('Tarea no encontrada o actualización fallida.');
        }
        return updatedTask;
    }

    async deleteTask(id: string) {
        const success = await this.taskService.deleteTask(id);
        if (!success) {
            throw new Error('Tarea no encontrada o ya eliminada.');
        }
        return { success: true };
    }

    async updateTaskStatus(id: string, body: any, user: any) {
        const updatedTask = await this.taskService.updateTaskStatus(id, body, user);
        if (!updatedTask) {
            throw new Error('Tarea no encontrada o actualización de estado fallida.');
        }
        return updatedTask;
    }

    async addCommentToTask(id: string, body: any, userId: string) {
        const taskId = this.parseNumericId(id, 'ID de tarea');
        const userIdNum = this.parseNumericId(userId, 'ID de usuario');

        const commentServicePayload = {
            taskId: taskId,
            userId: userIdNum,
            content: body.content,
        };

        const newComment = await this.taskService.addComment(commentServicePayload);
        return newComment;
    }

    async getDashboardMetrics() {
        const tasks = await this.taskService.getAllTasks();

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t: any) => t.status === 'completada').length;
        const inProgressTasks = tasks.filter((t: any) => t.status === 'en_progreso').length;
        const pendingTasks = tasks.filter((t: any) => t.status === 'pendiente').length;
        const overdueTasks = tasks.filter((t: any) => {
            if (!t.endDate) return false;
            const end = new Date(t.endDate);
            return end < new Date() && t.status !== 'completada';
        }).length;

        const completedWithTime = tasks.filter((t: any) =>
            t.status === 'completada' && t.actualHours !== null && t.actualHours > 0
        );
        const averageCompletionTime = completedWithTime.length > 0
            ? completedWithTime.reduce((sum: number, t: any) => sum + (t.actualHours), 0) / completedWithTime.length
            : 0;

        return {
            totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            overdueTasks,
            averageCompletionTime
        };
    }
}
