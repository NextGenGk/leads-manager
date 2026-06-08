// components/dashboard/TopBar.tsx
"use client";
import { useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [syncing, setSyncing] = useState(false);

  const handleSearch = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  };

  const triggerSync = async () => {
    setSyncing(true);
    await fetch("/api/scrape/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "hashtags" }),
    });
    setTimeout(() => setSyncing(false), 3000);
  };

  return (
    <header className="h-14 bg-white border-b border-stone-200 flex items-center px-6 gap-4 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 w-72">
        <Search size={13} className="text-stone-400" />
        <input
          type="text"
          placeholder="Search leads, areas, cities…"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="bg-transparent text-sm text-stone-700 placeholder-stone-400 outline-none flex-1"
        />
      </div>

      <div className="flex-1" />

      {/* Sync button */}
      <button
        onClick={triggerSync}
        disabled={syncing}
        className="flex items-center gap-2 text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
      >
        <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
        {syncing ? "Triggering…" : "Run scraper"}
      </button>
    </header>
  );
}
