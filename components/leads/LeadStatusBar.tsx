// components/leads/LeadStatusBar.tsx
"use client";
import { Business } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "CONVERTED", "LOST", "ON_HOLD"] as const;

export default function LeadStatusBar({ lead }: { lead: Business }) {
  const [status, setStatus] = useState(lead.status);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const update = async (newStatus: typeof status) => {
    setSaving(true);
    setStatus(newStatus);
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    router.refresh();
  };

  const cls: Record<string, string> = {
    NEW: "status-new", CONTACTED: "status-contacted", IN_PROGRESS: "status-in_progress",
    CONVERTED: "status-converted", LOST: "status-lost", ON_HOLD: "status-on_hold",
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 px-5 py-3 flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-stone-500 mr-2">Status:</span>
      {STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => update(s)}
          disabled={saving}
          className={cn(
            "text-[11px] font-medium px-3 py-1.5 rounded-full border transition-all",
            status === s ? cls[s] : "bg-stone-50 text-stone-400 border-stone-200 hover:bg-stone-100"
          )}
        >
          {s.replace("_", " ")}
        </button>
      ))}
      {saving && <span className="text-xs text-stone-400 ml-2">Saving…</span>}
    </div>
  );
}
