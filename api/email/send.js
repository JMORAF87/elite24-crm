// api/email/send.js
const { Resend } = require("resend");
const { addActivity, updateLead } = require("../_store");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = typeof req.body === "object" ? req.body : {};
    const { leadId, to, subject, html } = body;

    if (!leadId) return res.status(400).json({ error: "Missing leadId" });
    if (!to) return res.status(400).json({ error: "Missing to" });
    if (!subject) return res.status(400).json({ error: "Missing subject" });
    if (!html) return res.status(400).json({ error: "Missing html" });

    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL || "Elite24 <onboarding@resend.dev>";

    let sendResult = { skipped: true };

    // If key exists, actually send. Otherwise simulate (still logs activity).
    if (resendKey) {
      const resend = new Resend(resendKey);
      sendResult = await resend.emails.send({ from, to, subject, html });
    }

    // Track activity
    addActivity({
      leadId,
      type: "email",
      message: `Email sent to ${to}: ${subject}`,
      meta: resendKey ? { provider: "resend", sendResult } : { provider: "mock", sendResult },
      at: new Date().toISOString(),
    });
    
    updateLead(leadId, { status: "ATTEMPTED", lastActivityAt: new Date().toISOString() });    

    return res.status(200).json({ ok: true, sendResult });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "send endpoint crashed" });
  }
};
