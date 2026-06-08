// components/scraper/HashtagManager.tsx
"use client";
import { TrackedHashtag } from "@prisma/client";
import { useState } from "react";
import { Plus, Trash2, Hash } from "lucide-react";

export default function HashtagManager({ hashtags: initial }: { hashtags: TrackedHashtag[] }) {
  const [hashtags, setHashtags] = useState(initial);
  const [tag, setTag] = useState("");
  const [city, setCity] = useState<"BHILAI" | "DURG" | "">("BHILAI");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    const clean = tag.replace(/^#/, "").trim();
    if (!clean) return;
    setAdding(true);
    const res = await fetch("/api/scrape/hashtags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: clean, city: city || undefined }),
    });
    const { hashtag } = await res.json();
    setHashtags([hashtag, ...hashtags]);
    setTag("");
    setAdding(false);
  };

  const remove = async (t: string) => {
    await fetch("/api/scrape/hashtags", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: t }),
    });
    setHashtags(hashtags.filter((h) => h.tag !== t));
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Hash size={14} className="text-amber-500" />
        <h2 className="text-sm font-semibold text-stone-900">Tracked hashtags</h2>
        <span className="text-xs text-stone-400 ml-auto">
          {hashtags.filter((h) => h.isActive).length} active
        </span>
      </div>

      <div className="flex gap-2">
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="#bhilaicafe"
          className="flex-1 text-xs border border-stone-200 rounded-lg px-3 py-2 outline-none text-stone-700 placeholder-stone-300 focus:border-amber-400"
        />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value as any)}
          className="text-xs border border-stone-200 rounded-lg px-2 py-2 outline-none bg-stone-50 text-stone-700"
        >
          <option value="BHILAI">Bhilai</option>
          <option value="DURG">Durg</option>
          <option value="">Both</option>
        </select>
        <button
          onClick={add}
          disabled={adding || !tag.trim()}
          className="text-xs bg-amber-600 text-white px-3 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {hashtags.map((h) => (
          <div
            key={h.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
              h.isActive ? "bg-stone-50" : "opacity-40"
            }`}
          >
            <Hash size={10} className="text-amber-400 shrink-0" />
            <span className="text-stone-700 font-medium flex-1">#{h.tag}</span>
            <span className="text-stone-400">{h.city ?? "Both"}</span>
            {h.postsFound > 0 && (
              <span className="text-blue-600 font-medium">{h.postsFound} posts</span>
            )}
            <button
              onClick={() => remove(h.tag)}
              className="text-stone-300 hover:text-red-400"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
