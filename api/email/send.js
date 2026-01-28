import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    // Vercel functions sometimes give body as string; handle both
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { to, subject, html, text, leadId } = body || {};
    if (!to || !subject || (!html && !text)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Missing required fields: to, subject, (html or text)" }));
      return;
    }

    const from = process.env.RESEND_FROM; // e.g. "Elite24 CRM <onboarding@resend.dev>" or "Elite24 <sales@yourdomain.com>"
    if (!from) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Server misconfigured: RESEND_FROM missing" }));
      return;
    }

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      tags: leadId ? [{ name: "leadId", value: String(leadId) }] : undefined,
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, result }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: err?.message || String(err) }));
  }
}