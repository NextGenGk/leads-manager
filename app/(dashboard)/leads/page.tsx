// app/(dashboard)/leads/page.tsx
import { db } from "@/lib/db";
import LeadsTable from "@/components/leads/LeadsTable";
import LeadsFilters from "@/components/leads/LeadsFilters";
import { City, Priority, LeadStatus, Segment } from "@prisma/client";

interface SearchParams {
  city?: string;
  priority?: string;
  status?: string;
  segment?: string;
  hasWebsite?: string;
  q?: string;
  page?: string;
}

export const revalidate = 0;

async function getLeads(params: SearchParams) {
  const page = parseInt(params.page ?? "1");
  const pageSize = 20;

  const where: any = {};
  if (params.city && params.city !== "ALL")
    where.city = params.city as City;
  if (params.priority && params.priority !== "ALL")
    where.priority = params.priority as Priority;
  if (params.status && params.status !== "ALL")
    where.status = params.status as LeadStatus;
  if (params.segment && params.segment !== "ALL")
    where.segment = params.segment as Segment;
  if (params.hasWebsite === "NO") where.hasWebsite = false;
  if (params.hasWebsite === "YES") where.hasWebsite = true;
  if (params.q)
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { area: { contains: params.q, mode: "insensitive" } },
      { address: { contains: params.q, mode: "insensitive" } },
    ];

  const [leads, total] = await Promise.all([
    db.business.findMany({
      where,
      include: { instagramProfile: true, discoveredVia: true },
      orderBy: { leadScore: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.business.count({ where }),
  ]);

  return { leads, total, page, pageSize };
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { leads, total, page, pageSize } = await getLeads(searchParams);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">All Leads</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {total} businesses found · Bhilai & Durg
          </p>
        </div>
      </div>

      <LeadsFilters />

      <LeadsTable
        leads={leads}
        total={total}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
