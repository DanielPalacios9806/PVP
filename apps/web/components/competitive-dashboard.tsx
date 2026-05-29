"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/config";
import { brand } from "@/lib/brand";
import {
  getStoredUser,
  getStoredWallet,
  roleLabels,
  subscribeSessionChange,
  type AppRole,
  type StoredUser,
  type StoredWallet
} from "@/lib/session";

const activeRegistrationStatuses = new Set(["PENDING", "CONFIRMED", "CHECKED_IN"]);
const activeTournamentStatuses = new Set(["PUBLISHED", "REGISTRATION_OPEN", "CHECK_IN", "IN_PROGRESS"]);
const openMatchStatuses = new Set(["PENDING", "READY", "IN_PROGRESS", "RESULT_PENDING", "DISPUTED"]);

interface RiotAccount {
  id: string;
  riotGameName?: string | null;
  riotTagLine?: string | null;
  platformRoute?: string | null;
  regionalRoute?: string | null;
  verified?: boolean;
  verificationStatus?: string | null;
  verifiedAt?: string | null;
  lastSyncedAt?: string | null;
  metadata?: {
    verificationMethod?: string;
    ownershipVerified?: boolean;
    warning?: string;
  } | null;
}

interface RuntimeStatus {
  mode?: string;
  readyForAccountLookup?: boolean;
  readyForOfficialRso?: boolean;
  readyForTournamentCodes?: boolean;
  realRequestsEnabled?: boolean;
}

interface TeamMember {
  userId: string;
  role?: string | null;
}

interface Team {
  id: string;
  name: string;
  tag?: string | null;
  logoUrl?: string | null;
  status?: string | null;
  ownerId?: string | null;
  members?: TeamMember[];
}

interface Registration {
  id: string;
  tournamentId?: string | null;
  userId?: string | null;
  teamId?: string | null;
  status?: string | null;
  checkedInAt?: string | null;
  createdAt?: string | null;
}

interface Tournament {
  id: string;
  name: string;
  game: string;
  status: string;
  startsAt?: string | null;
  endsAt?: string | null;
  registrationClosesAt?: string | null;
  prizes?: string | null;
  entryFeeTokens?: number | null;
  maxParticipants?: number | null;
  registrations?: Registration[];
  bracket?: {
    status?: string | null;
    rounds?: unknown[];
  } | null;
}

interface MatchResult {
  status?: string | null;
  winnerRegistrationId?: string | null;
}

interface Dispute {
  status?: string | null;
}

interface Match {
  id: string;
  tournamentId: string;
  status: string;
  scheduledAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  homeRegistrationId?: string | null;
  awayRegistrationId?: string | null;
  winnerRegistrationId?: string | null;
  results?: MatchResult[];
  disputes?: Dispute[];
}

interface ActivityItem {
  id: string;
  label: string;
  detail: string;
  status: string;
  href: string;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
  date?: string | null;
}

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      headers: getAuthHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Por definir";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Por definir";
  }

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function normalizeBalance(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function registrationLabel(registration?: Registration) {
  if (!registration?.status) {
    return "Sin registro";
  }

  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    CHECKED_IN: "Check-in listo",
    REJECTED: "Rechazado",
    CANCELLED: "Cancelado"
  };

  return labels[registration.status] ?? registration.status;
}

function matchStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    READY: "Listo",
    IN_PROGRESS: "En juego",
    RESULT_PENDING: "Resultado pendiente",
    COMPLETED: "Finalizado",
    DISPUTED: "En disputa",
    CANCELLED: "Cancelado"
  };

  return labels[status] ?? status;
}

function tournamentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicado",
    REGISTRATION_OPEN: "Inscripciones abiertas",
    CHECK_IN: "Check-in",
    IN_PROGRESS: "En competencia",
    COMPLETED: "Finalizado",
    CANCELLED: "Cancelado"
  };

  return labels[status] ?? status;
}

function riotState(account?: RiotAccount | null, runtime?: RuntimeStatus) {
  if (account?.verified && account.verificationStatus === "RSO_VERIFIED") {
    return {
      label: "Vinculado por Riot Sign On",
      detail: "Propiedad confirmada oficialmente por Riot.",
      tone: "success" as const
    };
  }

  if (account) {
    return {
      label: "Validado tecnicamente",
      detail: "El Riot ID existe, pero la propiedad oficial requiere Riot Sign On.",
      tone: "warning" as const
    };
  }

  if (runtime?.readyForAccountLookup) {
    return {
      label: "Listo para validar",
      detail: "Puedes validar Riot ID para pruebas internas.",
      tone: "info" as const
    };
  }

  return {
    label: "No conectado",
    detail: "Configura Riot para preparar tu perfil competitivo.",
    tone: "neutral" as const
  };
}

function toneClass(tone: ActivityItem["tone"] | "success" | "warning" | "danger" | "info" | "neutral") {
  const classes: Record<string, string> = {
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
    warning: "border-amber-400/25 bg-amber-400/10 text-amber-100",
    danger: "border-rose-400/25 bg-rose-400/10 text-rose-100",
    info: "border-[#18e6f2]/25 bg-[#18e6f2]/10 text-[#d6fbff]",
    neutral: "border-white/10 bg-white/8 text-white/72"
  };

  return classes[tone] ?? classes.neutral;
}

function avatarInitials(user?: StoredUser | null, team?: Team | null) {
  const source = team?.tag || team?.name || user?.displayName || user?.username || user?.email || "DS";
  const words = source.split(/[\s._-]+/).filter(Boolean).slice(0, 2);
  return words.map((word: string) => word[0]?.toUpperCase()).join("") || "DS";
}

export function CompetitiveDashboard() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [wallet, setWallet] = useState<StoredWallet>(getStoredWallet());
  const [riotAccounts, setRiotAccounts] = useState<RiotAccount[]>([]);
  const [runtime, setRuntime] = useState<RuntimeStatus>({ mode: "mock" });
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  function syncStoredSession() {
    setUser(getStoredUser());
    setWallet(getStoredWallet());
  }

  useEffect(() => {
    syncStoredSession();
    return subscribeSessionChange(syncStoredSession);
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const [profile, riot, status, teamList, tournamentList, matchList] = await Promise.all([
        fetchJson<{ wallets?: Array<{ balance?: string | number; currencyCode?: string }> }>("/users/me", {}),
        fetchJson<RiotAccount[]>("/riot/accounts/me", []),
        fetchJson<RuntimeStatus>("/riot/status", { mode: "mock" }),
        fetchJson<Team[]>("/teams", []),
        fetchJson<Tournament[]>("/tournaments", []),
        fetchJson<Match[]>("/matches", [])
      ]);

      const internalWallet = profile.wallets?.find((item) => item.currencyCode === "DS_TOKEN") ?? profile.wallets?.[0];
      if (internalWallet) {
        setWallet({
          balance: normalizeBalance(internalWallet.balance),
          currencyCode: internalWallet.currencyCode ?? "DS_TOKEN"
        });
      }

      setRiotAccounts(riot);
      setRuntime(status);
      setTeams(teamList);
      setTournaments(tournamentList);
      setMatches(matchList);
      setLoading(false);
    }

    void loadDashboard();
  }, []);

  const teamMemberships = useMemo(() => {
    if (!user) {
      return [];
    }

    return teams.filter((team) => team.ownerId === user.id || team.members?.some((member) => member.userId === user.id));
  }, [teams, user]);

  const primaryTeam = teamMemberships[0] ?? null;
  const teamIds = useMemo(() => new Set(teamMemberships.map((team) => team.id)), [teamMemberships]);

  const activeTournamentEntries = useMemo(() => {
    if (!user) {
      return [];
    }

    return tournaments
      .map((tournament) => {
        const registration = tournament.registrations?.find(
          (item) =>
            activeRegistrationStatuses.has(item.status ?? "") &&
            (item.userId === user.id || (item.teamId ? teamIds.has(item.teamId) : false))
        );

        return registration ? { tournament, registration } : null;
      })
      .filter((item): item is { tournament: Tournament; registration: Registration } => Boolean(item));
  }, [teamIds, tournaments, user]);

  const registrationIds = useMemo(() => new Set(activeTournamentEntries.map((item) => item.registration.id)), [activeTournamentEntries]);

  const relevantMatches = useMemo(
    () =>
      matches.filter(
        (match) =>
          (match.homeRegistrationId ? registrationIds.has(match.homeRegistrationId) : false) ||
          (match.awayRegistrationId ? registrationIds.has(match.awayRegistrationId) : false) ||
          (match.winnerRegistrationId ? registrationIds.has(match.winnerRegistrationId) : false)
      ),
    [matches, registrationIds]
  );

  const upcomingMatches = useMemo(
    () =>
      relevantMatches
        .filter((match) => openMatchStatuses.has(match.status))
        .sort((a, b) => new Date(a.scheduledAt ?? a.updatedAt ?? a.createdAt ?? 0).getTime() - new Date(b.scheduledAt ?? b.updatedAt ?? b.createdAt ?? 0).getTime())
        .slice(0, 3),
    [relevantMatches]
  );

  const recentMatches = useMemo(
    () =>
      relevantMatches
        .filter((match) => match.status === "COMPLETED" || match.status === "RESULT_PENDING" || match.status === "DISPUTED")
        .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime())
        .slice(0, 4),
    [relevantMatches]
  );

  const notifications = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    upcomingMatches.slice(0, 2).forEach((match) => {
      const tournament = tournaments.find((item) => item.id === match.tournamentId);
      items.push({
        id: `match-${match.id}`,
        label: match.status === "DISPUTED" ? "Disputa activa" : match.status === "RESULT_PENDING" ? "Resultado pendiente" : "Partida programada",
        detail: `${tournament?.name ?? "Torneo"} · ${matchStatusLabel(match.status)}`,
        status: match.status,
        href: `/dashboard/matches/${match.id}`,
        tone: match.status === "DISPUTED" ? "danger" : match.status === "RESULT_PENDING" ? "warning" : "info",
        date: match.scheduledAt ?? match.updatedAt ?? match.createdAt
      });
    });

    activeTournamentEntries.slice(0, 2).forEach(({ tournament, registration }) => {
      if (tournament.status === "CHECK_IN" || registration.status === "PENDING") {
        items.push({
          id: `tournament-${tournament.id}`,
          label: tournament.status === "CHECK_IN" ? "Check-in disponible" : "Inscripcion en revision",
          detail: tournament.name,
          status: tournament.status,
          href: `/dashboard/tournaments/${tournament.id}`,
          tone: tournament.status === "CHECK_IN" ? "success" : "warning",
          date: tournament.startsAt ?? registration.createdAt
        });
      }
    });

    if (items.length === 0) {
      items.push({
        id: "empty",
        label: "Sin alertas criticas",
        detail: "Tu panel competitivo esta estable por ahora.",
        status: "OK",
        href: "/dashboard/tournaments",
        tone: "neutral"
      });
    }

    return items.slice(0, 4);
  }, [activeTournamentEntries, tournaments, upcomingMatches]);

  const primaryRiot = riotAccounts[0] ?? null;
  const riot = riotState(primaryRiot, runtime);
  const displayName = user?.displayName || user?.username || "Competidor Darkside";
  const role = roleLabels[(user?.role as AppRole | undefined) ?? "USER"] ?? "Jugador";
  const activeTournaments = activeTournamentEntries.filter((item) => activeTournamentStatuses.has(item.tournament.status));
  const nextMatch = upcomingMatches[0];
  const nextMatchTournament = nextMatch ? tournaments.find((item) => item.id === nextMatch.tournamentId) : null;

  return (
    <div className="page-section max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
      <section className="motion-section relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#080d16] shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
        <Image src="/assets/darkside/official/hero-desktop.jpg" alt="Darkside arena" fill priority className="object-cover opacity-28" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(24,230,242,0.22),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.28),transparent_34%),linear-gradient(135deg,rgba(5,8,14,0.86),rgba(8,13,22,0.96))]" />
        <div className="relative grid gap-5 p-4 sm:p-6 xl:grid-cols-[1fr_360px] xl:p-7">
          <div className="flex min-w-0 flex-col justify-between gap-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] border border-[#18e6f2]/35 bg-black/45 text-3xl font-black text-white shadow-[0_0_46px_rgba(24,230,242,0.18)]">
                {avatarInitials(user, primaryTeam)}
              </div>
              <div className="min-w-0">
                <p className="page-kicker">Centro competitivo</p>
                <h1 className="mt-2 break-words text-[2.6rem] font-black leading-none tracking-[-0.06em] text-white sm:text-[4.2rem]">
                  {displayName}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                  Gestiona tu identidad competitiva, tus torneos activos, tokens internos, equipo y proximas partidas desde un solo panel.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/tournaments" className="btn-primary">
                Explorar torneos
              </Link>
              <Link href="/dashboard/account" className="btn-secondary">
                Perfil y Riot ID
              </Link>
              <Link href={nextMatch ? `/dashboard/matches/${nextMatch.id}` : "/dashboard/teams"} className="btn-secondary">
                {nextMatch ? "Abrir proximo match" : "Gestionar equipo"}
              </Link>
            </div>
          </div>

          <aside className="surface-panel min-w-0 border-white/12 bg-black/28 p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="page-kicker">Perfil del jugador</p>
                <h2 className="mt-2 text-2xl font-bold text-white">{primaryRiot ? `${primaryRiot.riotGameName}#${primaryRiot.riotTagLine}` : "Riot ID pendiente"}</h2>
              </div>
              <Image src={brand.logoMark} alt="" width={44} height={44} className="rounded-2xl" />
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/38">Estado Riot</p>
                <p className="mt-2 font-semibold text-white">{riot.label}</p>
                <p className="mt-2 text-xs leading-5 text-white/58">{riot.detail}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/38">Rol</p>
                  <p className="mt-2 font-semibold text-white">{role}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/38">Region</p>
                  <p className="mt-2 font-semibold text-white">{primaryRiot?.platformRoute ?? "LA1"}</p>
                </div>
              </div>
              <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${toneClass(riot.tone)}`}>
                {runtime.readyForOfficialRso ? "RSO listo" : "RSO pendiente de aprobacion"}
              </span>
            </div>
          </aside>
        </div>
      </section>

      <section className="motion-section stagger-1 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="surface-panel motion-card min-w-0 p-5">
          <p className="page-kicker">Puntos Darkside</p>
          <strong className="mt-3 block text-4xl font-black tracking-[-0.05em] text-white">{wallet.balance}</strong>
          <p className="mt-2 text-sm text-white/58">{wallet.currencyCode || "DS_TOKEN"} no retirables.</p>
        </article>
        <article className="surface-panel motion-card min-w-0 p-5">
          <p className="page-kicker">Torneos activos</p>
          <strong className="mt-3 block text-4xl font-black tracking-[-0.05em] text-white">{activeTournaments.length}</strong>
          <p className="mt-2 text-sm text-white/58">Participaciones vigentes.</p>
        </article>
        <article className="surface-panel motion-card min-w-0 p-5">
          <p className="page-kicker">Proximas partidas</p>
          <strong className="mt-3 block text-4xl font-black tracking-[-0.05em] text-white">{upcomingMatches.length}</strong>
          <p className="mt-2 text-sm text-white/58">Matches abiertos o en revision.</p>
        </article>
        <article className="surface-panel motion-card min-w-0 p-5">
          <p className="page-kicker">Ranking Riot</p>
          <strong className="mt-3 block text-2xl font-black tracking-[-0.05em] text-white">Pendiente</strong>
          <p className="mt-2 text-sm text-white/58">Preparado para League API.</p>
        </article>
      </section>

      <section className="motion-section stagger-2 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="surface-panel min-w-0 overflow-hidden p-0">
          <div className="relative min-h-[210px] p-5 sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(255,61,129,0.24),transparent_36%),linear-gradient(140deg,rgba(20,28,43,0.98),rgba(8,13,22,0.98))]" />
            <div className="relative z-10">
              <p className="page-kicker">Plantilla actual</p>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white text-xl font-black text-[#101725]">
                  {avatarInitials(user, primaryTeam)}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-bold text-white">{primaryTeam?.name ?? "Sin equipo principal"}</h2>
                  <p className="mt-1 text-sm text-white/58">{primaryTeam?.tag ? `TAG ${primaryTeam.tag}` : primaryTeam ? "Equipo activo" : "Crea o unite a un equipo para competir."}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/38">Miembros</p>
                  <p className="mt-2 text-xl font-semibold text-white">{primaryTeam?.members?.length ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/38">Estado</p>
                  <p className="mt-2 text-xl font-semibold text-white">{primaryTeam?.status ?? "Pendiente"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/38">Equipos</p>
                  <p className="mt-2 text-xl font-semibold text-white">{teamMemberships.length}</p>
                </div>
              </div>

              <Link href="/dashboard/teams" className="btn-secondary mt-6 inline-flex">
                Ver equipos
              </Link>
            </div>
          </div>
        </article>

        <article className="surface-panel min-w-0 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-kicker">Proximo match</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{nextMatchTournament?.name ?? "Sin match asignado"}</h2>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass(nextMatch ? (nextMatch.status === "DISPUTED" ? "danger" : "info") : "neutral")}`}>
              {nextMatch ? matchStatusLabel(nextMatch.status) : "Pendiente"}
            </span>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-5">
            <p className="text-sm text-white/50">Fecha estimada</p>
            <p className="mt-2 text-xl font-semibold text-white">{formatDate(nextMatch?.scheduledAt ?? nextMatch?.updatedAt)}</p>
            <p className="mt-4 text-sm leading-6 text-white/62">
              {nextMatch ? "Abre la sala de partida para revisar reglas, evidencias y estado del resultado." : "Cuando generes o entres a un bracket, tus partidas apareceran aqui."}
            </p>
            <Link href={nextMatch ? `/dashboard/matches/${nextMatch.id}` : "/dashboard/tournaments"} className="btn-primary mt-5 inline-flex">
              {nextMatch ? "Abrir sala" : "Buscar torneo"}
            </Link>
          </div>
        </article>
      </section>

      <section className="motion-section stagger-3 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="surface-panel min-w-0 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-kicker">Progreso en torneos</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Mis competencias</h2>
            </div>
            <Link href="/dashboard/tournaments" className="text-sm font-semibold text-[#18e6f2] hover:text-white">
              Ver todos
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {activeTournamentEntries.slice(0, 4).map(({ tournament, registration }) => (
              <Link key={tournament.id} href={`/dashboard/tournaments/${tournament.id}`} className="rounded-2xl border border-white/10 bg-white/6 p-4 transition hover:border-[#18e6f2]/35 hover:bg-white/9">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/38">{tournament.game}</p>
                    <h3 className="mt-1 truncate text-lg font-semibold text-white">{tournament.name}</h3>
                    <p className="mt-1 text-sm text-white/58">{registrationLabel(registration)} · {tournamentStatusLabel(tournament.status)}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold text-white/70">
                    {tournament.registrations?.length ?? 0}/{tournament.maxParticipants ?? "?"}
                  </span>
                </div>
              </Link>
            ))}
            {activeTournamentEntries.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/6 p-5 text-sm leading-6 text-white/62">
                Aun no tienes torneos activos. Explora competencias abiertas y conecta tu Riot ID para preparar tu elegibilidad.
              </div>
            ) : null}
          </div>
        </article>

        <article className="surface-panel min-w-0 p-5 sm:p-6">
          <p className="page-kicker">Notificaciones</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Pendientes competitivos</h2>
          <div className="mt-5 grid gap-3">
            {notifications.map((item) => (
              <Link key={item.id} href={item.href} className="rounded-2xl border border-white/10 bg-white/6 p-4 transition hover:border-white/20 hover:bg-white/9">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{item.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/58">{item.detail}</p>
                    {item.date ? <p className="mt-1 text-xs text-white/36">{formatDate(item.date)}</p> : null}
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${toneClass(item.tone)}`}>{item.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="motion-section stagger-4 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="surface-panel min-w-0 p-5 sm:p-6">
          <p className="page-kicker">Historial reciente</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Ultimos matches</h2>
          <div className="mt-5 grid gap-3">
            {recentMatches.length > 0 ? (
              recentMatches.map((match) => {
                const tournament = tournaments.find((item) => item.id === match.tournamentId);
                const won = match.winnerRegistrationId ? registrationIds.has(match.winnerRegistrationId) : false;
                return (
                  <Link key={match.id} href={`/dashboard/matches/${match.id}`} className="rounded-2xl border border-white/10 bg-white/6 p-4 transition hover:border-white/20 hover:bg-white/9">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{tournament?.name ?? "Match competitivo"}</p>
                        <p className="mt-1 text-sm text-white/54">{matchStatusLabel(match.status)} · {formatDate(match.updatedAt ?? match.createdAt)}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass(match.status === "COMPLETED" ? (won ? "success" : "neutral") : match.status === "DISPUTED" ? "danger" : "warning")}`}>
                        {match.status === "COMPLETED" ? (won ? "Victoria" : "Finalizado") : matchStatusLabel(match.status)}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/6 p-5 text-sm leading-6 text-white/62">Tu historial aparecera cuando completes tus primeras partidas.</div>
            )}
          </div>
        </article>

        <article className="surface-panel min-w-0 overflow-hidden p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-kicker">Riot Sign On</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Elegibilidad Riot</h2>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass(runtime.readyForOfficialRso ? "success" : "warning")}`}>
              {runtime.readyForOfficialRso ? "RSO listo" : "RSO pendiente"}
            </span>
          </div>
          <p className="mt-3 text-sm leading-7 text-white/62">
            Darkside puede validar que un Riot ID existe, pero la propiedad oficial se confirmara mediante Riot Sign On cuando Riot apruebe el acceso de produccion.
          </p>
          <div className="mt-5 rounded-[1.5rem] border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100/90">
            Para torneos serios, la inscripcion debera exigir cuenta Riot vinculada oficialmente. Para pruebas internas, se permite validacion tecnica.
          </div>
          <Link href="/dashboard/account" className="btn-secondary mt-5 inline-flex">
            Revisar Riot ID
          </Link>
        </article>
      </section>

      {loading ? <p className="text-center text-sm text-white/42">Sincronizando panel competitivo...</p> : null}
    </div>
  );
}
