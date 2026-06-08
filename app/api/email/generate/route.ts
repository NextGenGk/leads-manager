// app/api/email/generate/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { db } from "@/lib/db";
import { z } from "zod";

const GenerateSchema = z.object({
  businessId: z.string(),
  tone: z.enum(["FRIENDLY", "FORMAL", "DIRECT", "STORYTELLING"]),
  service: z.array(z.string()).min(1),
  platform: z.enum(["EMAIL", "WHATSAPP", "INSTAGRAM"]).default("EMAIL"),
  save: z.boolean().default(true),
});

const TONE_DESCRIPTIONS = {
  FRIENDLY: "warm, conversational, peer-to-peer — like a local business owner talking to another",
  FORMAL: "professional and polished — formal English suitable for a business proposal",
  DIRECT: "direct and no-nonsense — bullet points where useful, gets to the point in 3 sentences",
  STORYTELLING: "narrative-led, emotional — starts with a story or observation that hooks the reader",
};

const PLATFORM_CONFIG = {
  EMAIL: {
    label: "cold outreach email",
    maxWords: 220,
    rules: `1. Open with ONE specific, genuine observation about this business — their rating, concept, something real. NEVER start with "I hope this email finds you well" or "My name is".
2. Reference SPECIFIC numbers like Google rating, reviews, Instagram followers.
3. Pitch the service as the direct solution to their specific digital weakness.
4. Include 2–3 hyper-specific benefits for THIS business, not generic benefits.
5. CTA: a 15-minute call or WhatsApp message — low friction.
6. Sign off: "FrequnSync Genz | https://www.frequnsync.online/ | connect@frequnsync.online | +91 7582985761 / +91 9770075755"
7. Output format — first line: SUBJECT: [subject]
Then blank line, then email body. Nothing else before SUBJECT:.`,
  },
  WHATSAPP: {
    label: "cold outreach WhatsApp message",
    maxWords: 100,
    rules: `1. Open with a friendly greeting using the business name.
2. Keep it conversational — like texting a business owner you respect.
3. Mention 1–2 specific facts about their business.
4. Pitch the service briefly as something that solves their pain point.
5. CTA: "Can I send you some ideas? Just reply here."
6. Sign off: "FrequnSync Genz | https://www.frequnsync.online/ | connect@frequnsync.online"
7. NO subject line. Just the message body. Under 100 words.`,
  },
  INSTAGRAM: {
    label: "cold outreach Instagram DM",
    maxWords: 60,
    rules: `1. Open with a genuine compliment or observation about their business.
2. Make it ultra-short and punchy — 2–3 sentences max.
3. Mention ONE specific thing you noticed about their online presence.
4. Pitch the service in one line — what you can do for them.
5. CTA: "DM me if you'd like to see some ideas 🙌"
6. Sign off: "FrequnSync Genz | https://www.frequnsync.online/ | connect@frequnsync.online"
7. NO subject line. Just the DM body. Under 60 words.`,
  },
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { businessId, tone, service, platform, save } = parsed.data;
  const cfg = PLATFORM_CONFIG[platform];

  const lead = await db.business.findUnique({
    where: { id: businessId },
    include: { instagramProfile: true },
  });
  if (!lead)
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const igLine = lead.instagramProfile
    ? `Instagram: @${lead.instagramProfile.username} with ${lead.instagramProfile.followers.toLocaleString()} followers, ${lead.instagramProfile.postsCount} posts, ${lead.instagramProfile.engagementLevel} engagement`
    : "Instagram: No account found";

  const prompt = `You are a senior business development executive at FrequnSync Genz, a web design and digital marketing agency in Bhilai, Chhattisgarh, India.

Write a HIGHLY PERSONALISED ${cfg.label} to the owner/manager of "${lead.name}", a ${lead.segment.toLowerCase()} ${lead.category.toLowerCase()} in ${lead.area}, ${lead.city}.

REAL BUSINESS INTELLIGENCE (use these specific facts):
- Location: ${lead.address ?? lead.area + ", " + lead.city}
- Opened: ${lead.openingNote ?? "Recently opened"}
- Google rating: ${lead.googleRating ?? "N/A"}★ (${lead.googleReviews ?? 0} reviews)
- ${igLine}
- Has website: ${lead.hasWebsite ? "Yes" : "No — zero web presence"}
- Online reservation: ${lead.hasReservation ? "Yes" : "No"}
- Online menu: ${lead.hasOnlineMenu ? "Yes" : "No"}
- Lead score: ${lead.leadScore}/20

SERVICE TO PITCH: ${service.join(", ")}
TONE: ${TONE_DESCRIPTIONS[tone]}

STRICT RULES:
${cfg.rules}
- CRITICAL: Do NOT invent or guess the owner/manager name. Address the business by name only, never a person's name.
Under ${cfg.maxWords} words total.`;

  // Stream the response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";

      try {
        const response = await axios.post(
          "https://integrate.api.nvidia.com/v1/chat/completions",
          {
            model: "moonshotai/kimi-k2.6",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 16384,
            temperature: 1.0,
            top_p: 1.0,
            stream: true,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
              Accept: "text/event-stream",
            },
            responseType: "stream",
          }
        );

        for await (const chunk of response.data) {
          const lines = chunk.toString().split("\n").filter(Boolean);
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              const json = JSON.parse(line.slice(6));
              const text = json.choices?.[0]?.delta?.content ?? "";
              if (text) {
                fullText += text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            }
          }
        }

        // Parse output based on platform
        let subject: string;
        let bodyText: string;

        if (platform === "EMAIL") {
          const subjectMatch = fullText.match(/^SUBJECT:\s*(.+)/m);
          subject = subjectMatch?.[1]?.trim() ?? `Quick question about ${lead.name}'s online presence`;
          bodyText = fullText.replace(/^SUBJECT:.*\n?/m, "").replace(/^\s*\n/, "").trim();
        } else {
          subject = "";
          bodyText = fullText.trim();
        }

        // Save to DB
        if (save) {
          const savedEmail = await db.outreachEmail.create({
            data: {
              businessId,
              subject,
              body: bodyText,
              tone,
              service: service.join(", "),
              platform,
            },
          });
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, emailId: savedEmail.id, subject, body: bodyText })}\n\n`
            )
          );
        } else {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, subject, body: bodyText })}\n\n`
            )
          );
        }
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
