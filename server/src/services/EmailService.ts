import { Resend } from 'resend';

class EmailService {
    private provider: string;
    private resend: Resend | null = null;
    private fromEmail = 'Amarillo Security <noreply@amarillosecurity.com>';

    constructor() {
        this.provider = process.env.EMAIL_PROVIDER || 'resend';

        if (this.provider === 'resend' && process.env.EMAIL_API_KEY) {
            this.resend = new Resend(process.env.EMAIL_API_KEY);
        }
    }

    // Generate email tracking pixel URL
    generateTrackingPixel(activityId: string): string {
        const baseUrl = process.env.SERVER_URL || 'http://localhost:3001';
        return `${baseUrl}/api/email/open/${activityId}`;
    }

    // Send email
    async sendEmail(options: {
        to: string;
        subject: string;
        body: string;
        trackingPixel?: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            if (!this.resend) {
                console.warn('Email service not configured');
                return { success: false, error: 'Email service not configured' };
            }

            // Add tracking pixel to HTML body
            let htmlBody = options.body.replace(/\n/g, '<br>');
            if (options.trackingPixel) {
                htmlBody += `<img src="${options.trackingPixel}" width="1" height="1" alt="" />`;
            }

            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: options.to,
                subject: options.subject,
                html: htmlBody
            });

            return { success: true, messageId: result.data?.id };
        } catch (error: any) {
            console.error('Send email error:', error);
            return { success: false, error: error.message };
        }
    }

    // Email templates
    getTemplate(type: string, companyName?: string, focus?: string): { subject: string; body: string } {
        const templates: Record<string, { subject: string; body: string }> = {
            GC_FIRST: {
                subject: `Security Solutions for ${companyName || 'Your Construction Projects'}`,
                body: `Hi there,\n\nI noticed ${companyName || 'your company'} specializes in ${focus || 'construction projects'} in the Amarillo area. We provide reliable, professional security guards for construction sites to prevent theft, vandalism, and ensure worker safety.\n\nOur services include:\n• Unarmed and armed security guards\n• 24/7 site protection\n• Theft and vandalism prevention\n• Flexible scheduling\n\nWould you be open to a quick call to discuss how we can help protect your sites?\n\nBest regards,\nAmarillo Security`
            },
            PM_FIRST: {
                subject: `Professional Security for ${companyName || 'Your Commercial Properties'}`,
                body: `Hi there,\n\nI noticed ${companyName || 'your company'} manages commercial properties in the Amarillo area. We provide professional security patrols and guards to protect your properties and tenants.\n\nOur services include:\n• Regular security patrols\n• On-site security personnel\n• 24/7 monitoring\n• Customizable schedules\n\nWould you be interested in discussing how we can enhance security for your properties?\n\nBest regards,\nAmarillo Security`
            },
            FOLLOW_UP: {
                subject: `Following up - Amarillo Security Services`,
                body: `Hi there,\n\nI wanted to follow up on my previous email about security services for ${companyName || 'your company'}.\n\nDo you have any questions about our services? I'd be happy to provide a custom quote or schedule a brief call at your convenience.\n\nBest regards,\nAmarillo Security`
            }
        };

        return templates[type] || templates.FOLLOW_UP;
    }
}

export default new EmailService();
