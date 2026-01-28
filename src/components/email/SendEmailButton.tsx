import React from "react";
import { Send } from "lucide-react";
import { sendEmail } from "../../services/email";

type Props = {
  to: string;
  leadId?: string;
  companyName?: string;
};

export function SendEmailButton({ to, leadId, companyName }: Props) {
  const [loading, setLoading] = React.useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      await sendEmail({
        to,
        subject: `Elite24 — Quick intro${companyName ? ` (${companyName})` : ""}`,
        text:
          `Hi${companyName ? ` ${companyName}` : ""},\n\n` +
          "Quick intro — this is a demo email sent from the Elite24 CRM using Resend.\n\n" +
          "Reply here if you'd like a quote.\n",
        leadId,
      });

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
    >
      <Send size={14} />
      {loading ? "Sending..." : "Email"}
    </button>
  );
}