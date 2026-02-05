import { env } from './environment';

// Validate that environment variables exist
if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

let effectiveJwtExpiration: string;
if (!env.JWT_EXPIRATION) {
    effectiveJwtExpiration = '1h';
} else {
    effectiveJwtExpiration = env.JWT_EXPIRATION;
}

// Build jwtConfig object
export const jwtConfig = {
    secret: env.JWT_SECRET,
    expiresIn: effectiveJwtExpiration,
};

// Define roles based on User interface
export const roles = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    COLLABORATOR: 'collaborator',
    CLIENT: 'client',
} as const;

export type Role = typeof roles[keyof typeof roles];

// Token payload type
export interface TokenPayload {
    id: string;
    email: string;
    role: Role;
}


