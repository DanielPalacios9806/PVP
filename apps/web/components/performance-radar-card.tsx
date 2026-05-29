"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { RiotMatchSummary } from "./riot-match-history";
import type { RiotRankQueue } from "./riot-rank-card";

interface PerformanceRadarCardProps {
  matches?: RiotMatchSummary[];
  queues?: RiotRankQueue[];
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function PerformanceRadarCard({ matches = [], queues = [] }: PerformanceRadarCardProps) {
  const kills = average(matches.map((match) => Number(match.kills ?? 0)));
  const assists = average(matches.map((match) => Number(match.assists ?? 0)));
  const deaths = average(matches.map((match) => Number(match.deaths ?? 0)));
  const winRate = matches.length ? Math.round((matches.filter((match) => match.result === "win").length / matches.length) * 100) : queues[0]?.winRate ?? 0;
  const kda = average(matches.map((match) => Number(match.kda ?? 0)));

  const data = [
    { metric: "K/D", value: Math.min(kda * 22, 100) },
    { metric: "Kills", value: Math.min(kills * 9, 100) },
    { metric: "Asist.", value: Math.min(assists * 7, 100) },
    { metric: "Win%", value: winRate },
    { metric: "FKPR", value: Math.max(100 - deaths * 9, 10) }
  ];

  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-[#0d1421] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/48">Estadisticas de rendimiento</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Perfil de juego</h3>
        </div>
        <span className="rounded-full border border-[#18e6f2]/20 bg-[#18e6f2]/8 px-3 py-1 text-xs font-bold text-[#bffaff]">Recharts</span>
      </div>

      <div className="mt-4 h-[250px] min-h-[250px] w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height={250} minWidth={220}>
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="rgba(255,255,255,0.15)" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: 700 }} />
            <Radar dataKey="value" stroke="#18e6f2" fill="#18e6f2" fillOpacity={0.32} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
          <p className="text-white/42">KDA prom.</p>
          <strong className="text-white">{kda.toFixed(2)}</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
          <p className="text-white/42">Winrate</p>
          <strong className="text-white">{winRate}%</strong>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/24 p-3">
          <p className="text-white/42">Muestras</p>
          <strong className="text-white">{matches.length}</strong>
        </div>
      </div>
    </article>
  );
}
