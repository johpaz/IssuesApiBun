import { jwt } from '@elysiajs/jwt';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/environment';

// Create JWT plugin instance for Elysia routes
export const jwtPlugin = jwt({
    name: 'jwt',
    secret: env.JWT_SECRET || 'fallback-secret-change-in-production',
    exp: env.JWT_EXPIRATION || '1h',
});

// Create a standalone JWT signer using jose for use outside Elysia context (e.g., in services)
const secretKey = new TextEncoder().encode(env.JWT_SECRET || 'fallback-secret-change-in-production');

export async function createToken(payload: { id: string; email: string; role: string }): Promise<string> {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(env.JWT_EXPIRATION || '1h')
        .sign(secretKey);
    return token;
}

export async function verifyToken(token: string): Promise<{ id: string; email: string; role: string } | null> {
    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload as { id: string; email: string; role: string };
    } catch {
        return null;
    }
}
