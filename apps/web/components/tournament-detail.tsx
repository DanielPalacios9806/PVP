"use client";

import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { mockTournaments } from "../lib/mock-data";
import { BracketBoard } from "./bracket-board";
import { SectionCard } from "./section-card";

function registrationLabel(registration: any) {
  if (registration.team) {
    return registration.team.tag
      ? `${registration.team.name} [${registration.team.tag}]`
      : registration.team.name;
  }

  return registration.user?.displayName || registration.user?.username || "Sin definir";
}

export function TournamentDetail({ tournamentId }: { tournamentId: string }) {
  const [tournament, setTournament] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [checkInMessage, setCheckInMessage] = useState("");

  async function load() {
    try {
      const response = await fetch(`${apiUrl}/tournaments/${tournamentId}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo cargar el torneo.");
      }

      setTournament(data);
    } catch {
      setTournament(mockTournaments.find((item) => item.id === tournamentId) ?? mockTournaments[0]);
      setMessage("");
    }
  }

  useEffect(() => {
    void load();
  }, [tournamentId]);

  async function checkIn(registrationId: string) {
    const response = await fetch(`${apiUrl}/tournaments/${tournamentId}/check-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({ registrationId })
    });

    const data = await response.json();

    if (!response.ok) {
      setCheckInMessage(data.message ?? "No se pudo registrar el check-in.");
      return;
    }

    setCheckInMessage("Check-in realizado correctamente.");
    await load();
  }

  if (!tournament) {
    return (
      <SectionCard title="Detalle del torneo" description="Cargando informacion del torneo.">
        <p className="text-sm text-white/60">{message || "Cargando..."}</p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard title={tournament.name} description={`${tournament.game} | ${tournament.status}`}>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="stat-tile">
            <p className="eyebrow">Formato</p>
            <h3 className="mt-2 font-semibold">{tournament.format}</h3>
          </div>
          <div className="stat-tile">
            <p className="eyebrow">Tipo</p>
            <h3 className="mt-2 font-semibold">{tournament.type}</h3>
          </div>
          <div className="stat-tile">
            <p className="eyebrow">Participantes</p>
            <h3 className="mt-2 font-semibold">
              {tournament.registrations.length}/{tournament.maxParticipants}
            </h3>
          </div>
          <div className="stat-tile">
            <p className="eyebrow">Organiza</p>
            <h3 className="mt-2 font-semibold">
              {tournament.organizer.displayName || tournament.organizer.username}
            </h3>
          </div>
        </div>
        {tournament.rules ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
            {tournament.rules}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Inscripciones" description="Participantes inscritos y estado de check-in.">
        {checkInMessage ? <p className="mb-4 text-sm text-brand-cyan">{checkInMessage}</p> : null}
        <div className="grid gap-3 md:grid-cols-2">
          {tournament.registrations.map((registration: any) => (
            <article
              key={registration.id}
              className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.2))] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <strong>{registrationLabel(registration)}</strong>
                <span className="text-xs text-brand-cyan">{registration.status}</span>
              </div>
              {registration.status !== "CHECKED_IN" ? (
                <button onClick={() => checkIn(registration.id)} className="btn-secondary mt-4 !px-4 !py-2 !text-xs">
                  Hacer check-in
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Cuadro del torneo" description="Vista del bracket y acceso a cada sala de partida.">
        <BracketBoard rounds={tournament.bracket?.rounds ?? []} />
      </SectionCard>
    </div>
  );
}
