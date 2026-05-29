"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { mockMatch } from "../lib/mock-data";
import { getStoredUser, type AppRole } from "../lib/session";
import { SectionCard } from "./section-card";

const matchStatusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  READY: "Listo",
  IN_PROGRESS: "En juego",
  RESULT_PENDING: "Resultado pendiente",
  COMPLETED: "Finalizado",
  DISPUTED: "En disputa",
  CANCELLED: "Cancelado"
};

const resultStatusLabel: Record<string, string> = {
  PENDING_CONFIRMATION: "Pendiente de validación",
  CONFIRMED: "Confirmado",
  REJECTED: "Rechazado"
};

const statusTone: Record<string, string> = {
  PENDING: "border-white/10 bg-white/8 text-white/70",
  READY: "border-[#18e6f2]/30 bg-[#18e6f2]/10 text-[#18e6f2]",
  IN_PROGRESS: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  RESULT_PENDING: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  COMPLETED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  DISPUTED: "border-[#ff4f63]/35 bg-[#ff4f63]/12 text-[#ff9aa7]",
  CANCELLED: "border-white/10 bg-white/5 text-white/45"
};

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

function participantInitials(registration: any) {
  const label = participantLabel(registration);
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word: string) => word[0]?.toUpperCase())
    .join("") || "?";
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Sin horario";
  }

  return new Date(value).toLocaleString("es-EC", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function scoreForSide(result: any | null, side: "home" | "away") {
  if (!result) {
    return "-";
  }

  return side === "home" ? result.homeScore : result.awayScore;
}

function evidenceUrls(result: any) {
  if (!result?.evidenceUrls) {
    return [] as string[];
  }

  if (Array.isArray(result.evidenceUrls)) {
    return result.evidenceUrls.filter(Boolean).map(String);
  }

  return [] as string[];
}

function findRegistrationById(match: any, registrationId?: string | null) {
  if (!registrationId) {
    return null;
  }

  if (match.homeRegistration?.id === registrationId) {
    return match.homeRegistration;
  }

  if (match.awayRegistration?.id === registrationId) {
    return match.awayRegistration;
  }

  return null;
}

function ParticipantCard({
  label,
  side,
  registration,
  score,
  winner
}: {
  label: string;
  side: "home" | "away";
  registration: any;
  score: string | number;
  winner: boolean;
}) {
  const glow = side === "home" ? "from-[#18e6f2]/22" : "from-[#ff4f63]/24";

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border p-5 ${
        winner ? "border-emerald-300/40 bg-emerald-300/10" : "border-white/10 bg-white/[0.045]"
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${glow} to-transparent`} />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-black/40 text-lg font-black text-white shadow-[0_0_24px_rgba(24,230,242,0.12)]">
            {participantInitials(registration)}
          </div>
          <div>
            <p className="eyebrow">{label}</p>
            <h3 className="mt-1 text-lg font-black text-white md:text-xl">{participantLabel(registration)}</h3>
            <p className="mt-1 text-xs text-white/45">{registration?.team ? "Equipo" : registration?.user ? "Jugador" : "Slot pendiente"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.28em] text-white/35">Score</p>
          <strong className="text-4xl font-black text-white">{score}</strong>
        </div>
      </div>
      {winner ? (
        <div className="relative mt-4 inline-flex rounded-full border border-emerald-300/35 bg-emerald-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
          Ganador reportado
        </div>
      ) : null}
    </div>
  );
}

export function MatchRoom({ matchId }: { matchId: string }) {
  const [match, setMatch] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState<AppRole>("USER");

  async function load() {
    try {
      setLoading(true);
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
      setMessage("No se pudo conectar con la API. Mostrando datos demo de la sala.");
      setMessageTone("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setRole(getStoredUser()?.role ?? "USER");
    void load();
  }, [matchId]);

  const canOperate = role === "ADMIN" || role === "SUPER_ADMIN" || role === "ORGANIZER" || role === "MODERATOR";
  const latestResult = useMemo(() => match?.results?.[0] ?? null, [match]);
  const pendingResult = useMemo(
    () => match?.results?.find((result: any) => result.status === "PENDING_CONFIRMATION") ?? null,
    [match]
  );
  const canReport = match && !["COMPLETED", "CANCELLED"].includes(match.status) && winnerOptionsFromMatch(match).length > 0;

  async function reportResult(formData: FormData) {
    setSubmitting(true);
    setMessage("");
    const payload = {
      winnerRegistrationId: String(formData.get("winnerRegistrationId") || ""),
      homeScore: Number(formData.get("homeScore")),
      awayScore: Number(formData.get("awayScore")),
      evidenceUrls: String(formData.get("evidenceUrl"))
        ? [String(formData.get("evidenceUrl"))]
        : [],
      notes: String(formData.get("notes") || "")
    };

    try {
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
        setMessageTone("error");
        return;
      }

      setMessage("Resultado reportado. Queda pendiente de validación.");
      setMessageTone("success");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function openDispute(formData: FormData) {
    setSubmitting(true);
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
      setMessageTone("error");
      setSubmitting(false);
      return;
    }

    setMessage("Disputa creada. Un moderador podrá revisar el caso.");
    setMessageTone("success");
    setSubmitting(false);
    await load();
  }

  async function confirmResult(resultId: string, approved: boolean) {
    setSubmitting(true);
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
      setMessageTone("error");
      setSubmitting(false);
      return;
    }

    setMessage(approved ? "Resultado confirmado y bracket actualizado." : "Resultado rechazado; la partida queda en disputa.");
    setMessageTone(approved ? "success" : "info");
    setSubmitting(false);
    await load();
  }

  async function simulateRiotResult() {
    if (!match?.homeRegistration && !match?.awayRegistration) {
      setMessage("No hay participantes suficientes para simular el resultado.");
      setMessageTone("error");
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
      setMessageTone("success");
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
      setMessageTone("success");
    }
  }

  if (!match || loading) {
    return (
      <SectionCard title="Sala de partida" description="Cargando datos de la partida.">
        <p className="text-sm text-white/60">{message || "Cargando..."}</p>
      </SectionCard>
    );
  }

  const winnerOptions = winnerOptionsFromMatch(match);
  const latestWinner = findRegistrationById(match, latestResult?.winnerRegistrationId);
  const tournamentHref = `/dashboard/tournaments/${match.tournament.id}`;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#070b16] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(24,230,242,0.18),transparent_34%),radial-gradient(circle_at_84%_12%,rgba(255,79,99,0.18),transparent_32%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.22em] ${statusTone[match.status] ?? statusTone.PENDING}`}>
                {matchStatusLabel[match.status] ?? match.status}
              </span>
              <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                {match.round?.name ?? "Ronda sin asignar"}
              </span>
              <span className="rounded-full border border-[#18e6f2]/25 bg-[#18e6f2]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#18e6f2]">
                BO{match.bestOf}
              </span>
            </div>
            <p className="mt-5 text-sm uppercase tracking-[0.32em] text-[#18e6f2]">Sala competitiva</p>
            <h1 className="mt-2 max-w-4xl text-3xl font-black text-white md:text-5xl">{match.tournament.name}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">
              Reporta resultados, adjunta evidencias y valida la partida. Cuando el resultado se confirma, el bracket avanza automáticamente.
            </p>
          </div>
          <a href={tournamentHref} className="btn-secondary w-full text-center lg:w-auto">
            Volver al torneo
          </a>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <SectionCard title="Enfrentamiento" description="Marcador principal y participantes de la partida.">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <ParticipantCard
                label="Lado A"
                side="home"
                registration={match.homeRegistration}
                score={scoreForSide(latestResult, "home")}
                winner={latestWinner?.id === match.homeRegistration?.id}
              />
              <div className="grid place-items-center rounded-3xl border border-white/10 bg-black/30 px-5 py-4 text-center">
                <p className="text-xs uppercase tracking-[0.32em] text-white/35">VS</p>
                <strong className="text-2xl font-black text-white">{scoreForSide(latestResult, "home")} - {scoreForSide(latestResult, "away")}</strong>
              </div>
              <ParticipantCard
                label="Lado B"
                side="away"
                registration={match.awayRegistration}
                score={scoreForSide(latestResult, "away")}
                winner={latestWinner?.id === match.awayRegistration?.id}
              />
            </div>
            <div className="mt-5 grid gap-3 text-sm text-white/70 md:grid-cols-4">
              <div className="stat-tile">Juego: {match.tournament.game}</div>
              <div className="stat-tile">Formato: {match.tournament.format}</div>
              <div className="stat-tile">Horario: {formatDate(match.scheduledAt)}</div>
              <div className="stat-tile">Fuente: {match.resultSource ?? "MANUAL"}</div>
            </div>
          </SectionCard>

          <SectionCard title="Historial de resultados" description="Reportes enviados por jugadores, capitanes o staff.">
            <div className="space-y-3">
              {match.results.length === 0 ? <p className="text-sm text-white/60">Aún no hay resultados reportados.</p> : null}
              {match.results.map((result: any) => {
                const winner = result.winnerRegistration ?? findRegistrationById(match, result.winnerRegistrationId);
                const urls = evidenceUrls(result);
                return (
                  <article
                    key={result.id}
                    className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(0,0,0,0.22))] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <strong className="text-lg text-white">{result.homeScore} - {result.awayScore}</strong>
                        <p className="mt-1 text-xs text-white/45">
                          Reportó: {result.reportedByUser?.displayName ?? result.reportedByUser?.username ?? "Usuario"}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#18e6f2]/20 bg-[#18e6f2]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#18e6f2]">
                        {resultStatusLabel[result.status] ?? result.status}
                      </span>
                    </div>
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                      Ganador reportado: <strong className="text-white">{participantLabel(winner)}</strong>
                    </div>
                    {result.notes ? <p className="mt-3 text-sm leading-6 text-white/62">{result.notes}</p> : null}
                    {urls.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {urls.map((url: string) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white/70 hover:border-[#18e6f2]/40 hover:text-[#18e6f2]">
                            Ver evidencia
                          </a>
                        ))}
                      </div>
                    ) : null}
                    {result.status === "PENDING_CONFIRMATION" ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => confirmResult(result.id, true)}
                          disabled={submitting}
                          className="btn-primary !rounded-xl !px-4 !py-2 !text-xs disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => confirmResult(result.id, false)}
                          disabled={submitting}
                          className="btn-secondary !rounded-xl !px-4 !py-2 !text-xs disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
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
                    <p className="mt-2 text-xs text-[#18e6f2]">Resolución: {dispute.resolution}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Reportar resultado" description="Flujo manual para capitanes y jugadores autorizados.">
            {canReport ? (
              <form action={reportResult} className="space-y-4">
                <select name="winnerRegistrationId" defaultValue={winnerOptions[0]?.id} className="w-full rounded-2xl border border-white/10 bg-[#0c1324] p-3 text-sm text-white outline-none focus:border-[#18e6f2]/50">
                  {winnerOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input name="homeScore" type="number" min="0" defaultValue="1" required placeholder="Score A" />
                  <input name="awayScore" type="number" min="0" defaultValue="0" required placeholder="Score B" />
                </div>
                <input name="evidenceUrl" placeholder="URL de evidencia (opcional)" />
                <textarea name="notes" rows={4} placeholder="Notas de la partida" />
                <button disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                  {submitting ? "Enviando..." : "Enviar resultado"}
                </button>
              </form>
            ) : (
              <p className="text-sm leading-7 text-white/60">Esta partida no está disponible para reportar resultados.</p>
            )}
          </SectionCard>

          {pendingResult ? (
            <SectionCard title="Validación pendiente" description="Resultado esperando aceptación o revisión del staff.">
              <div className="rounded-[20px] border border-amber-300/25 bg-amber-300/10 p-4">
                <p className="text-sm leading-7 text-amber-100">
                  Hay un resultado pendiente. El rival puede aceptarlo o el staff puede confirmarlo/rechazarlo.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button onClick={() => confirmResult(pendingResult.id, true)} disabled={submitting} className="btn-primary !py-2 disabled:opacity-50">
                    Aceptar resultado
                  </button>
                  <button onClick={() => confirmResult(pendingResult.id, false)} disabled={submitting} className="btn-secondary !py-2 disabled:opacity-50">
                    Rechazar
                  </button>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Abrir disputa" description="Usa esta vía si el marcador o la evidencia son incorrectos.">
            <form action={openDispute} className="space-y-4">
              <textarea name="reason" rows={5} placeholder="Describe claramente la disputa" required />
              <button disabled={submitting} className="btn-secondary w-full disabled:opacity-50">
                Crear disputa
              </button>
            </form>
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

          {message ? (
            <SectionCard title="Estado" description="Respuesta de la última acción realizada.">
              <p className={`text-sm ${messageTone === "error" ? "text-[#ff9aa7]" : messageTone === "success" ? "text-emerald-200" : "text-[#18e6f2]"}`}>
                {message}
              </p>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function winnerOptionsFromMatch(match: any) {
  return [
    match.homeRegistration ? { id: match.homeRegistration.id, label: participantLabel(match.homeRegistration) } : null,
    match.awayRegistration ? { id: match.awayRegistration.id, label: participantLabel(match.awayRegistration) } : null
  ].filter(Boolean) as { id: string; label: string }[];
}




