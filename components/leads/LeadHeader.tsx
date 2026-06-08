// components/leads/LeadHeader.tsx
"use client";
import { Business, InstagramProfile, DiscoverySource, LeadNote, OutreachEmail, DailySnapshot } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Globe, Instagram, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type FullLead = Business & {
  instagramProfile: InstagramProfile | null;
  emailDrafts: OutreachEmail[];
  notes: LeadNote[];
  discoveredVia: DiscoverySource | null;
  dailySnapshots: DailySnapshot[];
};

export default function LeadHeader({ lead }: { lead: FullLead }) {
  const initials = lead.name.slice(0, 2).toUpperCase();
  const priorityColors: Record<string, string> = {
    HIGH: "bg-red-600", MEDIUM: "bg-amber-500", LOW: "bg-stone-400",
  };

  return (
    <div>
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 mb-4">
        <ArrowLeft size={12} /> Back to leads
      </Link>

      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-xl font-semibold text-amber-700 shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-stone-900">{lead.name}</h1>
              <span className={cn("w-2 h-2 rounded-full", priorityColors[lead.priority])} />
              <span className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full",
                lead.priority === "HIGH" ? "priority-high"
                  : lead.priority === "MEDIUM" ? "priority-med"
                  : "priority-low"
              )}>
                {lead.priority} priority
              </span>
              <span className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full",
                lead.segment === "PREMIUM" ? "seg-premium"
                  : lead.segment === "MID" ? "seg-mid"
                  : "seg-budget"
              )}>
                {lead.segment}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
                {lead.category}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-stone-500">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} />
                {lead.address ?? `${lead.area}, ${lead.city}`}
              </span>
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-amber-600">
                  <Phone size={13} /> {lead.phone}
                </a>
              )}
              {lead.openingNote && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> Opened: {lead.openingNote}
                </span>
              )}
              {lead.googleMapsUrl && (
                <a href={lead.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-500 hover:underline">
                  <MapPin size={13} /> Google Maps
                </a>
              )}
              {lead.hasWebsite && lead.websiteUrl && (
                <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-emerald-600 hover:underline">
                  <Globe size={13} /> Website
                </a>
              )}
              {lead.instagramProfile && (
                <a href={lead.instagramProfile.profileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-purple-500 hover:underline">
                  <Instagram size={13} /> @{lead.instagramProfile.username}
                </a>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="text-center shrink-0">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold font-mono",
              lead.leadScore >= 15 ? "score-high"
                : lead.leadScore >= 11 ? "score-med"
                : "score-low"
            )}>
              {lead.leadScore}
            </div>
            <div className="text-[10px] text-stone-400 mt-1 font-medium">Lead score</div>
            <div className="text-[10px] text-stone-300">out of 20</div>
          </div>
        </div>
      </div>
    </div>
  );
}
