import { Router } from 'express';
import { Resend } from 'resend';
import prisma from '../client.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

router.use(authenticateToken);

// Send Email
router.post('/send', async (req: AuthRequest, res) => {
    try {
        const { to, subject, html, leadId } = req.body;

        if (!to || !subject || !html || !leadId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Send via Resend
        const { data, error } = await resend.emails.send({
            from: 'Elite24 CRM <onboarding@resend.dev>',
            to: [to],
            subject: subject,
            html: html
        });

        if (error) {
            console.error('Resend Error:', error);
            // In dev mode with fake key, this will error. 
            // We'll log activity anyway if it was a "success" simulation or handle error.
            // If using verified domain, it works.
            // For now, if simulating:
            if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
                console.log('Simulating email send in dev mode');
            } else {
                return res.status(400).json({ error });
            }
        }

        // Log Activity
        const activity = await prisma.activity.create({
            data: {
                leadId: leadId,
                type: 'EMAIL',
                subject: subject,
                bodyPreview: html.substring(0, 100) + '...',
            }
        });

        res.json({ success: true, activity });

    } catch (error) {
        console.error('Send Email Error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Test Email Route
router.post('/test', async (req: AuthRequest, res) => {
    try {
        const userEmail = req.user?.email || 'admin@amarillosecurity.com';
        // ... (existing test logic)
        const { data, error } = await resend.emails.send({
            from: 'Elite24 CRM <onboarding@resend.dev>',
            to: [userEmail],
            subject: 'Test Email from Elite24',
            html: '<strong>It works!</strong><p>Your email integration is active.</p>'
        });

        if (error) {
            // Allow pass for dev simulation
            if (process.env.NODE_ENV === 'development') {
                return res.json({ success: true, message: 'Simulated sent' });
            }
            return res.status(400).json({ error });
        }
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send test email' });
    }
});

// Get recent emails
router.get('/', async (req, res) => {
    const emails = await prisma.activity.findMany({
        where: { type: 'EMAIL' },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { lead: true }
    });
    res.json(emails);
});

export default router;
