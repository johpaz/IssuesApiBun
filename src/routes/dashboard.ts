import { Elysia } from 'elysia';
import { DashboardController } from '../controllers/dashboardController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { roles } from '../config/auth';

const dashboardController = new DashboardController();

export const dashboardRoutes = new Elysia({ prefix: '/api/dashboard' })
    .derive(authenticateToken())
    .get('/stats', async ({ set }) => {
        try {
            const result = await dashboardController.getGeneralStats();
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeRoles(roles.ADMIN, roles.MANAGER)]
    })
    .get('/my-tasks', async ({ user, set }) => {
        try {
            if (!user || !user.id) {
                set.status = 401;
                return { message: 'Unauthorized.' };
            }
            const result = await dashboardController.getMyTasks(user.id);
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    })
    .get('/team', async ({ set }) => {
        try {
            const result = await dashboardController.getTeamTasks();
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeRoles(roles.ADMIN, roles.MANAGER)]
    })
    .get('/metrics', async ({ set }) => {
        try {
            const result = await dashboardController.getPerformanceMetrics();
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeRoles(roles.ADMIN, roles.MANAGER)]
    })
    .get('/client', async ({ user, set }) => {
        try {
            if (!user || !user.id) {
                set.status = 401;
                return { message: 'Unauthorized.' };
            }
            const result = await dashboardController.getClientDashboardStats(user.id);
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeRoles(roles.ADMIN, roles.MANAGER, roles.CLIENT)]
    });
