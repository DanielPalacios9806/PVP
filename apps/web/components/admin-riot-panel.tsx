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

export function AdminRiotPanel() {
  const [overview, setOverview] = useState<RiotOverview | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
        <RiotMetric label="Requests" value={String(overview?.metrics.totalRequests ?? 0)} />
        <RiotMetric label="Exito" value={`${overview?.metrics.successRate ?? 0}%`} />
        <RiotMetric label="Callbacks" value={String(overview?.metrics.callbackCount ?? 0)} />
      </div>

      <form onSubmit={testConnection} className="mt-5 grid gap-3 md:grid-cols-[1fr_0.55fr_auto]">
        <input name="gameName" placeholder="Riot game name para prueba segura" />
        <input name="tagLine" placeholder="Tagline" />
        <button className="btn-primary rounded-[12px]" disabled={loading}>
          {loading ? "Probando..." : "Probar conexion"}
        </button>
      </form>

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
