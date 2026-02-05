import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { sql } from 'drizzle-orm';
import { env } from '../config/environment';
import { logger } from '../config/logger';
import * as schemaAll from '../models/schema';

// Global variable to store database instance
let dbInstance: ReturnType<typeof drizzle> | null = null;

// Global client for connection
let tursoClient: ReturnType<typeof createClient> | null = null;

const getDbInstance = () => {
  // If instance already exists, reuse it
  if (dbInstance) {
    return dbInstance;
  }

  // If not, create a new one
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  tursoClient = createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  });

  dbInstance = drizzle(tursoClient, { schema: schemaAll });
  logger.info('New Drizzle instance created for Turso');
  return dbInstance;
};

// Export the instance (which will be created once and then reused)
export const db = getDbInstance();

/**
 * Creates all application tables using pure SQL.
 * The function is idempotent, meaning it can be safely executed
 * multiple times without causing errors if tables already exist.
 */
export async function createTables() {
  logger.info('Iniciando la creación de tablas en la base de datos');

  try {
    if (!tursoClient) {
      throw new Error('Database client not initialized');
    }

    // Use executeMultiple which is ideal for executing a script with multiple
    // SQL statements separated by semicolons (;).
    // It's more efficient than doing an `await` for each table.

    await tursoClient.executeMultiple(`
      -- Users Table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'manager', 'collaborator', 'client')) NOT NULL DEFAULT 'client',
        avatar_url TEXT,
        department TEXT,
        company TEXT,
        phone TEXT,
        created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
        updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
        notification_settings TEXT,
        preferences TEXT,
        reset_password_token TEXT,
        reset_password_expires INTEGER,
        tiene_suscripcion_mensual INTEGER DEFAULT 0,
        link_pago TEXT,
        costo_suscripcion TEXT,
        inicio_suscripcion TEXT,
        fin_suscripcion TEXT,
        dia_pago INTEGER,
        is_pago INTEGER DEFAULT 0
      );

      -- Tasks Table
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('desarrollo', 'agente', 'soporte', 'pqr', 'consultoria', 'capacitacion')),
        status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente', 'en_progreso', 'revision', 'completada', 'cancelada')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
        assignedTo TEXT NOT NULL,
        assignedBy TEXT NOT NULL,
        client INTEGER REFERENCES users(id),
        startDate TEXT,
        endDate TEXT,
        estimatedHours INTEGER,
        actualHours INTEGER DEFAULT 0,
        tags TEXT,
        attachments TEXT,
        createdAt TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
        updatedAt TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
      );

      -- Comments Table
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
        updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
      );

      -- Files Table
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        mimetype TEXT NOT NULL,
        storage_url TEXT NOT NULL UNIQUE,
        size INTEGER NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
      );

      -- Notifications Table
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        entity_id TEXT,
        entity_type TEXT,
        created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))
      );
    `);

    logger.info('Tablas creadas exitosamente (o ya existían)');

  } catch (error) {
    logger.error({ err: error }, 'Error fatal durante la creación de tablas');
    throw error;
  }
}

// Connection function to verify at startup
export const connectDB = async () => {
  try {
    // Use the already created instance
    await db.select({ version: sql`sqlite_version()` });
    logger.info('Connected to Turso and verified connection');
  } catch (error) {
    logger.error({ err: error }, 'Could not connect to or verify database connection');
    process.exit(1);
  }
};
