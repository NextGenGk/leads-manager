// app/(dashboard)/leads/[id]/page.tsx
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import LeadHeader from "@/components/leads/LeadHeader";
import LeadIntelligence from "@/components/leads/LeadIntelligence";
import LeadInstagram from "@/components/leads/LeadInstagram";
import LeadGrowthChart from "@/components/leads/LeadGrowthChart";
import OutreachEmailPanel from "@/components/outreach/OutreachEmailPanel";
import LeadNotes from "@/components/leads/LeadNotes";
import LeadStatusBar from "@/components/leads/LeadStatusBar";

export const revalidate = 0;

async function getLead(id: string) {
  const lead = await db.business.findUnique({
    where: { id },
    include: {
      instagramProfile: true,
      emailDrafts: { orderBy: { generatedAt: "desc" }, take: 10 },
      notes: { orderBy: { createdAt: "desc" } },
      discoveredVia: true,
      dailySnapshots: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
  });
  return lead;
}

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const lead = await getLead(params.id);
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <LeadHeader lead={lead} />
      <LeadStatusBar lead={lead} />

      <div className="grid grid-cols-3 gap-6">
        {/* Left column — 2/3 */}
        <div className="col-span-2 space-y-6">
          <LeadIntelligence lead={lead} />
          {lead.instagramProfile && (
            <LeadInstagram profile={lead.instagramProfile} />
          )}
          <LeadGrowthChart snapshots={lead.dailySnapshots} />
          <OutreachEmailPanel lead={lead} existingEmails={lead.emailDrafts} />
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-4">
          <LeadNotes leadId={lead.id} notes={lead.notes} />
        </div>
      </div>
    </div>
  );
}
