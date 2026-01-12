import express, { Request, Response } from 'express';
import prisma from '../client.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Get all settings
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        // Convert to object
        const settingsMap = settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

// Update settings (bulk)
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const updates = req.body; // { key: value, key2: value2 }

        const operations = Object.entries(updates).map(([key, value]) => {
            return prisma.systemSetting.upsert({
                where: { key: key },
                update: { value: String(value) },
                create: { key: key, value: String(value) }
            });
        });

        await prisma.$transaction(operations);

        res.json({ success: true });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
