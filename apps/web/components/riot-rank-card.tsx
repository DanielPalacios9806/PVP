import Image from "next/image";
import { formatRank, queueLabel, rankIconUrl, winRate } from "@/lib/ddragon";

export interface RiotRankQueue {
  queueType: string;
  label?: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  winRate?: number;
  hotStreak?: boolean;
  inactive?: boolean;
}

interface RiotRankCardProps {
  queues?: RiotRankQueue[];
  loading?: boolean;
}

function pickPrimaryQueue(queues: RiotRankQueue[] = []) {
  return queues.find((queue) => queue.queueType === "RANKED_SOLO_5X5") ?? queues.find((queue) => queue.queueType === "RANKED_SOLO_5x5") ?? queues[0] ?? null;
}

export function RiotRankCard({ queues = [], loading }: RiotRankCardProps) {
  const primary = pickPrimaryQueue(queues);
  const flex = queues.find((queue) => queue.queueType === "RANKED_FLEX_SR");

  if (loading) {
    return (
      <article className="rounded-[1.6rem] border border-white/10 bg-[#0d1421] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/48">Ranking actual</p>
        <div className="mt-4 h-28 animate-pulse rounded-2xl bg-white/8" />
      </article>
    );
  }

  if (!primary) {
    return (
      <article className="rounded-[1.6rem] border border-white/10 bg-[#0d1421] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/48">Ranking actual</p>
        <div className="mt-4 flex items-center gap-4">
          <Image src={rankIconUrl("unranked")} alt="Unranked" width={74} height={74} className="drop-shadow-[0_0_22px_rgba(24,230,242,0.2)]" />
          <div>
            <strong className="text-2xl font-black text-white">Pendiente</strong>
            <p className="mt-1 text-sm text-white/58">Valida Riot ID para cargar League API.</p>
          </div>
        </div>
      </article>
    );
  }

  const primaryWinRate = primary.winRate ?? winRate(primary.wins, primary.losses);

  return (
    <article className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0d1421] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(24,230,242,0.2),transparent_34%),radial-gradient(circle_at_95%_0%,rgba(70,120,255,0.18),transparent_36%)]" />
      <div className="relative">
        <div className="flex items-start gap-4">
          <Image src={rankIconUrl(primary.tier)} alt={primary.tier} width={92} height={92} className="shrink-0 drop-shadow-[0_0_34px_rgba(24,230,242,0.3)]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/48">Ranking actual</p>
            <h3 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">{primary.tier} {primary.rank}</h3>
            <p className="text-sm font-semibold text-[#18e6f2]">{queueLabel(primary.queueType)} · {primary.leaguePoints} LP</p>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[#18e6f2] to-[#ff2941]" style={{ width: `${Math.min(Math.max(primary.leaguePoints, 8), 100)}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/42">
          <span>Siguiente division</span>
          <span>{100 - primary.leaguePoints} LP</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
            <p className="text-white/42">Winrate</p>
            <strong className="text-white">{primaryWinRate}%</strong>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
            <p className="text-white/42">Victorias</p>
            <strong className="text-white">{primary.wins}</strong>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
            <p className="text-white/42">Derrotas</p>
            <strong className="text-white">{primary.losses}</strong>
          </div>
        </div>

        {flex ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/8 p-3 text-sm text-white/68">
            Flex: <span className="font-semibold text-white">{formatRank(flex.tier, flex.rank, flex.leaguePoints)}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}
