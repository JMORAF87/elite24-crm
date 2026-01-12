import { Router } from 'express';
import multer from 'multer';
import * as xlsx from 'xlsx';
import prisma from '../client.js'; // Standardizing on src/client.ts if it exists, will verify

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/leads', upload.single('file'), async (req, res) => {
    console.log(`[Import] Route hit. File: ${req.file?.originalname}, Size: ${req.file?.size}`);

    try {
        if (!req.file) {
            console.log('[Import] No file uploaded.');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Parse data
        const rawData = xlsx.utils.sheet_to_json(sheet);
        console.log(`[Import] Parsed ${rawData.length} rows from file.`);

        let createdCount = 0;
        let updatedCount = 0;
        const errors: any[] = [];

        for (const [index, row] of (rawData as any[]).entries()) {
            const rowNumber = index + 2; // +2 because 0-indexed + 1 for header
            // Map fields exactly as requested
            const companyName = row['CompanyName'] || row['Company Name'] || row['Company'];
            const phone = row['Phone'] ? String(row['Phone']) : undefined;

            if (!companyName) {
                console.log(`[Import] Skipping row ${rowNumber} missing CompanyName`);
                errors.push({ row: rowNumber, error: 'Missing "CompanyName"' });
                continue;
            }

            // Validate Enums
            let segment = (row['Segment'] === 'GC' || row['Segment'] === 'COMMERCIAL_PM') ? row['Segment'] : 'COMMERCIAL_PM';
            if (row['Segment'] && row['Segment'] !== 'GC' && row['Segment'] !== 'COMMERCIAL_PM') {
                errors.push({ row: rowNumber, error: `Invalid Segment "${row['Segment']}". Defaulting to COMMERCIAL_PM.` });
            }

            let status = 'NEW';
            const validStatuses = ['NEW', 'ATTEMPTED', 'CONNECTED', 'MEETING_SET', 'QUOTE_SENT', 'WON', 'LOST'];
            if (row['Status']) {
                const s = String(row['Status']).toUpperCase();
                if (validStatuses.includes(s)) {
                    status = s;
                } else {
                    errors.push({ row: rowNumber, error: `Invalid Status "${row['Status']}". Defaulting to NEW.` });
                }
            }

            let priority = 'MEDIUM';
            if (row['Priority']) {
                const p = String(row['Priority']).toUpperCase();
                if (['HIGH', 'MEDIUM', 'LOW'].includes(p)) {
                    priority = p;
                } else {
                    errors.push({ row: rowNumber, error: `Invalid Priority "${row['Priority']}". Defaulting to MEDIUM.` });
                }
            }

            // Map keys
            const leadData = {
                companyName,
                segment: segment as any,
                focus: row['Focus'],
                address: row['Address'],
                city: row['City'],
                state: row['State'],
                zip: row['Zip'] ? String(row['Zip']) : undefined,
                phone: phone,
                website: row['Website'],
                contactName1: row['ContactName1'],
                role1: row['Role1'],
                email1: row['Email1'],
                contactName2: row['ContactName2'],
                role2: row['Role2'],
                email2: row['Email2'],
                contactName3: row['ContactName3'],
                role3: row['Role3'],
                email3: row['Email3'],
                contactFormURL: row['ContactFormURL'],
                rating: row['Rating'] ? Number(row['Rating']) : undefined,
                reviewCount: row['ReviewCount'] ? Number(row['ReviewCount']) : undefined,
                priority: priority as any,
                status: status as any,
            };

            // Using upsert logic by manually checking for existence to get accurate counts
            try {
                let existing = null;

                if (companyName && phone) {
                    existing = await prisma.lead.findUnique({
                        where: { companyName_phone: { companyName, phone } }
                    });
                } else {
                    // Fallback check by company name only if phone is missing
                    existing = await prisma.lead.findFirst({
                        where: { companyName: companyName }
                    });
                }

                if (existing) {
                    // Update
                    await prisma.lead.update({
                        where: { id: existing.id },
                        data: leadData
                    });
                    updatedCount++;
                } else {
                    // Create
                    await prisma.lead.create({
                        data: leadData
                    });
                    createdCount++;
                }

            } catch (err) {
                console.error(`[Import] DB Error for ${companyName}:`, err);
                errors.push({ row: rowNumber, error: 'Database error saving record' });
            }
        }

        console.log(`[Import] Finished. Created: ${createdCount}, Updated: ${updatedCount}`);

        res.json({
            success: true,
            created: createdCount,
            updated: updatedCount,
            errors,
            message: `Imported ${createdCount} new leads, updated ${updatedCount} existing leads.`
        });

    } catch (error) {
        console.error('[Import] Critical Error:', error);
        res.status(500).json({ error: 'Failed to process import' });
    }
});

export default router;
