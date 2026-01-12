import express, { Request, Response } from 'express';
import prisma from '../client.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Get activities for a lead
router.get('/lead/:leadId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { leadId } = req.params;

        const activities = await prisma.activity.findMany({
            where: { leadId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(activities);
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ error: 'Failed to get activities' });
    }
});

// Create activity
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const activity = await prisma.activity.create({
            data: req.body
        });

        // If this is an email or call, update lead status if it's NEW
        if (['EMAIL', 'CALL'].includes(req.body.type)) {
            const lead = await prisma.lead.findUnique({
                where: { id: req.body.leadId }
            });

            if (lead?.status === 'NEW') {
                await prisma.lead.update({
                    where: { id: req.body.leadId },
                    data: { status: 'ATTEMPTED' }
                });
            }
        }

        res.status(201).json(activity);
    } catch (error) {
        console.error('Create activity error:', error);
        res.status(500).json({ error: 'Failed to create activity' });
    }
});

export default router;
