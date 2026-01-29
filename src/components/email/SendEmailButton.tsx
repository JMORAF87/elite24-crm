// src/components/email/SendEmailButton.tsx
import React from "react";
import { Send } from "lucide-react";
import { sendEmail } from "../../services/email";
import { recordActivity } from "../../services/activityStore";

type Props = {
  to: string;
  leadId?: string;
  companyName?: string;
};

export function SendEmailButton({ to, leadId, companyName }: Props) {
  const [loading, setLoading] = React.useState(false);

  const onClick = async () => {
    if (!to) {
      alert("No email found for this lead.");
      return;
    }

    setLoading(true);

    const subject = `Elite24 — Quick intro${companyName ? ` (${companyName})` : ""}`;
    const text =
      `Hi${companyName ? ` ${companyName}` : ""},\n\n` +
      "Quick intro — this is a demo email sent from the Elite24 CRM using Resend.\n\n" +
      "Reply here if you'd like a quote.\n";

    try {
      await sendEmail({
        to,
        subject,
        text,
        leadId,
      });

      // ✅ Demo realism: log an activity locally so UI can show "Last Activity"
      if (leadId) {
        recordActivity({
          leadId,
          type: "EMAIL_SENT",
          summary: `Email sent to ${to}`,
          meta: { to, subject },
        });
      }

      alert("Email sent ✅ (check inbox)");
    } catch (e: any) {
      alert(`Email failed ❌\n\n${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={loading || !to}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
      title={!to ? "Lead has no email" : "Send email"}
      type="button"
    >
      <Send size={14} />
      {loading ? "Sending..." : "Email"}
    </button>
  );
}
