// lib/instagram.ts
// Uses Apify's Instagram scraper actors to fetch posts without violating ToS
// Actor: apify/instagram-scraper (official Apify-maintained actor)

import { ApifyClient } from "apify-client";
import { db } from "./db";
import { City, ScrapeSource } from "@prisma/client";
import { computeLeadScore } from "./scoring";

const apify = new ApifyClient({ token: process.env.APIFY_TOKEN });

// ─── Hashtag targets for Bhilai/Durg ──────────────────
export const BHILAI_HASHTAGS = [
  "bhilaicafe", "bhilairestaurant", "bhilaifoodie",
  "bhilaifood", "bhilaicoffee", "bhilaieats",
  "newcafebhilai", "bhilainewopening",
];

export const DURG_HASHTAGS = [
  "durgcafe", "durgfood", "durgrestaurant",
  "durgfoodie", "durgeats", "newcafedurg",
];

export const ALL_HASHTAGS = [...BHILAI_HASHTAGS, ...DURG_HASHTAGS];

// ─── Known food bloggers in Bhilai/Durg ───────────────
export const SEED_BLOGGERS = [
  { username: "bhilaifoodie", city: City.BHILAI },
  { username: "foodiebhilai", city: City.BHILAI },
  { username: "bhilaifoodlover", city: City.BHILAI },
  { username: "durgfoodgram", city: City.DURG },
  { username: "chhattisgarheats", city: City.BHILAI },
  { username: "bhilaiblogger", city: City.BHILAI },
];

// ─── Types ────────────────────────────────────────────
export interface ApifyInstagramPost {
  id: string;
  shortCode: string;
  url: string;
  caption?: string;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  imageUrl?: string;
  videoUrl?: string;
  ownerUsername?: string;
  ownerFullName?: string;
  hashtags?: string[];
  mentions?: string[];
}

export interface ApifyInstagramProfile {
  username: string;
  fullName: string;
  biography?: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  verified: boolean;
  businessCategoryName?: string;
  profilePicUrl?: string;
  latestPosts?: ApifyInstagramPost[];
}

// ─── Scrape hashtag for new café posts ────────────────
export async function scrapeHashtag(
  hashtag: string,
  postsLimit = 50
): Promise<{
  posts: ApifyInstagramPost[];
  runId: string;
  cost: number;
}> {
  const run = await apify.actor("apify/instagram-scraper").call({
    directUrls: [`https://www.instagram.com/explore/tags/${hashtag}/`],
    resultsType: "posts",
    resultsLimit: postsLimit,
    addParentData: true,
    scrapePostsUntilDate: new Date(
      Date.now() - 60 * 24 * 60 * 60 * 1000 // last 60 days
    ).toISOString(),
  });

  const { items } = await apify
    .dataset(run.defaultDatasetId)
    .listItems();

  return {
    posts: items as unknown as ApifyInstagramPost[],
    runId: run.id,
    cost: run.usageTotalUsd ?? 0,
  };
}

// ─── Scrape a blogger's posts to find café mentions ───
export async function scrapeBloggerPosts(
  username: string,
  postsLimit = 30
): Promise<{
  posts: ApifyInstagramPost[];
  profile: ApifyInstagramProfile | null;
  runId: string;
}> {
  const run = await apify.actor("apify/instagram-scraper").call({
    directUrls: [`https://www.instagram.com/${username}/`],
    resultsType: "posts",
    resultsLimit: postsLimit,
    scrapePostsUntilDate: new Date(
      Date.now() - 60 * 24 * 60 * 60 * 1000
    ).toISOString(),
  });

  const { items } = await apify
    .dataset(run.defaultDatasetId)
    .listItems();

  const profile =
    (items.find((i: any) => i.type === "profile") as unknown as ApifyInstagramProfile) ??
    null;
  const posts = items.filter(
    (i: any) => i.type !== "profile"
  ) as unknown as ApifyInstagramPost[];

  return { posts, profile, runId: run.id };
}

// ─── Fetch a specific Instagram profile ───────────────
export async function scrapeProfile(
  username: string
): Promise<ApifyInstagramProfile | null> {
  try {
    const run = await apify.actor("apify/instagram-scraper").call({
      directUrls: [`https://www.instagram.com/${username}/`],
      resultsType: "details",
      resultsLimit: 1,
    });

    const { items } = await apify
      .dataset(run.defaultDatasetId)
      .listItems();

    return (items[0] as unknown as ApifyInstagramProfile) ?? null;
  } catch {
    return null;
  }
}

// ─── Extract city from caption ─────────────────────────
export function extractCity(
  caption: string,
  hashtags: string[]
): City | null {
  const all = (caption + " " + hashtags.join(" ")).toLowerCase();
  if (
    all.includes("bhilai") ||
    BHILAI_HASHTAGS.some((h) => all.includes(h))
  )
    return City.BHILAI;
  if (
    all.includes("durg") ||
    DURG_HASHTAGS.some((h) => all.includes(h))
  )
    return City.DURG;
  return null;
}

// ─── Extract potential café name from caption ─────────
export function extractBusinessName(caption: string): string | null {
  // Match patterns like: @cafename, "Cafe Name", #cafename, "at CafeName"
  const patterns = [
    /\bat\s+([A-Z][a-zA-Z\s'&-]{3,30}café?)/gi,
    /\bat\s+([A-Z][a-zA-Z\s'&-]{3,30}coffee)/gi,
    /visiting\s+([A-Z][a-zA-Z\s'&-]{3,30})/gi,
    /📍\s*([A-Z][a-zA-Z\s'&-]{3,30})/g,
    /🍵\s*([A-Z][a-zA-Z\s'&-]{3,30})/g,
  ];
  for (const p of patterns) {
    const m = p.exec(caption);
    if (m?.[1]) return m[1].trim().replace(/\s+/g, " ");
  }
  return null;
}

// ─── Check if a post is about a new opening ───────────
export function isNewOpeningPost(caption: string): boolean {
  const keywords = [
    "grand opening",
    "now open",
    "soft launch",
    "just opened",
    "new cafe",
    "new restaurant",
    "newly opened",
    "opening soon",
    "opening today",
    "launch",
    "abhi khula",
    "naya cafe",
    "grand launch",
    "#nowopen",
    "#grandopening",
    "#newopening",
    "#softlaunch",
  ];
  const lower = caption.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

// ─── Compute engagement level ─────────────────────────
export function computeEngagement(
  followers: number,
  avgLikes: number,
  avgComments: number
): "HIGH" | "MEDIUM" | "LOW" | "NONE" {
  if (followers === 0) return "NONE";
  const rate = ((avgLikes + avgComments) / followers) * 100;
  if (rate >= 5) return "HIGH";
  if (rate >= 2) return "MEDIUM";
  if (rate >= 0.5) return "LOW";
  return "NONE";
}

// ─── Upsert Instagram profile into DB ─────────────────
export async function upsertInstagramProfile(
  businessId: string,
  profile: ApifyInstagramProfile,
  posts: ApifyInstagramPost[]
) {
  const avgLikes =
    posts.length > 0
      ? posts.reduce((s, p) => s + p.likesCount, 0) / posts.length
      : 0;
  const avgComments =
    posts.length > 0
      ? posts.reduce((s, p) => s + p.commentsCount, 0) / posts.length
      : 0;

  const sorted = [...posts].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const firstPost = sorted[sorted.length - 1];
  const lastPost = sorted[0];

  const eng = computeEngagement(
    profile.followersCount,
    avgLikes,
    avgComments
  );

  await db.instagramProfile.upsert({
    where: { businessId },
    create: {
      businessId,
      username: profile.username,
      fullName: profile.fullName,
      bio: profile.biography,
      profileUrl: `https://instagram.com/${profile.username}`,
      profilePicUrl: profile.profilePicUrl,
      followers: profile.followersCount,
      following: profile.followsCount,
      postsCount: profile.postsCount,
      isVerified: profile.verified,
      isBusinessAcct: !!profile.businessCategoryName,
      firstPostDate: firstPost
        ? new Date(firstPost.timestamp)
        : null,
      lastPostDate: lastPost ? new Date(lastPost.timestamp) : null,
      engagementLevel: eng,
      avgLikes,
      avgComments,
      recentPosts: sorted.slice(0, 10) as any,
    },
    update: {
      followers: profile.followersCount,
      following: profile.followsCount,
      postsCount: profile.postsCount,
      lastPostDate: lastPost ? new Date(lastPost.timestamp) : null,
      engagementLevel: eng,
      avgLikes,
      avgComments,
      recentPosts: sorted.slice(0, 10) as any,
      fetchedAt: new Date(),
    },
  });
}
