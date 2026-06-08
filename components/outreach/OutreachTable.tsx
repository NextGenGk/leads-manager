// components/outreach/OutreachTable.tsx
"use client";
import { OutreachEmail, Business } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type EmailWithBiz = OutreachEmail & {
  business: Pick<Business, "id" | "name" | "area" | "city" | "priority" | "phone" | "email">;
};

export default function OutreachTable({ emails }: { emails: EmailWithBiz[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              {["Business", "Subject", "Tone", "Service", "Status", "When", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emails.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-stone-400">
                No emails yet. Open a lead and generate one.
              </td></tr>
            )}
            {emails.map((email) => (
              <>
                <tr key={email.id} className="border-b border-stone-50 hover:bg-stone-50 cursor-pointer"
                  onClick={() => setExpanded(expanded === email.id ? null : email.id)}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-stone-900">{email.business.name}</div>
                    <div className="text-xs text-stone-400">{email.business.area}, {email.business.city}</div>
                  </td>
                  <td className="px-5 py-3 text-xs text-stone-600 max-w-xs truncate">{email.subject}</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                      {email.tone}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-stone-500 max-w-xs truncate">{email.service}</td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full",
                      email.sentStatus === "SENT" ? "bg-emerald-50 text-emerald-600"
                        : email.sentStatus === "REPLIED" ? "bg-violet-50 text-violet-600"
                        : "bg-stone-100 text-stone-500"
                    )}>
                      {email.sentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-stone-400">
                    {formatDistanceToNow(email.generatedAt, { addSuffix: true })}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); copy(email.id, `Subject: ${email.subject}\n\n${email.body}`); }}
                        className="text-stone-400 hover:text-amber-600">
                        {copied === email.id ? <span className="text-[10px] text-emerald-500">✓</span> : <Copy size={13} />}
                      </button>
                      <Link href={`/leads/${email.businessId}`} onClick={(e) => e.stopPropagation()}
                        className="text-stone-400 hover:text-amber-600">
                        <ExternalLink size={13} />
                      </Link>
                    </div>
                  </td>
                </tr>
                {expanded === email.id && (
                  <tr key={`${email.id}-body`}>
                    <td colSpan={7} className="px-5 pb-4 bg-amber-50/30">
                      <div className="rounded-lg border border-stone-200 bg-white p-4">
                        <div className="text-xs font-semibold text-stone-500 mb-1">Subject: {email.subject}</div>
                        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{email.body}</p>
                        <div className="flex gap-2 mt-3">
                          <button type="button" onClick={(e) => { e.preventDefault(); copy(email.id, `Subject: ${email.subject}\n\n${email.body}`); }}
                            className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg hover:bg-stone-900">
                            Copy full email
                          </button>
                          {email.business.phone && (
                            <a href={`https://wa.me/${email.business.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(email.body)}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700">
                              Send via WhatsApp
                            </a>
                          )}
                          {email.business.email && (
                            <a href={`mailto:${email.business.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`}
                              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                              Send via Email
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
