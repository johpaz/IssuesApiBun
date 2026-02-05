import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function checkSchema() {
    try {
        const res: any = await db.run(sql`PRAGMA table_info(users)`);
        console.log(JSON.stringify(res, null, 2));
    } catch (error) {
        console.error('Error checking schema:', error);
    }
    process.exit(0);
}

checkSchema();
