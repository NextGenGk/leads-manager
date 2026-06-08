// app/api/scrape/hashtags/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { City } from "@prisma/client";

const HashtagSchema = z.object({
  tag: z.string().min(1).max(50).transform((t) => t.replace(/^#/, "")),
  city: z.nativeEnum(City).optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hashtags = await db.trackedHashtag.findMany({ orderBy: { postsFound: "desc" } });
  return NextResponse.json({ hashtags });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = HashtagSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const hashtag = await db.trackedHashtag.upsert({
    where: { tag: parsed.data.tag },
    create: parsed.data,
    update: { isActive: true },
  });
  return NextResponse.json({ hashtag }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tag } = await req.json();
  await db.trackedHashtag.update({ where: { tag }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
