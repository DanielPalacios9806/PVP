"use client";

import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { mockMatch } from "../lib/mock-data";
import { getStoredUser, type AppRole } from "../lib/session";
import { SectionCard } from "./section-card";

function participantLabel(registration: any) {
  if (!registration) {
    return "Pendiente";
  }

  if (registration.team) {
    return registration.team.tag
      ? `${registration.team.name} [${registration.team.tag}]`
      : registration.team.name;
  }

  return registration.user?.displayName || registration.user?.username || "Sin definir";
}

export function MatchRoom({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<AppRole>("USER");

  async function load() {
    try {
      const response = await fetch(`${apiUrl}/matches/${matchId}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo cargar la partida.");
      }

      setMatch(data);
    } catch {
      setMatch(mockMatch);
      setMessage("");
    }
  }

  useEffect(() => {
    setRole(getStoredUser()?.role ?? "USER");
    void load();
  }, [matchId]);

  const canOperate = role === "ADMIN" || role === "SUPER_ADMIN" || role === "ORGANIZER" || role === "MODERATOR";

  async function reportResult(formData: FormData) {
    const payload = {
      winnerRegistrationId: String(formData.get("winnerRegistrationId") || ""),
      homeScore: Number(formData.get("homeScore")),
      awayScore: Number(formData.get("awayScore")),
      evidenceUrls: String(formData.get("evidenceUrl"))
        ? [String(formData.get("evidenceUrl"))]
        : [],
      notes: String(formData.get("notes") || "")
    };

    const response = await fetch(`${apiUrl}/matches/${matchId}/results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message ?? "No se pudo reportar el resultado.");
      return;
    }

    setMessage("Resultado reportado.");
    await load();
  }

  async function openDispute(formData: FormData) {
    const response = await fetch(`${apiUrl}/disputes/matches/${matchId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        reason: String(formData.get("reason"))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message ?? "No se pudo abrir la disputa.");
      return;
    }

    setMessage("Disputa creada.");
    await load();
  }

  async function confirmResult(resultId: string, approved: boolean) {
    const response = await fetch(`${apiUrl}/matches/results/${resultId}/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({ approved })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message ?? "No se pudo validar el resultado.");
      return;
    }

    setMessage(approved ? "Resultado confirmado." : "Resultado rechazado.");
    await load();
  }

  async function simulateRiotResult() {
    if (!match?.homeRegistration && !match?.awayRegistration) {
      setMessage("No hay participantes suficientes para simular el resultado.");
      return;
    }

    const winnerRegistrationId = match.homeRegistration?.id ?? match.awayRegistration?.id;
    const payload = {
      winnerRegistrationId,
      homeScore: match.homeRegistration?.id === winnerRegistrationId ? 1 : 0,
      awayScore: match.awayRegistration?.id === winnerRegistrationId ? 1 : 0,
      riotGameId: `MOCK-${Date.now()}`
    };

    try {
      const response = await fetch(`${apiUrl}/riot/mock/matches/${matchId}/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo simular Riot mock.");
      }

      setMessage("Resultado Riot mock simulado y bracket actualizado.");
      await load();
    } catch {
      setMatch((current: any) =>
        current
          ? {
              ...current,
              status: "COMPLETED",
              resultSource: "MOCK_RIOT",
              winnerRegistration: current.homeRegistration,
              results: [
                {
                  id: `mock-result-${Date.now()}`,
                  status: "CONFIRMED",
                  homeScore: 1,
                  awayScore: 0,
                  winnerRegistrationId,
                  notes: "Resultado simulado en modo demo sin Riot API oficial."
                },
                ...(current.results ?? [])
              ]
            }
          : current
      );
      setMessage("Resultado Riot mock simulado localmente para demo.");
    }
  }

  if (!match) {
    return (
      <SectionCard title="Sala de partida" description="Cargando datos de la partida.">
        <p className="text-sm text-white/60">{message || "Cargando..."}</p>
      </SectionCard>
    );
  }

  const winnerOptions = [
    match.homeRegistration ? { id: match.homeRegistration.id, label: participantLabel(match.homeRegistration) } : null,
    match.awayRegistration ? { id: match.awayRegistration.id, label: participantLabel(match.awayRegistration) } : null
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <SectionCard title={match.tournament.name} description={`Partida ${match.status}`}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(47,107,255,0.12),rgba(0,0,0,0.18))] p-5">
              <p className="eyebrow">Lado A</p>
              <h3 className="mt-2 text-xl font-semibold">{participantLabel(match.homeRegistration)}</h3>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,79,99,0.12),rgba(0,0,0,0.18))] p-5">
              <p className="eyebrow">Lado B</p>
              <h3 className="mt-2 text-xl font-semibold">{participantLabel(match.awayRegistration)}</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3 text-sm text-white/70 md:grid-cols-4">
            <div className="stat-tile">Juego: {match.tournament.game}</div>
            <div className="stat-tile">Formato: {match.tournament.format}</div>
            <div className="stat-tile">Bo: {match.bestOf}</div>
            <div className="stat-tile">Ronda: {match.round?.name ?? "Sin asignar"}</div>
          </div>
        </SectionCard>

        {canOperate ? (
          <SectionCard title="Riot mock" description="Simula un callback de resultado sin usar Riot API oficial.">
            <div className="rounded-[20px] border border-[#18e6f2]/20 bg-[#18e6f2]/8 p-4">
              <p className="text-sm leading-7 text-white/68">
                Esta acción usa el adaptador mock para validar el flujo de avance de bracket. No representa una verificación oficial de Riot.
              </p>
              <button onClick={simulateRiotResult} className="btn-primary mt-4 w-full">
                Simular resultado Riot mock
              </button>
            </div>
          </SectionCard>
        ) : null}

        <SectionCard title="Resultados reportados" description="Historial de resultados enviados para esta partida.">
          <div className="space-y-3">
            {match.results.length === 0 ? <p className="text-sm text-white/60">Aun no hay resultados reportados.</p> : null}
            {match.results.map((result: any) => (
              <article
                key={result.id}
                className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.2))] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong>{result.homeScore} - {result.awayScore}</strong>
                  <span className="text-xs text-brand-cyan">{result.status}</span>
                </div>
                <p className="mt-2 text-sm text-white/70">{result.notes || "Sin notas adicionales."}</p>
                <p className="mt-2 text-xs text-white/50">
                  Ganador reportado: {result.winnerRegistrationId ?? "Sin definir"}
                </p>
                {result.status === "PENDING_CONFIRMATION" ? (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => confirmResult(result.id, true)}
                      className="btn-primary !rounded-xl !px-4 !py-2 !text-xs"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => confirmResult(result.id, false)}
                      className="btn-secondary !rounded-xl !px-4 !py-2 !text-xs"
                    >
                      Rechazar
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Disputas" description="Casos abiertos o resueltos asociados a la partida.">
          <div className="space-y-3">
            {match.disputes.length === 0 ? <p className="text-sm text-white/60">No hay disputas activas.</p> : null}
            {match.disputes.map((dispute: any) => (
              <article
                key={dispute.id}
                className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.2))] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong>{dispute.status}</strong>
                  <span className="text-xs text-white/50">{new Date(dispute.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 text-sm text-white/70">{dispute.reason}</p>
                {dispute.resolution ? (
                  <p className="mt-2 text-xs text-brand-cyan">Resolucion: {dispute.resolution}</p>
                ) : null}
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="space-y-6">
        <SectionCard title="Reportar resultado" description="Flujo manual para capitanes y jugadores autorizados.">
          <form action={reportResult} className="space-y-4">
            <select name="winnerRegistrationId" defaultValue={winnerOptions[0]?.id}>
              {winnerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input name="homeScore" type="number" min="0" defaultValue="1" required />
              <input name="awayScore" type="number" min="0" defaultValue="0" required />
            </div>
            <input name="evidenceUrl" placeholder="URL de evidencia (opcional)" />
            <textarea name="notes" rows={4} placeholder="Notas de la partida" />
            <button className="btn-primary w-full">Enviar resultado</button>
          </form>
        </SectionCard>

        <SectionCard title="Abrir disputa" description="Usa esta via si el marcador o la evidencia son incorrectos.">
          <form action={openDispute} className="space-y-4">
            <textarea name="reason" rows={5} placeholder="Describe claramente la disputa" required />
            <button className="btn-secondary w-full">
              Crear disputa
            </button>
          </form>
        </SectionCard>

        {message ? (
          <SectionCard title="Estado" description="Respuesta de la ultima accion realizada.">
            <p className="text-sm text-brand-cyan">{message}</p>
          </SectionCard>
        ) : null}
      </div>
    </div>
  );
}
