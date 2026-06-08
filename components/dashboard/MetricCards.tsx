// components/dashboard/MetricCards.tsx
import { Users, AlertTriangle, Globe2, Plus } from "lucide-react";

interface Props {
  totalLeads: number;
  highPriority: number;
  noWebsite: number;
  newThisWeek: number;
}

const cards = (p: Props) => [
  {
    label: "Total leads",
    value: p.totalLeads,
    sub: "Bhilai & Durg",
    icon: Users,
    color: "bg-stone-100 text-stone-700",
  },
  {
    label: "High priority",
    value: p.highPriority,
    sub: "Score ≥ 15/20",
    icon: AlertTriangle,
    color: "bg-red-50 text-red-600",
  },
  {
    label: "No website",
    value: p.noWebsite,
    sub: "Immediate opportunity",
    icon: Globe2,
    color: "bg-amber-50 text-amber-600",
  },
  {
    label: "Added this week",
    value: p.newThisWeek,
    sub: "Via scraper or manual",
    icon: Plus,
    color: "bg-emerald-50 text-emerald-600",
  },
];

export default function MetricCards(props: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {cards(props).map((c) => (
        <div
          key={c.label}
          className="bg-white rounded-xl border border-stone-200 p-4 flex items-start gap-3"
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.color}`}>
            <c.icon size={16} />
          </div>
          <div>
            <div className="text-2xl font-semibold text-stone-900 font-mono">{c.value}</div>
            <div className="text-xs font-medium text-stone-700 mt-0.5">{c.label}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">{c.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
