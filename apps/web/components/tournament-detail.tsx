"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { mockMatch, mockTournaments } from "../lib/mock-data";
import { getStoredUser, type AppRole, type StoredUser } from "../lib/session";
import { BracketBoard } from "./bracket-board";

const tabs = ["Información", "Bracket", "Equipos", "Reglas", "Partidos"];

const gameAssets: Record<string, { bg: string; logo: string; label: string }> = {
  "LEAGUE OF LEGENDS": {
    bg: "/assets/darkside/official/game-lol-card.jpg",
    logo: "/assets/darkside/official/game-lol-logo.png",
    label: "League of Legends"
  },
  VALORANT: {
    bg: "/assets/darkside/official/game-valorant-card.jpg",
    logo: "/assets/darkside/official/game-valorant-logo.png",
    label: "VALORANT"
  }
};

function registrationLabel(registration: any) {
  if (!registration) {
    return "Próximo rival";
  }

  if (registration?.team) {
    return registration.team.tag
      ? `${registration.team.name} [${registration.team.tag}]`
      : registration.team.name;
  }

  return registration?.user?.displayName || registration?.user?.username || "Sin definir";
}

function formatMode(tournament: any) {
  const size = tournament.teamSize ? `${tournament.teamSize}v${tournament.teamSize}` : tournament.type === "TEAM" ? "5v5" : "1v1";
  return `${size} · ${String(tournament.format || "Single elimination").replaceAll("_", " ")}`;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicado",
    REGISTRATION_OPEN: "Inscripción abierta",
    REGISTRATION_CLOSED: "Inscripción cerrada",
    CHECK_IN: "Check-in",
    IN_PROGRESS: "En curso",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado"
  };

  return labels[status] ?? status;
}

function formatDate(value?: string | Date | null) {
  if (!value) {
    return "Por definir";
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function canOperate(role?: AppRole) {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "ORGANIZER" || role === "MODERATOR";
}

function flattenMatches(tournament: any) {
  const bracketMatches = tournament.bracket?.rounds?.flatMap((round: any) =>
    (round.matches ?? []).map((match: any) => ({
      ...match,
      round
    }))
  );

  if (bracketMatches?.length) {
    return bracketMatches;
  }

  if (tournament.matches?.length) {
    return tournament.matches;
  }

  return [{ ...mockMatch, tournament }];
}

export function TournamentDetail({ tournamentId }: { tournamentId: string }) {
  const [tournament, setTournament] = useState<any | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [message, setMessage] = useState("");
  const [checkInMessage, setCheckInMessage] = useState("");
  const [activeTab, setActiveTab] = useState("Bracket");
  const [localRegistered, setLocalRegistered] = useState(false);
  const [ownedTeams, setOwnedTeams] = useState<any[]>([]);

  const isMockTournament = tournamentId.startsWith("mock-") || tournament?.id?.startsWith("mock-");
  const game = gameAssets[String(tournament?.game || "").toUpperCase()] ?? gameAssets.VALORANT;
  const matches = useMemo(() => (tournament ? flattenMatches(tournament) : []), [tournament]);
  const featuredMatches = matches.slice(0, 2);
  const registrationOpen = tournament?.status === "REGISTRATION_OPEN" || isMockTournament;
  const registeredCount = (tournament?.registrations?.length ?? 0) + (localRegistered ? 1 : 0);
  const maxParticipants = tournament?.maxParticipants ?? 8;

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
      setMessage("");
    } catch {
      setTournament(mockTournaments.find((item) => item.id === tournamentId) ?? mockTournaments[0]);
      setMessage("");
    }
  }

  async function loadTeams(currentUser: StoredUser | null) {
    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/teams`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (!response.ok || !Array.isArray(data)) {
        return;
      }

      setOwnedTeams(
        data.filter((team) =>
          team.ownerId === currentUser.id ||
          team.members?.some((member: any) => member.userId === currentUser.id && ["OWNER", "CAPTAIN"].includes(member.role))
        )
      );
    } catch {
      setOwnedTeams([]);
    }
  }

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    void load();
    void loadTeams(storedUser);
  }, [tournamentId]);

  async function register() {
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    if (!registrationOpen) {
      setMessage("Las inscripciones no estan abiertas para este torneo.");
      return;
    }

    if (isMockTournament) {
      setLocalRegistered(true);
      setMessage("Inscripción simulada para demo. El flujo real se activara con un torneo publicado en API.");
      return;
    }

    try {
      const team = tournament.type === "TEAM" ? ownedTeams[0] : null;
      if (tournament.type === "TEAM" && !team) {
        setMessage("Necesitas crear o unirte a un equipo antes de inscribirte a este torneo.");
        return;
      }

      const response = await fetch(`${apiUrl}/tournaments/${tournament.id}/${team ? "register-team" : "register-player"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(team ? { teamId: team.id } : { userId: user.id })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo completar la inscripción.");
      }

      setMessage("Inscripción enviada. El organizador debe aprobarla si el torneo requiere revisión.");
      await load();
    } catch (error) {
      setLocalRegistered(true);
      setMessage(error instanceof Error ? `${error.message} Se muestra inscripción simulada para demo.` : "Inscripción simulada para demo.");
    }
  }

  async function checkIn(registrationId: string) {
    if (isMockTournament) {
      setCheckInMessage("Check-in simulado correctamente.");
      return;
    }

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
      <div className="page-section">
        <div className="surface-panel motion-section p-6 text-sm text-white/62">
          Cargando detalle del torneo...
        </div>
      </div>
    );
  }

  function renderMainTab() {
    if (activeTab === "Equipos") {
      return (
        <div className="grid gap-3 md:grid-cols-2">
          {tournament.registrations?.map((registration: any) => (
            <article key={registration.id} className="rounded-[16px] border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="min-w-0 truncate text-white">{registrationLabel(registration)}</strong>
                <span className="text-xs uppercase tracking-[0.12em] text-[#18e6f2]">{registration.status}</span>
              </div>
              {registration.status !== "CHECKED_IN" ? (
                <button onClick={() => checkIn(registration.id)} className="btn-secondary mt-4 !rounded-xl !px-4 !py-2 !text-xs">
                  Hacer check-in
                </button>
              ) : null}
            </article>
          ))}
          {localRegistered ? (
            <article className="rounded-[16px] border border-[#18e6f2]/30 bg-[#18e6f2]/10 p-4">
              <strong className="text-white">{user?.displayName || user?.username || "Tu cuenta"}</strong>
              <p className="mt-2 text-sm text-white/62">Inscripción simulada para demo.</p>
            </article>
          ) : null}
        </div>
      );
    }

    if (activeTab === "Reglas") {
      return (
        <div className="rounded-[16px] border border-white/10 bg-white/[0.035] p-5 text-sm leading-8 text-white/72">
          {tournament.publicRules || tournament.rules || "Reglas por publicar. El organizador debe mantener reglas claras, reportes auditables y evidencia obligatoria."}
        </div>
      );
    }

    if (activeTab === "Partidos") {
      return <FeaturedMatches matches={matches} />;
    }

    if (activeTab === "Información") {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile label="Juego" value={game.label} />
          <InfoTile label="Formato" value={formatMode(tournament)} />
          <InfoTile label="Estado" value={statusLabel(tournament.status)} />
          <InfoTile label="Cupos" value={`${registeredCount}/${maxParticipants}`} />
        </div>
      );
    }

    return <BracketBoard rounds={tournament.bracket?.rounds ?? []} />;
  }

  return (
    <div className="min-w-0 overflow-x-hidden pb-10">
      <section className="relative overflow-hidden border-b border-white/8">
        <Image src="/assets/darkside/official/hero-desktop.jpg" alt="" fill priority className="object-cover object-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,12,0.98)_0%,rgba(5,8,12,0.78)_38%,rgba(5,8,12,0.2)_72%,rgba(5,8,12,0.88)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_34%,rgba(255,36,56,0.2),transparent_26%),radial-gradient(circle_at_76%_58%,rgba(24,230,242,0.16),transparent_22%)]" />

        <div className="relative z-10 mx-auto max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-7 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            <Link href="/dashboard/tournaments" className="transition hover:text-white">Torneos</Link>
            <span>/</span>
            <span className="text-white/70">{tournament.name}</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-[#ff2438]/35 bg-[#ff2438]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5868]">
                {isMockTournament ? "Modo demo" : statusLabel(tournament.status)}
              </span>
              <h1 className="mt-5 max-w-4xl break-words font-heading text-[2.65rem] font-semibold leading-none text-white sm:text-6xl lg:text-7xl">
                {tournament.name}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/72">
                <span className="inline-flex items-center gap-2 font-semibold text-[#18e6f2]">
                  <Image src={game.logo} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                  {game.label}
                </span>
                <span>{formatMode(tournament)}</span>
                <span>{statusLabel(tournament.status)}</span>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                {tournament.description || tournament.rules || "Compite en un entorno organizado con brackets, check-in, reportes auditables y resultados preparados para Riot mock."}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <HeroMetric label="Recompensa" value="Tokens internos" />
                <HeroMetric label="Inicio" value={formatDate(tournament.startsAt)} />
                <HeroMetric label="Formato" value={String(tournament.format || "SINGLE_ELIMINATION").replaceAll("_", " ")} />
                <HeroMetric label="Equipos" value={`${registeredCount}/${maxParticipants}`} />
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button onClick={register} className="btn-primary motion-press w-full sm:w-auto">
                  {user ? "Inscribirme ahora" : "Iniciar sesión para inscribirme"}
                </button>
                <Link href="#bracket" className="btn-secondary motion-press w-full sm:w-auto">
                  Ver bracket
                </Link>
              </div>
              {(message || checkInMessage) ? (
                <p className="mt-4 max-w-2xl rounded-[14px] border border-[#18e6f2]/25 bg-[#18e6f2]/10 px-4 py-3 text-sm text-[#bffaff]">
                  {message || checkInMessage}
                </p>
              ) : null}
            </div>

            <div className="rounded-[18px] border border-white/10 bg-black/30 p-5 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#18e6f2]">Comienza en</p>
              <div className="mt-4 grid grid-cols-4 gap-3 text-center">
                {[
                  ["02", "días"],
                  ["14", "horas"],
                  ["37", "min"],
                  ["52", "seg"]
                ].map(([value, label]) => (
                  <div key={label}>
                    <strong className="block text-2xl text-[#18e6f2]">{value}</strong>
                    <span className="text-[10px] uppercase text-white/40">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-2 overflow-x-auto border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-4 py-4 text-sm font-semibold transition ${
                  activeTab === tab ? "border-b-2 border-[#ff2438] text-white" : "text-white/50 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1360px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:px-8" id="bracket">
        <div className="min-w-0 space-y-5">
          <div className="surface-panel motion-section min-w-0 p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="page-kicker">{activeTab}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                  {activeTab === "Bracket" ? "Playoffs" : activeTab}
                </h2>
              </div>
              {activeTab === "Bracket" ? (
                <span className="status-badge status-open">Single elimination</span>
              ) : null}
            </div>
            {renderMainTab()}
          </div>

          <FeaturedMatches matches={featuredMatches} />
        </div>

        <aside className="space-y-5">
          <InfoPanel tournament={tournament} game={game.label} registeredCount={registeredCount} maxParticipants={maxParticipants} />
          <RewardPanel />
          <OrganizerPanel />
        </aside>
      </section>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-white/40">{label}</p>
      <strong className="mt-2 block break-words text-sm text-white sm:text-base">{value}</strong>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[#8eb8ff]">{label}</p>
      <strong className="mt-2 block break-words text-white">{value}</strong>
    </div>
  );
}

function FeaturedMatches({ matches }: { matches: any[] }) {
  const rows = matches.length ? matches : [{ ...mockMatch }];

  return (
    <section className="surface-panel motion-section p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="page-kicker">Partidos destacados</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Resultados y salas</h2>
        </div>
        <Link href="/dashboard/matches/mock-match-1" className="hidden text-sm font-semibold text-[#18e6f2] sm:inline-flex">
          Ver sala demo
        </Link>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {rows.slice(0, 4).map((match: any, index: number) => (
          <Link
            key={match.id ?? `match-${index}`}
            href={`/dashboard/matches/${match.id ?? "mock-match-1"}`}
            className="motion-card relative overflow-hidden rounded-[18px] border border-white/10 bg-[linear-gradient(120deg,rgba(17,24,36,0.96),rgba(7,11,17,0.94))] p-4"
          >
            <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-white/45">
              <span>{match.round?.name ?? "Partida"}</span>
              <span>{match.status ?? "READY"}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <TeamScore registration={match.homeRegistration} score={matchScore(match, match.homeRegistration)} />
              <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-sm text-white/62">vs</span>
              <TeamScore registration={match.awayRegistration} score={matchScore(match, match.awayRegistration)} alignRight />
            </div>
            <p className="mt-4 text-sm font-semibold text-[#18e6f2]">Abrir sala</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function matchScore(match: any, registration: any) {
  if (!match.winnerRegistration?.id || !registration?.id) {
    return "-";
  }

  return match.winnerRegistration.id === registration.id ? "1" : "0";
}

function TeamScore({ registration, score, alignRight = false }: { registration: any; score: string; alignRight?: boolean }) {
  return (
    <div className={alignRight ? "text-right" : ""}>
      <strong className="block truncate text-white">{registrationLabel(registration)}</strong>
      <span className="mt-2 block text-3xl font-semibold text-white">{score}</span>
    </div>
  );
}

function InfoPanel({ tournament, game, registeredCount, maxParticipants }: { tournament: any; game: string; registeredCount: number; maxParticipants: number }) {
  return (
    <div className="surface-panel p-5">
      <p className="page-kicker">Información del torneo</p>
      <dl className="mt-5 space-y-3 text-sm">
        {[
          ["Organizador", tournament.organizer?.displayName || tournament.organizer?.username || "Darkside Ops"],
          ["Juego", game],
          ["Región", tournament.regionalRoute || "AMERICAS"],
          ["Formato", String(tournament.format || "SINGLE_ELIMINATION").replaceAll("_", " ")],
          ["Equipos", `${registeredCount}/${maxParticipants}`],
          ["Estado", statusLabel(tournament.status)]
        ].map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <dt className="text-white/45">{label}</dt>
            <dd className="text-right font-semibold text-white/80">{value}</dd>
          </div>
        ))}
      </dl>
      <button className="mt-5 w-full rounded-[12px] border border-[#ff2438]/55 px-4 py-3 text-sm font-semibold text-[#ff5868]">
        Ver reglas completas
      </button>
    </div>
  );
}

function RewardPanel() {
  return (
    <div className="surface-panel p-5">
      <p className="page-kicker">Recompensas internas</p>
      <h3 className="mt-3 text-2xl font-semibold text-[#40ff91]">Tokens, XP y badges</h3>
      <p className="mt-3 text-sm leading-7 text-white/62">
        Beneficios no monetarios para progresión visual y experiencias futuras. No son retirables ni convertibles a dinero.
      </p>
      <div className="mt-5 space-y-3 text-sm text-white/72">
        <p>Trofeo digital · Campeón</p>
        <p>Badge de finalista</p>
        <p>XP competitivo por participación</p>
      </div>
    </div>
  );
}

function OrganizerPanel() {
  return (
    <div className="surface-panel p-5">
      <p className="page-kicker">Organizado por</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-[14px] border border-[#ff2438]/35 bg-black/35">
          <Image src="/assets/darkside/logos/darkside-logo-mark.svg" alt="" width={34} height={34} />
        </div>
        <div>
          <strong className="text-white">Darkside.cool</strong>
          <p className="mt-1 text-sm text-white/55">Plataforma competitiva universitaria.</p>
        </div>
      </div>
    </div>
  );
}
