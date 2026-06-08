// components/leads/LeadsMapClient.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MapLead {
  id: string;
  name: string;
  area: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  priority: string;
  leadScore: number;
  segment: string;
  googleRating: number | null;
  googleReviews: number | null;
  hasWebsite: boolean;
  phone: string | null;
  googleMapsUrl: string | null;
  status: string;
}

interface Props {
  leads: MapLead[];
}

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: "#C0392B",
  MEDIUM: "#D4845E",
  LOW: "#9C9690",
};

export default function LeadsMapClient({ leads }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<MapLead | null>(null);
  const [filter, setFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");

  const filtered = leads.filter(
    (l) => filter === "ALL" || l.priority === filter
  );

  // Build static map URL using Google Maps embed (no JS API key needed for embed)
  const mapSrc = `https://maps.google.com/maps?q=Bhilai,Chhattisgarh&t=m&z=12&output=embed&iwloc=near`;

  return (
    <div className="flex gap-4 h-full">
      {/* Sidebar */}
      <div className="w-72 shrink-0 bg-white rounded-xl border border-stone-200 flex flex-col overflow-hidden">
        {/* Filter */}
        <div className="p-3 border-b border-stone-100 flex gap-1.5 flex-wrap">
          {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={cn(
                "text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors",
                filter === p
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
              )}
            >
              {p}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-stone-400 self-center">
            {filtered.length} shown
          </span>
        </div>

        {/* Lead list */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
          {filtered.map((lead) => (
            <button
              key={lead.id}
              onClick={() => setSelected(lead)}
              className={cn(
                "w-full text-left px-3 py-3 hover:bg-stone-50 transition-colors",
                selected?.id === lead.id && "bg-amber-50"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: PRIORITY_COLOR[lead.priority] }}
                />
                <span className="text-xs font-medium text-stone-900 truncate flex-1">
                  {lead.name}
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  {lead.leadScore}
                </span>
              </div>
              <div className="text-[10px] text-stone-400 mt-0.5 pl-4">
                {lead.area}, {lead.city}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Map + detail */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Map embed */}
        <div className="flex-1 bg-white rounded-xl border border-stone-200 overflow-hidden relative">
          <iframe
            title="Bhilai Durg Leads Map"
            src={mapSrc}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {/* Overlay pins legend */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl border border-stone-200 p-3 space-y-1.5 text-xs">
            <div className="font-semibold text-stone-700 mb-2">Priority</div>
            {Object.entries(PRIORITY_COLOR).map(([p, color]) => (
              <div key={p} className="flex items-center gap-2 text-stone-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* Selected lead detail */}
        {selected && (
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: PRIORITY_COLOR[selected.priority] }}
                  />
                  <h3 className="text-sm font-semibold text-stone-900">{selected.name}</h3>
                  <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                    {selected.leadScore}/20
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1 ml-4">
                  {selected.area}, {selected.city} ·{" "}
                  {selected.googleRating
                    ? `${selected.googleRating}★ (${selected.googleReviews} reviews)`
                    : "No rating"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {selected.googleMapsUrl && (
                  <a
                    href={selected.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                  >
                    Open in Maps
                  </a>
                )}
                {selected.phone && (
                  <a
                    href={`tel:${selected.phone}`}
                    className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700"
                  >
                    Call
                  </a>
                )}
                <a
                  href={`/leads/${selected.id}`}
                  className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700"
                >
                  View lead →
                </a>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-stone-400 hover:text-stone-600 px-1"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
