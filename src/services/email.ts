// src/services/email.ts
export async function sendEmail(payload: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    leadId?: string;
  }) {
    const res = await fetch(`/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  
    const raw = await res.text();
    let data: any = null;
    try { data = JSON.parse(raw); } catch {}
  
    if (!res.ok) {
      throw new Error(data?.error || raw || "Email send failed");
    }
  
    return data;
  }  