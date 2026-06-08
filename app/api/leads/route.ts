// app/api/leads/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { computeLeadScore, scoreToPriority } from "@/lib/scoring";
import { City, Segment, Category, Priority } from "@prisma/client";

const CreateLeadSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  category: z.nativeEnum(Category).default("CAFE"),
  segment: z.nativeEnum(Segment).default("BUDGET"),
  openingNote: z.string().optional(),
  area: z.string().min(1),
  city: z.nativeEnum(City),
  address: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  googlePlaceId: z.string().optional(),
  googleMapsUrl: z.string().url().optional().or(z.literal("")),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  googleRating: z.number().min(0).max(5).optional(),
  googleReviews: z.number().int().optional(),
  hasWebsite: z.boolean().default(false),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  websiteScore: z.number().int().min(0).max(10).optional(),
});

// GET /api/leads — list with optional filters
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  const priority = searchParams.get("priority");
  const limit = parseInt(searchParams.get("limit") ?? "50");

  const where: any = {};
  if (city && city !== "ALL") where.city = city as City;
  if (priority && priority !== "ALL") where.priority = priority as Priority;

  const leads = await db.business.findMany({
    where,
    include: { instagramProfile: true },
    orderBy: { leadScore: "desc" },
    take: Math.min(limit, 200),
  });

  return NextResponse.json({ leads, total: leads.length });
}

// POST /api/leads — create new lead manually
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateLeadSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  const slug =
    data.slug ??
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
      "-" +
      data.city.toLowerCase() +
      "-" +
      Date.now();

  const scoreBreakdown = computeLeadScore({
    hasWebsite: data.hasWebsite,
    websiteScore: data.websiteScore ?? 0,
    segment: data.segment,
    openingDate: null,
    hasReservation: false,
    hasOnlineMenu: false,
    googleRating: data.googleRating ?? null,
    googleReviews: data.googleReviews ?? null,
    instagram: null,
  });

  const lead = await db.business.create({
    data: {
      ...data,
      slug,
      email: data.email || undefined,
      websiteUrl: data.websiteUrl || undefined,
      googleMapsUrl: data.googleMapsUrl || undefined,
      leadScore: scoreBreakdown.total,
      priority: scoreToPriority(scoreBreakdown.total) as Priority,
      discoveredVia: {
        create: { source: "manual" },
      },
    },
  });

  return NextResponse.json({ lead }, { status: 201 });
}
