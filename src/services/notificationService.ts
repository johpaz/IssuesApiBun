import { db } from '../db';
import { notifications, users } from '../models/schema';
import { EmailService } from './emailService';
import { eq, and, desc, sql } from 'drizzle-orm';
import { logger } from '../config/logger';
import type { CreateNotificationInput } from '../types';

export class NotificationService {
    emailService: EmailService;

    constructor() {
        this.emailService = new EmailService();
    }

    parseNumericId(idString: string | undefined, paramName = 'ID'): number | undefined {
        if (idString === undefined) return undefined;
        const numericId = parseInt(idString, 10);
        return isNaN(numericId) ? undefined : numericId;
    }

    async createNotification(input: CreateNotificationInput) {
        const payload = {
            userId: input.userId,
            type: input.type,
            message: input.message,
            isRead: "0",
            entityId: input.entityId,
            entityType: input.entityType,
        };

        const [newNotification] = await db.insert(notifications).values(payload).returning();

        if (!newNotification) {
            logger.error('Fallo al crear la notificación en la BD');
            return null;
        }

        try {
            const [user] = await db.select({ email: users.email })
                .from(users)
                .where(eq(users.id, input.userId))
                .limit(1);

            if (user && user.email) {
                if (input.type.startsWith('task_')) {
                    await this.emailService.sendNotificationEmail(
                        user.email,
                        `Notificación: ${input.type}`,
                        input.message
                    );
                }
            } else {
                logger.warn({ userId: input.userId, notificationId: newNotification.id }, 'No se pudo encontrar el email para el usuario');
            }
        } catch (error) {
            logger.error({ err: error, notificationId: newNotification.id }, 'Error enrutando la notificación');
        }

        return newNotification;
    }

    async markAsRead(notificationIdParam: string, userIdParam: string) {
        const notificationId = this.parseNumericId(notificationIdParam, 'ID de Notificación');
        const userId = this.parseNumericId(userIdParam, 'ID de Usuario');

        if (notificationId === undefined || userId === undefined) {
            logger.error('IDs inválidos para markAsRead');
            return false;
        }

        const result = await db.update(notifications)
            .set({ isRead: "1" })
            .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
            .returning({ id: notifications.id });

        return result.length > 0;
    }

    async getNotificationsForUser(
        userIdParam: string,
        limit = 10,
        offset = 0,
        unreadOnly = false
    ) {
        const userId = this.parseNumericId(userIdParam, 'ID de Usuario');
        if (userId === undefined) {
            return { notifications: [], total: 0, unreadCount: 0 };
        }

        const baseQueryConditions = [eq(notifications.userId, userId)];
        const unreadQueryConditions = [...baseQueryConditions, eq(notifications.isRead, "0")];

        const conditions = unreadOnly ? unreadQueryConditions : baseQueryConditions;

        const userNotifications = await db.select()
            .from(notifications)
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .orderBy(desc(notifications.createdAt));

        const [totalResult] = await db.select({ count: sql`count(*)` })
            .from(notifications)
            .where(and(...baseQueryConditions));

        const [unreadCountResult] = await db.select({ count: sql`count(*)` })
            .from(notifications)
            .where(and(...unreadQueryConditions));

        return {
            notifications: userNotifications,
            total: Number(totalResult?.count) || 0,
            unreadCount: Number(unreadCountResult?.count) || 0,
        };
    }

    async notifyTaskAssigned(task: any, assignedTo: any, assignedBy: any) {
        const assignedToId = this.parseNumericId(typeof assignedTo.id === 'number' ? String(assignedTo.id) : assignedTo.id);
        const taskIdString = typeof task.id === 'number' ? String(task.id) : task.id;

        if (!assignedToId) return;

        await this.createNotification({
            userId: assignedToId,
            type: 'task_assigned',
            message: `${assignedBy.name || 'Un usuario'} te ha asignado la tarea: "${task.title}".`,
            entityId: taskIdString,
            entityType: 'task',
        });
    }

    async notifyCommentAdded(task: any, commentCreator: any, taskCreator: any) {
        const taskCreatorId = this.parseNumericId(typeof taskCreator.id === 'number' ? String(taskCreator.id) : taskCreator.id);
        const taskIdString = typeof task.id === 'number' ? String(task.id) : task.id;

        if (!taskCreatorId || taskCreator.id === commentCreator.id) return;

        await this.createNotification({
            userId: taskCreatorId,
            type: 'comment_added',
            message: `${commentCreator.name || 'Un usuario'} añadió un comentario a tu tarea: "${task.title}".`,
            entityId: taskIdString,
            entityType: 'task',
        });
    }

    async notifyTaskStatusChange(task: any, changer: any) {
        const taskIdString = typeof task.id === 'number' ? String(task.id) : task.id;

        const taskCreatorIdFromDb = this.parseNumericId(String(task.assignedBy));
        const changerIdNumeric = this.parseNumericId(typeof changer.id === 'number' ? String(changer.id) : changer.id);

        if (taskCreatorIdFromDb && taskCreatorIdFromDb !== changerIdNumeric) {
            await this.createNotification({
                userId: taskCreatorIdFromDb,
                type: 'task_status_changed',
                message: `El estado de tu tarea "${task.title}" ha cambiado a ${task.status} por ${changer.name || 'un usuario'}.`,
                entityId: taskIdString,
                entityType: 'task',
            });
        }

        const assignedToIdNumeric = typeof task.assignedTo === 'string'
            ? this.parseNumericId(task.assignedTo)
            : task.assignedTo;

        if (assignedToIdNumeric && assignedToIdNumeric !== changerIdNumeric && assignedToIdNumeric !== taskCreatorIdFromDb) {
            await this.createNotification({
                userId: assignedToIdNumeric,
                type: 'task_status_changed',
                message: `El estado de tu tarea asignada "${task.title}" ha cambiado a ${task.status} por ${changer.name || 'un usuario'}.`,
                entityId: taskIdString,
                entityType: 'task',
            });
        }
    }
}
