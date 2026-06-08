// components/scraper/BloggerManager.tsx
"use client";
import { FoodBlogger } from "@prisma/client";
import { useState } from "react";
import { Plus, Trash2, Instagram } from "lucide-react";

export default function BloggerManager({ bloggers: initial }: { bloggers: FoodBlogger[] }) {
  const [bloggers, setBloggers] = useState(initial);
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("BHILAI");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!username.trim()) return;
    setAdding(true);
    const res = await fetch("/api/scrape/bloggers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.replace("@", ""), city }),
    });
    const { blogger } = await res.json();
    setBloggers([blogger, ...bloggers]);
    setUsername("");
    setAdding(false);
  };

  const remove = async (u: string) => {
    await fetch("/api/scrape/bloggers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u }),
    });
    setBloggers(bloggers.filter((b) => b.username !== u));
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Instagram size={14} className="text-purple-500" />
        <h2 className="text-sm font-semibold text-stone-900">Food bloggers</h2>
        <span className="text-xs text-stone-400 ml-auto">{bloggers.filter((b) => b.isActive).length} active</span>
      </div>

      {/* Add form */}
      <div className="flex gap-2">
        <input value={username} onChange={(e) => setUsername(e.target.value)}
          placeholder="@username"
          className="flex-1 text-xs border border-stone-200 rounded-lg px-3 py-2 outline-none text-stone-700 placeholder-stone-300 focus:border-amber-400" />
        <select value={city} onChange={(e) => setCity(e.target.value)}
          className="text-xs border border-stone-200 rounded-lg px-2 py-2 outline-none text-stone-700 bg-stone-50">
          <option value="BHILAI">Bhilai</option>
          <option value="DURG">Durg</option>
        </select>
        <button onClick={add} disabled={adding || !username.trim()}
          className="text-xs bg-amber-600 text-white px-3 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50">
          <Plus size={12} />
        </button>
      </div>

      {/* List */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {bloggers.map((b) => (
          <div key={b.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${b.isActive ? "bg-stone-50" : "bg-red-50 opacity-60"}`}>
            <Instagram size={11} className="text-purple-400 shrink-0" />
            <a href={`https://instagram.com/${b.username}`} target="_blank" rel="noopener noreferrer"
              className="text-stone-700 hover:text-purple-600 font-medium flex-1">@{b.username}</a>
            <span className="text-stone-400">{b.city}</span>
            {b.leadsFound > 0 && <span className="text-emerald-600 font-medium">+{b.leadsFound}</span>}
            <button onClick={() => remove(b.username)} className="text-stone-300 hover:text-red-400">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
