// api/email/send.js
import { Resend } from "resend";
import store, { addActivity, bumpLeadStatus } from "../_store.js";

function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Robust JSON body read for Vercel serverless (/api folder) + Next-style req.body
async function readJsonBody(req) {
  // If a platform already parsed JSON:
  if (req.body && typeof req.body === "object") return req.body;

  // If body is a string (happens sometimes):
  if (typeof req.body === "string" && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  // Raw Node request stream fallback:
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    return res.json({ ok: false, error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.RESEND_API_KEY;
    const defaultFrom = process.env.RESEND_FROM || "onboarding@resend.dev";

    if (!apiKey) {
      return res
        .status(500)
        .json({ ok: false, error: "Missing RESEND_API_KEY in environment" });
    }

    const body = await readJsonBody(req);
    const { leadId, to, subject, html, text, from } = body || {};

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        ok: false,
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

    // --------- TRACKING STEP (activity + pipeline) ----------
    // Only track if leadId is provided by the frontend.
    // (If leadId is missing, the email still sends, but nothing will show in Attempted/Activity.)
    if (leadId) {
      const now = new Date().toISOString();

      // Activity log
      addActivity({
        leadId,
        type: "EMAIL_SENT",
        createdAt: now,
        meta: {
          to: Array.isArray(to) ? to : [to],
          subject,
          // Resend returns different shapes depending on version;
          // store whatever we can get.
          messageId: result?.data?.id || result?.id || null,
        },
      });

      // Move pipeline status forward (never backward)
      bumpLeadStatus(leadId, "ATTEMPTED", now);
    }

    return res.status(200).json({
      ok: true,
      result,
      tracking: leadId
        ? { recorded: true }
        : { recorded: false, reason: "Missing leadId in request body" },
    });
  } catch (err) {
    const message = err?.message || "Unknown error sending email";
    return res.status(500).json({
      ok: false,
      error: message,
    });
  }
}
