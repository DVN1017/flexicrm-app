"use client";

import { FormEvent, useState } from "react";

type Note = {
  id: string;
  author_user_id: string;
  body: string;
  created_at: string;
};

export function PrivateNotes({ conversationId, initialNotes }: { conversationId: string; initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = body.trim();
    if (!value || saving) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: value }),
      });
      const result = (await response.json()) as { note?: Note; error?: string };
      if (!response.ok || !result.note) throw new Error(result.error ?? "Ajout impossible");
      setNotes((current) => [result.note!, ...current]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ajout impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="border-t border-border bg-surface px-5 py-4">
      <h2 className="text-sm font-semibold">Notes privées</h2>
      <p className="mt-1 text-xs text-muted">Visibles uniquement par les membres autorisés de l’entreprise.</p>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Ajouter une note interne..."
          disabled={saving}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="rounded-lg bg-text px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "..." : "Ajouter"}
        </button>
      </form>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

      <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-xs text-muted">Aucune note privée.</p>
        ) : notes.map((note) => (
          <div key={note.id} className="rounded-lg border border-border bg-background px-3 py-2">
            <p className="whitespace-pre-wrap text-sm">{note.body}</p>
            <p className="mt-1 text-[11px] text-muted">{new Date(note.created_at).toLocaleString("fr-FR")}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
