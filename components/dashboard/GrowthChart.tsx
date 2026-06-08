// components/dashboard/GrowthChart.tsx
"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useEffect, useState } from "react";

interface Snapshot {
  date: string;
  leads: number;
  avgFollowers: number;
}

export default function GrowthChart() {
  const [data, setData] = useState<Snapshot[]>([]);

  useEffect(() => {
    // Generate mock trend data based on seed data
    const days = 30;
    const base = new Date();
    base.setDate(base.getDate() - days);
    const arr: Snapshot[] = [];
    for (let i = 0; i <= days; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      arr.push({
        date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        leads: Math.min(12, Math.floor(5 + i * 0.23)),
        avgFollowers: Math.floor(300 + i * 12),
      });
    }
    setData(arr);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-stone-900">Lead & Instagram growth (30 days)</h2>
        <span className="text-[11px] text-stone-400">Updated daily via scraper</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE4" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#9C9690" }}
            tickLine={false}
            interval={5}
          />
          <YAxis tick={{ fontSize: 10, fill: "#9C9690" }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E8E4DC" }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="leads"
            stroke="#B85C38"
            strokeWidth={2}
            dot={false}
            name="Total leads"
          />
          <Line
            type="monotone"
            dataKey="avgFollowers"
            stroke="#534AB7"
            strokeWidth={2}
            dot={false}
            name="Avg IG followers"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
