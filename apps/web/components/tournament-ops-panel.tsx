"use client";

import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { mockTournaments } from "../lib/mock-data";
import { SectionCard } from "./section-card";

export function TournamentOpsPanel() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const response = await fetch(`${apiUrl}/tournaments`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setTournaments(Array.isArray(data) ? data : []);
    } catch {
      setTournaments(mockTournaments);
      setMessage("");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createBracket(id: string) {
    const response = await fetch(`${apiUrl}/tournaments/${id}/bracket`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message ?? "No se pudo generar el bracket.");
      return;
    }

    setMessage("Bracket generado.");
    await load();
  }

  return (
    <SectionCard title="Operaciones de torneos" description="Acciones administrativas sobre torneos activos y programados.">
      {message ? <p className="mb-4 text-sm text-brand-cyan">{message}</p> : null}
      <div className="space-y-3">
        {tournaments.map((tournament) => (
          <article key={tournament.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">{tournament.name}</h3>
              <span className="text-xs text-white/50">{tournament.status}</span>
            </div>
            <p className="mt-2 text-sm text-white/70">
              {tournament.game} | {tournament.type} | {tournament.format}
            </p>
            <p className="mt-1 text-xs text-white/50">
              Inscripciones: {tournament.registrations?.length ?? 0}
            </p>
            <div className="mt-4">
              <button
                onClick={() => createBracket(tournament.id)}
                className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-medium"
              >
                Generar bracket
              </button>
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
