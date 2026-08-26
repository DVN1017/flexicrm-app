"use client";

import { FormEvent, useState } from "react";

type Note = { id: string; body: string; created_at: string; author_user_id: string };

export function DossierNotes({ dossierId, initialNotes }: { dossierId: string; initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = body.trim();
    if (!value || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/dossiers/${dossierId}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: value }) });
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
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
      <h2 className="font-semibold">Notes internes</h2>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Ajouter une note..." className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        <button disabled={saving || !body.trim()} className="rounded-lg bg-text px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "..." : "Ajouter"}</button>
      </form>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      <div className="mt-4 space-y-2">
        {notes.length === 0 ? <p className="text-sm text-muted">Aucune note.</p> : notes.map((note) => (
          <div key={note.id} className="rounded-lg border border-border bg-background p-3">
            <p className="whitespace-pre-wrap text-sm">{note.body}</p>
            <p className="mt-1 text-[11px] text-muted">{new Date(note.created_at).toLocaleString("fr-FR")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
