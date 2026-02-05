import { Elysia, t } from 'elysia';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const notificationController = new NotificationController();

export const notificationRoutes = new Elysia({ prefix: '/api/notifications' })
    .derive(authenticateToken())
    .get('/', async ({ user, query, set }) => {
        try {
            if (!user || !user.id) {
                set.status = 401;
                return { message: 'No autorizado.' };
            }
            const result = await notificationController.getNotifications(user.id.toString(), query);
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    })
    .patch('/:id/read', async ({ params, user, set }) => {
        try {
            if (!user || !user.id) {
                set.status = 401;
                return { message: 'No autorizado.' };
            }
            const result = await notificationController.markAsRead(params.id, user.id.toString());
            set.status = 200;
            return result;
        } catch (error: any) {
            if (error.message === 'Notification not found or permission denied.') {
                set.status = 404;
                return { message: error.message };
            }
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    });