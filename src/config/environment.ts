import { z } from 'zod';

const envSchema = z.object({
    // General and Server Variables
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),

    // Database (Turso)
    DATABASE_URL: z.string().url('La URL de la base de datos debe ser una URL válida.'),
    DATABASE_AUTH_TOKEN: z.string().min(1, 'DATABASE_AUTH_TOKEN es requerido.'),

    // Authentication JWT
    JWT_SECRET: z.string().min(10, 'JWT_SECRET debe tener al menos 10 caracteres.'),
    JWT_EXPIRATION: z.string().min(1, 'JWT_EXPIRATION es requerido (ej. "1h", "7d").'),

    // AI (Gemini)
    GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY es requerida.'),

    // Email (Resend)
    RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY es requerida.'),
    EMAIL_FROM: z.string().email().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),

    // Admin User (for initial setup)
    ADMIN_EMAIL: z.string().email('El email del admin debe ser un email válido.'),
    ADMIN_PASSWORD: z.string().min(8, 'La contraseña del admin debe tener al menos 8 caracteres.'),

    // File Upload Configuration
    MAX_FILE_SIZE: z.string().regex(/^\d+$/).transform(Number).default('5242880'),
    UPLOAD_PATH: z.string().default('./uploads'),

    // Frontend URL
    CLIENT_URL: z.string().url('La URL del cliente debe ser una URL válida.').optional(),

    // Firebase Admin SDK and Storage
    FIREBASE_TYPE: z.string().min(1, "FIREBASE_TYPE es requerido (ej. 'service_account')."),
    FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID es requerido."),
    FIREBASE_PRIVATE_KEY_ID: z.string().min(1, "FIREBASE_PRIVATE_KEY_ID es requerido."),
    FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY es requerido."),
    FIREBASE_CLIENT_EMAIL: z.string().email("FIREBASE_CLIENT_EMAIL debe ser un email válido."),
    FIREBASE_CLIENT_ID: z.string().min(1, "FIREBASE_CLIENT_ID es requerido."),
    FIREBASE_AUTH_URI: z.string().url("FIREBASE_AUTH_URI debe ser una URL válida."),
    FIREBASE_TOKEN_URI: z.string().url("FIREBASE_TOKEN_URI debe ser una URL válida."),
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: z.string().url("FIREBASE_AUTH_PROVIDER_X509_CERT_URL debe ser una URL válida."),
    FIREBASE_CLIENT_X509_CERT_URL: z.string().url("FIREBASE_CLIENT_X509_CERT_URL debe ser una URL válida."),
    FIREBASE_STORAGE_BUCKET: z.string().min(1, "FIREBASE_STORAGE_BUCKET es requerido (ej. 'tu-proyecto.appspot.com')."),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error(
        '❌ Variables de entorno inválidas detectadas por Zod. Por favor, revisa tu archivo .env:',
    );
    parsedEnv.error.issues.forEach((issue) => {
        console.error(`  - Campo: ${issue.path.join('.')}`);
        console.error(`    Mensaje: ${issue.message}`);
    });
    throw new Error('Variables de entorno inválidas. El servidor no puede iniciar.');
}

// Export parsed and validated environment variables
export const env = parsedEnv.data;

// Optional: Log confirmation (without showing sensitive values)
console.log('✅ Variables de entorno cargadas y validadas exitosamente.');
