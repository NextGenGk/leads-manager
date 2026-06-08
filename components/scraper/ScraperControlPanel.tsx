// components/scraper/ScraperControlPanel.tsx
"use client";
import { useState } from "react";
import { Play, Hash, Users, Camera, BarChart2 } from "lucide-react";

const JOBS = [
  { type: "hashtags", label: "Scrape all hashtags", desc: "Searches #bhilaicafe, #durgfood and 14 others for new openings", icon: Hash, color: "bg-amber-600" },
  { type: "bloggers", label: "Scrape food bloggers", desc: "Checks all active food blogger accounts for new café mentions", icon: Users, color: "bg-violet-600" },
  { type: "snapshots", label: "Take daily snapshots", desc: "Records current review counts and follower counts for all leads", icon: BarChart2, color: "bg-blue-600" },
] as const;

export default function ScraperControlPanel() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const trigger = async (type: string) => {
    setRunning(type);
    try {
      const res = await fetch("/api/scrape/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResults((r) => ({ ...r, [type]: `Error: ${data.error ?? "request failed"}` }));
      } else {
        setResults((r) => ({ ...r, [type]: `Triggered: ${data.triggered}` }));
      }
    } catch {
      setResults((r) => ({ ...r, [type]: "Error: network error" }));
    }
    setRunning(null);
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <h2 className="text-sm font-semibold text-stone-900 mb-4">Manual triggers</h2>
      <div className="grid grid-cols-3 gap-4">
        {JOBS.map((job) => (
          <div key={job.type} className="border border-stone-100 rounded-xl p-4 space-y-3">
            <div className={`w-9 h-9 rounded-lg ${job.color} flex items-center justify-center`}>
              <job.icon size={15} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-medium text-stone-900">{job.label}</div>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">{job.desc}</p>
            </div>
            {results[job.type] && (
              <p className="text-xs text-emerald-600 font-medium">{results[job.type]}</p>
            )}
            <button onClick={() => trigger(job.type)} disabled={running !== null}
              className="w-full flex items-center justify-center gap-2 text-xs bg-stone-900 text-white py-2 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors">
              <Play size={11} className={running === job.type ? "animate-spin" : ""} />
              {running === job.type ? "Running…" : "Run now"}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-stone-400 mt-4">
        ⚡ Cron schedule: Hashtags at 7 AM IST · Bloggers at 9 AM IST · Snapshots at midnight IST — via Inngest
      </p>
    </div>
  );
}
