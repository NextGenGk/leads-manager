// components/leads/LeadsFilters.tsx
"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const CITIES = ["ALL", "BHILAI", "DURG"];
const PRIORITIES = ["ALL", "HIGH", "MEDIUM", "LOW"];
const STATUSES = ["ALL", "NEW", "CONTACTED", "IN_PROGRESS", "CONVERTED", "LOST"];
const SEGMENTS = ["ALL", "PREMIUM", "MID", "BUDGET"];
const WEB = [
  { value: "", label: "All" },
  { value: "NO", label: "No website" },
  { value: "YES", label: "Has website" },
];

export default function LeadsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "ALL" || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const get = (key: string) => searchParams.get(key) ?? "";

  return (
    <div className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex flex-wrap gap-3 items-center">
      <span className="text-xs font-medium text-stone-500">Filter:</span>

      {[
        { key: "city", options: CITIES },
        { key: "priority", options: PRIORITIES },
        { key: "status", options: STATUSES },
        { key: "segment", options: SEGMENTS },
      ].map(({ key, options }) => (
        <div key={key}>
          <label className="sr-only">{key}</label>
          <select
            value={get(key).toUpperCase() || "ALL"}
            onChange={(e) => update(key, e.target.value)}
            className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 outline-none cursor-pointer bg-stone-50 capitalize"
          >
            {options.map((o) => (
              <option key={o} value={o}>{o === "ALL" ? `All ${key}s` : o.toLowerCase()}</option>
            ))}
          </select>
        </div>
      ))}

      <select
        value={get("hasWebsite")}
        onChange={(e) => update("hasWebsite", e.target.value)}
        className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 outline-none cursor-pointer bg-stone-50"
      >
        {WEB.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {searchParams.toString() && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-amber-600 hover:underline ml-auto"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
