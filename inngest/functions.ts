// inngest/functions.ts
import { inngest } from "./client";
import { db } from "@/lib/db";
import {
  ALL_HASHTAGS,
  scrapeHashtag,
  scrapeBloggerPosts,
  scrapeProfile,
  extractCity,
  isNewOpeningPost,
  extractBusinessName,
  upsertInstagramProfile,
  computeEngagement,
} from "@/lib/instagram";
import { computeLeadScore, scoreToPriority } from "@/lib/scoring";
import { City, ScrapeSource, Priority } from "@prisma/client";

// ─── 1. Daily hashtag scrape — runs every day at 7 AM IST ─
export const dailyHashtagScrape = inngest.createFunction(
  { id: "daily-hashtag-scrape", name: "Daily: Scrape Bhilai/Durg hashtags" },
  [{ cron: "30 1 * * *" }, { event: "instagram/hashtags.scrape" }],
  async ({ event, step, logger }) => {
    let totalPosts = 0;
    let totalNew = 0;
    let totalUpdated = 0;
    const eventData = event.data as { runId?: string } | undefined;
    const batchRunId = eventData?.runId;

    for (const hashtag of ALL_HASHTAGS) {
      await step.run(`scrape-hashtag-${hashtag}`, async () => {
        logger.info(`Scraping #${hashtag}…`);

        const runLog = await db.scrapeRun.create({
          data: {
            source: ScrapeSource.INSTAGRAM_HASHTAG,
            targetQuery: `#${hashtag}`,
            status: "RUNNING",
          },
        });

        try {
          const { posts, runId, cost } = await scrapeHashtag(hashtag, 30);

          totalPosts += posts.length;

          let newLeads = 0;
          let updated = 0;

          for (const post of posts) {
            const city = extractCity(
              post.caption ?? "",
              post.hashtags ?? []
            );
            if (!city) continue;

            const isNew = isNewOpeningPost(post.caption ?? "");
            const bizName =
              extractBusinessName(post.caption ?? "") ??
              post.ownerFullName ??
              null;
            if (!bizName) continue;

            // Check if already exists
            const existing = await db.business.findFirst({
              where: {
                OR: [
                  { name: { contains: bizName, mode: "insensitive" } },
                  {
                    instagramProfile: {
                      username: post.ownerUsername ?? "__none__",
                    },
                  },
                ],
              },
            });

            if (existing) {
              updated++;
              continue;
            }

            // Create new lead
            const slug =
              bizName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "") +
              "-" +
              city.toLowerCase() +
              "-" +
              Date.now();

            const scoreData = {
              hasWebsite: false,
              websiteScore: 0,
              segment: "BUDGET" as any,
              openingDate: isNew ? new Date() : null,
              hasReservation: false,
              hasOnlineMenu: false,
              googleRating: null,
              googleReviews: null,
              instagram: null,
            };
            const scoreBreakdown = computeLeadScore(scoreData);

            await db.business.create({
              data: {
                name: bizName,
                slug,
                city,
                area: city === "BHILAI" ? "Bhilai" : "Durg",
                hasWebsite: false,
                leadScore: scoreBreakdown.total,
                priority: scoreToPriority(scoreBreakdown.total) as Priority,
                openingDate: isNew ? new Date() : undefined,
                discoveredVia: {
                  create: {
                    source: `hashtag:#${hashtag}`,
                    postUrl: post.url,
                    snippet: post.caption?.slice(0, 200),
                  },
                },
              },
            });

            // If post owner has Instagram, try to enrich
            if (post.ownerUsername) {
              const profile = await scrapeProfile(post.ownerUsername);
              if (profile) {
                const biz = await db.business.findFirst({
                  where: { slug },
                });
                if (biz) {
                  await upsertInstagramProfile(biz.id, profile, [post]);
                }
              }
            }

            newLeads++;
            totalNew++;
          }

          await db.scrapeRun.update({
            where: { id: runLog.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
              apifyRunId: runId,
              cost,
              totalFound: posts.length,
              newLeads,
              updated,
            },
          });
        } catch (err: any) {
          logger.error(`Error scraping #${hashtag}: ${err.message}`);
          await db.scrapeRun.update({
            where: { id: runLog.id },
            data: {
              status: "FAILED",
              completedAt: new Date(),
              errorLog: err.message,
            },
          });
        }
      });
    }

    if (batchRunId) {
      await db.scrapeRun.update({
        where: { id: batchRunId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          totalFound: totalPosts,
          newLeads: totalNew,
          updated: totalUpdated,
        },
      });
    }

    return { totalNew, totalUpdated };
  }
);

// ─── 2. Blogger posts scrape — every day at 9 AM IST ──
export const dailyBloggerScrape = inngest.createFunction(
  { id: "daily-blogger-scrape", name: "Daily: Scrape food bloggers" },
  [{ cron: "30 3 * * *" }, { event: "instagram/bloggers.scrape" }],
  async ({ event, step, logger }) => {
    const eventData = event.data as { runId?: string } | undefined;
    const batchRunId = eventData?.runId;
    const bloggers = await db.foodBlogger.findMany({
      where: { isActive: true },
    });

    let totalPosts = 0;
    let totalLeads = 0;

    for (const blogger of bloggers) {
      await step.run(`scrape-blogger-${blogger.username}`, async () => {
        logger.info(`Scraping blogger @${blogger.username}…`);

        try {
          const { posts, profile } = await scrapeBloggerPosts(
            blogger.username,
            20
          );

          let newLeads = 0;

          for (const post of posts) {
            const city = extractCity(
              post.caption ?? "",
              post.hashtags ?? []
            );
            if (!city) continue;

            const bizName = extractBusinessName(post.caption ?? "");
            if (!bizName) continue;

            const existing = await db.business.findFirst({
              where: {
                name: { contains: bizName, mode: "insensitive" },
              },
            });

            if (existing) continue;

            const slug =
              bizName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "") +
              "-" +
              city.toLowerCase() +
              "-" +
              Date.now();

            const scoreBreakdown = computeLeadScore({
              hasWebsite: false,
              websiteScore: 0,
              segment: "BUDGET" as any,
              openingDate: null,
              hasReservation: false,
              hasOnlineMenu: false,
              googleRating: null,
              googleReviews: null,
              instagram: null,
            });

            await db.business.create({
              data: {
                name: bizName,
                slug,
                city,
                area: city === "BHILAI" ? "Bhilai" : "Durg",
                hasWebsite: false,
                leadScore: scoreBreakdown.total,
                priority: scoreToPriority(scoreBreakdown.total) as Priority,
                discoveredVia: {
                  create: {
                    source: `blogger:@${blogger.username}`,
                    postUrl: post.url,
                    snippet: post.caption?.slice(0, 200),
                  },
                },
              },
            });
            newLeads++;
            totalLeads++;
          }

          totalPosts += posts.length;

          await db.foodBlogger.update({
            where: { id: blogger.id },
            data: {
              lastScraped: new Date(),
              postsScraped: { increment: posts.length },
              leadsFound: { increment: newLeads },
            },
          });
        } catch (err: any) {
          logger.error(
            `Failed scraping @${blogger.username}: ${err.message}`
          );
        }
      });
    }

    if (batchRunId) {
      await db.scrapeRun.update({
        where: { id: batchRunId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          totalFound: totalPosts,
          newLeads: totalLeads,
        },
      });
    }
  }
);

// ─── 3. Instagram profile refresh — every 48 hours ────
export const refreshInstagramProfiles = inngest.createFunction(
  {
    id: "refresh-instagram-profiles",
    name: "48h: Refresh all IG profiles",
  },
  { cron: "0 0 */2 * *" },
  async ({ step, logger }) => {
    const profiles = await db.instagramProfile.findMany({
      where: {
        updatedAt: {
          lt: new Date(Date.now() - 47 * 60 * 60 * 1000),
        },
      },
      take: 50, // batch of 50 per run
    });

    for (const profile of profiles) {
      await step.run(`refresh-ig-${profile.username}`, async () => {
        try {
          const fresh = await scrapeProfile(profile.username);
          if (!fresh) return;
          await upsertInstagramProfile(profile.businessId, fresh, []);
        } catch (err: any) {
          logger.warn(`Could not refresh @${profile.username}`);
        }
      });
    }
  }
);

// ─── 4. Daily snapshots — midnight IST ────────────────
export const takeDailySnapshots = inngest.createFunction(
  { id: "daily-snapshots", name: "Daily: Snapshot all lead metrics" },
  [{ cron: "30 18 * * *" }, { event: "leads/snapshots.take" }],
  async ({ event, step }) => {
    const eventData = event.data as { runId?: string } | undefined;
    const batchRunId = eventData?.runId;
    const businesses = await db.business.findMany({
      include: { instagramProfile: true },
    });

    await step.run("write-snapshots", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await db.$transaction(
        businesses.map((b) =>
          db.dailySnapshot.upsert({
            where: {
              businessId_date: { businessId: b.id, date: today },
            },
            create: {
              businessId: b.id,
              date: today,
              googleRating: b.googleRating,
              googleReviews: b.googleReviews,
              igFollowers: b.instagramProfile?.followers ?? null,
              igPosts: b.instagramProfile?.postsCount ?? null,
              leadScore: b.leadScore,
            },
            update: {
              googleRating: b.googleRating,
              googleReviews: b.googleReviews,
              igFollowers: b.instagramProfile?.followers ?? null,
              leadScore: b.leadScore,
            },
          })
        )
      );
    });

    if (batchRunId) {
      await db.scrapeRun.update({
        where: { id: batchRunId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          totalFound: businesses.length,
        },
      });
    }

    return { snapshotted: businesses.length };
  }
);

// ─── 5. Manual trigger: scrape single profile ─────────
export const scrapeProfileOnDemand = inngest.createFunction(
  { id: "scrape-profile-on-demand", name: "On-demand: Scrape IG profile" },
  { event: "instagram/profile.scrape" },
  async ({ event, step }) => {
    const { businessId, username } = event.data as {
      businessId: string;
      username: string;
    };

    await step.run("fetch-profile", async () => {
      const profile = await scrapeProfile(username);
      if (!profile) return;
      await upsertInstagramProfile(businessId, profile, []);
    });
  }
);
