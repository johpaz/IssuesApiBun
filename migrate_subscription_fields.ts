import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('🚀 Starting subscription fields migration...');

    const newColumns = [
        { name: 'tiene_suscripcion_mensual', type: 'INTEGER DEFAULT 0' },
        { name: 'link_pago', type: 'TEXT' },
        { name: 'costo_suscripcion', type: 'TEXT' },
        { name: 'inicio_suscripcion', type: 'TEXT' },
        { name: 'fin_suscripcion', type: 'TEXT' },
        { name: 'dia_pago', type: 'INTEGER' },
        { name: 'is_pago', type: 'INTEGER DEFAULT 0' }
    ];

    for (const column of newColumns) {
        try {
            await db.run(sql.raw(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`));
            console.log(`✅ Added column ${column.name}`);
        } catch (e: any) {
            console.log(`⚠️ Could not add ${column.name} (maybe it already exists):`, e.message);
        }
    }

    console.log('🏁 Migration finished.');
    process.exit(0);
}

migrate();
