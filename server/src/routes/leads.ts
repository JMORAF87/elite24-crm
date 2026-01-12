import express, { Request, Response } from 'express';
import prisma from '../client.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all leads with filtering, search, and pagination
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            segment,
            priority,
            status,
            city,
            search,
            page = '1',
            limit = '20',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        // Build where clause
        const where: Prisma.LeadWhereInput = {};

        if (segment) where.segment = segment as any;
        if (priority) where.priority = priority as any;
        if (status) where.status = status as any;
        if (city) where.city = { contains: city as string, mode: 'insensitive' };

        if (search) {
            where.OR = [
                { companyName: { contains: search as string, mode: 'insensitive' } },
                { focus: { contains: search as string, mode: 'insensitive' } },
                { city: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const [leads, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                skip,
                take,
                orderBy: { [sortBy as string]: sortOrder },
                include: {
                    _count: {
                        select: { activities: true, tasks: true, quotes: true }
                    }
                }
            }),
            prisma.lead.count({ where })
        ]);

        res.json({
            leads,
            pagination: {
                page: Number(page),
                limit: take,
                total,
                totalPages: Math.ceil(total / take)
            }
        });
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ error: 'Failed to get leads' });
    }
});

// Get single lead by ID
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const lead = await prisma.lead.findUnique({
            where: { id },
            include: {
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                },
                tasks: {
                    orderBy: { dueDate: 'asc' }
                },
                quotes: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!lead) {
            res.status(404).json({ error: 'Lead not found' });
            return;
        }

        res.json(lead);
    } catch (error) {
        console.error('Get lead error:', error);
        res.status(500).json({ error: 'Failed to get lead' });
    }
});

// Create lead
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const lead = await prisma.lead.create({
            data: req.body,
            include: {
                _count: {
                    select: { activities: true, tasks: true, quotes: true }
                }
            }
        });

        res.status(201).json(lead);
    } catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({ error: 'Failed to create lead' });
    }
});

// Update lead
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const lead = await prisma.lead.update({
            where: { id },
            data: req.body,
            include: {
                _count: {
                    select: { activities: true, tasks: true, quotes: true }
                }
            }
        });

        res.json(lead);
    } catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

// Update lead status
router.patch('/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Update lead status
        const lead = await prisma.lead.update({
            where: { id },
            data: { status }
        });

        // Create activity for status change
        await prisma.activity.create({
            data: {
                leadId: id,
                type: 'NOTE',
                subject: 'Status Changed',
                outcome: `Status changed to ${status}`,
                bodyPreview: `Lead status was updated to ${status}`
            }
        });

        res.json(lead);
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Delete lead
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.lead.delete({ where: { id } });

        res.status(204).send();
    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

export default router;
