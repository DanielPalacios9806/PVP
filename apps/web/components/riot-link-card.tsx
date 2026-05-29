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
  verificationStatus?: string | null;
};

type RiotCheckResult = {
  ok: boolean;
  mode: string;
  account: {
    gameName: string;
    tagLine: string;
    platformRoute: string;
    regionalRoute: string;
    puuidPresent: boolean;
    summonerIdPresent: boolean;
  };
};

export function RiotLinkCard({ compact = false }: { compact?: boolean }) {
  const [accounts, setAccounts] = useState<RiotAccount[]>([]);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("mock");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<RiotCheckResult | null>(null);

  async function loadAccounts() {
    try {
      const [accountsResponse, statusResponse] = await Promise.all([
        fetch(`${apiUrl}/riot/accounts/me`, {
          headers: getAuthHeaders()
        }),
        fetch(`${apiUrl}/riot/status`, {
          headers: getAuthHeaders()
        })
      ]);
      const data = await accountsResponse.json();
      const status = await statusResponse.json();
      if (accountsResponse.ok && Array.isArray(data)) {
        setAccounts(data);
      }
      if (statusResponse.ok && status.mode) {
        setMode(status.mode);
      }
    } catch {
      setAccounts([]);
    }
  }

  useEffect(() => {
    void loadAccounts();
  }, []);

  async function checkAccount(form: HTMLFormElement | null) {
    if (!form) {
      return;
    }

    const formData = new FormData(form);
    setChecking(true);
    setMessage("");
    setCheckResult(null);

    try {
      const response = await fetch(`${apiUrl}/riot/accounts/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          gameName: String(formData.get("gameName") || ""),
          tagLine: String(formData.get("tagLine") || ""),
          platformRoute: "LA1",
          regionalRoute: "AMERICAS"
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "No se pudo validar ese Riot ID.");
        return;
      }

      setCheckResult(data);
      setMessage(data.mode === "mock" ? "Riot ID validado en modo mock." : "Riot ID validado desde Riot API en backend.");
    } catch {
      setMessage("No se pudo conectar con la API Riot del backend.");
    } finally {
      setChecking(false);
    }
  }

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
        setMessage(data.message ?? "No se pudo vincular Riot ID.");
        return;
      }

      setMessage(mode === "mock" ? "Riot ID vinculado manualmente en modo mock." : "Riot ID verificado desde backend.");
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
          <p className="page-kicker">Riot ID</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {primaryAccount ? "Riot ID vinculado" : "Completa tu perfil competitivo"}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/62">
            {primaryAccount
              ? "Tu Riot ID queda asociado a Darkside.cool. La verificacion oficial con Riot Sign On se activara solo cuando exista aprobacion de produccion."
              : "Valida y vincula tu Riot ID desde backend. La API key se mantiene protegida en Render/API y nunca se expone al frontend."}
          </p>
        </div>
        <span className="status-badge status-open">RIOT_API_MODE={mode}</span>
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
              {primaryAccount.verificationStatus ?? (primaryAccount.verified ? "VERIFIED" : "MANUAL")}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 grid gap-3 md:grid-cols-[1fr_0.65fr_auto_auto]">
          <input name="gameName" placeholder="Nombre Riot" required />
          <input name="tagLine" placeholder="Tagline, ej. LAN" required />
          <button
            className="btn-secondary rounded-[10px] !px-4"
            disabled={checking || loading}
            type="button"
            onClick={(event) => void checkAccount(event.currentTarget.form)}
          >
            {checking ? "Validando..." : "Validar"}
          </button>
          <button className="btn-primary rounded-[10px]" disabled={loading || checking}>
            {loading ? "Vinculando..." : "Vincular"}
          </button>
        </form>
      )}

      {checkResult ? (
        <div className="mt-4 rounded-2xl border border-[#18e6f2]/25 bg-[#18e6f2]/10 p-4 text-sm text-[#bffaff]">
          <p className="font-semibold">
            {checkResult.account.gameName}#{checkResult.account.tagLine} validado para {checkResult.account.platformRoute}/{checkResult.account.regionalRoute}
          </p>
          <p className="mt-1 text-white/65">
            Modo: {checkResult.mode}. PUUID: {checkResult.account.puuidPresent ? "detectado" : "pendiente"}.
          </p>
        </div>
      ) : null}

      {message ? <p className="mt-4 text-sm text-[#43d3ff]">{message}</p> : null}
    </section>
  );
}
