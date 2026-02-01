// api/email/send.js
import { Resend } from "resend";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { makeId, getStore } = require("../_store"); // api/_store.js

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

    const { leadId, to, subject, html, text, from } = req.body || {};

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

    // ---- TRACKING (store + activity + status) ----
    // Only do this if leadId was provided by the frontend
    if (leadId) {
      const store = getStore();
      const now = new Date().toISOString();

      // log email
      store.emails.unshift({
        id: makeId(),
        leadId,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html: finalHtml,
        createdAt: now,
      });

      // activity
      store.activities.unshift({
        id: makeId(),
        leadId,
        type: "EMAIL_SENT",
        detail: subject,
        createdAt: now,
      });

      // move lead to ATTEMPTED (only if your leads live in the same store)
      const lead = store.leads.find((l) => String(l.id) === String(leadId));
      if (lead) {
        if (!lead.status || lead.status === "NEW") lead.status = "ATTEMPTED";
        lead.updatedAt = now;
      }
    }

    return res.status(200).json({ ok: true, result });
  } catch (err) {
    const message = err?.message || "Unknown error sending email";

    return res.status(400).json({
      ok: false,
      error: message,
    });
  }
}
