"use client";

import { useState } from "react";

type MemberOption = { userId: string; email: string; role: string };

export function ConversationControls({
  conversationId,
  assignedUserId,
  status,
  members,
}: {
  conversationId: string;
  assignedUserId: string | null;
  status: "open" | "pending" | "closed";
  members: MemberOption[];
}) {
  const [selectedUser, setSelectedUser] = useState(assignedUserId ?? "");
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function update(payload: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
    <section className="border-b border-border bg-surface px-5 py-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-xs font-medium text-muted">
          Responsable
          <select
            value={selectedUser}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedUser(value);
              void update({ assignedUserId: value || null });
            }}
            disabled={saving}
            className="mt-1 block min-w-52 rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary"
          >
            <option value="">Non attribuée</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.email || member.userId} · {member.role}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-muted">
          Statut
          <select
            value={selectedStatus}
            onChange={(event) => {
              const value = event.target.value as typeof selectedStatus;
              setSelectedStatus(value);
              void update({ status: value });
            }}
            disabled={saving}
            className="mt-1 block rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary"
          >
            <option value="open">Ouverte</option>
            <option value="pending">En attente</option>
            <option value="closed">Fermée</option>
          </select>
        </label>

        {saving ? <span className="text-xs text-muted">Enregistrement...</span> : null}
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </section>
  );
}
