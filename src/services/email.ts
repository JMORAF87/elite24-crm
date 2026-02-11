import api from "./api";

type SendEmailPayload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  leadId?: string;
};

// Thin wrapper around the authenticated /email/send backend route
export async function sendEmail(payload: SendEmailPayload) {
  const { to, subject, html, text, leadId } = payload;

  if (!leadId) {
    throw new Error("leadId is required to send an email");
  }

  const finalHtml =
    html ?? (text ? text.replace(/\n/g, "<br>") : "<p>(no content)</p>");

  const res = await api.post("/email/send", {
    leadId,
    to,
    subject,
    html: finalHtml,
  });

  return res.data;
}