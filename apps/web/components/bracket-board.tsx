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
    ACTIVE: "Activa"
  };

  return labels[status] ?? status;
}

export function BracketBoard({ rounds }: { rounds: RoundView[] }) {
  if (!rounds.length) {
    return (
      <div className="rounded-[20px] border border-dashed border-white/12 bg-black/20 p-6 text-sm leading-7 text-white/62">
        El bracket aun no ha sido generado. Cuando el organizador cierre inscripciones, aqui apareceran las rondas y partidas.
      </div>
    );
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
      <div className="flex min-w-max items-start gap-5">
        {rounds.map((round) => (
          <section key={round.id} className="relative w-[255px] shrink-0 sm:w-[292px]">
            <div className="absolute -right-5 top-[52%] hidden h-px w-5 bg-gradient-to-r from-[#18e6f2]/60 to-transparent lg:block" />
            <div className="mb-4 border-l border-[#ff2438]/60 pl-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">{round.name}</h3>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#8eb8ff]">{statusLabel(round.status)}</p>
            </div>

            <div className="space-y-4">
              {round.matches.map((match) => (
                <article
                  key={match.id}
                  className="motion-card relative overflow-hidden rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,36,0.96),rgba(7,11,17,0.94))] p-3 shadow-[0_16px_34px_rgba(0,0,0,0.26)]"
                >
                  <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[#18e6f2] via-[#ff2438] to-transparent" />
                  <div className="mb-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.14em] text-white/45">
                    <span>BO{match.bestOf}</span>
                    <span>{statusLabel(match.status)}</span>
                  </div>

                  <div className="space-y-2">
                    {[match.homeRegistration, match.awayRegistration].map((registration, index) => {
                      const winner = isWinner(match, registration);
                      return (
                        <div
                          key={`${match.id}-${index}`}
                          className={`flex items-center justify-between gap-3 rounded-[12px] border px-3 py-2 text-sm ${
                            winner
                              ? "border-[#18e6f2]/40 bg-[#18e6f2]/10 text-white"
                              : "border-white/10 bg-white/[0.035] text-white/70"
                          }`}
                        >
                          <span className="min-w-0 truncate">{registrationLabel(registration)}</span>
                          <span className={winner ? "text-[#40ffbb]" : "text-white/40"}>{winner ? "1" : "-"}</span>
                        </div>
                      );
                    })}
                  </div>

                  <Link href={`/dashboard/matches/${match.id}`} className="mt-4 inline-flex text-sm font-semibold text-[#18e6f2]">
                    Abrir sala
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
