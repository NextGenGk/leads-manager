// components/dashboard/TopLeadsTable.tsx
import Link from "next/link";
import { Business, InstagramProfile } from "@prisma/client";
import { ExternalLink, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";

type LeadWithIG = Business & { instagramProfile: InstagramProfile | null };

function ScoreBubble({ score }: { score: number }) {
  const cls =
    score >= 15 ? "score-high" : score >= 11 ? "score-med" : "score-low";
  return (
    <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold font-mono", cls)}>
      {score}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls =
    priority === "HIGH"
      ? "priority-high"
      : priority === "MEDIUM"
      ? "priority-med"
      : "priority-low";
  return (
    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", cls)}>
      {priority}
    </span>
  );
}

export default function TopLeadsTable({ leads }: { leads: LeadWithIG[] }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-900">Top 10 leads by score</h2>
        <Link href="/leads" className="text-xs text-amber-600 hover:underline">
          View all →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100">
              {["Business", "City / Area", "Rating", "Instagram", "Score", "Priority", "Website", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-medium text-stone-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="font-medium text-stone-900">{lead.name}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{lead.category}</div>
                </td>
                <td className="px-5 py-3 text-stone-500 text-xs">
                  {lead.area}, {lead.city}
                </td>
                <td className="px-5 py-3">
                  {lead.googleRating ? (
                    <div className="text-stone-700">
                      <span className="font-medium">{lead.googleRating}★</span>
                      <span className="text-xs text-stone-400 ml-1">({lead.googleReviews})</span>
                    </div>
                  ) : (
                    <span className="text-stone-300">—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {lead.instagramProfile ? (
                    <div className="flex items-center gap-1.5">
                      <Instagram size={12} className="text-purple-500" />
                      <span className="text-xs text-stone-600">
                        {lead.instagramProfile.followers.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-red-400">None</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <ScoreBubble score={lead.leadScore} />
                </td>
                <td className="px-5 py-3">
                  <PriorityBadge priority={lead.priority} />
                </td>
                <td className="px-5 py-3">
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium",
                    lead.hasWebsite
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  )}>
                    {lead.hasWebsite ? "Yes" : "None"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <Link href={`/leads/${lead.id}`} className="text-amber-600 hover:text-amber-700">
                    <ExternalLink size={13} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
