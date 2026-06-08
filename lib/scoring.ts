// lib/scoring.ts
import type { Business, InstagramProfile } from "@prisma/client";

type ScoringInput = Pick<
  Business,
  | "hasWebsite"
  | "websiteScore"
  | "segment"
  | "openingDate"
  | "hasReservation"
  | "hasOnlineMenu"
  | "googleRating"
  | "googleReviews"
> & {
  instagram?: Pick<
    InstagramProfile,
    "followers" | "engagementLevel" | "postsCount"
  > | null;
};

export interface ScoreBreakdown {
  total: number;
  noWebsite: number;
  poorWebsite: number;
  recentOpening: number;
  premiumSegment: number;
  activeInstagram: number;
  missingOnlineSystem: number;
  googlePresence: number;
}

export function computeLeadScore(input: ScoringInput): ScoreBreakdown {
  let noWebsite = 0;
  let poorWebsite = 0;
  let recentOpening = 0;
  let premiumSegment = 0;
  let activeInstagram = 0;
  let missingOnlineSystem = 0;
  let googlePresence = 0;

  // +5 No website at all
  if (!input.hasWebsite || !input.websiteScore) {
    noWebsite = 5;
  }
  // +4 Poor website (score 1–4)
  else if (input.websiteScore <= 4) {
    poorWebsite = 4;
  }
  // +2 Mediocre website (score 5–6)
  else if (input.websiteScore <= 6) {
    poorWebsite = 2;
  }

  // +4 Opened within last 60 days
  if (input.openingDate) {
    const daysSince =
      (Date.now() - new Date(input.openingDate).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSince <= 60) recentOpening = 4;
    else if (daysSince <= 120) recentOpening = 3;
    else if (daysSince <= 180) recentOpening = 2;
    else recentOpening = 1;
  } else {
    recentOpening = 2; // unknown opening date — still likely recent
  }

  // +3 Premium segment
  if (input.segment === "PREMIUM") premiumSegment = 3;
  else if (input.segment === "MID") premiumSegment = 1;

  // +2 Active Instagram
  const ig = input.instagram;
  if (ig) {
    if (
      ig.engagementLevel === "HIGH" ||
      (ig.followers > 1000 && ig.postsCount > 30)
    ) {
      activeInstagram = 2;
    } else if (ig.followers > 200 || ig.postsCount > 20) {
      activeInstagram = 1;
    }
  }

  // +2 No reservation or online menu
  if (!input.hasReservation && !input.hasOnlineMenu) {
    missingOnlineSystem = 2;
  } else if (!input.hasReservation || !input.hasOnlineMenu) {
    missingOnlineSystem = 1;
  }

  // +1 Google presence bonus
  if (input.googleRating && input.googleRating >= 4.5) {
    googlePresence = 1;
  }

  const total =
    noWebsite +
    poorWebsite +
    recentOpening +
    premiumSegment +
    activeInstagram +
    missingOnlineSystem +
    googlePresence;

  return {
    total: Math.min(total, 20),
    noWebsite,
    poorWebsite,
    recentOpening,
    premiumSegment,
    activeInstagram,
    missingOnlineSystem,
    googlePresence,
  };
}

export function scoreToPriority(
  score: number
): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 15) return "HIGH";
  if (score >= 11) return "MEDIUM";
  return "LOW";
}

export function recommendedServices(
  b: ScoringInput & { category: string }
): string[] {
  const services: string[] = [];
  if (!b.hasWebsite) services.push("New Website Design");
  else if (b.websiteScore && b.websiteScore <= 5)
    services.push("Website Redesign");

  if (!b.instagram || b.instagram.followers < 500)
    services.push("Instagram Management");

  if (!b.hasOnlineMenu) services.push("Online Menu Website");
  if (!b.hasReservation && b.segment === "PREMIUM")
    services.push("Online Reservation System");

  if (b.googleRating && b.googleRating < 4.0)
    services.push("Google Business Optimization");
  else if (!b.hasWebsite)
    services.push("Google Business Optimization");

  if (b.segment === "PREMIUM" && !b.hasWebsite)
    services.push("Branding Services");

  services.push("SEO Services");
  return Array.from(new Set(services)).slice(0, 4);
}
