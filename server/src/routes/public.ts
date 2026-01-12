import { Router } from 'express';
import prisma from '../prisma/client.js';

const router = Router();

router.post('/leads', async (req, res) => {
    try {
        const { name, company, email, phone, city, notes, segment } = req.body;

        // Try to find existing lead
        let lead = await prisma.lead.findFirst({
            where: {
                OR: [
                    { email1: email },
                    { companyName: company }
                ]
            }
        });

        if (lead) {
            // Update basic info if missing
            lead = await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    status: 'NEW', // Re-open lead
                    priority: 'HIGH'
                }
            });
        } else {
            // Create new
            lead = await prisma.lead.create({
                data: {
                    companyName: company || name || 'Unknown Company',
                    contactName1: name,
                    email1: email,
                    phone: phone,
                    city: city,
                    segment: segment || 'COMMERCIAL_PM',
                    priority: 'MEDIUM',
                    status: 'NEW',
                    focus: notes
                }
            });
        }

        // Create Inbound Activity
        await prisma.activity.create({
            data: {
                leadId: lead.id,
                type: 'INBOUND_FORM',
                subject: 'New Web Inquiry',
                bodyPreview: `Inbound request from ${name}. Notes: ${notes}`,
            }
        });

        // Create Follow-up Task
        await prisma.task.create({
            data: {
                leadId: lead.id,
                title: 'Call inbound lead immediately',
                dueDate: new Date()
                // Removed 'priority' as it doesn't exist in Task model
            }
        });

        res.json({ success: true, leadId: lead.id });

    } catch (error) {
        console.error('Public lead error:', error);
        res.status(500).json({ error: 'Failed to process lead' });
    }
});

export default router;
