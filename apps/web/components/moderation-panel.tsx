"use client";

import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { mockDisputes } from "../lib/mock-data";
import { SectionCard } from "./section-card";

export function ModerationPanel() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const response = await fetch(`${apiUrl}/disputes`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudieron cargar las disputas.");
      }

      setDisputes(data);
    } catch {
      setDisputes(mockDisputes);
      setMessage("");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function resolveDispute(id: string, status: "RESOLVED" | "REJECTED") {
    const response = await fetch(`${apiUrl}/disputes/${id}/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        status,
        resolution:
          status === "RESOLVED"
            ? "Resuelta por moderacion tras revisar la evidencia."
            : "Rechazada por evidencia insuficiente."
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message ?? "No se pudo resolver la disputa.");
      return;
    }

    await load();
  }

  return (
    <SectionCard title="Disputas" description="Panel de moderacion para revision manual de incidencias.">
      {message ? <p className="mb-4 text-sm text-amber-300">{message}</p> : null}
      <div className="space-y-3">
        {disputes.length === 0 ? <p className="text-sm text-white/60">No hay disputas disponibles.</p> : null}
        {disputes.map((dispute) => (
          <article key={dispute.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">{dispute.status}</h3>
              <span className="text-xs text-white/50">Partida: {dispute.matchId}</span>
            </div>
            <p className="mt-2 text-sm text-white/70">{dispute.reason}</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => resolveDispute(dispute.id, "RESOLVED")}
                className="rounded-xl bg-brand-cyan px-4 py-2 text-sm font-medium text-brand-ink"
              >
                Resolver
              </button>
              <button
                onClick={() => resolveDispute(dispute.id, "REJECTED")}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm"
              >
                Rechazar
              </button>
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
