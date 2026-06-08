# BhilaiLeads — Café & Restaurant Lead Intelligence CRM

AI-powered CRM that automatically discovers and tracks newly opened cafés and restaurants in **Bhilai & Durg, Chhattisgarh** via daily Instagram scraping, scores every lead, and generates personalised AI outreach emails.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| ORM | Prisma + `@prisma/adapter-neon` |
| Auth | Clerk |
| Cron / Jobs | Inngest |
| Instagram Scraping | [Apify](https://apify.com) — `apify/instagram-scraper` actor |
| AI Emails | Anthropic Claude (claude-sonnet-4) |
| Deployment | Vercel |

---

## Features

- **Daily Instagram scraper** — Scrapes 16 Bhilai/Durg hashtags every morning at 7 AM IST via Inngest cron
- **Food blogger monitoring** — Watches known local food bloggers for new café mentions
- **Lead scoring engine** — Scores every business out of 20 based on website status, segment, recency, Instagram, and more
- **AI email generator** — Streaming, personalised outreach emails referencing real business data (rating, followers, concept)
- **CRM pipeline** — Track lead status from NEW → CONTACTED → CONVERTED
- **Daily snapshots** — Track Google review count and Instagram follower growth over time
- **Map view** — All leads plotted on Google Maps with priority colour coding
- **Outreach hub** — Manage all generated emails, copy, WhatsApp-send
- **Seed data** — 12 known leads pre-loaded from June 2026 research

---

## Quick Start

### 1. Clone & install
```bash
git clone <repo>
cd bhilai-leads
npm install
```

### 2. Set environment variables
```bash
cp .env.example .env.local
# Fill in all values — see .env.example for descriptions
```

Required keys:
- `DATABASE_URL` + `DIRECT_URL` — Neon PostgreSQL connection strings
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` — from [clerk.com](https://clerk.com)
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)
- `APIFY_TOKEN` — from [apify.com](https://apify.com) (free tier works for ~50 runs/month)
- `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` — from [inngest.com](https://inngest.com)

### 3. Set up database
```bash
npm run db:push        # Push schema to Neon
npm run db:generate    # Generate Prisma client
```

### 4. Run dev server
```bash
npm run dev
```

### 5. Seed initial data
Visit `http://localhost:3000/settings` and click **"Seed 12 known leads"**.

This seeds:
- 12 Bhilai/Durg cafés from the June 2026 CRM research
- 6 local food bloggers
- 16 tracked hashtags

### 6. Start Inngest dev server (for cron jobs)
```bash
npx inngest-cli@latest dev
```

---

## Scraper Architecture

```
Daily at 7 AM IST (Inngest cron)
  └── dailyHashtagScrape
        ├── Iterates 16 hashtags (#bhilaicafe, #durgfood, ...)
        ├── Calls Apify instagram-scraper actor (postsLimit: 30 per hashtag)
        ├── For each post:
        │     ├── extractCity() — Bhilai or Durg?
        │     ├── isNewOpeningPost() — "grand opening", "now open", etc.?
        │     ├── extractBusinessName() — parse name from caption
        │     └── createBusiness() if not already in DB
        └── Logs run to ScrapeRun table

Daily at 9 AM IST
  └── dailyBloggerScrape
        ├── Iterates all active FoodBlogger records
        ├── Scrapes last 20 posts per blogger
        └── Creates leads for any mentioned cafés

Every 48 hours
  └── refreshInstagramProfiles
        └── Updates follower counts, engagement, recent posts

Midnight IST
  └── takeDailySnapshots
        └── Records googleReviews + igFollowers for every lead
```

---

## Scaling to more cities

When ready to expand beyond Bhilai/Durg:

1. Add new `City` enum values to `prisma/schema.prisma`
2. Add city hashtags to `lib/instagram.ts` → `ALL_HASHTAGS`
3. Run `npm run db:migrate`

---

## Instagram API Note

This app uses **Apify's `apify/instagram-scraper` actor** which scrapes Instagram's public web interface. This is the most reliable approach for reading public posts and profiles without Instagram's (heavily restricted) Graph API.

**Cost**: Apify free tier gives $5 credit/month. With 16 hashtags × 30 posts each = ~480 page loads/day × 30 days ≈ within free tier limits.

**Actor docs**: https://apify.com/apify/instagram-scraper

---

## Deploy to Vercel

```bash
vercel --prod
```

Set all environment variables in the Vercel dashboard. Add your Vercel deployment URL to Inngest's allowed origins.

---

## Project Structure

```
bhilai-leads/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/      # Home page with metrics
│   │   ├── leads/          # CRM table + lead detail
│   │   ├── outreach/       # Email management hub
│   │   ├── map/            # Google Maps view
│   │   ├── scraper/        # Scraper control + history
│   │   └── settings/       # Seed + config
│   └── api/
│       ├── leads/          # CRUD + notes
│       ├── email/          # AI generation (streaming SSE)
│       ├── scrape/         # Trigger + bloggers + hashtags
│       ├── analytics/      # Chart data
│       ├── seed/           # Seed known leads
│       └── inngest/        # Inngest HTTP handler
├── components/
│   ├── dashboard/          # Sidebar, TopBar, MetricCards, Charts
│   ├── leads/              # Table, detail panels, notes, map
│   ├── outreach/           # Email panel, table, stats
│   ├── scraper/            # Control panel, run history, blogger/hashtag managers
│   └── settings/           # Seed panel
├── inngest/
│   ├── client.ts           # Inngest singleton
│   └── functions.ts        # All cron + event functions
├── lib/
│   ├── db.ts               # Prisma + Neon client
│   ├── instagram.ts        # Apify scraper wrappers
│   ├── scoring.ts          # Lead score engine
│   ├── seed-data.ts        # 12 known leads
│   └── utils.ts            # cn() helper
└── prisma/
    └── schema.prisma       # Full data model
```
