import express, { Request, Response } from 'express';
import prisma from '../client.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get dashboard statistics
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            newLeads,
            highPriorityLeads,
            meetingsThisWeek,
            quotesSentThisWeek,
            wonThisMonth,
            tasksDueToday,
            overdueTasks
        ] = await Promise.all([
            // New leads
            prisma.lead.count({ where: { status: 'NEW' } }),

            // High priority leads
            prisma.lead.count({ where: { priority: 'HIGH' } }),

            // Meetings this week
            prisma.activity.count({
                where: {
                    type: 'MEETING',
                    createdAt: { gte: weekStart }
                }
            }),

            // Quotes sent this week
            prisma.quote.count({
                where: {
                    status: 'SENT',
                    createdAt: { gte: weekStart }
                }
            }),

            // Won this month
            prisma.lead.count({
                where: {
                    status: 'WON',
                    updatedAt: { gte: monthStart }
                }
            }),

            // Tasks due today
            prisma.task.count({
                where: {
                    dueDate: { gte: today, lt: tomorrow },
                    completed: false
                }
            }),

            // Overdue tasks
            prisma.task.count({
                where: {
                    dueDate: { lt: today },
                    completed: false
                }
            })
        ]);

        res.json({
            newLeads,
            highPriorityLeads,
            meetingsThisWeek,
            quotesSentThisWeek,
            wonThisMonth,
            tasksDueToday,
            overdueTasks
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

export default router;
