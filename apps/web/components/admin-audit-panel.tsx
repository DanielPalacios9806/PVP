"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { SectionCard } from "./section-card";

type AuditActor = {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  role: string;
} | null;

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  module?: string;
  severity?: "info" | "warning" | "critical" | string;
  ipAddress?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  createdAt: string;
  actorUser?: AuditActor;
};

type AuditResponse = {
  logs: AuditLog[];
  summary?: {
    total: number;
    byModule: Record<string, number>;
    bySeverity: Record<string, number>;
  };
};

const moduleOptions = [
  { value: "", label: "Todos los modulos" },
  { value: "auth", label: "Auth" },
  { value: "admin", label: "Admin" },
  { value: "tokens", label: "Tokens" },
  { value: "tournaments", label: "Torneos" },
  { value: "matches", label: "Matches" },
  { value: "riot", label: "Riot" },
  { value: "teams", label: "Equipos" },
  { value: "spaces", label: "Spaces" },
  { value: "system", label: "Sistema" }
];

const severityLabels: Record<string, string> = {
  info: "Informativo",
  warning: "Atencion",
  critical: "Critico"
};

const severityClasses: Record<string, string> = {
  info: "border-[#18e6f2]/25 bg-[#18e6f2]/10 text-[#18e6f2]",
  warning: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  critical: "border-rose-400/35 bg-rose-500/10 text-rose-200"
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-EC", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function actorLabel(actor: AuditActor) {
  if (!actor) return "Sistema";
  return actor.displayName ?? actor.username ?? actor.email;
}

function stringifyPreview(value: unknown) {
  if (value === null || value === undefined) return "Sin datos";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "No se pudo mostrar el detalle.";
  }
}

export function AdminAuditPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<AuditResponse["summary"]>();
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedLog = useMemo(() => logs.find((log) => log.id === selectedLogId) ?? null, [logs, selectedLogId]);

  async function load() {
    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams({ limit: "100" });

      if (query.trim()) params.set("q", query.trim());
      if (module) params.set("module", module);
      if (criticalOnly) params.set("criticalOnly", "true");

      const response = await fetch(`${apiUrl}/admin/audit-logs?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      const data = (await response.json()) as AuditResponse | { message?: string };

      if (!response.ok) {
        throw new Error("message" in data ? data.message : "No se pudieron cargar los registros.");
      }

      setLogs(Array.isArray((data as AuditResponse).logs) ? (data as AuditResponse).logs : []);
      setSummary((data as AuditResponse).summary);
      setSelectedLogId(null);
    } catch (error) {
      setLogs([]);
      setSummary(undefined);
      setMessage(error instanceof Error ? error.message : "No se pudieron cargar los registros de auditoria.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const criticalCount = summary?.bySeverity?.critical ?? logs.filter((log) => log.severity === "critical").length;
  const warningCount = summary?.bySeverity?.warning ?? logs.filter((log) => log.severity === "warning").length;
  const total = summary?.total ?? logs.length;

  return (
    <SectionCard title="Auditoria operativa" description="Trazabilidad de acciones criticas, cambios administrativos y eventos competitivos.">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Eventos cargados</p>
          <strong className="mt-2 block text-2xl text-white">{total}</strong>
        </div>
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-rose-200/70">Criticos</p>
          <strong className="mt-2 block text-2xl text-rose-100">{criticalCount}</strong>
        </div>
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-100/70">Atencion</p>
          <strong className="mt-2 block text-2xl text-amber-100">{warningCount}</strong>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void load();
          }}
          placeholder="Buscar accion, entidad, usuario o correo..."
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[#18e6f2]/50"
        />
        <select
          value={module}
          onChange={(event) => setModule(event.target.value)}
          className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-[#18e6f2]/50"
        >
          {moduleOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#08111f] text-white">
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-2xl bg-[#18e6f2] px-5 py-3 text-sm font-semibold text-[#07111f] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Cargando..." : "Filtrar"}
        </button>
      </div>

      <label className="mt-3 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/70">
        <input type="checkbox" checked={criticalOnly} onChange={(event) => setCriticalOnly(event.target.checked)} />
        Ver solo eventos criticos
      </label>

      {message ? <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-200">{message}</p> : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-3">
          {logs.length === 0 ? <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">Aun no hay registros disponibles con los filtros actuales.</p> : null}
          {logs.map((log) => {
            const severity = log.severity ?? "info";
            const active = selectedLogId === log.id;

            return (
              <button
                type="button"
                key={log.id}
                onClick={() => setSelectedLogId(active ? null : log.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  active ? "border-[#18e6f2]/50 bg-[#18e6f2]/10" : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${severityClasses[severity] ?? severityClasses.info}`}>
                        {severityLabels[severity] ?? severity}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/50">
                        {log.module ?? "system"}
                      </span>
                    </div>
                    <strong className="mt-3 block text-sm text-white">{log.action}</strong>
                    <p className="mt-1 text-xs text-white/50">
                      {log.entityType} {log.entityId ? `#${log.entityId}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-white/45">{formatDate(log.createdAt)}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/50">
                  <span>Actor: {actorLabel(log.actorUser ?? null)}</span>
                  <span>Rol: {log.actorUser?.role ?? "sistema"}</span>
                  <span>IP: {log.ipAddress ?? "n/a"}</span>
                </div>
              </button>
            );
          })}
        </div>

        <aside className="rounded-3xl border border-white/10 bg-black/30 p-5">
          {selectedLog ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#18e6f2]">Detalle tecnico</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{selectedLog.action}</h3>
                <p className="mt-1 text-xs text-white/45">ID: {selectedLog.id}</p>
              </div>
              <div className="grid gap-3 text-sm text-white/70">
                <p><span className="text-white/40">Actor:</span> {actorLabel(selectedLog.actorUser ?? null)}</p>
                <p><span className="text-white/40">Entidad:</span> {selectedLog.entityType}</p>
                <p><span className="text-white/40">Fecha:</span> {formatDate(selectedLog.createdAt)}</p>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">Antes</p>
                <pre className="max-h-44 overflow-auto rounded-2xl border border-white/10 bg-[#050912] p-3 text-xs text-white/60">{stringifyPreview(selectedLog.before)}</pre>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">Despues</p>
                <pre className="max-h-44 overflow-auto rounded-2xl border border-white/10 bg-[#050912] p-3 text-xs text-white/60">{stringifyPreview(selectedLog.after)}</pre>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">Metadata</p>
                <pre className="max-h-44 overflow-auto rounded-2xl border border-white/10 bg-[#050912] p-3 text-xs text-white/60">{stringifyPreview(selectedLog.metadata)}</pre>
              </div>
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <div className="rounded-full border border-[#18e6f2]/25 bg-[#18e6f2]/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#18e6f2]">Audit trail</div>
              <h3 className="mt-4 text-lg font-semibold text-white">Selecciona un evento</h3>
              <p className="mt-2 max-w-xs text-sm text-white/50">Revisa el antes, despues y metadata de cada accion critica sin exponer informacion innecesaria al usuario final.</p>
            </div>
          )}
        </aside>
      </div>
    </SectionCard>
  );
}
