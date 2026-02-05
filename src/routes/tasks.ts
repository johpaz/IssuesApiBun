import { Elysia, t } from 'elysia';
import { TaskController } from '../controllers/taskController';
import { taskInputSchema, updateTaskStatusSchema, addCommentSchema, clientTaskInputSchema } from '../types';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { roles } from '../config/auth';

const taskController = new TaskController();

export const taskRoutes = new Elysia({ prefix: '/api/tasks' })
    .derive(authenticateToken())
    .get('/', async ({ query, set }) => {
        try {
            const result = await taskController.getTasks(query);
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    })
    .get('/my-tasks', async ({ user, set }) => {
        try {
            if (!user || !user.id) {
                set.status = 401;
                return { message: 'No autorizado.' };
            }
            const result = await taskController.getMyTasks(user.id);
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    })
    .post('/', async ({ body, user, set }) => {
        try {
            if (!user || !user.id) {
                set.status = 401;
                return { message: 'No autorizado.' };
            }

            const schema = user.role === 'client' ? clientTaskInputSchema : taskInputSchema;
            const result = await taskController.createTask(body, user.role, user.id);
            set.status = 201;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeRoles(roles.ADMIN, roles.MANAGER, roles.COLLABORATOR, roles.CLIENT)]
    })
    .get('/:id', async ({ params, set }) => {
        try {
            const result = await taskController.getTaskById(params.id);
            if (!result) {
                set.status = 404;
                return { message: 'Tarea no encontrada.' };
            }
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    })
    .post('/metrics', async ({ set }) => {
        try {
            const result = await taskController.getDashboardMetrics();
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeRoles(roles.ADMIN, roles.MANAGER, roles.COLLABORATOR)]
    })
    .put('/:id', async ({ params, body, user, set }) => {
        try {
            if (!user || !user.id) {
                set.status = 401;
                return { message: 'No autorizado.' };
            }
            const result = await taskController.updateTask(params.id, body, user);
            if (!result) {
                set.status = 404;
                return { message: 'Tarea no encontrada o actualización fallida.' };
            }
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeRoles(roles.ADMIN, roles.MANAGER, roles.COLLABORATOR)]
    })
    .delete('/:id', async ({ params, set }) => {
        try {
            const result = await taskController.deleteTask(params.id);
            if (!result.success) {
                set.status = 404;
                return { message: 'Tarea no encontrada o ya eliminada.' };
            }
            set.status = 204;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        beforeHandle: [authorizeRoles(roles.ADMIN, roles.MANAGER)]
    })
    .patch('/:id/status', async ({ params, body, user, set }) => {
        try {
            if (!user || !user.id) {
                set.status = 401;
                return { message: 'No autorizado.' };
            }
            const result = await taskController.updateTaskStatus(params.id, body, user);
            if (!result) {
                set.status = 404;
                return { message: 'Tarea no encontrada o actualización de estado fallida.' };
            }
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        body: updateTaskStatusSchema,
        beforeHandle: [authorizeRoles(roles.ADMIN, roles.MANAGER, roles.COLLABORATOR)]
    })
    .post('/:id/comments', async ({ params, body, user, set }) => {
        try {
            if (!user || !user.id) {
                set.status = 401;
                return { message: 'No autorizado.' };
            }
            const result = await taskController.addCommentToTask(params.id, body, user.id);
            set.status = 201;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        body: addCommentSchema
    });
