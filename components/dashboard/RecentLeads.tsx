// components/dashboard/RecentLeads.tsx
import Link from "next/link";
import { Business, InstagramProfile } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type LeadWithIG = Business & { instagramProfile: InstagramProfile | null };

export default function RecentLeads({ leads }: { leads: LeadWithIG[] }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100">
        <h2 className="text-sm font-semibold text-stone-900">Newly discovered</h2>
      </div>
      <div className="divide-y divide-stone-50">
        {leads.length === 0 && (
          <p className="px-5 py-6 text-sm text-stone-400 text-center">
            No leads yet. Run the scraper to discover new cafés.
          </p>
        )}
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads/${lead.id}`}
            className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50 transition-colors"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0"
              style={{ background: "#F5F0E8", color: "#B85C38" }}
            >
              {lead.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-stone-900 truncate">{lead.name}</div>
              <div className="text-xs text-stone-400">{lead.area}, {lead.city}</div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className={cn(
                "inline-block text-[10px] font-medium px-2 py-0.5 rounded-full",
                lead.priority === "HIGH" ? "priority-high"
                  : lead.priority === "MEDIUM" ? "priority-med"
                  : "priority-low"
              )}>
                {lead.priority}
              </div>
              <div className="text-[10px] text-stone-400 mt-1">
                {formatDistanceToNow(lead.createdAt, { addSuffix: true })}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
