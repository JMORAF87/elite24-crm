import express, { Response } from 'express';
import prisma from '../client.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { Prisma } from '@prisma/client';

const router = express.Router();
router.use(authenticateToken);

// Get Quote Knowledge
router.get('/knowledge', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const knowledge = await prisma.quoteKnowledge.findFirst({
            orderBy: { updatedAt: 'desc' }
        });

        if (!knowledge) {
            // Return default template if no knowledge exists
            const defaultTemplate = {
                rates: {
                    constructionSite: { unarmed: 25, armed: 35, patrol: 45 },
                    commercialProperty: { unarmed: 28, armed: 38, patrol: 50 },
                    event: { unarmed: 30, armed: 45 }
                },
                formulas: {
                    monthlyEstimate: "hourlyRate * hoursPerWeek * 4.33"
                },
                context: {
                    name: "Elite 24 Security",
                    website: "https://www.elite24security.com",
                    email: "sales@elite24.com"
                },
                rules: [
                    "Construction GC jobs usually need at least 40 hours per week."
                ]
            };
            res.json({ content: JSON.stringify(defaultTemplate, null, 2), contentType: 'json' });
            return;
        }

        res.json(knowledge);
    } catch (error) {
        console.error('Get knowledge error:', error);
        res.status(500).json({ error: 'Failed to get quote knowledge' });
    }
});

// Update Quote Knowledge
router.post('/knowledge', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { content, contentType } = req.body;

        // Validation
        if (contentType === 'json') {
            try {
                JSON.parse(content);
            } catch (e) {
                res.status(400).json({ error: 'Invalid JSON format' });
                return;
            }
        }

        // Upsert logic: treat as singleton for now by deleting old
        await prisma.quoteKnowledge.deleteMany({});

        const knowledge = await prisma.quoteKnowledge.create({
            data: { content, contentType }
        });

        res.json(knowledge);
    } catch (error) {
        console.error('Update knowledge error:', error);
        res.status(500).json({ error: 'Failed to update quote knowledge' });
    }
});

// Generate Draft Suggestion
router.post('/draft-suggest', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { leadId, serviceType, guardType, hoursPerWeek, knowledge } = req.body;

        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead) {
            res.status(404).json({ error: 'Lead not found' });
            return;
        }

        // Logic to generate text using knowledge + lead
        // This is a simple template engine for now
        let draft = `PROPOSAL FOR ${lead.companyName.toUpperCase()}\n\n`;

        if (knowledge && knowledge.context) {
            draft += `Prepared by ${knowledge.context.name}\n\n`;
        }

        draft += `SCOPE OF SERVICES: ${serviceType.replace('_', ' ')} (${guardType})\n`;
        draft += `COVERAGE: ${hoursPerWeek} Hours Per Week\n\n`;

        draft += `OUR APPROACH:\n`;
        draft += `Elite 24 will provide licensed ${guardType.toLowerCase()} security personnel to monitor the premises at ${lead.city || 'your location'}.\n`;

        if (serviceType === 'CONSTRUCTION_SITE') {
            draft += `- Access control for contractors and deliveries.\n`;
            draft += `- After-hours patrol to prevent theft and vandalism.\n`;
        } else if (serviceType === 'COMMERCIAL_PROPERTY') {
            draft += `- Tenant safety and visible deterrence.\n`;
            draft += `- Regular foot patrols of common areas.\n`;
        }

        if (knowledge && knowledge.rules && Array.isArray(knowledge.rules)) {
            draft += `\nNOTES:\n`;
            knowledge.rules.forEach((rule: string) => draft += `- ${rule}\n`);
        }

        res.json({ draft });
    } catch (error) {
        console.error('Draft suggest error:', error);
        res.status(500).json({ error: 'Failed to suggest draft' });
    }
});

// Get all quotes (for Quotes page)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, leadId } = req.query;

        const where: Prisma.QuoteWhereInput = {};
        if (status && status !== 'ALL') where.status = status as any;
        if (leadId) where.leadId = leadId as string;

        const quotes = await prisma.quote.findMany({
            where,
            include: {
                lead: {
                    select: {
                        companyName: true,
                        segment: true,
                        email1: true,
                        contactName1: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(quotes);
    } catch (error) {
        console.error('Get quotes error:', error);
        res.status(500).json({ error: 'Failed to get quotes' });
    }
});

// Get quotes for a lead
router.get('/lead/:leadId', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { leadId } = req.params;

        const quotes = await prisma.quote.findMany({
            where: { leadId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(quotes);
    } catch (error) {
        console.error('Get quotes error:', error);
        res.status(500).json({ error: 'Failed to get quotes' });
    }
});

// Create quote
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            leadId, serviceType, guardType, hoursPerWeek, startDate, notes,
            hourlyRate, totalAmount
        } = req.body;

        // Use provided rate or default
        const effectiveRate = hourlyRate || getDefaultRate(serviceType, guardType);

        // Use provided monthly estimate (totalAmount) or recalculate
        const monthlyEstimate = totalAmount || (effectiveRate * hoursPerWeek * 4.33);

        const quote = await prisma.quote.create({
            data: {
                leadId,
                serviceType,
                guardType,
                hoursPerWeek,
                hourlyRate: parseFloat(effectiveRate.toString()),
                monthlyEstimate: parseFloat(monthlyEstimate.toString()),
                startDate,
                notes,
                status: 'DRAFT'
            }
        });

        res.status(201).json(quote);
    } catch (error) {
        console.error('Create quote error:', error);
        res.status(500).json({ error: 'Failed to create quote' });
    }
});

// Update quote status (e.g., mark as sent)
router.patch('/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const quote = await prisma.quote.update({
            where: { id },
            data: { status }
        });

        res.json(quote);
    } catch (error) {
        console.error('Update quote status error:', error);
        res.status(500).json({ error: 'Failed to update quote status' });
    }
});

function getDefaultRate(serviceType: string, guardType: string): number {
    const rates: Record<string, Record<string, number>> = {
        CONSTRUCTION_SITE: { UNARMED: 25, ARMED: 35, PATROL: 30 },
        COMMERCIAL_PROPERTY: { UNARMED: 22, ARMED: 32, PATROL: 28 }
    };
    return rates[serviceType]?.[guardType] || 25;
}

export default router;
