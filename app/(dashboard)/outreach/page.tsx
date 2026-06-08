// app/(dashboard)/outreach/page.tsx
import { db } from "@/lib/db";
import OutreachTable from "@/components/outreach/OutreachTable";
import OutreachStats from "@/components/outreach/OutreachStats";

export const revalidate = 0;

export default async function OutreachPage() {
  const [emails, stats] = await Promise.all([
    db.outreachEmail.findMany({
      orderBy: { generatedAt: "desc" },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            area: true,
            city: true,
            priority: true,
            phone: true,
            email: true,
          },
        },
      },
      take: 50,
    }),
    db.outreachEmail.groupBy({
      by: ["sentStatus"],
      _count: { sentStatus: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">
          Outreach Hub
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          All AI-generated personalised emails across your leads.
        </p>
      </div>
      <OutreachStats stats={stats} />
      <OutreachTable emails={emails} />
    </div>
  );
}
