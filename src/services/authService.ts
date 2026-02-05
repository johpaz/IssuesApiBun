import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';
import type { AppUser, LoginInput, RegisterInput } from '../types';
import { createToken } from '../plugins/jwt';
import { logger } from '../config/logger';
import { env } from '../config/environment';
import { EmailService } from './emailService';

export class AuthService {
    mapDbUserToAppUser(dbUser: any): AppUser {
        return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            password: dbUser.password,
            role: dbUser.role,
            phone: dbUser.phone,
            avatar: dbUser.avatarUrl ?? null,
            department: dbUser.department ?? null,
            createdAt: new Date(dbUser.createdAt),
            updatedAt: new Date(dbUser.updatedAt),
        };
    }

    async register(userData: RegisterInput) {
        const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, userData.email)).limit(1);
        if (existingUser.length > 0) {
            throw new Error('User with this email already exists.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        const [newUserRecord] = await db.insert(users).values({
            email: userData.email,
            password: hashedPassword,
            department: userData.department,
            name: userData.name,
            role: userData.role,
            phone: userData.phone
        }).returning();

        if (!newUserRecord) {
            throw new Error('Failed to create user.');
        }

        const appUser = this.mapDbUserToAppUser(newUserRecord);

        const tokenPayload = {
            id: String(appUser.id),
            email: appUser.email,
            role: appUser.role,
        };
        const token = await this.generateToken(tokenPayload);

        return { user: appUser, token };
    }

    async login(credentials: LoginInput) {
        const [userRecord] = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);
        if (!userRecord) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(credentials.password, userRecord.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const appUser = this.mapDbUserToAppUser(userRecord);

        const tokenPayload = {
            id: String(appUser.id),
            email: appUser.email,
            role: appUser.role,
        };
        const token = await this.generateToken(tokenPayload);

        return { user: appUser, token };
    }

    async getMe(userIdFromToken: string) {
        const numericUserId = parseInt(userIdFromToken, 10);
        if (isNaN(numericUserId)) {
            logger.error({ userIdFromToken }, 'Invalid user ID format in token');
            return undefined;
        }

        const [userRecord] = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            password: users.password,
            role: users.role,
            avatarUrl: users.avatar,
            department: users.department,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
        }).from(users).where(eq(users.id, numericUserId)).limit(1);
        if (!userRecord) {
            return undefined;
        }
        return this.mapDbUserToAppUser(userRecord);
    }

    async forgotPassword(email: string) {
        const [userRecord] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!userRecord) {
            // We don't want to leak if a user exists or not, but the controller handles the generic message
            return;
        }

        const token = crypto.randomUUID();
        const expires = Date.now() + 3600000; // 1 hour from now

        await db.update(users).set({
            resetPasswordToken: token,
            resetPasswordExpires: expires
        }).where(eq(users.id, userRecord.id));

        const resetLink = `${env.CLIENT_URL}/reset-password?token=${token}`;

        const emailService = new EmailService();
        await emailService.sendPasswordResetEmail(email, resetLink);

        logger.info({ email }, 'Password reset email sent');
    }

    async resetPassword(token: string, newPassword: string) {
        const [userRecord] = await db.select().from(users)
            .where(eq(users.resetPasswordToken, token))
            .limit(1);

        if (!userRecord) {
            throw new Error('Invalid or expired reset token');
        }

        const now = Date.now();
        if (userRecord.resetPasswordExpires && userRecord.resetPasswordExpires < now) {
            throw new Error('Invalid or expired reset token');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.update(users).set({
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
        }).where(eq(users.id, userRecord.id));

        logger.info({ userId: userRecord.id }, 'Password reset successful');
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const numericUserId = parseInt(userId, 10);
        if (isNaN(numericUserId)) {
            throw new Error('Invalid user ID format.');
        }

        const [userRecord] = await db.select().from(users).where(eq(users.id, numericUserId)).limit(1);
        if (!userRecord) {
            throw new Error('User not found.');
        }

        const isMatch = await bcrypt.compare(currentPassword, userRecord.password);
        if (!isMatch) {
            throw new Error('Invalid current password.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.update(users).set({ password: hashedPassword }).where(eq(users.id, numericUserId));
    }

    async generateToken(payload: any) {
        return await createToken(payload);
    }
}
