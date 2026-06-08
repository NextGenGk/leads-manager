// components/leads/LeadInstagram.tsx
"use client";
import { InstagramProfile } from "@prisma/client";
import { Instagram, Heart, MessageCircle, Users, Grid } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

export default function LeadInstagram({ profile }: { profile: InstagramProfile }) {
  const [syncing, setSyncing] = useState(false);

  const triggerSync = async () => {
    setSyncing(true);
    await fetch("/api/scrape/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "profile", businessId: profile.businessId, username: profile.username }),
    });
    setTimeout(() => setSyncing(false), 2000);
  };

  const posts = Array.isArray(profile.recentPosts) ? profile.recentPosts as any[] : [];

  const engColor: Record<string, string> = {
    HIGH: "bg-emerald-50 text-emerald-700", MEDIUM: "bg-amber-50 text-amber-700",
    LOW: "bg-stone-100 text-stone-600", NONE: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Instagram size={16} className="text-purple-500" />
          <h2 className="text-sm font-semibold text-stone-900">Instagram</h2>
        </div>
        <button onClick={triggerSync} disabled={syncing}
          className="text-xs text-stone-400 hover:text-amber-600 disabled:opacity-50">
          {syncing ? "Syncing…" : "↻ Sync now"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Followers", value: profile.followers.toLocaleString() },
          { icon: Grid, label: "Posts", value: profile.postsCount },
          { icon: Heart, label: "Avg likes", value: profile.avgLikes?.toFixed(0) ?? "—" },
          { icon: MessageCircle, label: "Avg comments", value: profile.avgComments?.toFixed(0) ?? "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-stone-50 rounded-lg p-3 text-center">
            <Icon size={13} className="mx-auto mb-1 text-stone-400" />
            <div className="text-base font-semibold text-stone-900 font-mono">{value}</div>
            <div className="text-[10px] text-stone-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap text-xs text-stone-500">
        <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer"
          className="text-purple-600 hover:underline font-medium">@{profile.username}</a>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${engColor[profile.engagementLevel]}`}>
          {profile.engagementLevel} engagement
        </span>
        {profile.lastPostDate && (
          <span>Last post {formatDistanceToNow(profile.lastPostDate, { addSuffix: true })}</span>
        )}
        {profile.fetchedAt && (
          <span className="ml-auto text-stone-300">Synced {formatDistanceToNow(profile.fetchedAt, { addSuffix: true })}</span>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-xs text-stone-600 bg-stone-50 rounded-lg px-3 py-2 italic">"{profile.bio}"</p>
      )}

      {/* Recent posts */}
      {posts.length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Recent posts</p>
          <div className="grid grid-cols-5 gap-1.5">
            {posts.slice(0, 5).map((post: any, i: number) => (
              <a key={i} href={post.url} target="_blank" rel="noopener noreferrer"
                className="aspect-square bg-stone-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Instagram size={16} className="text-stone-400" />
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
