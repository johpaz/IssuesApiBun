import { z } from 'zod';

// ---- AUTH TYPES ----

export const userRegistrationSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    role: z.enum(['admin', 'manager', 'collaborator', 'client']),
    phone: z.string(),
    avatar: z.string().url().optional(),
    department: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long')
});

export const registerSchema = userRegistrationSchema.pick({
    email: true,
    password: true,
    department: true,
    name: true,
    role: true,
    phone: true
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// ---- TASK TYPES ----

const taskTypeEnum = ['desarrollo', 'agente', 'soporte', 'pqr', 'consultoria', 'capacitacion'] as const;
const taskStatusEnum = ['pendiente', 'en_progreso', 'revision', 'completada', 'cancelada'] as const;
const taskPriorityEnum = ['low', 'medium', 'high'] as const;

export const taskInputSchema = z.object({
    title: z.string().min(3, 'El título es obligatorio y debe tener al menos 3 caracteres.'),
    description: z.string().min(1, 'La descripción es obligatoria.'),
    type: z.enum(taskTypeEnum),
    status: z.enum(taskStatusEnum).default('pendiente').optional(),
    priority: z.enum(taskPriorityEnum).default('medium').optional(),
    assignedTo: z.string().nullable().optional(),
    client: z.number().int().nullable().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    estimatedHours: z.number().int().min(0).optional(),
    actualHours: z.number().int().min(0).optional(),
    tags: z.array(z.string()).optional(),
    attachments: z.array(z.string().url()).optional(),
});

export const clientTaskInputSchema = z.object({
    title: z.string().min(3, 'El título es obligatorio y debe tener al menos 3 caracteres.'),
    description: z.string().min(1, 'La descripción es obligatoria.'),
    type: z.enum(taskTypeEnum),
    client: z.number().int().optional(),
    assignedBy: z.number().int().optional(),
});

export const updateTaskStatusSchema = z.object({
    status: z.enum(taskStatusEnum),
});

export const addCommentSchema = z.object({
    content: z.string().min(1, "El contenido del comentario no puede estar vacío.")
});

export type CreateTaskControllerInput = z.infer<typeof taskInputSchema>;
export type UpdateTaskControllerInput = z.infer<typeof taskInputSchema>;
export type UpdateTaskStatusControllerInput = z.infer<typeof updateTaskStatusSchema>;
export type AddCommentControllerInput = z.infer<typeof addCommentSchema>;

// ---- FILTER TYPES ----

export const taskStatusEnumValues = ['pendiente', 'en_progreso', 'revision', 'completada', 'cancelada'] as const;
export const taskPriorityEnumValues = ['low', 'medium', 'high'] as const;
export const taskTypeEnumValues = ['desarrollo', 'agente', 'soporte', 'pqr', 'consultoria', 'capacitacion'] as const;

export type TaskStatusFilter = typeof taskStatusEnumValues[number];
export type TaskPriorityFilter = typeof taskPriorityEnumValues[number];
export type TaskTypeFilter = typeof taskTypeEnumValues[number];

export interface GetTasksFilters {
    status?: TaskStatusFilter | TaskStatusFilter[];
    priority?: TaskPriorityFilter;
    assignedTo?: string;
    client?: string;
    type?: TaskTypeFilter;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    pageSize?: number;
}

// ---- USER TYPES ----

export interface AppUser {
    id: number;
    email: string;
    name: string;
    password: string;
    role: 'admin' | 'manager' | 'collaborator' | 'client';
    phone?: string;
    avatar?: string | null;
    department?: string | null;
    company?: string | null;
    createdAt: Date;
    updatedAt: Date;
    notificationSettings?: string | null;
    preferences?: string | null;
    tieneSuscripcionMensual: boolean;
    linkPago?: string | null;
    costoSuscripcion?: string | null;
    inicioSuscripcion?: string | null;
    finSuscripcion?: string | null;
    diaPago?: number | null;
    isPago: boolean;
}

export interface SafeUser {
    id: number;
    name: string;
    email: string;
    department?: string | null;
    role: 'admin' | 'manager' | 'collaborator' | 'client';
    createdAt: string;
    updatedAt: string;
}

// ---- TASK TYPES ----

export interface AppTask {
    id: number;
    title: string;
    description: string;
    type: 'desarrollo' | 'agente' | 'soporte' | 'pqr' | 'consultoria' | 'capacitacion';
    status: 'pendiente' | 'en_progreso' | 'revision' | 'completada' | 'cancelada';
    priority: 'low' | 'medium' | 'high';
    assignedTo: string;
    assignedBy: string;
    client?: number | null;
    startDate?: Date | null;
    endDate?: Date | null;
    estimatedHours?: number | null;
    actualHours?: number;
    tags?: string | null;
    attachments?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// ---- NOTIFICATION TYPES ----

export interface CreateNotificationInput {
    userId: number;
    type: string;
    message: string;
    entityId?: string;
    entityType?: string;
}

// ---- COMMENT TYPES ----

export interface NewCommentPayload {
    taskId: number;
    userId: number;
    content: string;
}
