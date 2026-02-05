import { Elysia, t } from 'elysia';
import { UserController } from '../controllers/userController';
import { authenticateToken, authorizeRoles, authorizeSelfOrRoles } from '../middleware/auth';
import { roles } from '../config/auth';

const userController = new UserController();

export const userRoutes = new Elysia({ prefix: '/api/users' })
    .derive(authenticateToken())
    .get('/', async ({ set }) => {
        try {
            const result = await userController.getUsers();
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeRoles(roles.ADMIN, roles.MANAGER)]
    })
    .get('/:id', async ({ params, set }) => {
        try {
            const result = await userController.getUserById(params.id);
            set.status = 200;
            return result;
        } catch (error: any) {
            if (error.message === 'User not found.') {
                set.status = 404;
                return { message: error.message };
            }
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeRoles(roles.ADMIN, roles.MANAGER)]
    })
    .put('/:id', async ({ params, body, set }) => {
        try {
            const result = await userController.updateUser(params.id, body);
            set.status = 200;
            return result;
        } catch (error: any) {
            if (error.message === 'User not found or update failed.') {
                set.status = 404;
                return { message: error.message };
            }
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeSelfOrRoles(roles.ADMIN)]
    })
    .put('/:id/notifications', async ({ params, body, set }) => {
        try {
            const result = await userController.updateNotificationSettings(params.id, body);
            set.status = 200;
            return result;
        } catch (error: any) {
            if (error.message === 'User not found or update failed.') {
                set.status = 404;
                return { message: error.message };
            }
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeSelfOrRoles(roles.ADMIN)]
    })
    .put('/:id/preferences', async ({ params, body, set }) => {
        try {
            const result = await userController.updatePreferences(params.id, body);
            set.status = 200;
            return result;
        } catch (error: any) {
            if (error.message === 'User not found or update failed.') {
                set.status = 404;
                return { message: error.message };
            }
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeSelfOrRoles(roles.ADMIN)]
    })
    .delete('/:id', async ({ params, set }) => {
        try {
            const result = await userController.deleteUser(params.id);
            set.status = 204;
            return result;
        } catch (error: any) {
            if (error.message === 'User not found.') {
                set.status = 404;
                return { message: error.message };
            }
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeRoles(roles.ADMIN)]
    })
    .get('/:id/subscription-status', async ({ params, set }) => {
        try {
            const result = await userController.getSubscriptionStatus(params.id);
            set.status = 200;
            return result;
        } catch (error: any) {
            if (error.message === 'User not found.') {
                set.status = 404;
                return { message: error.message };
            }
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeSelfOrRoles(roles.ADMIN, roles.MANAGER)]
    });
