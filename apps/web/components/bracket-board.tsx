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
      className={`flex items-center justify-between gap-3 rounded-[12px] border px-3 py-2 text-sm ${
        winner
          ? "border-[#18e6f2]/40 bg-[#18e6f2]/10 text-white"
          : "border-white/10 bg-white/[0.035] text-white/70"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[10px] font-black ${
          winner ? "border-[#18e6f2]/45 bg-[#18e6f2]/15 text-[#bffaff]" : "border-white/10 bg-black/35 text-white/48"
        }`}>
          {teamInitials(label)}
        </span>
        <span className="min-w-0 truncate">{label}</span>
      </span>
      <span className={winner ? "text-[#40ffbb]" : "text-white/40"}>{score}</span>
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
    <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
      {!hasRealRounds ? (
        <div className="mb-5 flex flex-col gap-3 rounded-[18px] border border-[#18e6f2]/20 bg-[#18e6f2]/8 px-4 py-3 text-sm leading-6 text-[#bffaff] sm:flex-row sm:items-center sm:justify-between">
          <span>Bracket simulado para vista previa. Cuando el organizador genere las llaves reales, se reemplazara automaticamente.</span>
          <span className="shrink-0 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Preview</span>
        </div>
      ) : null}

      <div className="flex min-w-max items-start gap-7 py-2">
        {visibleRounds.map((round, roundIndex) => (
          <section
            key={round.id}
            className="relative w-[250px] shrink-0 sm:w-[286px]"
            style={{ paddingTop: roundIndex === 0 ? 0 : `${Math.min(roundIndex * 42, 132)}px` }}
          >
            <div className="absolute -right-7 top-[52%] hidden h-px w-7 bg-gradient-to-r from-[#18e6f2]/60 to-transparent lg:block" />
            <div className="mb-4 border-l border-[#ff2438]/60 pl-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">{round.name}</h3>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#8eb8ff]">{statusLabel(round.status)}</p>
            </div>

            <div className="space-y-4">
              {round.matches.map((match) => {
                const homeWinner = isWinner(match, match.homeRegistration);
                const awayWinner = isWinner(match, match.awayRegistration);

                return (
                  <article
                    key={match.id}
                    className="motion-card relative overflow-hidden rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,36,0.98),rgba(7,11,17,0.96))] p-3 shadow-[0_18px_36px_rgba(0,0,0,0.32)] after:absolute after:-right-7 after:top-1/2 after:hidden after:h-px after:w-7 after:bg-[#18e6f2]/45 lg:after:block"
                  >
                    <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[#18e6f2] via-[#ff2438] to-transparent" />
                    <div className="mb-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.14em] text-white/45">
                      <span>BO{match.bestOf}</span>
                      <span>{statusLabel(match.status)}</span>
                    </div>

                    <div className="space-y-2">
                      <TeamLine registration={match.homeRegistration} score={homeWinner ? "1" : hasRealRounds ? "-" : "0"} winner={homeWinner} />
                      <TeamLine registration={match.awayRegistration} score={awayWinner ? "1" : hasRealRounds ? "-" : "0"} winner={awayWinner} />
                    </div>

                    {hasRealRounds ? (
                      <Link href={`/dashboard/matches/${match.id}`} className="mt-4 inline-flex text-sm font-semibold text-[#18e6f2]">
                        Abrir sala
                      </Link>
                    ) : (
                      <p className="mt-4 text-sm font-semibold text-white/40">Sala pendiente</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
