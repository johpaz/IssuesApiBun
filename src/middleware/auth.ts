import { z } from 'zod';
import { verifyToken } from '../plugins/jwt';
import { logger } from '../config/logger';
import { roles, type TokenPayload } from '../config/auth';

// Elysia context type with user
export interface AuthContext {
    user?: TokenPayload;
}

export function authenticateToken() {
    return async ({ headers, set }: { headers: Record<string, string | undefined>; set: any }) => {
        const authHeader = headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            logger.warn({ headers }, 'No authentication token provided');
            set.status = 401;
            return { message: 'Authentication token required.' };
        }

        const decodedPayload = await verifyToken(token);
        if (!decodedPayload) {
            logger.warn({ token: token.substring(0, 10) + '...' }, 'Invalid or expired token');
            set.status = 403;
            return { message: 'Invalid or expired token.' };
        }

        logger.info({ userId: decodedPayload.id, role: decodedPayload.role }, 'User authenticated');
        return { user: decodedPayload as TokenPayload };
    };
}

export function authorizeRoles(...allowedRoles: string[]) {
    return async ({ user, set }: { user?: TokenPayload; set: any }) => {
        if (!user || !user.role) {
            set.status = 403;
            return { message: 'Access denied. User role not found in token.' };
        }
        if (!allowedRoles.includes(user.role)) {
            set.status = 403;
            return { message: 'Access denied. Insufficient permissions.' };
        }
        return { authorized: true };
    };
}

export function authorizeSelfOrRoles(...allowedRoles: string[]) {
    return async ({ user, params, set }: { user?: TokenPayload; params?: any; set: any }) => {
        if (!user || !user.id || !user.role) {
            set.status = 403;
            return { message: 'Access denied. User information not found in token.' };
        }

        const userIdFromToken = user.id.toString();
        const userIdFromParams = params?.id;

        logger.debug({
            userIdFromToken,
            userIdFromParams,
            userRole: user.role,
            allowedRoles
        }, 'Authorization check');

        if (userIdFromToken === userIdFromParams) {
            logger.debug('Access granted (self)');
            return { authorized: true };
        }

        if (allowedRoles.length > 0 && allowedRoles.includes(user.role)) {
            logger.debug('Access granted (role)');
            return { authorized: true };
        }

        logger.debug('Access denied');
        set.status = 403;
        return { message: 'Access denied. Insufficient permissions.' };
    };
}

export function validate<T>(schema: z.ZodSchema<T>) {
    return async ({ body, set }: { body: any; set: any }) => {
        const result = schema.safeParse(body);
        if (!result.success) {
            const formattedErrors = result.error.issues.map((issue: z.ZodIssue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            }));
            set.status = 400;
            return { errors: formattedErrors };
        }
        return { data: result.data };
    };
}
