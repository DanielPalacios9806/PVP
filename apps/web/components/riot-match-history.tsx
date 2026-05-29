import Image from "next/image";
import { championIconUrl } from "@/lib/ddragon";

export interface RiotMatchSummary {
  matchId: string;
  gameMode?: string | null;
  championName?: string | null;
  result?: "win" | "loss" | string | null;
  kills?: number | null;
  deaths?: number | null;
  assists?: number | null;
  kda?: number | null;
  position?: string | null;
  durationSeconds?: number | null;
  endedAt?: string | null;
}

interface RiotMatchHistoryProps {
  matches?: RiotMatchSummary[];
  loading?: boolean;
}

function durationLabel(seconds?: number | null) {
  if (!seconds) return "--";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function timeAgo(value?: string | null) {
  if (!value) return "Reciente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Reciente";
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / 36e5));
  if (diffHours < 24) return `Hace ${diffHours}h`;
  return `Hace ${Math.round(diffHours / 24)}d`;
}

export function RiotMatchHistory({ matches = [], loading }: RiotMatchHistoryProps) {
  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-[#0d1421] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/48">Partidos recientes</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Historial Riot</h3>
        </div>
        <span className="rounded-full border border-[#18e6f2]/25 bg-[#18e6f2]/10 px-3 py-1 text-xs font-black text-[#bffaff]">Match-V5</span>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[72px] animate-pulse rounded-2xl bg-white/8" />)
        ) : matches.length ? (
          matches.slice(0, 5).map((match) => {
            const isWin = match.result === "win";
            return (
              <div key={match.matchId} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-3 transition hover:border-[#18e6f2]/30 hover:bg-white/[0.075]">
                <div className={`absolute left-0 top-0 h-full w-1 ${isWin ? "bg-[#18e6f2]" : "bg-[#ff2941]"}`} />
                <div className="flex items-center gap-3 pl-1">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_0_18px_rgba(0,0,0,0.3)]">
                    <Image src={championIconUrl(match.championName)} alt={match.championName ?? "Champion"} fill sizes="48px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <strong className={isWin ? "text-[#18e6f2]" : "text-[#ff6b7a]"}>{isWin ? "VICTORIA" : "DERROTA"}</strong>
                      <span className="text-sm font-black text-white">{match.championName ?? "Campeon"}</span>
                      <span className="rounded-full border border-white/10 bg-black/22 px-2 py-0.5 text-[0.68rem] font-bold uppercase text-white/46">{match.position ?? match.gameMode ?? "LoL"}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-white/38">{match.matchId} · {timeAgo(match.endedAt)}</p>
                  </div>
                  <div className="text-right">
                    <strong className="text-xl text-white">{match.kills ?? 0}/{match.deaths ?? 0}/{match.assists ?? 0}</strong>
                    <p className="text-xs text-white/42">KDA {match.kda ?? "--"} · {durationLabel(match.durationSeconds)}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/8 p-4 text-sm text-white/60">
            Valida Riot ID para cargar partidas recientes con Match-V5.
          </div>
        )}
      </div>
    </article>
  );
}
