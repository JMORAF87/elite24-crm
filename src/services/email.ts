export async function sendEmail(payload: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    leadId?: string;
  }) {
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg);
    }
  
    return res.json();
  }  