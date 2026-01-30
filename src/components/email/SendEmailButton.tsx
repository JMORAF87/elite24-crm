import React from "react";
import { Send } from "lucide-react";
import { sendEmail } from "../../services/email";
import api from "../../services/api";
import { addLeadActivity, setLeadStatusOverride } from "../../services/activityStore";

type Props = {
  to: string;
  leadId?: string;
  companyName?: string;
  onSent?: () => void; // optional: lets parent refetch
};

export function SendEmailButton({ to, leadId, companyName, onSent }: Props) {
  const [loading, setLoading] = React.useState(false);

  const onClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // IMPORTANT: prevents row click navigation
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

      // ✅ Local activity + status override so UI can reflect changes immediately
      if (leadId) {
        const now = new Date().toISOString();

        addLeadActivity(leadId, {
          type: "EMAIL_SENT",
          title: `Email sent to ${to}`,
          createdAt: now,
          meta: { to, subject },
        });

        // Mark as attempted locally (Pipeline/Dashboard can read this)
        setLeadStatusOverride(leadId, "ATTEMPTED");

        // Best-effort backend update (won’t block demo if backend doesn’t support it)
        try {
          await api.patch(`/leads/${leadId}`, {
            status: "ATTEMPTED",
            lastActivityAt: now,
          });
        } catch {
          // ignore - demo still works via local overrides
        }
      }

      onSent?.();
      alert("Email sent ✅ (check inbox)");
    } catch (err: any) {
      alert(`Email failed ❌\n\n${err?.message || err}`);
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
    >
      <Send size={14} />
      {loading ? "Sending..." : "Email"}
    </button>
  );
}
