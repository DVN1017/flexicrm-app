"use client";

import { useState } from "react";

interface SimulationResponse {
  ok?: boolean;
  conversationId?: string;
  messageId?: string | null;
  error?: string;
}

export function WhatsAppTestSimulatorButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSimulate() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/test/whatsapp/incoming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({}),
      });

      const result = (await response.json()) as SimulationResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "La simulation a échoué.");
      }

      setSuccess(true);
      window.location.reload();
    } catch (simulationError) {
      setError(simulationError instanceof Error ? simulationError.message : "La simulation a échoué.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleSimulate}
        disabled={loading}
        className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Simulation en cours..." : "Simuler un message entrant (test)"}
      </button>
      {success ? <p className="text-xs text-green-600">Message simulé avec succès.</p> : null}
      {error ? <p className="max-w-xs text-right text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
