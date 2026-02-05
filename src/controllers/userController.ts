import { db } from '../db';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';
import type { SafeUser } from '../types';

export class UserController {
    async getUsers() {
        const allUsers = await db.select().from(users).all();

        const safeUsers: SafeUser[] = allUsers.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));

        return safeUsers;
    }

    async getUserById(id: string) {
        const numericId = Number(id);
        const [user] = await db.select().from(users).where(eq(users.id, numericId)).limit(1);

        if (!user) {
            throw new Error('User not found.');
        }

        const safeUser: SafeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        return safeUser;
    }

    async updateUser(id: string, updateData: any) {
        const dataToUpdate = { ...updateData };

        delete dataToUpdate.password;
        delete dataToUpdate.id;
        delete dataToUpdate.createdAt;

        const numericId = Number(id);
        const [updatedUser] = await db
            .update(users)
            .set(dataToUpdate)
            .where(eq(users.id, numericId))
            .returning();

        if (!updatedUser) {
            throw new Error('User not found or update failed.');
        }

        const safeUser: SafeUser = {
            id: updatedUser.id,
            name: updatedUser.name,
            department: updatedUser.department,
            email: updatedUser.email,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        };

        return safeUser;
    }

    async deleteUser(id: string) {
        const numericId = Number(id);
        const result = await db.delete(users).where(eq(users.id, numericId)).returning();

        if (result.length === 0) {
            throw new Error('User not found.');
        }

        return { message: 'el usuario a sido eliminado con exito' };
    }

    async updateNotificationSettings(id: string, notificationSettings: any) {
        const numericId = Number(id);

        const [updatedUser] = await db
            .update(users)
            .set({ notificationSettings: JSON.stringify(notificationSettings) })
            .where(eq(users.id, numericId))
            .returning();

        if (!updatedUser) {
            throw new Error('User not found or update failed.');
        }

        return { message: 'Notification settings updated successfully.' };
    }

    async updatePreferences(id: string, preferences: any) {
        const numericId = Number(id);

        const [updatedUser] = await db
            .update(users)
            .set({ preferences: JSON.stringify(preferences) })
            .where(eq(users.id, numericId))
            .returning();

        if (!updatedUser) {
            throw new Error('User not found or update failed.');
        }

        return { message: 'Preferences updated successfully.' };
    }

    async getSubscriptionStatus(id: string) {
        const numericId = Number(id);
        const [user] = await db.select().from(users).where(eq(users.id, numericId)).limit(1);

        if (!user) {
            throw new Error('User not found.');
        }

        const today = new Date();
        // Assume format YYYY-MM-DD
        const finSuscripcion = user.finSuscripcion ? new Date(user.finSuscripcion) : null;

        // Reset time for today to compare dates only
        today.setHours(0, 0, 0, 0);
        if (finSuscripcion) finSuscripcion.setHours(0, 0, 0, 0);

        const isActive = user.tieneSuscripcionMensual &&
            user.isPago &&
            finSuscripcion &&
            finSuscripcion >= today;

        let reason = 'Suscripción activa';
        if (!user.tieneSuscripcionMensual) reason = 'No tiene suscripción mensual';
        else if (!user.isPago) reason = 'Pago pendiente';
        else if (!finSuscripcion) reason = 'Fecha de fin de suscripción no definida';
        else if (finSuscripcion < today) reason = 'Suscripción expirada';

        return {
            id: user.id,
            active: !!isActive,
            reason,
            finSuscripcion: user.finSuscripcion,
            linkPago: user.linkPago
        };
    }
}
