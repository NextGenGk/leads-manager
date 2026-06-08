// app/(dashboard)/map/page.tsx
import { db } from "@/lib/db";
import LeadsMapClient from "@/components/leads/LeadsMapClient";

export const revalidate = 300;

export default async function MapPage() {
  const leads = await db.business.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    select: {
      id: true, name: true, area: true, city: true,
      latitude: true, longitude: true, priority: true,
      leadScore: true, segment: true, googleRating: true,
      googleReviews: true, hasWebsite: true, phone: true,
      googleMapsUrl: true, status: true,
    },
  });

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Map View</h1>
        <p className="text-sm text-stone-500 mt-1">
          {leads.length} leads mapped across Bhilai & Durg
        </p>
      </div>
      <LeadsMapClient leads={leads} />
    </div>
  );
}
