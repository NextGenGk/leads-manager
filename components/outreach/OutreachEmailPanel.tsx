// components/outreach/OutreachEmailPanel.tsx
"use client";
import { Business, InstagramProfile, OutreachEmail } from "@prisma/client";
import { useState, useRef, useCallback } from "react";
import { Copy, Check, RefreshCw, Mail, MessageCircle, Camera, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

type FullLead = Business & { instagramProfile: InstagramProfile | null };

interface Props {
  lead: FullLead;
  existingEmails: OutreachEmail[];
}

const TONES = [
  { value: "FRIENDLY", label: "Friendly" },
  { value: "FORMAL", label: "Formal" },
  { value: "DIRECT", label: "Direct" },
  { value: "STORYTELLING", label: "Story-led" },
] as const;

const SERVICES = [
  "New Website Design", "Website Redesign", "Instagram Management",
  "SEO Services", "Google Business Optimization", "Branding Services",
  "Online Menu Website", "Online Reservation System",
];

type PlatformState = {
  subject: string;
  body: string;
  generating: boolean;
  copied: boolean;
  emailId?: string;
};

function usePlatformState(): PlatformState {
  return { subject: "", body: "", generating: false, copied: false };
}

export default function OutreachEmailPanel({ lead, existingEmails }: Props) {
  const [tone, setTone] = useState<"FRIENDLY" | "FORMAL" | "DIRECT" | "STORYTELLING">("FRIENDLY");
  const [service, setService] = useState<string[]>([SERVICES[0]]);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [email, setEmail] = useState<PlatformState>(usePlatformState());
  const [whatsapp, setWhatsapp] = useState<PlatformState>(usePlatformState());
  const [instagram, setInstagram] = useState<PlatformState>(usePlatformState());
  const [showHistory, setShowHistory] = useState(false);
  const emailRef = useRef<HTMLDivElement>(null);
  const whatsappRef = useRef<HTMLDivElement>(null);
  const instagramRef = useRef<HTMLDivElement>(null);

  const streamPlatform = useCallback(async (
    platform: "EMAIL" | "WHATSAPP" | "INSTAGRAM",
    setState: React.Dispatch<React.SetStateAction<PlatformState>>,
  ) => {
    setState(s => ({ ...s, generating: true, subject: "", body: "" }));

    const res = await fetch("/api/email/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: lead.id, platform, tone, service, save: true }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let fullBody = "";
    let fullSubject = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const json = JSON.parse(line.slice(6));
          if (json.text) {
            if (platform === "EMAIL") {
              const subMatch = (fullBody + json.text).match(/^SUBJECT:\s*(.+)/m);
              if (subMatch && !fullSubject) {
                fullSubject = subMatch[1].trim();
              }
              fullBody += json.text;
              const cleanBody = fullBody.replace(/^SUBJECT:.*\n?/m, "").replace(/^\s*\n/, "").trim();
              setState(s => ({ ...s, subject: fullSubject, body: cleanBody }));
            } else {
              fullBody += json.text;
              setState(s => ({ ...s, body: fullBody.trim() }));
            }
          }
          if (json.done) {
            fullSubject = json.subject ?? fullSubject;
            const bodyText = json.body ?? (platform === "EMAIL"
              ? fullBody.replace(/^SUBJECT:.*\n?/m, "").replace(/^\s*\n/, "").trim()
              : fullBody.trim());
            setState(s => ({ ...s, subject: fullSubject, body: bodyText, generating: false, emailId: json.emailId }));
          }
        } catch {}
      }
    }

    setState(s => ({ ...s, generating: false }));
  }, [lead.id, tone, service]);

  const generateAll = async () => {
    setGeneratingAll(true);
    setEmail(usePlatformState());
    setWhatsapp(usePlatformState());
    setInstagram(usePlatformState());

    await streamPlatform("EMAIL", setEmail);
    await streamPlatform("WHATSAPP", setWhatsapp);
    await streamPlatform("INSTAGRAM", setInstagram);

    setGeneratingAll(false);
  };

  const copyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const anyOutput = email.body || whatsapp.body || instagram.body || generatingAll;

  function Section({ platform, icon: Icon, color, state, setState, label }: {
    platform: "EMAIL" | "WHATSAPP" | "INSTAGRAM";
    icon: any;
    color: string;
    state: PlatformState;
    setState: React.Dispatch<React.SetStateAction<PlatformState>>;
    label: string;
  }) {
    const show = generatingAll || state.body;
    if (!show) return null;

    return (
      <div className="border border-stone-200 rounded-xl overflow-hidden">
        <div className={cn("px-4 py-2.5 border-b border-stone-100 flex items-center gap-2", color)}>
          <Icon size={14} />
          <span className="text-xs font-semibold">{label}</span>
          {state.generating && (
            <div className="w-3 h-3 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin ml-auto" />
          )}
        </div>

        {platform === "EMAIL" && state.subject && (
          <div className="px-4 py-2 border-b border-stone-100 bg-stone-50 flex items-center gap-2">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">Subject:</span>
            <span className="text-sm text-stone-700 font-medium flex-1">{state.subject}</span>
          </div>
        )}

        <div className="px-5 py-4 min-h-16" ref={platform === "EMAIL" ? emailRef : platform === "WHATSAPP" ? whatsappRef : instagramRef}>
          {state.generating && !state.body && (
            <div className="flex items-center gap-2 text-sm text-stone-400">
              <div className="w-4 h-4 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
              Generating {label.toLowerCase()}…
            </div>
          )}
          <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap font-sans [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_strong]:font-semibold [&_em]:italic">
            <ReactMarkdown>{state.body}</ReactMarkdown>
            {state.generating && state.body && <span className="typing-cursor" />}
          </div>
        </div>

        {!state.generating && state.body && (
          <div className="px-4 py-3 border-t border-stone-100 bg-stone-50 flex gap-2">
            <button type="button" onClick={(e) => { e.preventDefault(); copyText(
              platform === "EMAIL" ? `Subject: ${state.subject}\n\n${state.body}` : state.body,
              (v) => setState(s => ({ ...s, copied: v })),
            ); }}
              className="flex items-center gap-1.5 text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg hover:bg-stone-900 transition-colors">
              {state.copied ? <Check size={12} /> : <Copy size={12} />}
              {state.copied ? "Copied!" : "Copy"}
            </button>
            {platform === "EMAIL" && (
              <button type="button" onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(state.subject); }}
                className="flex items-center gap-1.5 text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors">
                Copy subject
              </button>
            )}
            {platform === "EMAIL" && lead.email && (
              <a href={`mailto:${lead.email}?subject=${encodeURIComponent(state.subject)}&body=${encodeURIComponent(state.body)}`}
                className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors ml-auto">
                <Mail size={12} />
                Send via Email
              </a>
            )}
            {platform === "WHATSAPP" && lead.whatsapp && (
              <a href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(state.body)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors ml-auto">
                <MessageCircle size={12} />
                Send via WhatsApp
              </a>
            )}
            {platform === "INSTAGRAM" && lead.instagramProfile?.username && (
              <a href={`https://instagram.com/${lead.instagramProfile.username}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity ml-auto">
                <Camera size={12} />
                Send via Instagram
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
        <Mail size={15} className="text-amber-600" />
        <h2 className="text-sm font-semibold text-stone-900">Generate outreach</h2>
      </div>

      <div className="p-5 space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-end">
          {/* Tone */}
          <div>
            <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide block mb-1">Tone</label>
            <div className="flex gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg border transition-colors",
                    tone === t.value
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Service */}
          <div>
            <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide block mb-1">Service to pitch</label>
            <div className="flex flex-wrap gap-1.5 max-w-xs">
              {SERVICES.map((s) => (
                <button
                  key={s}
                  onClick={() => setService(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-lg border transition-colors",
                    service.includes(s)
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generatingAll ? undefined : generateAll}
            disabled={generatingAll}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-lg font-medium disabled:opacity-60 transition-colors ml-auto"
          >
            <RefreshCw size={12} className={generatingAll ? "animate-spin" : ""} />
            {generatingAll ? "Generating all platforms…" : anyOutput ? "Regenerate all" : "Generate all platforms"}
          </button>
        </div>

        {/* Loading skeleton */}
        {generatingAll && !email.body && !whatsapp.body && !instagram.body && (
          <div className="flex items-center gap-2 text-sm text-stone-400 py-4">
            <div className="w-4 h-4 border-2 border-stone-200 border-t-amber-600 rounded-full animate-spin" />
            Analysing {lead.name}'s business data…
          </div>
        )}

        {/* Output sections */}
        <div className="space-y-3">
          <Section platform="EMAIL" icon={Mail} color="bg-amber-50 text-amber-700" state={email} setState={setEmail} label="Email" />
          <Section platform="WHATSAPP" icon={MessageCircle} color="bg-emerald-50 text-emerald-700" state={whatsapp} setState={setWhatsapp} label="WhatsApp" />
          <Section platform="INSTAGRAM" icon={Camera} color="bg-pink-50 text-pink-700" state={instagram} setState={setInstagram} label="Instagram DM" />
        </div>

        {/* History */}
        {existingEmails.length > 0 && (
          <div>
            <button onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600">
              {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {existingEmails.length} previous outreach{existingEmails.length !== 1 ? "s" : ""}
            </button>

            {showHistory && (
              <div className="mt-3 space-y-3">
                {existingEmails.map((email) => {
                  const plat = (email as any).platform;
                  return (
                    <div key={email.id} className="border border-stone-100 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-stone-700">
                          {plat && plat !== "EMAIL" ? `[${plat}] ${email.subject || "(no subject)"}` : email.subject}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-400">
                            {formatDistanceToNow(email.generatedAt, { addSuffix: true })}
                          </span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                            email.sentStatus === "SENT" ? "bg-emerald-50 text-emerald-600"
                              : "bg-stone-100 text-stone-500"
                          )}>
                            {email.sentStatus}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2">{email.body}</p>
                      <button onClick={() => {
                        const target = plat === "INSTAGRAM" ? setInstagram : plat === "WHATSAPP" ? setWhatsapp : setEmail;
                        target({ subject: email.subject, body: email.body, generating: false, copied: false });
                      }}
                        className="text-[10px] text-amber-600 hover:underline">
                        Load this
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
