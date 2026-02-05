import { NotificationService } from '../services/notificationService';
import { logger } from '../config/logger';

export class NotificationController {
    notificationService: NotificationService;

    constructor() {
        this.notificationService = new NotificationService();
    }

    async getNotifications(userId: string, query: any) {
        const limit = query.limit ? parseInt(query.limit, 10) : 10;
        const offset = query.offset ? parseInt(query.offset, 10) : 0;
        const unreadOnly = query.unreadOnly === 'true';

        return await this.notificationService.getNotificationsForUser(userId, limit, offset, unreadOnly);
    }

    async markAsRead(notificationId: string, userId: string) {
        const success = await this.notificationService.markAsRead(notificationId, userId);
        if (!success) {
            throw new Error('Notification not found or permission denied.');
        }
        return { message: 'Notification marked as read.' };
    }
}
