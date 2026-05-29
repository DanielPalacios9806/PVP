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

function normalizeGameKey(value?: string | null) {
  const normalized = String(value || "")
    .toUpperCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim();

  if (normalized.includes("LEAGUE") || normalized === "LOL") {
    return "LEAGUE OF LEGENDS";
  }

  if (normalized.includes("VALORANT")) {
    return "VALORANT";
  }

  return "VALORANT";
}

function tournamentHeroImage(tournament: any, game: { bg: string }) {
  if (tournament?.slug) {
    return `/images/tournaments/${tournament.slug}.webp`;
  }

  return game.bg;
}

function getCountdownParts(value?: string | Date | null) {
  if (!value) {
    return [
      ["--", "dias"],
      ["--", "horas"],
      ["--", "min"],
      ["--", "seg"]
    ];
  }

  const diff = Math.max(new Date(value).getTime() - Date.now(), 0);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);

  return [
    [String(days).padStart(2, "0"), "dias"],
    [String(hours).padStart(2, "0"), "horas"],
    [String(minutes).padStart(2, "0"), "min"],
    [String(seconds).padStart(2, "0"), "seg"]
  ];
}

function isUserRegistration(registration: any, user: StoredUser | null, ownedTeams: any[]) {
  if (!registration || !user) {
    return false;
  }

  if (registration.user?.id === user.id || registration.userId === user.id) {
    return true;
  }

  if (registration.team?.id) {
    return ownedTeams.some((team) => team.id === registration.team.id);
  }

  return false;
}

function isActiveParticipantStatus(status?: string) {
  return status === "PENDING" || status === "CONFIRMED" || status === "CHECKED_IN";
}

function registrationStatusLabel(status?: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendiente de aprobación",
    CONFIRMED: "Confirmado",
    CHECKED_IN: "Check-in realizado",
    REJECTED: "Rechazado",
    CANCELLED: "Cancelado"
  };

  return labels[status ?? ""] ?? status ?? "Sin estado";
}

function translateTournamentError(message?: string) {
  const fallback = "No se pudo completar la acción. Revisa los requisitos del torneo.";

  if (!message) {
    return fallback;
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("same time") || normalized.includes("active tournament")) {
    return "No puedes inscribirte porque tú o alguien de tu equipo ya participa en otro torneo que se juega en el mismo horario.";
  }

  if (normalized.includes("capacity") || normalized.includes("cupos")) {
    return "Los cupos de este torneo ya están completos.";
  }

  if (normalized.includes("deadline")) {
    return "La fecha límite de inscripción ya terminó.";
  }

  if (normalized.includes("not open") || normalized.includes("registration is not open")) {
    return "Las inscripciones no están abiertas para este torneo.";
  }

  if (normalized.includes("roster") || normalized.includes("team does not meet")) {
    return "Tu equipo todavía no cumple el número de integrantes requerido para este torneo.";
  }

  if (normalized.includes("already registered")) {
    return "Ya existe una inscripción activa para este participante en este torneo.";
  }

  return message;
}

function teamRosterCount(team: any) {
  if (Array.isArray(team?.members)) {
    return team.members.length;
  }

  return team?.memberCount ?? 0;
}

function teamLabel(team: any) {
  if (!team) {
    return "Selecciona equipo";
  }

  return team.tag ? `${team.name} [${team.tag}]` : team.name;
}

function primaryActionLabel(params: {
  user: StoredUser | null;
  tournament: any;
  hasRegistration: boolean;
  myRegistration?: any;
  registrationOpen: boolean;
  capacityFull: boolean;
  needsTeam: boolean;
}) {
  if (!params.user) {
    return "Iniciar sesion para inscribirme";
  }

  if (params.hasRegistration) {
    if (params.tournament.status === "CHECK_IN" && params.myRegistration?.status === "CONFIRMED") {
      return "Hacer check-in";
    }

    return "Ver mi inscripcion";
  }

  if (params.capacityFull) {
    return "Cupos completos";
  }

  if (!params.registrationOpen) {
    return "Registro cerrado";
  }

  if (params.needsTeam) {
    return "Crear o unirme a un equipo";
  }

  return "Inscribirse ahora";
}

function primaryActionDisabled(params: {
  user: StoredUser | null;
  hasRegistration: boolean;
  registrationOpen: boolean;
  capacityFull: boolean;
  needsTeam: boolean;
  selectedTeamMissingRoster: boolean;
  isSubmitting: boolean;
}) {
  if (params.isSubmitting) {
    return true;
  }

  if (!params.user || params.hasRegistration) {
    return false;
  }

  return !params.registrationOpen || params.capacityFull || params.needsTeam || params.selectedTeamMissingRoster;
}

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
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [heroSrc, setHeroSrc] = useState("/assets/darkside/official/hero-desktop.jpg");

  const isMockTournament = tournamentId.startsWith("mock-") || tournament?.id?.startsWith("mock-");
  const game = gameAssets[normalizeGameKey(tournament?.game)] ?? gameAssets.VALORANT;
  const matches = useMemo(() => (tournament ? flattenMatches(tournament) : []), [tournament]);
  const featuredMatches = matches.slice(0, 2);
  const registrationOpen = tournament?.status === "REGISTRATION_OPEN" || isMockTournament;
  const registeredCount = (tournament?.registrations?.length ?? 0) + (localRegistered ? 1 : 0);
  const maxParticipants = tournament?.maxParticipants ?? 8;
  const myRegistration = useMemo(
    () => tournament?.registrations?.find((registration: any) => isUserRegistration(registration, user, ownedTeams)),
    [tournament, user, ownedTeams]
  );
  const hasRegistration = Boolean(localRegistered || (myRegistration && isActiveParticipantStatus(myRegistration.status)));
  const capacityFull = registeredCount >= maxParticipants;
  const selectedTeam = ownedTeams.find((team) => team.id === selectedTeamId) ?? ownedTeams[0] ?? null;
  const selectedTeamMissingRoster = Boolean(
    tournament?.type === "TEAM" &&
    selectedTeam &&
    tournament.teamSize &&
    teamRosterCount(selectedTeam) < tournament.teamSize
  );
  const needsTeam = Boolean(tournament?.type === "TEAM" && user && !ownedTeams.length && !hasRegistration);
  const countdownParts = useMemo(() => getCountdownParts(tournament?.startsAt), [tournament?.startsAt]);
  const actionLabel = primaryActionLabel({
    user,
    tournament,
    hasRegistration,
    myRegistration,
    registrationOpen,
    capacityFull,
    needsTeam
  });
  const actionDisabled = primaryActionDisabled({
    user,
    hasRegistration,
    registrationOpen,
    capacityFull,
    needsTeam,
    selectedTeamMissingRoster,
    isSubmitting
  });

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

      const filteredTeams = data.filter((team) =>
        team.ownerId === currentUser.id ||
        team.members?.some((member: any) => member.userId === currentUser.id && ["OWNER", "CAPTAIN"].includes(member.role))
      );

      setOwnedTeams(filteredTeams);
      setSelectedTeamId((current) => current || filteredTeams[0]?.id || "");
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

  useEffect(() => {
    if (tournament) {
      setHeroSrc(tournamentHeroImage(tournament, game));
    }
  }, [tournament, game]);

  async function register() {
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    if (hasRegistration) {
      setActiveTab("Equipos");
      setMessage("Ya tienes una inscripción activa en este torneo.");
      return;
    }

    if (!registrationOpen) {
      setMessage("Las inscripciones no están abiertas para este torneo.");
      return;
    }

    if (capacityFull) {
      setMessage("Los cupos de este torneo ya están completos.");
      return;
    }

    if (selectedTeamMissingRoster) {
      setMessage(`El equipo seleccionado necesita ${tournament.teamSize} integrantes para este torneo.`);
      return;
    }

    if (isMockTournament) {
      setLocalRegistered(true);
      setMessage("Inscripción simulada para demo. El flujo real se activará con un torneo publicado en API.");
      return;
    }

    try {
      setIsSubmitting(true);
      const team = tournament.type === "TEAM" ? selectedTeam : null;
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
        throw new Error(translateTournamentError(data.message));
      }

      setMessage("Inscripción enviada correctamente. Revisa la pestaña Equipos para ver tu estado.");
      setActiveTab("Equipos");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo completar la inscripción.");
    } finally {
      setIsSubmitting(false);
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
      setCheckInMessage(translateTournamentError(data.message ?? "No se pudo registrar el check-in."));
      return;
    }

    setCheckInMessage("Check-in realizado correctamente.");
    await load();
  }

  async function handlePrimaryAction() {
    if (myRegistration && tournament?.status === "CHECK_IN" && myRegistration.status === "CONFIRMED") {
      await checkIn(myRegistration.id);
      return;
    }

    if (hasRegistration) {
      setActiveTab("Equipos");
      setMessage("Ya estas participando en este torneo. Revisa tu estado en la pestaña Equipos.");
      return;
    }

    await register();
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
      const registrations = tournament.registrations ?? [];

      return (
        <div className="space-y-4">
          {myRegistration ? (
            <article className="rounded-[18px] border border-[#18e6f2]/30 bg-[#18e6f2]/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#18e6f2]">Mi inscripción</p>
                  <strong className="mt-2 block text-white">{registrationLabel(myRegistration)}</strong>
                  <p className="mt-1 text-sm text-white/62">{registrationStatusLabel(myRegistration.status)}</p>
                </div>
                {tournament.status === "CHECK_IN" && myRegistration.status === "CONFIRMED" ? (
                  <button onClick={() => checkIn(myRegistration.id)} className="btn-primary motion-press !rounded-xl !px-4 !py-2 !text-xs">
                    Hacer check-in
                  </button>
                ) : null}
              </div>
            </article>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            {registrations.map((registration: any) => {
              const mine = isUserRegistration(registration, user, ownedTeams);

              return (
                <article
                  key={registration.id}
                  className={`rounded-[16px] border p-4 ${
                    mine ? "border-[#18e6f2]/35 bg-[#18e6f2]/8" : "border-white/10 bg-white/[0.035]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="min-w-0 truncate text-white">{registrationLabel(registration)}</strong>
                    <span className="text-xs uppercase tracking-[0.12em] text-[#18e6f2]">{registrationStatusLabel(registration.status)}</span>
                  </div>
                  {mine ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#40ff91]">Tu participación</p> : null}
                </article>
              );
            })}
          </div>

          {localRegistered ? (
            <article className="rounded-[16px] border border-[#18e6f2]/30 bg-[#18e6f2]/10 p-4">
              <strong className="text-white">{user?.displayName || user?.username || "Tu cuenta"}</strong>
              <p className="mt-2 text-sm text-white/62">Inscripción simulada para demo.</p>
            </article>
          ) : null}

          {!registrations.length && !localRegistered ? (
            <div className="rounded-[16px] border border-white/10 bg-white/[0.035] p-5 text-sm text-white/62">
              Aún no hay participantes inscritos. Sé el primero cuando el registro esté abierto.
            </div>
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

    return <BracketBoard rounds={tournament.bracket?.rounds ?? []} previewRegistrations={tournament.registrations ?? []} />;
  }

  return (
    <div className="min-w-0 overflow-x-hidden bg-[#05080d] pb-10">
      <section className="relative isolate overflow-hidden border-b border-white/8 bg-[#070b12]">
        <Image src={heroSrc} alt="" fill priority className="object-cover object-[center_38%]" onError={() => setHeroSrc(game.bg)} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,12,0.98)_0%,rgba(5,8,12,0.82)_38%,rgba(5,8,12,0.28)_72%,rgba(5,8,12,0.9)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_34%,rgba(255,36,56,0.24),transparent_28%),radial-gradient(circle_at_76%_58%,rgba(24,230,242,0.18),transparent_24%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#05080d] to-transparent" />

        <div className="relative z-10 mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-7 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            <Link href="/dashboard/tournaments" className="transition hover:text-white">Torneos</Link>
            <span>/</span>
            <span className="text-white/70">{tournament.name}</span>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start">
            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-[#ff2438]/35 bg-[#ff2438]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#ff5868]">
                {isMockTournament ? "Modo demo" : statusLabel(tournament.status)}
              </span>
              <h1 className="mt-5 max-w-5xl break-words font-heading text-[2.35rem] font-semibold leading-[0.94] text-white sm:text-5xl xl:text-[4.85rem]">
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

              <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <HeroMetric label="Recompensa" value="Tokens internos" />
                <HeroMetric label="Inicio" value={formatDate(tournament.startsAt)} />
                <HeroMetric label="Formato" value={String(tournament.format || "SINGLE_ELIMINATION").replaceAll("_", " ")} />
                <HeroMetric label="Equipos" value={`${registeredCount}/${maxParticipants}`} />
              </div>

              {tournament.type === "TEAM" && user && !hasRegistration ? (
                <TeamEligibilityPanel
                  teams={ownedTeams}
                  selectedTeamId={selectedTeamId}
                  onSelectTeam={setSelectedTeamId}
                  teamSize={tournament.teamSize}
                  needsTeam={needsTeam}
                  selectedTeamMissingRoster={selectedTeamMissingRoster}
                />
              ) : null}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handlePrimaryAction}
                  disabled={actionDisabled}
                  className={`btn-primary motion-press w-full sm:w-auto ${actionDisabled ? "cursor-not-allowed opacity-55" : ""}`}
                >
                  {isSubmitting ? "Procesando..." : actionLabel}
                </button>
                <Link href="#bracket" className="btn-secondary motion-press w-full sm:w-auto">
                  Ver bracket
                </Link>
              </div>
              <EligibilityHint
                user={user}
                tournament={tournament}
                hasRegistration={hasRegistration}
                myRegistration={myRegistration}
                registrationOpen={registrationOpen}
                capacityFull={capacityFull}
                needsTeam={needsTeam}
                selectedTeamMissingRoster={selectedTeamMissingRoster}
              />
              {(message || checkInMessage) ? (
                <p className="mt-4 max-w-2xl rounded-[14px] border border-[#18e6f2]/25 bg-[#18e6f2]/10 px-4 py-3 text-sm text-[#bffaff]">
                  {message || checkInMessage}
                </p>
              ) : null}
            </div>

            <div className="rounded-[18px] border border-[#18e6f2]/15 bg-black/35 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#18e6f2]">Comienza en</p>
              <div className="mt-4 grid grid-cols-4 gap-3 text-center">
                {countdownParts.map(([value, label]) => (
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

      <section className="mx-auto grid max-w-[1280px] gap-5 px-4 py-5 sm:px-6 2xl:grid-cols-[minmax(0,1fr)_310px] lg:px-8" id="bracket">
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

function EligibilityHint({
  user,
  tournament,
  hasRegistration,
  myRegistration,
  registrationOpen,
  capacityFull,
  needsTeam,
  selectedTeamMissingRoster
}: {
  user: StoredUser | null;
  tournament: any;
  hasRegistration: boolean;
  myRegistration?: any;
  registrationOpen: boolean;
  capacityFull: boolean;
  needsTeam: boolean;
  selectedTeamMissingRoster: boolean;
}) {
  let title = "Listo para competir";
  let copy = "Puedes inscribirte si cumples las reglas del torneo y no tienes otro evento en el mismo horario.";
  let tone = "border-[#18e6f2]/25 bg-[#18e6f2]/10 text-[#bffaff]";

  if (!user) {
    title = "Inicia sesión para validar requisitos";
    copy = "Necesitamos tu cuenta para revisar equipos, inscripciones activas y conflictos de horario.";
    tone = "border-white/10 bg-white/[0.04] text-white/62";
  } else if (hasRegistration) {
    title = "Ya participas en este torneo";
    copy = myRegistration
      ? `Estado actual: ${registrationStatusLabel(myRegistration.status)}.`
      : "Tu inscripción aparece activa en este torneo.";
    tone = "border-[#40ff91]/25 bg-[#40ff91]/10 text-[#d7ffe8]";
  } else if (capacityFull) {
    title = "Cupos completos";
    copy = "El torneo alcanzó su límite de participantes. Puedes revisar otros torneos abiertos.";
    tone = "border-[#ffb347]/30 bg-[#ffb347]/10 text-[#ffe0b0]";
  } else if (!registrationOpen) {
    title = "Registro no disponible";
    copy = `El torneo está en estado ${statusLabel(tournament.status)}. El botón se activará cuando el organizador abra inscripciones.`;
    tone = "border-white/10 bg-white/[0.04] text-white/62";
  } else if (needsTeam) {
    title = "Necesitas un equipo";
    copy = "Este torneo es por equipos. Crea un equipo o únete como capitán antes de inscribirte.";
    tone = "border-[#ffb347]/30 bg-[#ffb347]/10 text-[#ffe0b0]";
  } else if (selectedTeamMissingRoster) {
    title = "Equipo incompleto";
    copy = `El equipo seleccionado no cumple el tamaño requerido de ${tournament.teamSize} integrantes.`;
    tone = "border-[#ffb347]/30 bg-[#ffb347]/10 text-[#ffe0b0]";
  }

  return (
    <div className={`mt-4 rounded-[16px] border px-4 py-3 text-sm leading-6 ${tone}`}>
      <strong className="block text-white">{title}</strong>
      <span>{copy}</span>
    </div>
  );
}

function TeamEligibilityPanel({
  teams,
  selectedTeamId,
  onSelectTeam,
  teamSize,
  needsTeam,
  selectedTeamMissingRoster
}: {
  teams: any[];
  selectedTeamId: string;
  onSelectTeam: (value: string) => void;
  teamSize?: number | null;
  needsTeam: boolean;
  selectedTeamMissingRoster: boolean;
}) {
  if (needsTeam) {
    return (
      <div className="mt-6 rounded-[18px] border border-[#ffb347]/30 bg-[#ffb347]/10 p-4 text-sm leading-6 text-[#ffe0b0]">
        <strong className="block text-white">Este torneo requiere equipo</strong>
        Crea un equipo o confirma que seas capitán/owner para poder inscribirte.
        <Link href="/dashboard/teams" className="mt-3 inline-flex font-semibold text-[#18e6f2]">
          Ir a mis equipos
        </Link>
      </div>
    );
  }

  if (!teams.length) {
    return null;
  }

  return (
    <div className="mt-6 rounded-[18px] border border-white/10 bg-black/30 p-4 backdrop-blur-md">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#18e6f2]">Equipo para inscripción</p>
          <p className="mt-1 text-sm text-white/62">Selecciona el equipo con el que competirás.</p>
        </div>
        {teamSize ? <span className="text-xs uppercase tracking-[0.14em] text-white/40">Requiere {teamSize} integrantes</span> : null}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {teams.map((team) => {
          const selected = team.id === selectedTeamId;
          const incomplete = Boolean(teamSize && teamRosterCount(team) < teamSize);

          return (
            <button
              key={team.id}
              type="button"
              onClick={() => onSelectTeam(team.id)}
              className={`rounded-[14px] border px-4 py-3 text-left transition ${
                selected
                  ? "border-[#18e6f2]/45 bg-[#18e6f2]/12"
                  : "border-white/10 bg-white/[0.035] hover:border-white/20"
              }`}
            >
              <strong className="block truncate text-white">{teamLabel(team)}</strong>
              <span className={`mt-1 block text-xs ${incomplete ? "text-[#ffb347]" : "text-white/50"}`}>
                {teamRosterCount(team)} integrante(s){incomplete ? " · incompleto" : ""}
              </span>
            </button>
          );
        })}
      </div>
      {selectedTeamMissingRoster ? (
        <p className="mt-3 rounded-[12px] border border-[#ffb347]/25 bg-[#ffb347]/10 px-3 py-2 text-xs text-[#ffe0b0]">
          El equipo seleccionado todavía no cumple el tamaño requerido.
        </p>
      ) : null}
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-black/35 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-white/42">{label}</p>
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
