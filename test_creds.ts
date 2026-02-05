import bcrypt from 'bcryptjs';
import { db } from './src/db';
import { users } from './src/models/schema';
import { eq } from 'drizzle-orm';

async function testLogin(email: string, password: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
        console.log(`User ${email} NOT FOUND`);
        return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Email: ${email}, Password: "${password}", Match: ${isMatch}`);
}

// Credentials from .env
const adminEmail = 'noreply@tuprofedeia.com.co';
const adminPass = 'JacN6WImR8KUq5Wp';

console.log('--- TESTING CREDENTIALS ---');
await testLogin(adminEmail, adminPass);
await testLogin('john.paez@tuprofedeia.com.co', adminPass);
await testLogin('john.paez@tuprofedeia.com.co', 'admin123');
await testLogin('john.paez@tuprofedeia.com.co', 'app123');
console.log('---------------------------');
process.exit(0);
