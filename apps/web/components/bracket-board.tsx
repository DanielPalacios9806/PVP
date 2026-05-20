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
    return "Pendiente";
  }

  if (registration.team) {
    return registration.team.tag
      ? `${registration.team.name} [${registration.team.tag}]`
      : registration.team.name;
  }

  return registration.user?.displayName || registration.user?.username || "Sin definir";
}

export function BracketBoard({ rounds }: { rounds: RoundView[] }) {
  if (!rounds.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-8 text-sm text-white/60">
        El bracket aun no ha sido generado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max items-start gap-8">
        {rounds.map((round) => (
          <section key={round.id} className="relative w-[320px] rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-gradient-to-r from-brand-cyan/60 to-transparent xl:block" />
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{round.name}</h3>
              <p className="text-xs uppercase tracking-[0.2em] text-brand-cyan">{round.status}</p>
            </div>
            <div className="space-y-5">
              {round.matches.map((match) => (
                <article
                  key={match.id}
                  className="relative rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.18))] p-4 shadow-xl shadow-black/20"
                >
                  <div className="mb-3 flex items-center justify-between text-xs text-white/50">
                    <span>BO{match.bestOf}</span>
                    <span>{match.status}</span>
                  </div>
                  <div className="space-y-2">
                    <div
                      className={`rounded-xl px-3 py-2 text-sm ${
                        match.winnerRegistration?.id && match.winnerRegistration.id === match.homeRegistration?.id
                          ? "border border-brand-cyan/40 bg-brand-cyan/20 text-brand-cyan"
                          : "border border-white/5 bg-white/5 text-white/80"
                      }`}
                    >
                      {registrationLabel(match.homeRegistration)}
                    </div>
                    <div
                      className={`rounded-xl px-3 py-2 text-sm ${
                        match.winnerRegistration?.id && match.winnerRegistration.id === match.awayRegistration?.id
                          ? "border border-brand-cyan/40 bg-brand-cyan/20 text-brand-cyan"
                          : "border border-white/5 bg-white/5 text-white/80"
                      }`}
                    >
                      {registrationLabel(match.awayRegistration)}
                    </div>
                  </div>
                  <a href={`/dashboard/matches/${match.id}`} className="mt-4 inline-flex text-sm text-brand-cyan">
                    Abrir sala de partida
                  </a>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
