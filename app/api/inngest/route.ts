// app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  dailyHashtagScrape,
  dailyBloggerScrape,
  refreshInstagramProfiles,
  takeDailySnapshots,
  scrapeProfileOnDemand,
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    dailyHashtagScrape,
    dailyBloggerScrape,
    refreshInstagramProfiles,
    takeDailySnapshots,
    scrapeProfileOnDemand,
  ],
});
