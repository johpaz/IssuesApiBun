import bcrypt from 'bcryptjs';
import { db } from './index';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';
import { env } from '../config/environment';
import { logger } from '../config/logger';

async function seedAdmin() {
    logger.info('🚀 Starting admin seeding process...');

    try {
        const adminEmail = env.ADMIN_EMAIL;
        const adminPassword = env.ADMIN_PASSWORD;

        // Check if admin already exists
        const [existingAdmin] = await db.select()
            .from(users)
            .where(eq(users.email, adminEmail))
            .limit(1);

        if (existingAdmin) {
            logger.info({ email: adminEmail }, '✅ Admin user already exists. Updating password to match .env...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            await db.update(users)
                .set({ password: hashedPassword })
                .where(eq(users.id, existingAdmin.id));

            logger.info('✅ Admin password updated successfully.');
        } else {
            logger.info({ email: adminEmail }, '👤 Admin user not found. Creating new admin...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            await db.insert(users).values({
                email: adminEmail,
                password: hashedPassword,
                name: 'System Admin',
                role: 'admin',
                department: 'Systems'
            });

            logger.info('✅ Admin user created successfully.');
        }

    } catch (error: any) {
        logger.error({ err: error }, '❌ Error seeding admin user');
    } finally {
        process.exit(0);
    }
}

seedAdmin();
