"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { SectionCard } from "./section-card";

type RiotOverview = {
  config: {
    mode: string;
    apiKeyConfigured: boolean;
    region: string;
    regionalRoute: string;
    callbackUrlConfigured: boolean;
    tournamentProviderIdConfigured: boolean;
    tournamentApiEnabled: boolean;
    readyForAccountLookup?: boolean;
    readyForTournamentCodes?: boolean;
    rsoClientIdConfigured?: boolean;
    rsoRedirectUriConfigured?: boolean;
    readyForOfficialRso?: boolean;
    realRequestsEnabled?: boolean;
    missingRequirements?: string[];
  };
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    successRate: number;
    codeCount: number;
    callbackCount: number;
    pendingCallbacks: number;
  };
  errorsByType: { errorType: string | null; count: number }[];
  recentErrors: {
    id: string;
    endpoint: string;
    method: string;
    statusCode?: number | null;
    errorType?: string | null;
    errorMessage?: string | null;
    createdAt: string;
  }[];
};

type CapabilityBlock<T = Record<string, unknown>> = {
  status: string;
  message?: string;
  statusCode?: number;
  errorType?: string;
  data?: T;
};

type RiotCapabilities = {
  ok: boolean;
  mode: string;
  requestedRiotId?: string;
  platformRoute?: string;
  regionalRoute?: string;
  message?: string;
  accountV1?: CapabilityBlock<{ gameName?: string; tagLine?: string; puuidPresent?: boolean }>;
  summonerV4?: CapabilityBlock<{ profileIconId?: number | null; summonerLevel?: number | null; summonerIdPresent?: boolean; puuidPresent?: boolean }>;
  leagueV4?: CapabilityBlock<{ queues?: { queueType: string; label: string; tier: string; rank: string; leaguePoints: number; wins: number; losses: number; winRate: number }[] }>;
  matchV5?: CapabilityBlock<{ recentMatches?: number; sampleMatchIds?: string[] }>;
  matchDetailV5?: CapabilityBlock<{ matchId?: string; championName?: string | null; position?: string | null; result?: string; kills?: number | null; deaths?: number | null; assists?: number | null; kda?: number | null }>;
  rso?: CapabilityBlock;
  tournamentCodes?: CapabilityBlock;
};

export function AdminRiotPanel() {
  const [overview, setOverview] = useState<RiotOverview | null>(null);
  const [capabilities, setCapabilities] = useState<RiotCapabilities | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingCapabilities, setCheckingCapabilities] = useState(false);

  async function load() {
    try {
      const response = await fetch(`${apiUrl}/admin/riot/overview`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo cargar Riot API.");
      }

      setOverview(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar Riot API.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function testConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/admin/riot/test-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          gameName: String(form.get("gameName") || "") || undefined,
          tagLine: String(form.get("tagLine") || "") || undefined
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "La prueba Riot fallo de forma segura.");
      }

      setMessage(data.message ?? (data.ok ? "Prueba Riot completada." : "Prueba Riot sin llamada externa."));
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo probar Riot API.");
    } finally {
      setLoading(false);
    }
  }

  async function checkCapabilities(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setCheckingCapabilities(true);
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/riot/capabilities/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          gameName: String(form.get("gameName") || ""),
          tagLine: String(form.get("tagLine") || ""),
          platformRoute: String(form.get("platformRoute") || "LA1"),
          regionalRoute: String(form.get("regionalRoute") || "AMERICAS")
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudo revisar compatibilidad Riot.");
      }

      setCapabilities(data);
      setMessage(data.ok ? "Compatibilidad Riot revisada." : data.message ?? "Revisión Riot finalizada con advertencias.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo revisar compatibilidad Riot.");
    } finally {
      setCheckingCapabilities(false);
    }
  }

  const soloQueue = capabilities?.leagueV4?.data?.queues?.find((queue) => queue.queueType === "RANKED_SOLO_5x5");
  const flexQueue = capabilities?.leagueV4?.data?.queues?.find((queue) => queue.queueType === "RANKED_FLEX_SR");

  return (
    <SectionCard
      title="Riot API"
      description="Estado de integracion server-side. La API key nunca se muestra ni se expone al frontend."
    >
      {message ? <p className="mb-4 rounded-2xl border border-[#18e6f2]/25 bg-[#18e6f2]/10 px-4 py-3 text-sm text-[#bffaff]">{message}</p> : null}

      <div className="grid gap-3 md:grid-cols-3">
        <RiotMetric label="Modo" value={overview?.config.mode ?? "Cargando"} />
        <RiotMetric label="API key" value={overview?.config.apiKeyConfigured ? "Configurada" : "No configurada"} />
        <RiotMetric label="Region" value={`${overview?.config.region ?? "la1"} / ${overview?.config.regionalRoute ?? "americas"}`} />
        <RiotMetric label="Lookup Riot ID" value={overview?.config.readyForAccountLookup ? "Listo" : "Pendiente"} />
        <RiotMetric label="RSO oficial" value={overview?.config.readyForOfficialRso ? "Configurado" : "Pendiente Riot"} />
        <RiotMetric label="Tournament codes" value={overview?.config.readyForTournamentCodes ? "Listo" : "Desactivado"} />
        <RiotMetric label="Requests" value={String(overview?.metrics.totalRequests ?? 0)} />
        <RiotMetric label="Exito" value={`${overview?.metrics.successRate ?? 0}%`} />
        <RiotMetric label="Callbacks" value={String(overview?.metrics.callbackCount ?? 0)} />
      </div>

      <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100/90">
        El lookup de Riot ID confirma existencia de cuenta, no propiedad. La vinculacion oficial requiere Riot Sign On aprobado por Riot.
        {overview?.config.missingRequirements?.length ? (
          <span className="mt-2 block text-xs text-amber-100/70">Pendiente: {overview.config.missingRequirements.join(", ")}</span>
        ) : null}
      </div>

      <form onSubmit={testConnection} className="mt-5 grid gap-3 md:grid-cols-[1fr_0.55fr_auto]">
        <input name="gameName" placeholder="Riot game name para prueba segura" />
        <input name="tagLine" placeholder="Tagline" />
        <button className="btn-primary rounded-[12px]" disabled={loading}>
          {loading ? "Probando..." : "Probar conexion"}
        </button>
      </form>

      <div className="mt-6 rounded-[26px] border border-[#18e6f2]/18 bg-[#06111d]/80 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.34)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="page-kicker">Compatibility spike</p>
            <h3 className="mt-2 text-2xl font-black text-white">Mapa real de compatibilidad Riot</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
              Usa una cuenta de prueba para comprobar Account-V1, Summoner-V4, League-V4 y Match-V5 antes de diseñar automatizaciones.
            </p>
          </div>
        </div>

        <form onSubmit={checkCapabilities} className="mt-5 grid gap-3 md:grid-cols-[1fr_0.45fr_0.4fr_0.55fr_auto]">
          <input name="gameName" defaultValue="Palax" placeholder="Riot game name" />
          <input name="tagLine" defaultValue="LAN" placeholder="Tagline" />
          <input name="platformRoute" defaultValue="LA1" placeholder="LA1" />
          <input name="regionalRoute" defaultValue="AMERICAS" placeholder="AMERICAS" />
          <button className="btn-primary rounded-[12px]" disabled={checkingCapabilities}>
            {checkingCapabilities ? "Revisando..." : "Revisar APIs"}
          </button>
        </form>

        {capabilities ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <CapabilityCard title="Account-V1" block={capabilities.accountV1} detail={capabilities.accountV1?.data?.puuidPresent ? "PUUID disponible" : "Sin PUUID"} />
              <CapabilityCard title="Summoner-V4" block={capabilities.summonerV4} detail={capabilities.summonerV4?.data?.summonerLevel ? `Nivel ${capabilities.summonerV4.data.summonerLevel}` : "Perfil LoL"} />
              <CapabilityCard title="League-V4" block={capabilities.leagueV4} detail={soloQueue ? `${soloQueue.tier} ${soloQueue.rank} · ${soloQueue.leaguePoints} LP` : flexQueue ? `${flexQueue.tier} ${flexQueue.rank} · ${flexQueue.leaguePoints} LP` : "Ranked"} />
              <CapabilityCard title="Match-V5" block={capabilities.matchV5} detail={`${capabilities.matchV5?.data?.recentMatches ?? 0} partidas`} />
              <CapabilityCard title="Match detail" block={capabilities.matchDetailV5} detail={capabilities.matchDetailV5?.data?.championName ? `${capabilities.matchDetailV5.data.championName} · ${capabilities.matchDetailV5.data.result}` : "Detalle"} />
              <CapabilityCard title="RSO" block={capabilities.rso} detail="Requiere aprobacion" />
              <CapabilityCard title="Tournament Codes" block={capabilities.tournamentCodes} detail="Futuro" />
              <CapabilityCard title="Riot ID" block={{ status: capabilities.ok ? "ok" : "unavailable" }} detail={capabilities.requestedRiotId ?? "Sin Riot ID"} />
            </div>

            {capabilities.leagueV4?.data?.queues?.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {capabilities.leagueV4.data.queues.map((queue) => (
                  <article key={queue.queueType} className="rounded-2xl border border-white/10 bg-black/24 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#18e6f2]">{queue.label}</p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <strong className="text-2xl text-white">{queue.tier} {queue.rank}</strong>
                      <span className="text-sm text-white/60">{queue.leaguePoints} LP</span>
                    </div>
                    <p className="mt-2 text-sm text-white/55">{queue.wins}V / {queue.losses}D · winrate {queue.winRate}%</p>
                  </article>
                ))}
              </div>
            ) : null}

            {capabilities.matchDetailV5?.data ? (
              <article className="rounded-2xl border border-white/10 bg-black/24 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#18e6f2]">Partida de muestra</p>
                <div className="mt-3 grid gap-3 md:grid-cols-5">
                  <RiotMetric label="Match" value={capabilities.matchDetailV5.data.matchId ?? "n/a"} />
                  <RiotMetric label="Campeon" value={capabilities.matchDetailV5.data.championName ?? "n/a"} />
                  <RiotMetric label="Resultado" value={capabilities.matchDetailV5.data.result === "win" ? "Victoria" : "Derrota"} />
                  <RiotMetric label="KDA" value={`${capabilities.matchDetailV5.data.kills ?? 0}/${capabilities.matchDetailV5.data.deaths ?? 0}/${capabilities.matchDetailV5.data.assists ?? 0}`} />
                  <RiotMetric label="Posicion" value={capabilities.matchDetailV5.data.position ?? "n/a"} />
                </div>
              </article>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="page-kicker">Errores por tipo</p>
          <div className="mt-4 space-y-2 text-sm text-white/70">
            {overview?.errorsByType.length ? overview.errorsByType.map((item) => (
              <div key={item.errorType ?? "unknown"} className="flex items-center justify-between gap-3">
                <span>{item.errorType ?? "UNKNOWN"}</span>
                <strong className="text-white">{item.count}</strong>
              </div>
            )) : <p>No hay errores Riot registrados.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="page-kicker">Ultimos errores</p>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            {overview?.recentErrors.length ? overview.recentErrors.slice(0, 5).map((item) => (
              <article key={item.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-white">{item.errorType ?? "RIOT_ERROR"}</strong>
                  <span className="text-xs text-white/45">{item.statusCode ?? "n/a"}</span>
                </div>
                <p className="mt-1 truncate text-xs">{item.method} {item.endpoint}</p>
              </article>
            )) : <p>No hay errores recientes.</p>}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function RiotMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/42">{label}</p>
      <strong className="mt-2 block break-words text-white">{value}</strong>
    </div>
  );
}

function CapabilityCard({ title, block, detail }: { title: string; block?: CapabilityBlock; detail: string }) {
  const status = block?.status ?? "skipped";
  const ok = status === "ok";
  const warning = status === "empty" || status === "not_configured" || status === "skipped";
  const className = ok
    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
    : warning
      ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
      : "border-rose-400/25 bg-rose-400/10 text-rose-100";

  return (
    <article className={`rounded-2xl border p-4 ${className}`}>
      <p className="text-xs uppercase tracking-[0.18em] opacity-70">{title}</p>
      <strong className="mt-2 block text-lg uppercase">{status.replace(/_/g, " ")}</strong>
      <p className="mt-1 text-xs opacity-75">{block?.message ?? detail}</p>
    </article>
  );
}
