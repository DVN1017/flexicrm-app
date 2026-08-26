"use client";

import { FormEvent, useState } from "react";

interface Option { id: string; name: string; }

export function DossierCreateForm({ clients, pipelines, stagesByPipeline }: { clients: Option[]; pipelines: Option[]; stagesByPipeline: Record<string, Option[]> }) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [pipelineId, setPipelineId] = useState(pipelines[0]?.id ?? "");
  const [stageId, setStageId] = useState(stagesByPipeline[pipelines[0]?.id ?? ""]?.[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("normal");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function changePipeline(value: string) {
    setPipelineId(value);
    setStageId(stagesByPipeline[value]?.[0]?.id ?? "");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!clientId || !pipelineId || !stageId || !title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/dossiers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, pipelineId, stageId, title, priority }) });
      const result = (await response.json()) as { dossier?: { id: string }; error?: string };
      if (!response.ok || !result.dossier) throw new Error(result.error ?? "Création impossible");
      window.location.href = `/dashboard/dossiers/${result.dossier.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-background p-4">
      <h2 className="font-semibold">Nouveau dossier</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <select value={clientId} onChange={(event) => setClientId(event.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
        </select>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre du dossier" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
        <select value={pipelineId} onChange={(event) => changePipeline(event.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          {pipelines.map((pipeline) => <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>)}
        </select>
        <select value={stageId} onChange={(event) => setStageId(event.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          {(stagesByPipeline[pipelineId] ?? []).map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
        </select>
        <select value={priority} onChange={(event) => setPriority(event.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          <option value="low">Faible</option><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option>
        </select>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <button disabled={saving || !clientId || !pipelineId || !stageId || !title.trim()} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {saving ? "Création..." : "Créer le dossier"}
      </button>
    </form>
  );
}
