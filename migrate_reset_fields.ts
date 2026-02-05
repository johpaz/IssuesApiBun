import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('🚀 Starting schema migration...');
    try {
        await db.run(sql`ALTER TABLE users ADD COLUMN reset_password_token TEXT`);
        console.log('✅ Added column reset_password_token');
    } catch (e: any) {
        console.log('⚠️ Could not add reset_password_token (maybe it already exists):', e.message);
    }

    try {
        await db.run(sql`ALTER TABLE users ADD COLUMN reset_password_expires INTEGER`);
        console.log('✅ Added column reset_password_expires');
    } catch (e: any) {
        console.log('⚠️ Could not add reset_password_expires (maybe it already exists):', e.message);
    }

    console.log('🏁 Migration finished.');
    process.exit(0);
}

migrate();
