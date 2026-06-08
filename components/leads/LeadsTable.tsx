// components/leads/LeadsTable.tsx
"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Business, InstagramProfile, DiscoverySource } from "@prisma/client";
import { ExternalLink, Instagram, Globe, Phone, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Lead = Business & {
  instagramProfile: InstagramProfile | null;
  discoveredVia: DiscoverySource | null;
};

interface Props {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

function Score({ score }: { score: number }) {
  const cls = score >= 15 ? "score-high" : score >= 11 ? "score-med" : "score-low";
  return (
    <span className={cn("inline-flex w-8 h-8 items-center justify-center rounded-full text-xs font-semibold font-mono", cls)}>
      {score}
    </span>
  );
}

function Badge({ value, type }: { value: string; type: "priority" | "segment" | "status" }) {
  const cls: Record<string, string> = {
    // priority
    HIGH: "priority-high", MEDIUM: "priority-med", LOW: "priority-low",
    // segment
    PREMIUM: "seg-premium", MID: "seg-mid", BUDGET: "seg-budget",
    // status
    NEW: "status-new", CONTACTED: "status-contacted", IN_PROGRESS: "status-in_progress",
    CONVERTED: "status-converted", LOST: "status-lost", ON_HOLD: "status-on_hold",
  };
  return (
    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", cls[value] ?? "bg-stone-100 text-stone-500")}>
      {value.replace("_", " ")}
    </span>
  );
}

export default function LeadsTable({ leads, total, page, pageSize }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/leads?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              {["Business", "City/Area", "Contact", "Google", "Instagram", "Website", "Score", "Priority", "Status", "Segment", "Source", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {leads.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-sm text-stone-400">
                  No leads match the current filters.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-stone-50 transition-colors">
                {/* Business */}
                <td className="px-4 py-3">
                  <div className="font-medium text-stone-900 whitespace-nowrap">{lead.name}</div>
                  <div className="text-[11px] text-stone-400">{lead.category}</div>
                </td>

                {/* Location */}
                <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <MapPin size={11} />
                    {lead.area}, {lead.city}
                  </div>
                </td>

                {/* Contact */}
                <td className="px-4 py-3">
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-stone-600 hover:text-amber-600">
                      <Phone size={11} />
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="text-stone-300 text-xs">—</span>
                  )}
                </td>

                {/* Google */}
                <td className="px-4 py-3 text-xs whitespace-nowrap">
                  {lead.googleRating ? (
                    <div>
                      <span className="font-medium text-stone-700">{lead.googleRating}★</span>
                      <span className="text-stone-400 ml-1">({lead.googleReviews})</span>
                    </div>
                  ) : <span className="text-stone-300">—</span>}
                </td>

                {/* Instagram */}
                <td className="px-4 py-3">
                  {lead.instagramProfile ? (
                    <a href={lead.instagramProfile.profileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700">
                      <Instagram size={11} />
                      {lead.instagramProfile.followers.toLocaleString()}
                    </a>
                  ) : (
                    <span className="text-[11px] text-red-400">None</span>
                  )}
                </td>

                {/* Website */}
                <td className="px-4 py-3">
                  {lead.hasWebsite && lead.websiteUrl ? (
                    <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-600 hover:underline">
                      <Globe size={11} /> Visit
                    </a>
                  ) : (
                    <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">None</span>
                  )}
                </td>

                {/* Score */}
                <td className="px-4 py-3"><Score score={lead.leadScore} /></td>

                {/* Priority */}
                <td className="px-4 py-3"><Badge value={lead.priority} type="priority" /></td>

                {/* Status */}
                <td className="px-4 py-3"><Badge value={lead.status} type="status" /></td>

                {/* Segment */}
                <td className="px-4 py-3"><Badge value={lead.segment} type="segment" /></td>

                {/* Source */}
                <td className="px-4 py-3">
                  <span className="text-[10px] text-stone-400">
                    {lead.discoveredVia?.source?.replace("hashtag:", "#") ?? "manual"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="text-amber-600 hover:text-amber-700">
                    <ExternalLink size={13} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>{total} total results</span>
          <div className="flex items-center gap-3">
            <button onClick={() => goToPage(page - 1)} disabled={page <= 1}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none transition-colors">
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="font-medium text-stone-700">Page {page} of {totalPages}</span>
            <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none transition-colors">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
