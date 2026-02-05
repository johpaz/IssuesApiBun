import { db } from './src/db';
import { users } from './src/models/schema';
import { eq } from 'drizzle-orm';

async function verify() {
    console.log('🔍 Starting verification...');

    // 1. Get a test user (create one if none exists)
    let [testUser] = await db.select().from(users).limit(1);

    if (!testUser) {
        console.log('No user found, creating a test user...');
        [testUser] = await db.insert(users).values({
            email: 'test_sub@example.com',
            name: 'Test Subscription',
            password: 'hashed_password',
            role: 'client'
        }).returning();
    }

    console.log(`Testing with user: ${testUser.id} (${testUser.email})`);

    // 2. Update user with subscription data
    await db.update(users).set({
        tieneSuscripcionMensual: true,
        isPago: false,
        linkPago: 'https://checkout.example.com/pay/123',
        finSuscripcion: '2025-12-31'
    }).where(eq(users.id, testUser.id));

    console.log('✅ Updated test user with subscription fields');

    // 3. Verify the data is there
    const [updatedUser] = await db.select().from(users).where(eq(users.id, testUser.id)).limit(1);
    console.log('Current user sub state:', {
        tieneSuscripcionMensual: updatedUser.tieneSuscripcionMensual,
        isPago: updatedUser.isPago,
        linkPago: updatedUser.linkPago,
        finSuscripcion: updatedUser.finSuscripcion
    });

    if (updatedUser.tieneSuscripcionMensual === true && updatedUser.is_pago === 0) {
        console.log('✅ Subscription fields correctly stored in DB');
    }

    console.log('🏁 Verification script finished.');
    process.exit(0);
}

verify();
