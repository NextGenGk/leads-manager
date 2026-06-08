// app/api/scrape/bloggers/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { City } from "@prisma/client";

const BloggerSchema = z.object({
  username: z.string().min(1).max(30),
  fullName: z.string().optional(),
  city: z.nativeEnum(City),
  followers: z.number().int().default(0),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bloggers = await db.foodBlogger.findMany({ orderBy: { followers: "desc" } });
  return NextResponse.json({ bloggers });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = BloggerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const blogger = await db.foodBlogger.upsert({
    where: { username: parsed.data.username },
    create: parsed.data,
    update: { isActive: true, ...parsed.data },
  });
  return NextResponse.json({ blogger }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { username } = await req.json();
  await db.foodBlogger.update({ where: { username }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
