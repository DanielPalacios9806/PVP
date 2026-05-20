"use client";

import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { mockAuditLogs } from "../lib/mock-data";
import { SectionCard } from "./section-card";

export function AdminAuditPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const response = await fetch(`${apiUrl}/admin/audit-logs?limit=50`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudieron cargar los registros.");
      }

      setLogs(data);
    } catch {
      setLogs(mockAuditLogs);
      setMessage("");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <SectionCard title="Auditoria" description="Vista rapida de acciones criticas del sistema.">
      {message ? <p className="mb-4 text-sm text-amber-300">{message}</p> : null}
      <div className="space-y-3">
        {logs.length === 0 ? <p className="text-sm text-white/60">Aun no hay registros disponibles.</p> : null}
        {logs.map((log) => (
          <article key={log.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm">{log.action}</strong>
              <span className="text-xs text-white/50">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-white/70">
              {log.entityType} {log.entityId ? `#${log.entityId}` : ""}
            </p>
            <p className="mt-1 text-xs text-white/50">
              Actor: {log.actorUser?.username ?? "sistema"} | IP: {log.ipAddress ?? "n/a"}
            </p>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
