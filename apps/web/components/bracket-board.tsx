import Link from "next/link";

type RegistrationView = {
  id?: string;
  user?: { displayName?: string | null; username: string };
  team?: { name: string; tag?: string | null };
};

type MatchView = {
  id: string;
  status: string;
  bestOf: number;
  homeRegistration?: RegistrationView | null;
  awayRegistration?: RegistrationView | null;
  winnerRegistration?: RegistrationView | null;
};

type RoundView = {
  id: string;
  name: string;
  sequence: number;
  status: string;
  matches: MatchView[];
};

const demoTeamNames = [
  "Nova Esports",
  "Red Sentinel",
  "Lunaris",
  "Spectre Team",
  "Void Reapers",
  "Black Dragons",
  "Eclipse Gaming",
  "Inferno Squad"
];

function registrationLabel(registration?: RegistrationView | null) {
  if (!registration) {
    return "Proximo rival";
  }

  if (registration.team) {
    return registration.team.tag
      ? `${registration.team.name} [${registration.team.tag}]`
      : registration.team.name;
  }

  return registration.user?.displayName || registration.user?.username || "Sin definir";
}

function isWinner(match: MatchView, registration?: RegistrationView | null) {
  return Boolean(registration?.id && match.winnerRegistration?.id === registration.id);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    READY: "Lista",
    IN_PROGRESS: "En vivo",
    RESULT_PENDING: "Resultado",
    WAITING_RESULT: "Resultado",
    COMPLETED: "Finalizada",
    DISPUTED: "Disputa",
    CANCELLED: "Cancelada",
    ACTIVE: "Activa",
    SIMULATED: "Vista previa"
  };

  return labels[status] ?? status;
}

function statusTone(status: string) {
  if (status === "IN_PROGRESS" || status === "READY" || status === "ACTIVE") {
    return "border-[#40ff91]/35 bg-[#40ff91]/10 text-[#b8ffd7]";
  }

  if (status === "COMPLETED") {
    return "border-[#18e6f2]/35 bg-[#18e6f2]/10 text-[#bffaff]";
  }

  if (status === "DISPUTED" || status === "CANCELLED") {
    return "border-[#ff5868]/35 bg-[#ff2438]/10 text-[#ffc7cc]";
  }

  return "border-white/10 bg-white/[0.045] text-white/55";
}

function roundLabel(sequence: number, fallback: string) {
  const labels: Record<number, string> = {
    1: "Apertura",
    2: "Semifinal",
    3: "Final"
  };

  return labels[sequence] ?? fallback;
}

function teamInitials(label: string) {
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function buildPreviewRegistrations(registrations?: RegistrationView[]) {
  const realRegistrations = registrations?.filter((registration) => registration?.id) ?? [];

  if (realRegistrations.length >= 2) {
    return realRegistrations.slice(0, 8);
  }

  return demoTeamNames.map((name, index) => ({
    id: `preview-${index}`,
    team: {
      name
    }
  }));
}

function buildPreviewRounds(registrations?: RegistrationView[]): RoundView[] {
  const entries = buildPreviewRegistrations(registrations);
  const firstRoundMatches: MatchView[] = [];

  for (let index = 0; index < entries.length; index += 2) {
    firstRoundMatches.push({
      id: `preview-r1-${index}`,
      status: "SIMULATED",
      bestOf: 1,
      homeRegistration: entries[index],
      awayRegistration: entries[index + 1] ?? null,
      winnerRegistration: index % 4 === 0 ? entries[index] : undefined
    });
  }

  const secondRoundEntries = firstRoundMatches.map((match, index) => match.winnerRegistration ?? {
    id: `preview-winner-${index}`,
    team: {
      name: "Ganador pendiente"
    }
  });

  const secondRoundMatches: MatchView[] = [];
  for (let index = 0; index < secondRoundEntries.length; index += 2) {
    secondRoundMatches.push({
      id: `preview-r2-${index}`,
      status: "SIMULATED",
      bestOf: 1,
      homeRegistration: secondRoundEntries[index],
      awayRegistration: secondRoundEntries[index + 1] ?? null,
      winnerRegistration: index === 0 ? secondRoundEntries[index] : undefined
    });
  }

  const finalHome = secondRoundMatches[0]?.winnerRegistration ?? secondRoundMatches[0]?.homeRegistration;
  const finalAway = secondRoundMatches[1]?.winnerRegistration ?? secondRoundMatches[1]?.homeRegistration ?? null;

  return [
    {
      id: "preview-round-1",
      name: "Ronda 1",
      sequence: 1,
      status: "SIMULATED",
      matches: firstRoundMatches
    },
    {
      id: "preview-round-2",
      name: "Semifinales",
      sequence: 2,
      status: "SIMULATED",
      matches: secondRoundMatches
    },
    {
      id: "preview-final",
      name: "Gran final",
      sequence: 3,
      status: "SIMULATED",
      matches: [
        {
          id: "preview-final-match",
          status: "SIMULATED",
          bestOf: 3,
          homeRegistration: finalHome ?? null,
          awayRegistration: finalAway,
          winnerRegistration: undefined
        }
      ]
    }
  ];
}

function TeamLine({ registration, score, winner }: { registration?: RegistrationView | null; score: string; winner: boolean }) {
  const label = registrationLabel(registration);

  return (
    <div
      className={`group flex items-center justify-between gap-3 rounded-[14px] border px-3 py-2.5 text-sm transition ${
        winner
          ? "border-[#18e6f2]/50 bg-[#18e6f2]/12 text-white shadow-[0_0_24px_rgba(24,230,242,0.12)]"
          : "border-white/10 bg-white/[0.035] text-white/70 hover:border-white/20 hover:bg-white/[0.055]"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[10px] font-black ${
            winner
              ? "border-[#18e6f2]/55 bg-[#18e6f2]/18 text-[#d9fdff]"
              : "border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),rgba(0,0,0,0.35))] text-white/58"
          }`}
        >
          {teamInitials(label)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{label}</span>
          <span className="block text-[10px] uppercase tracking-[0.14em] text-white/32">Equipo</span>
        </span>
      </span>
      <span
        className={`grid h-7 min-w-7 place-items-center rounded-lg border px-2 text-xs font-black ${
          winner ? "border-[#40ff91]/40 bg-[#40ff91]/12 text-[#b8ffd7]" : "border-white/10 bg-black/25 text-white/42"
        }`}
      >
        {score}
      </span>
    </div>
  );
}

export function BracketBoard({
  rounds,
  previewRegistrations
}: {
  rounds: RoundView[];
  previewRegistrations?: RegistrationView[];
}) {
  const hasRealRounds = rounds.length > 0;
  const visibleRounds = hasRealRounds ? rounds : buildPreviewRounds(previewRegistrations);

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(24,230,242,0.12),transparent_28%),linear-gradient(180deg,rgba(10,16,25,0.92),rgba(4,7,11,0.98))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.36)] sm:p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#18e6f2]">Mapa competitivo</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Llaves del torneo</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-white/48">
          <span className="rounded-full border border-[#40ff91]/25 bg-[#40ff91]/8 px-3 py-1 text-[#b8ffd7]">Ganador</span>
          <span className="rounded-full border border-[#18e6f2]/25 bg-[#18e6f2]/8 px-3 py-1 text-[#bffaff]">Sala</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">BO</span>
        </div>
      </div>

      {!hasRealRounds ? (
        <div className="mb-5 flex flex-col gap-3 rounded-[18px] border border-[#18e6f2]/20 bg-[#18e6f2]/8 px-4 py-3 text-sm leading-6 text-[#bffaff] sm:flex-row sm:items-center sm:justify-between">
          <span>Bracket simulado para vista previa. Cuando el organizador genere las llaves reales, se reemplazara automaticamente.</span>
          <span className="shrink-0 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Preview</span>
        </div>
      ) : null}

      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        <div className="flex min-w-max items-start gap-9 py-2">
          {visibleRounds.map((round, roundIndex) => (
            <section
              key={round.id}
              className="relative w-[265px] shrink-0 sm:w-[300px]"
              style={{ paddingTop: roundIndex === 0 ? 0 : `${Math.min(roundIndex * 50, 150)}px` }}
            >
              {roundIndex < visibleRounds.length - 1 ? (
                <div className="pointer-events-none absolute -right-9 top-[52%] hidden h-px w-9 bg-gradient-to-r from-[#18e6f2]/60 via-[#18e6f2]/25 to-transparent lg:block" />
              ) : null}

              <div className="mb-4 rounded-[16px] border border-white/10 bg-white/[0.035] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff5868]">
                      {roundLabel(round.sequence, round.name)}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-white/86">{round.name}</h3>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone(round.status)}`}>
                    {statusLabel(round.status)}
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                {round.matches.map((match, matchIndex) => {
                  const homeWinner = isWinner(match, match.homeRegistration);
                  const awayWinner = isWinner(match, match.awayRegistration);

                  return (
                    <article
                      key={match.id}
                      className={`motion-card relative overflow-visible rounded-[18px] border bg-[linear-gradient(180deg,rgba(17,24,36,0.98),rgba(7,11,17,0.96))] p-3.5 shadow-[0_18px_36px_rgba(0,0,0,0.32)] ${
                        match.status === "IN_PROGRESS"
                          ? "border-[#40ff91]/32"
                          : roundIndex === visibleRounds.length - 1
                            ? "border-[#ff2438]/30 shadow-[0_0_40px_rgba(255,36,56,0.12)]"
                            : "border-white/10"
                      }`}
                    >
                      {roundIndex < visibleRounds.length - 1 ? (
                        <div className="pointer-events-none absolute -right-9 top-1/2 hidden h-px w-9 bg-[#18e6f2]/42 lg:block" />
                      ) : null}
                      <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-[18px] bg-gradient-to-b from-[#18e6f2] via-[#ff2438] to-transparent" />
                      <div className="mb-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.14em]">
                        <span className="text-white/42">Match {matchIndex + 1}</span>
                        <span className={`rounded-full border px-2.5 py-1 font-semibold ${statusTone(match.status)}`}>
                          {statusLabel(match.status)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <TeamLine registration={match.homeRegistration} score={homeWinner ? "1" : hasRealRounds ? "-" : "0"} winner={homeWinner} />
                        <TeamLine registration={match.awayRegistration} score={awayWinner ? "1" : hasRealRounds ? "-" : "0"} winner={awayWinner} />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                          BO{match.bestOf}
                        </span>
                        {hasRealRounds ? (
                          <Link href={`/dashboard/matches/${match.id}`} className="text-sm font-semibold text-[#18e6f2] hover:text-white">
                            Abrir sala
                          </Link>
                        ) : (
                          <p className="text-sm font-semibold text-white/40">Sala pendiente</p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );


}
