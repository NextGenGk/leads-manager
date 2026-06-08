// components/leads/LeadNotes.tsx
"use client";
import { LeadNote } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";

interface Props {
  leadId: string;
  notes: LeadNote[];
}

export default function LeadNotes({ leadId, notes: initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const addNote = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/leads/${leadId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    const { note } = await res.json();
    setNotes([note, ...notes]);
    setText("");
    setSaving(false);
    router.refresh();
  };

  const deleteNote = async (noteId: string) => {
    await fetch(`/api/leads/${leadId}/notes`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId }),
    });
    setNotes(notes.filter((n) => n.id !== noteId));
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
      <h2 className="text-sm font-semibold text-stone-900">Notes</h2>

      <div className="space-y-1.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a note about this lead…"
          rows={3}
          className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 text-stone-700 placeholder-stone-300 outline-none resize-none focus:border-amber-400 transition-colors"
        />
        <button
          onClick={addNote}
          disabled={saving || !text.trim()}
          className="w-full text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-2 font-medium disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Add note"}
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {notes.length === 0 && (
          <p className="text-xs text-stone-400 text-center py-4">No notes yet.</p>
        )}
        {notes.map((n) => (
          <div key={n.id} className="bg-stone-50 rounded-lg p-3 text-xs text-stone-700 group relative">
            <p className="leading-relaxed pr-4">{n.content}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-stone-400">
                {formatDistanceToNow(n.createdAt, { addSuffix: true })}
              </span>
              <button onClick={() => deleteNote(n.id)}
                className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
