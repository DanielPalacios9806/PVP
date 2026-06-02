"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Background,
  Controls,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node
} from "@xyflow/react";

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
    1: "Ronda 1",
    2: "Ronda 2",
    3: "Cuartos",
    4: "Semifinal",
    5: "Gran final"
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

function finalWinnerFromRounds(rounds: RoundView[]) {
  const finalRound = rounds[rounds.length - 1];
  const finalMatch = finalRound?.matches?.[finalRound.matches.length - 1];

  if (finalMatch?.status !== "COMPLETED" || !finalMatch.winnerRegistration) {
    return null;
  }

  return finalMatch.winnerRegistration;
}

function bracketProgress(rounds: RoundView[]) {
  const matches = rounds.flatMap((round) => round.matches ?? []);
  const completed = matches.filter((match) => match.status === "COMPLETED").length;

  return {
    total: matches.length,
    completed,
    percent: matches.length ? Math.round((completed / matches.length) * 100) : 0
  };
}

function matchScore(match: MatchView, registration?: RegistrationView | null, hasRealRounds = true) {
  if (!registration) {
    return "-";
  }

  if (!hasRealRounds) {
    return isWinner(match, registration) ? "1" : "0";
  }

  if (!match.winnerRegistration?.id) {
    return "-";
  }

  return isWinner(match, registration) ? "1" : "0";
}

function TeamLine({ registration, score, winner }: { registration?: RegistrationView | null; score: string; winner: boolean }) {
  const label = registrationLabel(registration);

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[12px] border px-3 py-2 text-sm transition ${
        winner
          ? "border-[#40ff91]/45 bg-[#40ff91]/12 text-white shadow-[0_0_22px_rgba(64,255,145,0.12)]"
          : "border-white/10 bg-black/24 text-white/70"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[9px] font-black ${
            winner
              ? "border-[#40ff91]/50 bg-[#40ff91]/14 text-[#d8ffe8]"
              : "border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(24,230,242,0.18),rgba(0,0,0,0.55))] text-white/58"
          }`}
        >
          {teamInitials(label)}
        </span>
        <span className="min-w-0 truncate font-semibold">{label}</span>
      </span>
      <span
        className={`grid h-7 min-w-7 place-items-center rounded-lg border px-2 text-xs font-black ${
          winner ? "border-[#40ff91]/40 bg-[#40ff91]/12 text-[#b8ffd7]" : "border-white/10 bg-black/25 text-white/46"
        }`}
      >
        {score}
      </span>
    </div>
  );
}

function MatchNodeCard({ match, hasRealRounds }: { match: MatchView; hasRealRounds: boolean }) {
  const homeWinner = isWinner(match, match.homeRegistration);
  const awayWinner = isWinner(match, match.awayRegistration);

  return (
    <div className="darkside-bracket-node-card">
      <div className="mb-3 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.16em]">
        <span className="text-white/42">BO{match.bestOf}</span>
        <span className={`rounded-full border px-2 py-1 font-bold ${statusTone(match.status)}`}>{statusLabel(match.status)}</span>
      </div>
      <div className="space-y-2">
        <TeamLine registration={match.homeRegistration} score={matchScore(match, match.homeRegistration, hasRealRounds)} winner={homeWinner} />
        <TeamLine registration={match.awayRegistration} score={matchScore(match, match.awayRegistration, hasRealRounds)} winner={awayWinner} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.12em]">
        <span className="text-white/35">Match room</span>
        {hasRealRounds ? (
          <Link href={`/dashboard/matches/${match.id}`} className="font-bold text-[#18e6f2] hover:text-white">
            Abrir
          </Link>
        ) : (
          <span className="font-semibold text-white/35">Preview</span>
        )}
      </div>
    </div>
  );
}


function MobileRoundCards({ rounds, hasRealRounds }: { rounds: RoundView[]; hasRealRounds: boolean }) {
  return (
    <div className="space-y-4 md:hidden">
      {rounds.map((round) => (
        <section key={round.id} className="rounded-[20px] border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff5868]">
                {roundLabel(round.sequence, round.name)}
              </p>
              <h4 className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-white/86">{round.name}</h4>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone(round.status)}`}>
              {statusLabel(round.status)}
            </span>
          </div>
          <div className="space-y-3">
            {round.matches.map((match) => {
              const homeWinner = isWinner(match, match.homeRegistration);
              const awayWinner = isWinner(match, match.awayRegistration);

              return (
                <article key={match.id} className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,19,30,0.96),rgba(5,8,13,0.98))] p-3 shadow-[0_16px_34px_rgba(0,0,0,0.28)]">
                  <div className="mb-3 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.14em]">
                    <span className="text-white/42">BO{match.bestOf}</span>
                    <span className={`rounded-full border px-2 py-1 font-bold ${statusTone(match.status)}`}>{statusLabel(match.status)}</span>
                  </div>
                  <div className="space-y-2">
                    <TeamLine registration={match.homeRegistration} score={matchScore(match, match.homeRegistration, hasRealRounds)} winner={homeWinner} />
                    <TeamLine registration={match.awayRegistration} score={matchScore(match, match.awayRegistration, hasRealRounds)} winner={awayWinner} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.12em]">
                    <span className="text-white/35">Match room</span>
                    {hasRealRounds ? (
                      <Link href={`/dashboard/matches/${match.id}`} className="font-bold text-[#18e6f2] hover:text-white">
                        Abrir
                      </Link>
                    ) : (
                      <span className="font-semibold text-white/35">Preview</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function buildFlow(rounds: RoundView[], hasRealRounds: boolean) {
  const roundGap = 345;
  const rowGap = 166;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  rounds.forEach((round, roundIndex) => {
    const roundOffset = Math.max(0, (Math.pow(2, roundIndex) - 1) * 42);

    nodes.push({
      id: `round-${round.id}`,
      position: { x: roundIndex * roundGap, y: -74 },
      draggable: false,
      selectable: false,
      data: {
        label: (
          <div className="min-w-[250px] rounded-[16px] border border-white/10 bg-white/[0.035] px-4 py-3 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff5868]">
              {roundLabel(round.sequence, round.name)}
            </p>
            <h3 className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-white/88">{round.name}</h3>
          </div>
        )
      },
      className: "darkside-flow-round-node",
      type: "default"
    });

    round.matches.forEach((match, matchIndex) => {
      const nodeId = `match-${match.id}`;
      const y = matchIndex * rowGap + roundOffset;

      nodes.push({
        id: nodeId,
        position: { x: roundIndex * roundGap, y },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        draggable: false,
        selectable: true,
        data: {
          label: <MatchNodeCard match={match} hasRealRounds={hasRealRounds} />
        },
        className: `darkside-flow-match-node ${roundIndex === rounds.length - 1 ? "darkside-flow-final-node" : ""}`,
        type: "default"
      });

      const nextRound = rounds[roundIndex + 1];
      const nextMatch = nextRound?.matches?.[Math.floor(matchIndex / 2)];
      if (nextMatch) {
        edges.push({
          id: `edge-${match.id}-${nextMatch.id}`,
          source: nodeId,
          target: `match-${nextMatch.id}`,
          type: "smoothstep",
          animated: match.status === "IN_PROGRESS" || match.status === "READY",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: "rgba(24,230,242,0.72)"
          },
          style: {
            stroke: match.status === "COMPLETED" ? "rgba(64,255,145,0.62)" : "rgba(24,230,242,0.52)",
            strokeWidth: 2
          }
        });
      }
    });
  });

  return { nodes, edges };
}

export function BracketBoard({
  rounds,
  previewRegistrations
}: {
  rounds: RoundView[];
  previewRegistrations?: RegistrationView[];
}) {
  const hasRealRounds = rounds.length > 0;
  const visibleRounds = useMemo(
    () => (hasRealRounds ? rounds : buildPreviewRounds(previewRegistrations)),
    [hasRealRounds, previewRegistrations, rounds]
  );
  const champion = finalWinnerFromRounds(visibleRounds);
  const progress = bracketProgress(visibleRounds);
  const { nodes, edges } = useMemo(() => buildFlow(visibleRounds, hasRealRounds), [visibleRounds, hasRealRounds]);

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(24,230,242,0.13),transparent_28%),linear-gradient(180deg,rgba(10,16,25,0.92),rgba(4,7,11,0.98))] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#18e6f2]">Mapa competitivo</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Playoffs interactivos</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
            Explora las rondas con pan y zoom. Los nodos enlazan a salas de partida cuando el bracket real ya fue generado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-white/48">
          <span className="rounded-full border border-[#40ff91]/25 bg-[#40ff91]/8 px-3 py-1 text-[#b8ffd7]">Ganador</span>
          <span className="rounded-full border border-[#18e6f2]/25 bg-[#18e6f2]/8 px-3 py-1 text-[#bffaff]">Conectado</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Zoom</span>
        </div>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[18px] border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-white/45">
            <span>Progreso del bracket</span>
            <span>{progress.completed}/{progress.total}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-gradient-to-r from-[#18e6f2] via-[#40ff91] to-[#ff2438]" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-3 text-sm text-white/55">
            {champion ? "La final ya tiene ganador confirmado y el torneo puede cerrarse como completado." : "Los ganadores confirmados avanzan automaticamente a la siguiente ronda."}
          </p>
        </div>
        <div className={`rounded-[18px] border p-4 ${champion ? "border-[#40ff91]/30 bg-[#40ff91]/10" : "border-white/10 bg-black/20"}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">Campeon</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-[#18e6f2]/35 bg-[#18e6f2]/12 text-xs font-black text-[#d9fdff]">
              {teamInitials(champion ? registrationLabel(champion) : "?")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">{champion ? registrationLabel(champion) : "Pendiente"}</p>
              <p className="text-xs text-white/45">{champion ? "Ganador confirmado" : "Aun no definido"}</p>
            </div>
          </div>
        </div>
      </div>

      {!hasRealRounds ? (
        <div className="mb-5 flex flex-col gap-3 rounded-[18px] border border-[#18e6f2]/20 bg-[#18e6f2]/8 px-4 py-3 text-sm leading-6 text-[#bffaff] sm:flex-row sm:items-center sm:justify-between">
          <span>Bracket simulado para vista previa. Cuando el organizador genere las llaves reales, se reemplazara automaticamente.</span>
          <span className="shrink-0 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Preview</span>
        </div>
      ) : null}

      <MobileRoundCards rounds={visibleRounds} hasRealRounds={hasRealRounds} />

      <div className="darkside-flow-shell hidden h-[560px] min-h-[500px] overflow-hidden rounded-[22px] border border-white/10 bg-black/32 md:block">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.35}
          maxZoom={1.35}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnScroll
          proOptions={{ hideAttribution: true }}
          className="darkside-flow"
        >
          <Background color="rgba(24,230,242,0.14)" gap={28} size={1} />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>
      </div>
    </div>
  );
}
