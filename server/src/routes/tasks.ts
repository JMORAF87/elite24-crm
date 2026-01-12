import express, { Request, Response } from 'express';
import prisma from '../client.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get all tasks (with optional filters)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { leadId, completed, dueToday, overdue } = req.query;

        const where: any = {};

        if (leadId) where.leadId = leadId;
        if (completed !== undefined) where.completed = completed === 'true';

        if (dueToday === 'true') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            where.dueDate = {
                gte: today,
                lt: tomorrow
            };
        }

        if (overdue === 'true') {
            where.dueDate = {
                lt: new Date()
            };
            where.completed = false;
        }

        const tasks = await prisma.task.findMany({
            where,
            orderBy: { dueDate: 'asc' },
            include: {
                lead: {
                    select: {
                        id: true,
                        companyName: true,
                        segment: true
                    }
                }
            }
        });

        res.json(tasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to get tasks' });
    }
});

// Create task
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const task = await prisma.task.create({
            data: req.body,
            include: {
                lead: {
                    select: {
                        id: true,
                        companyName: true,
                        segment: true
                    }
                }
            }
        });

        res.status(201).json(task);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Mark task as complete/incomplete
router.patch('/:id/complete', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { completed } = req.body;

        const task = await prisma.task.update({
            where: { id },
            data: { completed: completed ?? true }
        });

        res.json(task);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.task.delete({ where: { id } });

        res.status(204).send();
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

export default router;
