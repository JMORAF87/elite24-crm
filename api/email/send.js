import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { to, subject, text, html, leadId } = body || {};
    if (!to || !subject || (!text && !html)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "Missing required fields: to, subject, text|html" }));
      return;
    }

    // Use a verified sender in Resend (recommended: your domain).
    const from = process.env.RESEND_FROM || "Demo <onboarding@resend.dev>";

    const result = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html: html || (text ? `<p>${String(text).replaceAll("\n", "<br/>")}</p>` : undefined),
      headers: leadId ? { "X-Lead-Id": String(leadId) } : undefined,
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, result }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: err?.message || "Unknown error" }));
  }
}