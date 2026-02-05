import { Elysia, t } from 'elysia';
import { AuthController } from '../controllers/authController';
import { loginSchema, registerSchema } from '../types';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { roles } from '../config/auth';

const authController = new AuthController();

export const authRoutes = new Elysia({ prefix: '/api/auth' })
    .post('/login', async ({ body, set }) => {
        try {
            const result = await authController.login(body);
            set.status = 200;
            return result;
        } catch (error: any) {
            if (error.message === 'Invalid credentials') {
                set.status = 401;
                return { message: 'Invalid email or password.' };
            }
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        body: loginSchema
    })
    .post('/register-first-admin', async ({ body, set }) => {
        try {
            const result = await authController.register(body);
            set.status = 201;
            return result;
        } catch (error: any) {
            if (error.message === 'User with this email already exists.') {
                set.status = 409;
                return { message: error.message };
            }
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        body: registerSchema
    })
    .post('/forgot-password', async ({ body, set }) => {
        try {
            const result = await authController.forgotPassword(body.email);
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        body: t.Object({
            email: t.String()
        })
    })
    .post('/reset-password', async ({ body, set }) => {
        try {
            const result = await authController.resetPassword(body.token, body.newPassword);
            set.status = 200;
            return result;
        } catch (error: any) {
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        body: t.Object({
            token: t.String(),
            newPassword: t.String()
        })
    })
    // Protected routes start here
    .derive(authenticateToken())
    .post('/register', async ({ body, set }) => {
        try {
            const result = await authController.register(body);
            set.status = 201;
            return result;
        } catch (error: any) {
            if (error.message === 'User with this email already exists.') {
                set.status = 409;
                return { message: error.message };
            }
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        body: registerSchema,
        beforeHandle: [authorizeRoles(roles.ADMIN)]
    })
    .get('/me', async ({ user, set }) => {
        try {
            if (!user || !user.id) {
                set.status = 401;
                return { message: 'Not authenticated or user ID missing in token.' };
            }
            const result = await authController.getMe(user.id);
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
    })
    .post('/change-password', async ({ body, user, set }) => {
        try {
            if (!user || !user.id) {
                set.status = 401;
                return { message: 'Not authenticated.' };
            }
            const result = await authController.changePassword(user.id, body.currentPassword, body.newPassword);
            set.status = 200;
            return result;
        } catch (error: any) {
            if (error.message === 'Invalid current password.') {
                set.status = 400;
                return { message: error.message };
            }
            set.status = 500;
            return { message: error.message || 'Internal server error' };
        }
    }, {
        body: t.Object({
            currentPassword: t.String(),
            newPassword: t.String()
        })
    });
