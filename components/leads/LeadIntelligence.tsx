// components/leads/LeadIntelligence.tsx
import { Business, InstagramProfile, DiscoverySource, LeadNote, OutreachEmail, DailySnapshot } from "@prisma/client";
import { computeLeadScore, recommendedServices } from "@/lib/scoring";

type FullLead = Business & {
  instagramProfile: InstagramProfile | null;
  emailDrafts: OutreachEmail[];
  notes: LeadNote[];
  discoveredVia: DiscoverySource | null;
  dailySnapshots: DailySnapshot[];
};

function Bar({ label, value, max, color = "#B85C38" }: { label: string; value: number; max: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-stone-500 w-40 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="text-xs font-mono text-stone-500 w-8 text-right">{value}/{max}</span>
    </div>
  );
}

export default function LeadIntelligence({ lead }: { lead: FullLead }) {
  const breakdown = computeLeadScore({
    hasWebsite: lead.hasWebsite,
    websiteScore: lead.websiteScore,
    segment: lead.segment,
    openingDate: lead.openingDate,
    hasReservation: lead.hasReservation,
    hasOnlineMenu: lead.hasOnlineMenu,
    googleRating: lead.googleRating,
    googleReviews: lead.googleReviews,
    instagram: lead.instagramProfile,
  });

  const services = recommendedServices({
    hasWebsite: lead.hasWebsite,
    websiteScore: lead.websiteScore,
    segment: lead.segment,
    openingDate: lead.openingDate,
    hasReservation: lead.hasReservation,
    hasOnlineMenu: lead.hasOnlineMenu,
    googleRating: lead.googleRating,
    googleReviews: lead.googleReviews,
    instagram: lead.instagramProfile,
    category: lead.category,
  });

  const DIGITAL_GAPS = [
    { label: "Website", ok: lead.hasWebsite, fix: "New website design" },
    { label: "Online reservation", ok: lead.hasReservation, fix: "Booking system" },
    { label: "Online menu", ok: lead.hasOnlineMenu, fix: "Menu website" },
    { label: "Instagram", ok: !!lead.instagramProfile, fix: "Instagram setup" },
    { label: "Good Google rating", ok: (lead.googleRating ?? 0) >= 4.0, fix: "GBP optimization" },
  ];

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-5">
      <h2 className="text-sm font-semibold text-stone-900">Intelligence & scoring</h2>

      {/* Score breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Score breakdown</p>
        <Bar label="No website" value={breakdown.noWebsite} max={5} />
        <Bar label="Poor website" value={breakdown.poorWebsite} max={4} color="#D4845E" />
        <Bar label="Recent opening" value={breakdown.recentOpening} max={4} color="#534AB7" />
        <Bar label="Premium segment" value={breakdown.premiumSegment} max={3} color="#3A6B4A" />
        <Bar label="Instagram presence" value={breakdown.activeInstagram} max={2} color="#7B2D9E" />
        <Bar label="Missing online system" value={breakdown.missingOnlineSystem} max={2} color="#8B5E1A" />
        <Bar label="Google rating bonus" value={breakdown.googlePresence} max={1} color="#1F4E7A" />
      </div>

      {/* Digital gaps */}
      <div>
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Digital gaps</p>
        <div className="grid grid-cols-2 gap-2">
          {DIGITAL_GAPS.map((g) => (
            <div key={g.label} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${g.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
              <span>{g.ok ? "✓" : "✗"}</span>
              <span>{g.ok ? g.label : `No ${g.label.toLowerCase()} → ${g.fix}`}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended services */}
      <div>
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Recommended services</p>
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <span key={s} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-medium">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
