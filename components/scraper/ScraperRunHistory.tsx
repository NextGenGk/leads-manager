// components/scraper/ScraperRunHistory.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, Loader2, RefreshCw } from "lucide-react";

type RunWithBiz = {
  id: string;
  status: string;
  source: string;
  targetQuery: string;
  startedAt: Date | string;
  completedAt: Date | string | null;
  totalFound: number;
  newLeads: number;
  cost: number | null;
  errorLog: string | null;
  business: { name: string } | null;
};

function StatusIcon({ status }: { status: string }) {
  if (status === "COMPLETED") return <CheckCircle2 size={13} className="text-emerald-500" />;
  if (status === "FAILED")    return <XCircle size={13} className="text-red-500" />;
  if (status === "RUNNING")   return <Loader2 size={13} className="text-amber-500 animate-spin" />;
  return <Clock size={13} className="text-stone-400" />;
}

export default function ScraperRunHistory({ runs: initialRuns }: { runs: RunWithBiz[] }) {
  const [runs, setRuns] = useState(initialRuns);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/scrape/runs");
      const data = await res.json();
      setRuns(data.runs);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-900">Run history</h2>
        <button onClick={refresh} disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors">
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              {["Status","Source","Query","Started","Duration","Found","New leads","Cost","Error"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {runs.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-stone-400">
                  No scraper runs yet.
                </td>
              </tr>
            )}
            {runs.map((run) => {
              const duration =
                run.completedAt && run.startedAt
                  ? Math.round(
                      (new Date(run.completedAt).getTime() -
                        new Date(run.startedAt).getTime()) /
                        1000
                    ) + "s"
                  : "—";
              return (
                <tr key={run.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon status={run.status} />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          run.status === "COMPLETED"
                            ? "text-emerald-600"
                            : run.status === "FAILED"
                            ? "text-red-600"
                            : "text-amber-600"
                        )}
                      >
                        {run.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">
                    {run.source.replace(/_/g, " ").toLowerCase()}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-stone-600">
                    {run.targetQuery}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-stone-500">{duration}</td>
                  <td className="px-4 py-3 text-xs text-stone-600 font-mono">{run.totalFound}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs font-semibold font-mono",
                        run.newLeads > 0 ? "text-emerald-600" : "text-stone-400"
                      )}
                    >
                      +{run.newLeads}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400 font-mono">
                    {run.cost ? `$${run.cost.toFixed(4)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-red-400 max-w-xs truncate">
                    {run.errorLog ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
