// components/outreach/OutreachStats.tsx
interface Props {
  stats: { sentStatus: string; _count: { sentStatus: number } }[];
}
const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Drafts", READY: "Ready", SENT: "Sent", OPENED: "Opened",
  REPLIED: "Replied", BOUNCED: "Bounced",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-stone-100 text-stone-600", READY: "bg-blue-50 text-blue-600",
  SENT: "bg-amber-50 text-amber-700", OPENED: "bg-purple-50 text-purple-700",
  REPLIED: "bg-emerald-50 text-emerald-700", BOUNCED: "bg-red-50 text-red-600",
};

export default function OutreachStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-6 gap-3">
      {stats.map((s) => (
        <div key={s.sentStatus} className={`rounded-xl p-4 text-center ${STATUS_COLOR[s.sentStatus] ?? "bg-stone-100"}`}>
          <div className="text-2xl font-semibold font-mono">{s._count.sentStatus}</div>
          <div className="text-xs mt-1 font-medium">{STATUS_LABEL[s.sentStatus] ?? s.sentStatus}</div>
        </div>
      ))}
    </div>
  );
}
