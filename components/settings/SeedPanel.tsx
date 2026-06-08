// components/settings/SeedPanel.tsx
"use client";
import { useState } from "react";
import { Database, CheckCircle2 } from "lucide-react";

export default function SeedPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ seeded: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  const seed = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
          <Database size={16} className="text-amber-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Seed known leads</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Pre-populates the database with the 12 Bhilai &amp; Durg cafés identified in the June 2026 research.
            Safe to run multiple times — skips existing entries.
          </p>
        </div>
      </div>

      <button
        onClick={seed}
        disabled={loading}
        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-60 transition-colors"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Seeding…
          </>
        ) : (
          "Seed 12 known leads"
        )}
      </button>

      {result && (
        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3">
          <CheckCircle2 size={15} />
          Done — {result.seeded} seeded, {result.skipped} already existed.
        </div>
      )}

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
          Error: {error}
        </div>
      )}

      <div className="mt-4 border-t border-stone-100 pt-4 space-y-2">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
          Also seeds
        </h3>
        <ul className="text-xs text-stone-500 space-y-1">
          <li>• 6 known food bloggers in Bhilai &amp; Durg</li>
          <li>• 16 tracked hashtags (#bhilaicafe, #durgfood, etc.)</li>
          <li>• Inngest cron jobs activate automatically on next deploy</li>
        </ul>
      </div>
    </div>
  );
}
