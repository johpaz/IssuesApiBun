import { db } from './src/db';
import { users } from './src/models/schema';
import * as fs from 'fs';

async function checkUsers() {
    try {
        const allUsers = await db.select().from(users);
        const data = allUsers.map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role
        }));
        fs.writeFileSync('users_debug.json', JSON.stringify(data, null, 2));
        console.log(`Found ${allUsers.length} users. Saved to users_debug.json`);
    } catch (error: any) {
        fs.writeFileSync('users_debug.json', JSON.stringify({ error: error.message }, null, 2));
        console.error('Error checking users:', error);
    }
    process.exit(0);
}

await checkUsers();
