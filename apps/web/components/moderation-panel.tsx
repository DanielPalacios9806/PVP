"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { SectionCard } from "./section-card";

type RegistrationSummary = {
  id: string;
  user?: { id: string; username?: string | null; displayName?: string | null; email?: string | null } | null;
  team?: { id: string; name: string; tag?: string | null } | null;
} | null;

type ModerationResult = {
  id: string;
  status: string;
  homeScore: number;
  awayScore: number;
  notes?: string | null;
  evidenceUrls?: unknown;
  createdAt: string;
  reportedByUser?: { id: string; username?: string | null; displayName?: string | null; email?: string | null } | null;
  winnerRegistration?: RegistrationSummary;
} | null;

type ModerationDispute = {
  id: string;
  status: string;
  reason: string;
  resolution?: string | null;
  createdAt: string;
  openedByUser?: { id: string; username?: string | null; displayName?: string | null; email?: string | null } | null;
  resolvedByUser?: { id: string; username?: string | null; displayName?: string | null } | null;
} | null;

type ModerationCase = {
  id: string;
  status: string;
  scheduledAt?: string | null;
  updatedAt: string;
  tournament: { id: string; name: string; game: string; status: string; organizerId?: string | null };
  round?: { id: string; name?: string | null; number?: number | null } | null;
  homeRegistration: RegistrationSummary;
  awayRegistration: RegistrationSummary;
  winnerRegistration: RegistrationSummary;
  pendingResult: ModerationResult;
  openDispute: ModerationDispute;
  latestResult: ModerationResult;
  latestDispute: ModerationDispute;
  resultsCount: number;
  disputesCount: number;
  severity: "critical" | "warning" | "info" | "neutral" | string;
  actionNeeded: string;
};

type ModerationResponse = {
  cases: ModerationCase[];
  summary: {
    total: number;
    pendingResults: number;
    openDisputes: number;
    inProgress: number;
    completed: number;
  };
};

const statusFilters = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Resultados pendientes" },
  { value: "disputed", label: "Disputas" },
  { value: "open", label: "En seguimiento" },
  { value: "completed", label: "Cerrados" }
];

const severityClasses: Record<string, string> = {
  critical: "border-rose-400/35 bg-rose-500/10 text-rose-100",
  warning: "border-amber-300/35 bg-amber-300/10 text-amber-100",
  info: "border-[#18e6f2]/30 bg-[#18e6f2]/10 text-[#18e6f2]",
  neutral: "border-white/10 bg-white/[0.04] text-white/60"
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  READY: "Listo",
  IN_PROGRESS: "En juego",
  RESULT_PENDING: "Resultado pendiente",
  COMPLETED: "Completado",
  DISPUTED: "En disputa",
  CANCELLED: "Cancelado"
};

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-EC", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function registrationLabel(registration: RegistrationSummary) {
  if (!registration) return "Por definir";
  if (registration.team) return registration.team.tag ? `${registration.team.name} (${registration.team.tag})` : registration.team.name;
  return registration.user?.displayName ?? registration.user?.username ?? registration.user?.email ?? "Jugador";
}

function actorLabel(actor?: { username?: string | null; displayName?: string | null; email?: string | null } | null) {
  if (!actor) return "Sistema";
  return actor.displayName ?? actor.username ?? actor.email ?? "Usuario";
}

function evidenceCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

export function ModerationPanel() {
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [summary, setSummary] = useState<ModerationResponse["summary"]>();
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("Resolucion administrativa desde el panel de moderacion.");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const selectedCase = useMemo(() => cases.find((item) => item.id === selectedCaseId) ?? cases[0] ?? null, [cases, selectedCaseId]);

  async function loadCases() {
    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams({ limit: "80", status });
      if (query.trim()) params.set("q", query.trim());

      const response = await fetch(`${apiUrl}/matches/moderation/cases?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      const data = (await response.json()) as ModerationResponse | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data ? data.message : "No se pudieron cargar los casos de moderacion.");
      }

      const nextCases = Array.isArray((data as ModerationResponse).cases) ? (data as ModerationResponse).cases : [];
      setCases(nextCases);
      setSummary((data as ModerationResponse).summary);
      setSelectedCaseId((current) => (current && nextCases.some((item) => item.id === current) ? current : nextCases[0]?.id ?? null));
    } catch (error) {
      setCases([]);
      setSummary(undefined);
      setMessage(error instanceof Error ? error.message : "No se pudieron cargar los casos de moderacion.");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(label: string, path: string, body: Record<string, unknown>) {
    setActionLoading(label);
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(body)
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo ejecutar la accion de moderacion.");
      }

      setMessage("Accion de moderacion ejecutada correctamente.");
      await loadCases();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo ejecutar la accion de moderacion.");
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    void loadCases();
  }, []);

  const total = summary?.total ?? cases.length;
  const pendingResults = summary?.pendingResults ?? cases.filter((item) => item.pendingResult).length;
  const openDisputes = summary?.openDisputes ?? cases.filter((item) => item.openDispute).length;
  const inProgress = summary?.inProgress ?? cases.filter((item) => item.status === "IN_PROGRESS").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/40">Casos</p>
          <strong className="mt-2 block text-3xl text-white">{total}</strong>
        </div>
        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-amber-100/60">Pendientes</p>
          <strong className="mt-2 block text-3xl text-amber-100">{pendingResults}</strong>
        </div>
        <div className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-rose-100/60">Disputas</p>
          <strong className="mt-2 block text-3xl text-rose-100">{openDisputes}</strong>
        </div>
        <div className="rounded-3xl border border-[#18e6f2]/25 bg-[#18e6f2]/10 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[#18e6f2]/70">En juego</p>
          <strong className="mt-2 block text-3xl text-[#18e6f2]">{inProgress}</strong>
        </div>
      </div>

      <SectionCard title="Centro de moderacion" description="Supervisa disputas, resultados pendientes y salas que requieren intervencion del staff.">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void loadCases();
            }}
            placeholder="Buscar torneo, juego, equipo o jugador..."
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[#18e6f2]/50"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[#18e6f2]/50"
          >
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value} className="bg-[#08111f] text-white">
                {filter.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void loadCases()}
            disabled={loading}
            className="rounded-2xl bg-[#18e6f2] px-5 py-3 text-sm font-semibold text-[#07111f] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Cargando..." : "Filtrar"}
          </button>
        </div>

        {message ? <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">{message}</p> : null}

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-3">
            {cases.length === 0 ? <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">No hay casos con los filtros actuales.</p> : null}
            {cases.map((item) => {
              const active = selectedCase?.id === item.id;
              const severityClass = severityClasses[item.severity] ?? severityClasses.neutral;

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelectedCaseId(item.id)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${active ? "border-[#18e6f2]/60 bg-[#18e6f2]/10" : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${severityClass}`}>{item.actionNeeded}</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/50">{statusLabels[item.status] ?? item.status}</span>
                      </div>
                      <strong className="mt-3 block text-sm text-white">{item.tournament.name}</strong>
                      <p className="mt-1 text-xs text-white/50">{item.tournament.game} · {item.round?.name ?? `Ronda ${item.round?.number ?? "?"}`}</p>
                    </div>
                    <span className="text-xs text-white/45">{formatDate(item.updatedAt)}</span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Local</p>
                      <p className="mt-1 text-sm font-semibold text-white">{registrationLabel(item.homeRegistration)}</p>
                    </div>
                    <span className="text-center text-xs font-bold uppercase tracking-[0.18em] text-[#18e6f2]">VS</span>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:text-right">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Visitante</p>
                      <p className="mt-1 text-sm font-semibold text-white">{registrationLabel(item.awayRegistration)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <aside className="rounded-3xl border border-white/10 bg-black/30 p-5">
            {selectedCase ? (
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#18e6f2]">Caso seleccionado</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{selectedCase.tournament.name}</h3>
                  <p className="mt-1 text-sm text-white/50">{registrationLabel(selectedCase.homeRegistration)} vs {registrationLabel(selectedCase.awayRegistration)}</p>
                </div>

                <div className="grid gap-2 text-sm text-white/70">
                  <p><span className="text-white/40">Estado:</span> {statusLabels[selectedCase.status] ?? selectedCase.status}</p>
                  <p><span className="text-white/40">Accion pendiente:</span> {selectedCase.actionNeeded}</p>
                  <p><span className="text-white/40">Programado:</span> {formatDate(selectedCase.scheduledAt)}</p>
                  <p><span className="text-white/40">Reportes:</span> {selectedCase.resultsCount}</p>
                  <p><span className="text-white/40">Disputas:</span> {selectedCase.disputesCount}</p>
                </div>

                <a
                  href={`/dashboard/matches/${selectedCase.id}`}
                  className="block rounded-2xl border border-[#18e6f2]/30 bg-[#18e6f2]/10 px-4 py-3 text-center text-sm font-semibold text-[#18e6f2] transition hover:bg-[#18e6f2] hover:text-[#07111f]"
                >
                  Abrir sala del match
                </a>

                {selectedCase.pendingResult ? (
                  <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-amber-100/60">Resultado pendiente</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedCase.pendingResult.homeScore} - {selectedCase.pendingResult.awayScore}</p>
                    <p className="mt-1 text-xs text-white/55">Reportado por {actorLabel(selectedCase.pendingResult.reportedByUser)}</p>
                    <p className="mt-1 text-xs text-white/45">Evidencias: {evidenceCount(selectedCase.pendingResult.evidenceUrls)}</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={Boolean(actionLoading)}
                        onClick={() => void runAction("confirm", `/matches/results/${selectedCase.pendingResult?.id}/confirm`, { approved: true })}
                        className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-semibold text-[#06130f] transition hover:bg-white disabled:opacity-60"
                      >
                        Confirmar resultado
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(actionLoading)}
                        onClick={() => void runAction("reject", `/matches/results/${selectedCase.pendingResult?.id}/confirm`, { approved: false })}
                        className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-60"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ) : null}

                {selectedCase.openDispute ? (
                  <div className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-rose-100/60">Disputa abierta</p>
                    <p className="mt-2 text-sm text-white/75">{selectedCase.openDispute.reason}</p>
                    <p className="mt-2 text-xs text-white/45">Abierta por {actorLabel(selectedCase.openDispute.openedByUser)}</p>
                    <textarea
                      value={resolution}
                      onChange={(event) => setResolution(event.target.value)}
                      className="mt-4 min-h-24 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none transition focus:border-[#18e6f2]/50"
                    />
                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        disabled={Boolean(actionLoading)}
                        onClick={() => void runAction("resolve-confirm", `/matches/disputes/${selectedCase.openDispute?.id}/resolve`, { resolution, approved: true, approvedResultId: selectedCase.pendingResult?.id })}
                        className="rounded-xl bg-[#18e6f2] px-3 py-2 text-xs font-semibold text-[#07111f] transition hover:bg-white disabled:opacity-60"
                      >
                        Resolver confirmando resultado
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(actionLoading)}
                        onClick={() => void runAction("resolve-reject", `/matches/disputes/${selectedCase.openDispute?.id}/resolve`, { resolution, approved: false })}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 disabled:opacity-60"
                      >
                        Resolver sin resultado
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-white/60">Selecciona un caso para ver acciones de moderacion.</p>
            )}
          </aside>
        </div>
      </SectionCard>
    </div>
  );
}
