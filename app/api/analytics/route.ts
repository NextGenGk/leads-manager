// app/api/analytics/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    priorityBreakdown,
    segmentBreakdown,
    cityBreakdown,
    statusBreakdown,
    weeklyLeads,
    noWebsiteCount,
  ] = await Promise.all([
    db.business.groupBy({ by: ["priority"], _count: { priority: true } }),
    db.business.groupBy({ by: ["segment"], _count: { segment: true } }),
    db.business.groupBy({ by: ["city"], _count: { city: true } }),
    db.business.groupBy({ by: ["status"], _count: { status: true } }),
    // Count leads created in each of the last 7 days
    db.$queryRaw<{ day: string; count: number }[]>`
      SELECT
        DATE(created_at) as day,
        COUNT(*)::int as count
      FROM "Business"
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY day
    `,
    db.business.count({ where: { hasWebsite: false } }),
  ]);

  return NextResponse.json({
    priorityBreakdown,
    segmentBreakdown,
    cityBreakdown,
    statusBreakdown,
    weeklyLeads,
    noWebsiteCount,
  });
}
