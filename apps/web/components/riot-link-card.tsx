"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/config";

type RiotAccount = {
  id: string;
  riotGameName?: string | null;
  riotTagLine?: string | null;
  puuid?: string | null;
  platformRoute?: string | null;
  regionalRoute?: string | null;
  verified: boolean;
};

export function RiotLinkCard({ compact = false }: { compact?: boolean }) {
  const [accounts, setAccounts] = useState<RiotAccount[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAccounts() {
    try {
      const response = await fetch(`${apiUrl}/riot/accounts/me`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setAccounts(data);
      }
    } catch {
      setAccounts([]);
    }
  }

  useEffect(() => {
    void loadAccounts();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/riot/accounts/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          gameName: String(form.get("gameName")),
          tagLine: String(form.get("tagLine")),
          game: "LEAGUE_OF_LEGENDS",
          platformRoute: "LA1",
          regionalRoute: "AMERICAS"
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "No se pudo vincular Riot ID en modo mock.");
        return;
      }

      setMessage("Riot ID vinculado en modo mock.");
      await loadAccounts();
    } catch {
      setMessage("No se pudo conectar con la API.");
    } finally {
      setLoading(false);
    }
  }

  const primaryAccount = accounts[0];

  return (
    <section className={`surface-panel ${compact ? "p-5" : "p-6"}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="page-kicker">Riot mock</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {primaryAccount ? "Riot ID vinculado" : "Completa tu perfil competitivo"}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/62">
            {primaryAccount
              ? "Esta vinculacion es simulada para probar el flujo antes de solicitar API oficial."
              : "Vincula un Riot ID simulado para probar perfiles, codigos mock y resultados automaticos sin exponer llaves reales."}
          </p>
        </div>
        <span className="status-badge status-open">RIOT_MODE=mock</span>
      </div>

      {primaryAccount ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="surface-tile">
            <p className="text-xs uppercase tracking-[0.18em] text-white/38">Riot ID</p>
            <p className="mt-2 font-semibold text-white">
              {primaryAccount.riotGameName}#{primaryAccount.riotTagLine}
            </p>
          </div>
          <div className="surface-tile">
            <p className="text-xs uppercase tracking-[0.18em] text-white/38">Region</p>
            <p className="mt-2 font-semibold text-white">
              {primaryAccount.platformRoute ?? "LA1"} / {primaryAccount.regionalRoute ?? "AMERICAS"}
            </p>
          </div>
          <div className="surface-tile">
            <p className="text-xs uppercase tracking-[0.18em] text-white/38">Estado</p>
            <p className="mt-2 font-semibold text-white">
              {primaryAccount.verified ? "Verificado mock" : "Pendiente"}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 grid gap-3 md:grid-cols-[1fr_0.65fr_auto]">
          <input name="gameName" placeholder="Nombre Riot" required />
          <input name="tagLine" placeholder="Tagline, ej. LAN" required />
          <button className="btn-primary rounded-[10px]" disabled={loading}>
            {loading ? "Vinculando..." : "Vincular"}
          </button>
        </form>
      )}

      {message ? <p className="mt-4 text-sm text-[#43d3ff]">{message}</p> : null}
    </section>
  );
}
