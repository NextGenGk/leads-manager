// app/api/scrape/runs/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const runs = await db.scrapeRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 30,
    include: { business: { select: { name: true } } },
  });
  return NextResponse.json({ runs });
}
