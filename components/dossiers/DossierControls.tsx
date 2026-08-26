"use client";

import { useState } from "react";

interface Option { id: string; name: string; }

export function DossierControls({ dossierId, stageId, priority, status, stages }: { dossierId: string; stageId: string; priority: string; status: string; stages: Option[] }) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function update(payload: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/dossiers/${dossierId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Mise à jour impossible");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <label className="text-xs font-medium text-muted">Étape
          <select defaultValue={stageId} disabled={saving} onChange={(event) => void update({ stageId: event.target.value })} className="mt-1 block rounded-lg border border-border bg-background px-3 py-2 text-sm text-text">
            {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-muted">Priorité
          <select defaultValue={priority} disabled={saving} onChange={(event) => void update({ priority: event.target.value })} className="mt-1 block rounded-lg border border-border bg-background px-3 py-2 text-sm text-text">
            <option value="low">Faible</option><option value="normal">Normale</option><option value="high">Haute</option><option value="urgent">Urgente</option>
          </select>
        </label>
        <label className="text-xs font-medium text-muted">Statut
          <select defaultValue={status} disabled={saving} onChange={(event) => void update({ status: event.target.value })} className="mt-1 block rounded-lg border border-border bg-background px-3 py-2 text-sm text-text">
            <option value="open">Ouvert</option><option value="pending">En attente</option><option value="completed">Terminé</option><option value="cancelled">Annulé</option>
          </select>
        </label>
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
