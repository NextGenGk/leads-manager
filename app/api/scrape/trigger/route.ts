// app/api/scrape/trigger/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { z } from "zod";
import { ALL_HASHTAGS } from "@/lib/instagram";

const TriggerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hashtags") }),
  z.object({ type: z.literal("bloggers") }),
  z.object({ type: z.literal("profile"), businessId: z.string(), username: z.string() }),
  z.object({ type: z.literal("snapshots") }),
]);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = TriggerSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  switch (data.type) {
    case "hashtags": {
      const run = await db.scrapeRun.create({
        data: {
          source: "INSTAGRAM_HASHTAG",
          targetQuery: ALL_HASHTAGS.map(h => `#${h}`).join(", "),
          status: "RUNNING",
        },
      });
      try {
        await inngest.send({ name: "instagram/hashtags.scrape", data: { runId: run.id } });
      } catch {
        await db.scrapeRun.update({
          where: { id: run.id },
          data: { status: "FAILED", completedAt: new Date(), errorLog: "Failed to send to Inngest" },
        });
      }
      return NextResponse.json({ triggered: "hashtag-scrape", runId: run.id });
    }

    case "bloggers": {
      const run = await db.scrapeRun.create({
        data: {
          source: "INSTAGRAM_BLOGGER",
          targetQuery: "all active bloggers",
          status: "RUNNING",
        },
      });
      try {
        await inngest.send({ name: "instagram/bloggers.scrape", data: { runId: run.id } });
      } catch {
        await db.scrapeRun.update({
          where: { id: run.id },
          data: { status: "FAILED", completedAt: new Date(), errorLog: "Failed to send to Inngest" },
        });
      }
      return NextResponse.json({ triggered: "blogger-scrape", runId: run.id });
    }

    case "profile":
      await inngest.send({
        name: "instagram/profile.scrape",
        data: { businessId: data.businessId, username: data.username },
      });
      return NextResponse.json({ triggered: "profile-scrape" });

    case "snapshots": {
      const run = await db.scrapeRun.create({
        data: {
          source: "GOOGLE_MAPS",
          targetQuery: "daily snapshot",
          status: "RUNNING",
        },
      });
      try {
        await inngest.send({ name: "leads/snapshots.take", data: { runId: run.id } });
      } catch {
        await db.scrapeRun.update({
          where: { id: run.id },
          data: { status: "FAILED", completedAt: new Date(), errorLog: "Failed to send to Inngest" },
        });
      }
      return NextResponse.json({ triggered: "snapshots", runId: run.id });
    }
  }
}
