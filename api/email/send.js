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

function getBaseUrl(req) {
  const proto = (req.headers["x-forwarded-proto"] || "https").toString();
  const host = (req.headers["x-forwarded-host"] || req.headers.host).toString();
  return `${proto}://${host}`;
}

function leadIdFromReferer(req) {
  const ref = req.headers.referer || req.headers.referrer;
  if (!ref) return null;
  try {
    const u = new URL(ref.toString());
    const parts = u.pathname.split("/leads/");
    if (parts.length < 2) return null;
    return parts[1].split(/[/?#]/)[0] || null;
  } catch {
    return null;
  }
}

async function getJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
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

    const body = await getJsonBody(req);
    const { to, subject, html, text, from } = body || {};

    // leadId can be in body, query, or referer fallback
    let leadId = body?.leadId || null;
    if (!leadId) {
      try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        leadId = url.searchParams.get("leadId");
      } catch {}
    }
    if (!leadId) leadId = leadIdFromReferer(req);

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        error: "Missing required fields: to, subject, and (html or text)",
        received: { to: !!to, subject: !!subject, html: !!html, text: !!text, leadId: !!leadId },
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

    // Log activity (best-effort; don't fail the email if logging fails)
    if (leadId) {
      try {
        const baseUrl = getBaseUrl(req);
        await fetch(`${baseUrl}/api/activities`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            leadId,
            type: "email_sent",
            title: `Email sent: ${subject}`,
            meta: { to: Array.isArray(to) ? to : [to] },
          }),
        });
      } catch {
        // swallow
      }
    }

    return res.status(200).json({ ok: true, result, tracked: !!leadId, leadId: leadId || null });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      error: err?.message || "Unknown error sending email",
    });
  }
}
