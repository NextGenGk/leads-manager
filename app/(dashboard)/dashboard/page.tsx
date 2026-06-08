// app/(dashboard)/dashboard/page.tsx
import { db } from "@/lib/db";
import MetricCards from "@/components/dashboard/MetricCards";
import RecentLeads from "@/components/dashboard/RecentLeads";
import LeadsByCity from "@/components/dashboard/LeadsByCity";
import ScraperStatus from "@/components/dashboard/ScraperStatus";
import TopLeadsTable from "@/components/dashboard/TopLeadsTable";
import GrowthChart from "@/components/dashboard/GrowthChart";

export const revalidate = 300; // revalidate every 5 min

async function getDashboardData() {
  const [
    totalLeads,
    highPriority,
    noWebsite,
    newThisWeek,
    recentLeads,
    lastScrapeRun,
    cityBreakdown,
    topLeads,
  ] = await Promise.all([
    db.business.count(),
    db.business.count({ where: { priority: "HIGH" } }),
    db.business.count({ where: { hasWebsite: false } }),
    db.business.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    db.business.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { instagramProfile: true },
    }),
    db.scrapeRun.findFirst({
      orderBy: { startedAt: "desc" },
    }),
    db.business.groupBy({
      by: ["city"],
      _count: { city: true },
    }),
    db.business.findMany({
      take: 10,
      orderBy: { leadScore: "desc" },
      include: { instagramProfile: true },
    }),
  ]);

  return {
    totalLeads,
    highPriority,
    noWebsite,
    newThisWeek,
    recentLeads,
    lastScrapeRun,
    cityBreakdown,
    topLeads,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">
          Lead Intelligence Dashboard
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Bhilai & Durg · Cafés & Restaurants · Updated daily via Instagram
          scraper
        </p>
      </div>

      {/* Metric cards */}
      <MetricCards
        totalLeads={data.totalLeads}
        highPriority={data.highPriority}
        noWebsite={data.noWebsite}
        newThisWeek={data.newThisWeek}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Growth chart — takes 2 cols */}
        <div className="col-span-2">
          <GrowthChart />
        </div>

        {/* Scraper status + city breakdown */}
        <div className="space-y-4">
          <ScraperStatus lastRun={data.lastScrapeRun} />
          <LeadsByCity cityBreakdown={data.cityBreakdown} />
        </div>
      </div>

      {/* Top leads table */}
      <TopLeadsTable leads={data.topLeads} />

      {/* Recent additions */}
      <RecentLeads leads={data.recentLeads} />
    </div>
  );
}
