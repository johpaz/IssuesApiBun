import { integer, text, sqliteTable, numeric } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// ---- USER SCHEMA (SQLite) ----
export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    password: text('password').notNull(),
    role: text('role', { enum: ['admin', 'manager', 'collaborator', 'client'] })
        .notNull()
        .default('client'),
    avatar: text('avatar_url'),
    department: text('department'),
    company: text('company'),
    phone: text('phone'),
    createdAt: text('created_at')
        .notNull()
        .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
    updatedAt: text('updated_at')
        .notNull()
        .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
    notificationSettings: text('notification_settings'),
    preferences: text('preferences'),
    resetPasswordToken: text('reset_password_token'),
    resetPasswordExpires: integer('reset_password_expires'),
    tieneSuscripcionMensual: integer('tiene_suscripcion_mensual', { mode: 'boolean' }).default(false),
    linkPago: text('link_pago'),
    costoSuscripcion: text('costo_suscripcion'),
    inicioSuscripcion: text('inicio_suscripcion'),
    finSuscripcion: text('fin_suscripcion'),
    diaPago: integer('dia_pago'),
    isPago: integer('is_pago', { mode: 'boolean' }).default(false),
});

// ---- TASK SCHEMA (SQLite) ----
export const tasks = sqliteTable('tasks', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    type: text('type', {
        enum: ['desarrollo', 'agente', 'soporte', 'pqr', 'consultoria', 'capacitacion'],
    }).notNull(),
    status: text('status', {
        enum: ['pendiente', 'en_progreso', 'revision', 'completada', 'cancelada'],
    })
        .notNull()
        .default('pendiente'),
    priority: text('priority', {
        enum: ['low', 'medium', 'high'],
    })
        .notNull()
        .default('medium'),

    assignedTo: text('assignedTo').notNull(),
    assignedBy: text('assignedBy').notNull(),
    client: integer('client').references(() => users.id),
    startDate: text('startDate'),
    endDate: text('endDate'),
    estimatedHours: integer('estimatedHours'),
    actualHours: integer('actualHours').default(0),
    tags: text('tags'),
    attachments: text('attachments'),
    createdAt: text('createdAt')
        .notNull()
        .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
    updatedAt: text('updatedAt')
        .notNull()
        .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
});

// ---- COMMENT SCHEMA (SQLite) ----
export const comments = sqliteTable('comments', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    taskId: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: text('created_at')
        .notNull()
        .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
    updatedAt: text('updated_at')
        .notNull()
        .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
});

// ---- FILE SCHEMA (SQLite) ----
export const files = sqliteTable('files', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    filename: text('filename').notNull(),
    mimetype: text('mimetype').notNull(),
    storageUrl: text('storage_url').notNull().unique(),
    size: integer('size').notNull(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    taskId: integer('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    createdAt: text('created_at')
        .notNull()
        .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
});

// ---- NOTIFICATION SCHEMA (SQLite) ----
export const notifications = sqliteTable('notifications', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    message: text('message').notNull(),
    isRead: numeric('is_read').notNull().default('0'),
    entityId: text('entity_id'),
    entityType: text('entity_type'),
    createdAt: text('created_at')
        .notNull()
        .default(sql`(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW'))`),
});

// ---- RELATIONS ----

export const usersRelations = relations(users, ({ many }) => ({
    tasksAssignedToThisUser: many(tasks, {
        relationName: 'UserAssignedToTasks'
    }),
    tasksCreatedByThisUser: many(tasks, {
        relationName: 'UserWhoCreatedTasks'
    }),
    commentsMade: many(comments, {
        relationName: 'UserComments'
    }),
    filesUploaded: many(files, {
        relationName: 'UserFiles'
    }),
    receivedNotifications: many(notifications, {
        relationName: 'UserNotifications'
    })
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
    assignee: one(users, {
        fields: [tasks.assignedTo],
        references: [users.id],
        relationName: 'UserAssignedToTasks',
    }),
    creator: one(users, {
        fields: [tasks.assignedBy],
        references: [users.id],
        relationName: 'UserWhoCreatedTasks',
    }),
    client: one(users, {
        fields: [tasks.client],
        references: [users.id],
        relationName: 'TaskClientUser',
    }),
    comments: many(comments, {
        relationName: 'TaskComments'
    }),
    attachedFiles: many(files, {
        relationName: 'TaskFiles'
    }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
    task: one(tasks, {
        fields: [comments.taskId],
        references: [tasks.id],
        relationName: 'TaskComments'
    }),
    author: one(users, {
        fields: [comments.userId],
        references: [users.id],
        relationName: 'UserComments'
    }),
}));

export const filesRelations = relations(files, ({ one }) => ({
    uploader: one(users, {
        fields: [files.userId],
        references: [users.id],
        relationName: 'UserFiles'
    }),
    task: one(tasks, {
        fields: [files.taskId],
        references: [tasks.id],
        relationName: 'TaskFiles'
    }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    recipient: one(users, {
        fields: [notifications.userId],
        references: [users.id],
        relationName: 'UserNotifications'
    }),
}));

// ---- EXPORTED TYPES ----
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];
export type TaskType = Task['type'];

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type FileRecord = typeof files.$inferSelect;
export type NewFileRecord = typeof files.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
