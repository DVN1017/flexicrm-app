"use client";

import { FormEvent, useState } from "react";

type Pipeline = { id: string; name: string; description: string | null; stages: { id: string; name: string; position: number }[] };

export function PipelineManager({ initialPipelines, canManage }: { initialPipelines: Pipeline[]; canManage: boolean }) {
  const [pipelines, setPipelines] = useState(initialPipelines);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stageNames, setStageNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function createPipeline(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setError(null);
    const response = await fetch("/api/pipelines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) });
    const result = (await response.json()) as { pipeline?: { id: string; name: string; description: string | null }; error?: string };
    if (!response.ok || !result.pipeline) { setError(result.error ?? "Création impossible"); return; }
    setPipelines((current) => [...current, { ...result.pipeline!, stages: [] }]);
    setName("");
    setDescription("");
  }

  async function createStage(pipelineId: string) {
    const stageName = (stageNames[pipelineId] ?? "").trim();
    if (!stageName) return;
    const pipeline = pipelines.find((item) => item.id === pipelineId);
    const position = pipeline?.stages.length ?? 0;
    setError(null);
    const response = await fetch(`/api/pipelines/${pipelineId}/stages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: stageName, position }) });
    const result = (await response.json()) as { stage?: { id: string; name: string; position: number }; error?: string };
    if (!response.ok || !result.stage) { setError(result.error ?? "Création impossible"); return; }
    setPipelines((current) => current.map((item) => item.id === pipelineId ? { ...item, stages: [...item.stages, result.stage!] } : item));
    setStageNames((current) => ({ ...current, [pipelineId]: "" }));
  }

  return (
    <div>
      {canManage ? (
        <form onSubmit={createPipeline} className="mb-6 rounded-xl border border-border bg-background p-4">
          <h2 className="font-semibold">Créer un pipeline</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Pipeline Visa" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optionnelle)" className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <button className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Créer</button>
        </form>
      ) : null}

      {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="space-y-4">
        {pipelines.length === 0 ? <p className="text-sm text-muted">Aucun pipeline configuré.</p> : null}
        {pipelines.map((pipeline) => (
          <article key={pipeline.id} className="rounded-xl border border-border bg-surface p-5">
            <h3 className="font-semibold">{pipeline.name}</h3>
            <p className="mt-1 text-sm text-muted">{pipeline.description ?? "Aucune description"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {pipeline.stages.map((stage) => <span key={stage.id} className="rounded-full border border-border px-3 py-1 text-xs">{stage.name}</span>)}
            </div>
            {canManage ? (
              <div className="mt-4 flex gap-2">
                <input value={stageNames[pipeline.id] ?? ""} onChange={(event) => setStageNames((current) => ({ ...current, [pipeline.id]: event.target.value }))} placeholder="Nouvelle étape" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                <button type="button" onClick={() => void createStage(pipeline.id)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-background">Ajouter</button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
