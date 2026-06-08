// components/dashboard/LeadsByCity.tsx
"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  cityBreakdown: { city: string; _count: { city: number } }[];
}

const COLORS: Record<string, string> = {
  BHILAI: "#B85C38",
  DURG: "#534AB7",
};

export default function LeadsByCity({ cityBreakdown }: Props) {
  const data = cityBreakdown.map((c) => ({
    name: c.city,
    value: c._count.city,
  }));

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Leads by city</h2>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={80} height={80}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={24} outerRadius={36} dataKey="value" strokeWidth={0}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name] ?? "#9C9690"} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[d.name] ?? "#9C9690" }} />
              <span className="text-stone-600">{d.name}</span>
              <span className="font-semibold text-stone-900 ml-auto">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
