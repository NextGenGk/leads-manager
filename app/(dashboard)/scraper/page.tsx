// app/(dashboard)/scraper/page.tsx
import { db } from "@/lib/db";
import ScraperControlPanel from "@/components/scraper/ScraperControlPanel";
import ScraperRunHistory from "@/components/scraper/ScraperRunHistory";
import BloggerManager from "@/components/scraper/BloggerManager";
import HashtagManager from "@/components/scraper/HashtagManager";

export const revalidate = 0;

export default async function ScraperPage() {
  const [runs, bloggers, hashtags] = await Promise.all([
    db.scrapeRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 30,
      include: { business: { select: { name: true } } },
    }),
    db.foodBlogger.findMany({ orderBy: { followers: "desc" } }),
    db.trackedHashtag.findMany({ orderBy: { postsFound: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">
          Instagram Scraper
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Automated daily scraping of Bhilai & Durg hashtags and food bloggers.
          Runs every day at 7 AM IST via Inngest.
        </p>
      </div>

      <ScraperControlPanel />

      <div className="grid grid-cols-2 gap-6">
        <BloggerManager bloggers={bloggers} />
        <HashtagManager hashtags={hashtags} />
      </div>

      <ScraperRunHistory runs={runs} />
    </div>
  );
}
