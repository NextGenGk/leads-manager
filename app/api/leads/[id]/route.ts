// app/api/leads/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeLeadScore, scoreToPriority } from "@/lib/scoring";
import { Priority } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await db.business.findUnique({
    where: { id: params.id },
    include: {
      instagramProfile: true,
      emailDrafts: { orderBy: { generatedAt: "desc" }, take: 10 },
      notes: { orderBy: { createdAt: "desc" } },
      discoveredVia: true,
      dailySnapshots: { orderBy: { date: "desc" }, take: 30 },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Recalculate score if scoring-related fields changed
  const existing = await db.business.findUnique({
    where: { id: params.id },
    include: { instagramProfile: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const merged = { ...existing, ...body };
  const scoreBreakdown = computeLeadScore({
    hasWebsite: merged.hasWebsite,
    websiteScore: merged.websiteScore,
    segment: merged.segment,
    openingDate: merged.openingDate,
    hasReservation: merged.hasReservation,
    hasOnlineMenu: merged.hasOnlineMenu,
    googleRating: merged.googleRating,
    googleReviews: merged.googleReviews,
    instagram: existing.instagramProfile,
  });

  const updated = await db.business.update({
    where: { id: params.id },
    data: {
      ...body,
      leadScore: scoreBreakdown.total,
      priority: scoreToPriority(scoreBreakdown.total) as Priority,
    },
  });

  return NextResponse.json({ lead: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.business.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
