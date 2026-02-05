import { db } from '../db';
import { users, tasks } from '../models/schema';
import { count, eq, sql, and, or } from 'drizzle-orm';
import { TaskService } from '../services/taskService';

export class DashboardController {
    taskService: TaskService;

    constructor() {
        this.taskService = new TaskService();
    }

    parseNumericId(idString: string | undefined, paramName = 'ID'): number | undefined {
        if (idString === undefined) return undefined;
        const numericId = parseInt(idString, 10);
        return isNaN(numericId) ? undefined : numericId;
    }

    async getGeneralStats() {
        const [totalTasksResult] = await db.select({ value: count() }).from(tasks);
        const [totalUsersResult] = await db.select({ value: count() }).from(users);

        const tasksByStatusRaw = await db
            .select({ status: tasks.status, count: count() })
            .from(tasks)
            .groupBy(tasks.status);

        const tasksByPriorityRaw = await db
            .select({ priority: tasks.priority, count: count() })
            .from(tasks)
            .groupBy(tasks.priority);

        const usersByRoleRaw = await db
            .select({ role: users.role, count: count() })
            .from(users)
            .groupBy(users.role);

        return {
            totalTasks: totalTasksResult?.value || 0,
            totalUsers: totalUsersResult?.value || 0,
            tasksByStatus: tasksByStatusRaw.reduce((acc: any, curr: any) => {
                if (curr.status) acc[curr.status] = curr.count;
                return acc;
            }, {}),
            tasksByPriority: tasksByPriorityRaw.reduce((acc: any, curr: any) => {
                if (curr.priority) acc[curr.priority] = curr.count;
                return acc;
            }, {}),
            usersByRole: usersByRoleRaw.reduce((acc: any, curr: any) => {
                if (curr.role) acc[curr.role] = curr.count;
                return acc;
            }, {}),
            recentActivities: [],
        };
    }

    async getMyTasks(userId: string) {
        const userIdNumeric = this.parseNumericId(userId, 'User ID');
        if (userIdNumeric === undefined) {
            throw new Error('Invalid user ID format in token.');
        }

        const assignedTasksResult = await this.taskService.getTasks({ assignedTo: userIdNumeric.toString() });

        const createdTasksResult = await db
            .select()
            .from(tasks)
            .where(eq(tasks.assignedBy, userId));

        const [completedTasksCountResult] = await db
            .select({ value: count() })
            .from(tasks)
            .where(and(
                eq(tasks.assignedTo, userId),
                eq(tasks.status, 'completada')
            ));

        const [overdueTasksCountResult] = await db
            .select({ value: count() })
            .from(tasks)
            .where(and(
                eq(tasks.assignedTo, userId),
                sql`${tasks.endDate} < STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')`,
                sql`${tasks.status} NOT IN ('completada', 'cancelada')`
            ));

        return {
            assignedTasks: assignedTasksResult.data,
            totalAssigned: assignedTasksResult.total,
            createdTasks: createdTasksResult,
            myPerformance: {
                completedTasksCount: completedTasksCountResult?.value || 0,
                overdueTasksCount: overdueTasksCountResult?.value || 0,
            },
        };
    }

    async getTeamTasks() {
        const teamMembers = await db.select().from(users).where(or(eq(users.role, 'collaborator'), eq(users.role, 'client')));

        const teamMemberIds = teamMembers.map((member: any) => member.id);

        const teamTasksOverview = await db.select().from(tasks).where(sql`${tasks.assignedTo} IN (${teamMemberIds.join(',')})`);

        const [overdueTasksCountResult] = await db
            .select({ value: count() })
            .from(tasks)
            .where(and(
                sql`${tasks.assignedTo} IN (${teamMemberIds.join(',')})`,
                sql`${tasks.endDate} < STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')`,
                sql`${tasks.status} NOT IN ('completada', 'cancelada')`
            ));

        const [completedTasksCountResult] = await db
            .select({ value: count() })
            .from(tasks)
            .where(and(
                sql`${tasks.assignedTo} IN (${teamMemberIds.join(',')})`,
                eq(tasks.status, 'completada')
            ));

        return {
            teamMembers,
            teamTasksOverview,
            performanceMetrics: {
                overdueTasksCount: overdueTasksCountResult?.value || 0,
                completedTasksCount: completedTasksCountResult?.value || 0,
            },
        };
    }

    async getPerformanceMetrics() {
        const overdueTasksResult = await db
            .select()
            .from(tasks)
            .where(and(
                sql`${tasks.endDate} < STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')`,
                eq(tasks.status, 'pendiente'),
            ));

        const [completedTasksCountResult] = await db
            .select({ value: count() })
            .from(tasks)
            .where(eq(tasks.status, 'completada'));

        return {
            overdueTasksCount: overdueTasksResult.length,
            completedTasksCount: completedTasksCountResult?.value || 0,
        };
    }

    async getClientDashboardStats(userId: string) {
        const userIdNum = this.parseNumericId(userId, 'User ID');
        if (userIdNum === undefined) {
            throw new Error('Invalid user ID format in token.');
        }

        const userTasks = await db.select().from(tasks).where(eq(tasks.assignedBy, userId));

        const totalTasks = userTasks.length;
        const completedTasks = userTasks.filter((t: any) => t.status === 'completada').length;
        const pendingTasks = userTasks.filter((t: any) => t.status === 'pendiente' || t.status === 'en_progreso').length;

        return {
            totalTasks,
            completedTasks,
            pendingTasks,
            recentTasks: userTasks.slice(0, 5)
        };
    }
}
