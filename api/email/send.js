// api/email/send.js
import { Resend } from "resend";

function escapeHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    return res.json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const defaultFrom = process.env.RESEND_FROM || "onboarding@resend.dev";

    if (!apiKey) {
      return res.status(500).json({ error: "Missing RESEND_API_KEY in environment" });
    }

    const { to, subject, html, text, from } = req.body || {};

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        error: "Missing required fields: to, subject, and (html or text)",
        received: { to: !!to, subject: !!subject, html: !!html, text: !!text },
      });
    }

    const resend = new Resend(apiKey);

    const finalHtml =
      html || `<div style="font-family:system-ui,Arial">${escapeHtml(text)}</div>`;

    const result = await resend.emails.send({
      from: from || defaultFrom,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: finalHtml,
      text: text || undefined,
    });

    // Resend SDK returns either data or throws; keep it explicit
    return res.status(200).json({ ok: true, result });
  } catch (err) {
    const message =
      err?.message || "Unknown error sending email";

    // Don't leak internal objects; just enough to debug
    return res.status(400).json({
      ok: false,
      error: message,
    });
  }
}