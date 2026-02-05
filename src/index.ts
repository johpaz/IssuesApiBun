import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { connectDB, createTables } from './db';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { taskRoutes } from './routes/tasks';
import { dashboardRoutes } from './routes/dashboard';
import { notificationRoutes } from './routes/notifications';
import { jwtPlugin } from './plugins/jwt';
import { logger } from './config/logger';
import { env } from './config/environment';

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Create tables
        await createTables();

        // Create Elysia app with CORS and JWT plugin
        const app = new Elysia()
            .use(cors({
                origin: env.CLIENT_URL || 'http://localhost:5173',
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
            }))
            .use(jwtPlugin)
            .get('/', () => 'TaskMaster IA Backend is healthy and running!')
            .use(authRoutes)
            .use(userRoutes)
            .use(taskRoutes)
            .use(dashboardRoutes)
            .use(notificationRoutes)
            .listen(process.env.PORT || 3001);

        logger.info({ hostname: app.server?.hostname, port: app.server?.port }, 'Elysia server is running');
    } catch (error: any) {
        logger.error({ err: error }, 'Failed to start server');
        process.exit(1);
    }
};

startServer();
