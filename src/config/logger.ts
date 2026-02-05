import pino from 'pino';
import { env } from './environment';

// Create Pino logger with pretty printing in development
export const logger = pino({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            singleLine: false,
        }
    } : undefined,
    base: {
        env: env.NODE_ENV,
    },
});
