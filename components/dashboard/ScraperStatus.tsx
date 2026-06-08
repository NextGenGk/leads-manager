// components/dashboard/ScraperStatus.tsx
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ScrapeRun } from "@prisma/client";

export default function ScraperStatus({ lastRun }: { lastRun: ScrapeRun | null }) {
  if (!lastRun) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Scraper status</h2>
        <p className="text-sm text-stone-400">No runs yet. Click "Run scraper" to start.</p>
      </div>
    );
  }

  const icon =
    lastRun.status === "COMPLETED" ? (
      <CheckCircle2 size={16} className="text-emerald-500" />
    ) : lastRun.status === "FAILED" ? (
      <XCircle size={16} className="text-red-500" />
    ) : (
      <Clock size={16} className="text-amber-500" />
    );

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Last scrape run</h2>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium text-stone-700">{lastRun.status}</span>
      </div>
      <div className="space-y-1.5">
        <Row label="When" value={formatDistanceToNow(lastRun.startedAt, { addSuffix: true })} />
        <Row label="Source" value={lastRun.source.replace(/_/g, " ")} />
        <Row label="Found" value={`${lastRun.totalFound} posts`} />
        <Row label="New leads" value={`+${lastRun.newLeads}`} color="text-emerald-600" />
      </div>
    </div>
  );
}

function Row({ label, value, color = "text-stone-700" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-stone-400">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}
