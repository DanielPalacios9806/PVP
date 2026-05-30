"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/config";
import { brand } from "@/lib/brand";
import { championIconUrl, profileIconUrl, rankIconUrl, winRate } from "@/lib/ddragon";
import { PerformanceRadarCard } from "./performance-radar-card";
import { RiotMatchHistory, type RiotMatchSummary } from "./riot-match-history";
import { RiotRankCard, type RiotRankQueue } from "./riot-rank-card";
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

interface RiotCompetitiveSummary {
  ok?: boolean;
  mode?: string;
  message?: string;
  account?: {
    gameName?: string | null;
    tagLine?: string | null;
    platformRoute?: string | null;
    regionalRoute?: string | null;
    verified?: boolean;
    verificationStatus?: string | null;
    ownershipVerified?: boolean;
  } | null;
  summoner?: {
    status?: string;
    profileIconId?: number | null;
    summonerLevel?: number | null;
    revisionDate?: number | null;
  };
  ranked?: {
    status?: string;
    queues?: RiotRankQueue[];
  };
  recentMatches?: {
    status?: string;
    matches?: RiotMatchSummary[];
  };
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

function riotState(account?: RiotAccount | null, runtime?: RuntimeStatus, summary?: RiotCompetitiveSummary | null) {
  const verified = account?.verified || summary?.account?.verified;
  const status = account?.verificationStatus ?? summary?.account?.verificationStatus;

  if (verified && status === "RSO_VERIFIED") {
    return {
      label: "Vinculado por Riot Sign On",
      detail: "Propiedad confirmada oficialmente por Riot.",
      tone: "success" as const
    };
  }

  if (account || summary?.account) {
    return {
      label: "Validado tecnicamente",
      detail: "Riot ID existe. La propiedad oficial queda pendiente de Riot Sign On.",
      tone: "warning" as const
    };
  }

  if (runtime?.readyForAccountLookup) {
    return {
      label: "Listo para validar",
      detail: "Puedes validar Riot ID para activar datos visuales de League API.",
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

function pickSoloQueue(queues: RiotRankQueue[]) {
  return queues.find((queue) => queue.queueType === "RANKED_SOLO_5x5") ?? queues[0] ?? null;
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function durationLabel(seconds?: number | null) {
  if (!seconds) return "--";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("es-EC", { maximumFractionDigits: 0 }).format(value);
}

function queueDisplay(queue?: RiotRankQueue | null) {
  if (!queue) return "Unranked";
  return `${queue.tier} ${queue.rank}`;
}

export function CompetitiveDashboard() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [wallet, setWallet] = useState<StoredWallet>(getStoredWallet());
  const [riotAccounts, setRiotAccounts] = useState<RiotAccount[]>([]);
  const [runtime, setRuntime] = useState<RuntimeStatus>({ mode: "mock" });
  const [riotSummary, setRiotSummary] = useState<RiotCompetitiveSummary | null>(null);
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
      const [profile, riot, status, riotProfile, teamList, tournamentList, matchList] = await Promise.all([
        fetchJson<{ wallets?: Array<{ balance?: string | number; currencyCode?: string }> }>("/users/me", {}),
        fetchJson<RiotAccount[]>("/riot/accounts/me", []),
        fetchJson<RuntimeStatus>("/riot/status", { mode: "mock" }),
        fetchJson<RiotCompetitiveSummary | null>("/riot/profile/summary", null),
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

      setRiotAccounts(Array.isArray(riot) ? riot : []);
      setRuntime(status);
      setRiotSummary(riotProfile?.ok === false ? riotProfile : riotProfile);
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

  const recentInternalMatches = useMemo(
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
  const riot = riotState(primaryRiot, runtime, riotSummary);
  const riotQueues = riotSummary?.ranked?.queues ?? [];
  const riotMatches = riotSummary?.recentMatches?.matches ?? [];
  const profileIconId = riotSummary?.summoner?.profileIconId ?? null;
  const summonerLevel = riotSummary?.summoner?.summonerLevel ?? null;
  const soloQueue = pickSoloQueue(riotQueues);
  const flexQueue = riotQueues.find((queue) => queue.queueType === "RANKED_FLEX_SR") ?? null;
  const displayName = user?.displayName || user?.username || "Competidor Darkside";
  const role = roleLabels[(user?.role as AppRole | undefined) ?? "USER"] ?? "Jugador";
  const activeTournaments = activeTournamentEntries.filter((item) => activeTournamentStatuses.has(item.tournament.status));
  const nextMatch = upcomingMatches[0];
  const nextMatchTournament = nextMatch ? tournaments.find((item) => item.id === nextMatch.tournamentId) : null;
  const riotGameName = riotSummary?.account?.gameName ?? primaryRiot?.riotGameName ?? null;
  const riotTagLine = riotSummary?.account?.tagLine ?? primaryRiot?.riotTagLine ?? null;
  const riotId = riotGameName && riotTagLine ? `${riotGameName}#${riotTagLine}` : "Riot ID pendiente";
  const riotWinRate = riotMatches.length ? Math.round((riotMatches.filter((match) => match.result === "win").length / riotMatches.length) * 100) : soloQueue ? winRate(soloQueue.wins, soloQueue.losses) : 0;
  const averageKda = average(riotMatches.map((match) => Number(match.kda ?? 0)));
  const averageKills = average(riotMatches.map((match) => Number(match.kills ?? 0)));
  const mainChampion = riotMatches[0]?.championName ?? null;
  const losses = riotMatches.filter((match) => match.result === "loss").length;

  return (
    <div className="relative max-w-full overflow-hidden px-3 py-4 sm:px-5 xl:px-6">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute left-[10%] top-0 h-72 w-72 rounded-full bg-[#18e6f2]/10 blur-[110px]" />
        <div className="absolute right-[12%] top-20 h-80 w-80 rounded-full bg-[#ff2941]/12 blur-[120px]" />
      </div>

      <div className="relative mx-auto grid max-w-[1500px] gap-5 2xl:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#0a111c]/88 shadow-[0_22px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl 2xl:block">
          <div className="border-b border-white/8 p-5">
            <p className="text-[0.66rem] font-black uppercase tracking-[0.22em] text-white/64">Mi equipo</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-[#ff2941]/45 bg-black/40 p-2 shadow-[0_0_22px_rgba(255,41,65,0.18)]">
                <Image src={primaryTeam?.logoUrl || "/images/teams/default-team.svg"} alt="Team" fill sizes="56px" className="object-contain p-2" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-black text-white">{primaryTeam?.name ?? "Sin equipo"}</h3>
                <p className="truncate text-xs text-white/46">ID: {primaryTeam?.tag ?? "DARK"}</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-white/54">
                <span>Nivel {summonerLevel ?? 1}</span>
                <span>{riotWinRate || 0}% WR</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-[#ff2941] to-[#18e6f2]" style={{ width: `${Math.max(12, Math.min(riotWinRate || 45, 100))}%` }} />
              </div>
            </div>
          </div>

          <nav className="grid gap-1 p-3 text-sm font-semibold text-white/62">
            {[
              ["Dashboard", "/dashboard"],
              ["Mi Perfil", "/dashboard/account"],
              ["Mi Equipo", "/dashboard/teams"],
              ["Partidos", nextMatch ? `/dashboard/matches/${nextMatch.id}` : "/dashboard/tournaments"],
              ["Torneos", "/dashboard/tournaments"],
              ["Rankings", "/dashboard/tournaments?game=lol"],
              ["Estadisticas", "/dashboard"],
              ["Configuracion", "/dashboard/account"]
            ].map(([label, href], index) => (
              <Link key={label} href={href} className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition ${index === 0 ? "bg-[#ff2941]/10 text-white" : "hover:bg-white/7 hover:text-white"}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-[#ff2941] shadow-[0_0_16px_rgba(255,41,65,0.8)]" : "bg-white/20 group-hover:bg-[#18e6f2]"}`} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="m-4 rounded-[1.25rem] border border-[#ff2941]/20 bg-[radial-gradient(circle_at_top_right,rgba(255,41,65,0.2),transparent_45%),rgba(255,255,255,0.04)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/54">Riot status</p>
            <h4 className="mt-2 font-black text-white">{riot.label}</h4>
            <p className="mt-2 text-xs leading-5 text-white/52">{riot.detail}</p>
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
            <div className="rounded-[1.6rem] border border-white/10 bg-[#0a101a]/82 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.36)] sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white/52">Bienvenido de vuelta</p>
                  <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-white sm:text-4xl">
                    {riotGameName ?? displayName} <span className="text-[#18e6f2]">{riotGameName ? `#${riotTagLine}` : ""}</span>
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">
                    Preparate para competir. Tu perfil Riot, torneos, tokens, equipo y partidas se sincronizan desde un solo centro competitivo.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
                  <Link href="/dashboard/teams" className="rounded-2xl border border-[#18e6f2]/35 bg-[#18e6f2]/7 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#18e6f2]/12">Crear equipo</Link>
                  <Link href="/dashboard/tournaments" className="rounded-2xl border border-[#18e6f2]/25 bg-white/5 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-white/8">Buscar torneo</Link>
                  <Link href={nextMatch ? `/dashboard/matches/${nextMatch.id}` : "/dashboard/tournaments"} className="rounded-2xl border border-[#ff2941]/35 bg-[#ff2941]/8 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-[#ff2941]/12">Ver scrims</Link>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-[#0a101a]/82 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.36)] sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#6fb8ff]">Acciones rapidas</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-xs text-white/44">Riot</p>
                  <strong className="mt-1 block text-white">{riot.label}</strong>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-xs text-white/44">RSO</p>
                  <strong className="mt-1 block text-white">{runtime.readyForOfficialRso ? "Listo" : "Pendiente"}</strong>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-xs text-white/44">Modo</p>
                  <strong className="mt-1 block text-white">{runtime.mode ?? "mock"}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <article className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0d1421] shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(255,41,65,0.24),transparent_32%),radial-gradient(circle_at_86%_18%,rgba(24,230,242,0.16),transparent_34%)]" />
              <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[118px_1fr]">
                <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-[#ff2941]/70 bg-black shadow-[0_0_44px_rgba(255,41,65,0.34)]">
                  {profileIconId ? <Image src={profileIconUrl(profileIconId)} alt="Riot profile icon" fill sizes="112px" className="object-cover" /> : <Image src={brand.logoMark} alt="Darkside" fill sizes="112px" className="object-contain p-7" />}
                  <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-[#0d1421] bg-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-3xl font-black tracking-[-0.05em] text-white">{riotGameName ?? displayName}</h2>
                    <span className="rounded-full border border-[#ff2941]/30 bg-[#ff2941]/12 px-2.5 py-1 text-xs font-black text-[#ffb8c0]">PRO</span>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${toneClass(riot.tone)}`}>{riot.label}</span>
                  </div>
                  <p className="mt-2 text-sm text-white/58">{riotId} · {role} · Region {riotSummary?.account?.platformRoute ?? primaryRiot?.platformRoute ?? "LA1"}</p>

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="border-l border-white/10 pl-4">
                      <p className="text-xs text-white/42">Nivel</p>
                      <strong className="mt-1 block text-2xl text-white">{summonerLevel ?? "--"}</strong>
                    </div>
                    <div className="border-l border-white/10 pl-4">
                      <p className="text-xs text-white/42">Victorias</p>
                      <strong className="mt-1 block text-2xl text-white">{soloQueue?.wins ?? riotMatches.filter((match) => match.result === "win").length}</strong>
                    </div>
                    <div className="border-l border-white/10 pl-4">
                      <p className="text-xs text-white/42">Winrate</p>
                      <strong className="mt-1 block text-2xl text-white">{riotWinRate}%</strong>
                    </div>
                    <div className="border-l border-white/10 pl-4">
                      <p className="text-xs text-white/42">K/D Prom.</p>
                      <strong className="mt-1 block text-2xl text-white">{averageKda.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <RiotRankCard queues={riotQueues} loading={loading} />
              <article className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0d1421] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(255,41,65,0.26),transparent_34%)]" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/48">Puntos Darkside</p>
                      <strong className="mt-4 block text-4xl font-black tracking-[-0.06em] text-[#ff2941]">{compactNumber(wallet.balance)} DS</strong>
                      <p className="mt-2 text-sm font-semibold text-[#ff9aa6]">Tokens internos no retirables</p>
                    </div>
                    <Link href="/dashboard/tokens" className="text-sm font-bold text-[#18e6f2] hover:text-white">Historial</Link>
                  </div>
                  <div className="mt-6 flex h-16 items-end gap-1.5">
                    {[18, 24, 22, 34, 31, 48, 45, 58, 52, 67, 62, 75].map((height, index) => (
                      <span key={index} className="flex-1 rounded-t bg-gradient-to-t from-[#ff2941]/50 to-[#ff2941]" style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr_0.95fr]">
            <article className="rounded-[1.6rem] border border-white/10 bg-[#0d1421] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-white/48">Plantilla actual</p>
                  <h2 className="mt-2 text-2xl font-black text-white">{primaryTeam?.name ?? "Sin equipo principal"}</h2>
                </div>
                <span className="text-sm font-bold text-[#18e6f2]">{primaryTeam?.members?.length ?? 0}/5</span>
              </div>
              <div className="mt-5 space-y-3">
                {Array.from({ length: 5 }).map((_, index) => {
                  const member = primaryTeam?.members?.[index];
                  const names = [riotGameName ?? "Jugador", "ShadowX", "NeonGod", "Icey", "Zox"];
                  const roles = ["Lider", "Controlador", "Iniciador", "Centinela", "Flex"];
                  return (
                    <div key={index} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 p-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-black/40">
                        {index === 0 && profileIconId ? <Image src={profileIconUrl(profileIconId)} alt="Player" fill sizes="40px" className="object-cover" /> : <Image src={index === 0 ? brand.logoMark : "/images/teams/default-team.svg"} alt="Player" fill sizes="40px" className="object-contain p-2" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-white">{member ? names[index] : index === 0 && riotGameName ? riotGameName : names[index]}</p>
                        <p className="text-xs text-white/45">{member || index === 0 ? roles[index] : "Disponible"}</p>
                      </div>
                      <span className={`h-2 w-2 rounded-full ${member || index === 0 ? "bg-emerald-400" : "bg-white/20"}`} />
                    </div>
                  );
                })}
              </div>
              <Link href="/dashboard/teams" className="mt-4 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/70 hover:bg-white/8">Ver y gestionar equipo →</Link>
            </article>

            <RiotMatchHistory matches={riotMatches} loading={loading} />

            <article className="rounded-[1.6rem] border border-white/10 bg-[#0d1421] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-white/48">Proximos partidos</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Agenda competitiva</h2>
                </div>
                <Link href="/dashboard/tournaments" className="text-sm font-bold text-[#18e6f2] hover:text-white">Ver calendario</Link>
              </div>
              <div className="mt-5 space-y-3">
                {upcomingMatches.length ? upcomingMatches.map((match, index) => {
                  const tournament = tournaments.find((item) => item.id === match.tournamentId);
                  return (
                    <Link key={match.id} href={`/dashboard/matches/${match.id}`} className={`block rounded-2xl border p-4 transition hover:bg-white/8 ${index === 0 ? "border-[#ff2941]/55 bg-[#ff2941]/8" : "border-white/10 bg-white/5"}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-white/42">{formatDate(match.scheduledAt ?? match.updatedAt)}</p>
                          <h3 className="mt-1 font-black text-white">{tournament?.name ?? "Match competitivo"}</h3>
                          <p className="mt-1 text-sm text-white/48">{matchStatusLabel(match.status)}</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-black/28 px-3 py-1 text-xs font-bold text-white/70">#{index + 1}</span>
                      </div>
                    </Link>
                  );
                }) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/58">Cuando generes o entres a un bracket, tus partidas apareceran aqui.</div>
                )}
              </div>
            </article>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.9fr_1fr_0.9fr]">
            <PerformanceRadarCard matches={riotMatches} queues={riotQueues} />

            <article className="rounded-[1.6rem] border border-white/10 bg-[#0d1421] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-white/48">Progreso en torneos</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Mis competencias</h2>
                </div>
                <Link href="/dashboard/tournaments" className="text-sm font-bold text-[#18e6f2] hover:text-white">Ver todos</Link>
              </div>
              <div className="mt-5 space-y-3">
                {activeTournamentEntries.slice(0, 3).map(({ tournament, registration }) => (
                  <Link key={tournament.id} href={`/dashboard/tournaments/${tournament.id}`} className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/8">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="truncate font-black text-white">{tournament.name}</h3>
                        <p className="mt-1 text-sm text-white/48">{registrationLabel(registration)} · {tournamentStatusLabel(tournament.status)}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100">{tournament.registrations?.length ?? 0}/{tournament.maxParticipants ?? "?"}</span>
                    </div>
                  </Link>
                ))}
                {activeTournamentEntries.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/58">Explora torneos abiertos y prepara tu Riot ID para participar.</div> : null}
              </div>
            </article>

            <article className="rounded-[1.6rem] border border-white/10 bg-[#0d1421] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-white/48">Notificaciones</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Tu actividad</h2>
                </div>
                <Link href="/dashboard/account" className="text-sm font-bold text-[#18e6f2] hover:text-white">Ver todas</Link>
              </div>
              <div className="mt-5 space-y-3">
                {notifications.map((item) => (
                  <Link key={item.id} href={item.href} className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/8">
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.tone === "danger" ? "bg-[#ff2941]" : item.tone === "warning" ? "bg-amber-300" : item.tone === "success" ? "bg-emerald-300" : "bg-[#18e6f2]"}`} />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-black text-white">{item.label}</h3>
                        <p className="mt-1 text-sm leading-5 text-white/48">{item.detail}</p>
                      </div>
                      <span className="text-xs text-white/36">{item.date ? formatDate(item.date).split(",")[0] : "Ahora"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-[1.6rem] border border-amber-400/18 bg-amber-400/8 p-5 text-sm leading-6 text-amber-100/90">
            <strong>Riot Sign On pendiente:</strong> los datos visuales usan validacion tecnica y League API. La propiedad oficial de la cuenta se confirmara cuando Riot apruebe Production Key + RSO/OAuth. El smoke test de RSO debe seguir en la planificacion antes de Tournament Codes reales.
          </section>

          {loading ? <p className="text-center text-sm text-white/42">Sincronizando panel competitivo...</p> : null}
        </main>
      </div>
    </div>
  );
}
