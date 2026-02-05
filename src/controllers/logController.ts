import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export class LogController {
    getLogs() {
        const logFilePath = resolve(process.cwd(), 'logs', 'combined.log');

        if (existsSync(logFilePath)) {
            const logs = readFileSync(logFilePath, 'utf-8');
            return logs;
        } else {
            return 'No se encontraron logs.';
        }
    }
}
