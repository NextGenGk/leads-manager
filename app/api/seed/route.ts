// app/api/seed/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { KNOWN_LEADS } from "@/lib/seed-data";
import { SEED_BLOGGERS, ALL_HASHTAGS } from "@/lib/instagram";
import { EngagementLevel, Priority } from "@prisma/client";

export async function POST() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let seeded = 0;
  let skipped = 0;

  for (const lead of KNOWN_LEADS) {
    const exists = await db.business.findFirst({
      where: { OR: [{ slug: lead.slug }, { name: lead.name }] },
    });
    if (exists) { skipped++; continue; }

    const { instagramUsername, instagramFollowers, instagramPosts, instagramEngagement, ...bizData } = lead;

    const business = await db.business.create({
      data: {
        ...bizData,
        discoveredVia: { create: { source: "manual:seed" } },
      },
    });

    if (instagramUsername) {
      await db.instagramProfile.create({
        data: {
          businessId: business.id,
          username: instagramUsername,
          profileUrl: `https://instagram.com/${instagramUsername}`,
          followers: instagramFollowers,
          postsCount: instagramPosts,
          engagementLevel: instagramEngagement as EngagementLevel,
        },
      });
    }

    seeded++;
  }

  // Seed bloggers
  for (const b of SEED_BLOGGERS) {
    await db.foodBlogger.upsert({
      where: { username: b.username },
      create: { username: b.username, city: b.city },
      update: {},
    });
  }

  // Seed hashtags
  for (const tag of ALL_HASHTAGS) {
    await db.trackedHashtag.upsert({
      where: { tag },
      create: { tag, city: tag.toLowerCase().includes("durg") ? "DURG" : "BHILAI" },
      update: {},
    });
  }

  return NextResponse.json({ seeded, skipped, total: KNOWN_LEADS.length });
}
