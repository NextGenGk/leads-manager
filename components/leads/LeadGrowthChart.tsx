// components/leads/LeadGrowthChart.tsx
"use client";
import { DailySnapshot } from "@prisma/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function LeadGrowthChart({ snapshots }: { snapshots: DailySnapshot[] }) {
  if (snapshots.length < 2) return null;

  const data = [...snapshots].reverse().map((s) => ({
    date: format(s.date, "dd MMM"),
    reviews: s.googleReviews ?? 0,
    followers: s.igFollowers ?? 0,
    score: s.leadScore ?? 0,
  }));

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5">
      <h2 className="text-sm font-semibold text-stone-900 mb-4">Growth over time</h2>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE4" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9C9690" }} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#9C9690" }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E8E4DC" }} />
          <Line type="monotone" dataKey="reviews" stroke="#B85C38" strokeWidth={2} dot={false} name="Reviews" />
          <Line type="monotone" dataKey="followers" stroke="#534AB7" strokeWidth={2} dot={false} name="IG Followers" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
