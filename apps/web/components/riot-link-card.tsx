"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  metadata?: {
    verificationMethod?: string;
    ownershipVerified?: boolean;
    warning?: string;
  } | null;
};

type RiotStatus = {
  mode: string;
  readyForAccountLookup?: boolean;
  readyForOfficialRso?: boolean;
  realRequestsEnabled?: boolean;
};

type LookupResult = {
  ok: boolean;
  mode: string;
  ownershipVerified: boolean;
  verificationMethod: string;
  message: string;
  account: {
    gameName: string;
    tagLine: string;
    platformRoute: string;
    regionalRoute: string;
    puuidPresent: boolean;
    summonerIdPresent: boolean;
  };
};

function statusLabel(account?: RiotAccount | null) {
  if (!account) {
    return "No conectado";
  }

  if (account.verified && account.verificationStatus === "RSO_VERIFIED") {
    return "Vinculado oficialmente";
  }

  if (account.verificationStatus === "RSO_PENDING") {
    return "Validado tecnicamente";
  }

  return account.verificationStatus ?? "Validacion manual";
}

function statusDescription(account?: RiotAccount | null) {
  if (!account) {
    return "Valida tu Riot ID para pruebas internas. La propiedad oficial se confirmara con Riot Sign On cuando Riot apruebe el acceso.";
  }

  if (account.verified && account.verificationStatus === "RSO_VERIFIED") {
    return "Esta cuenta fue vinculada mediante Riot Sign On.";
  }

  return "Este Riot ID existe y fue guardado para pruebas internas, pero aun no confirma propiedad oficial de la cuenta.";
}

export function RiotLinkCard({ compact = false }: { compact?: boolean }) {
  const [accounts, setAccounts] = useState<RiotAccount[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<RiotStatus>({ mode: "mock" });
  const [loading, setLoading] = useState(false);
  const [lookup, setLookup] = useState<LookupResult | null>(null);

  const primaryAccount = accounts[0];
  const formDefaults = useMemo(
    () => ({
      gameName: lookup?.account.gameName ?? primaryAccount?.riotGameName ?? "",
      tagLine: lookup?.account.tagLine ?? primaryAccount?.riotTagLine ?? ""
    }),
    [lookup, primaryAccount]
  );

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
      const runtime = await statusResponse.json();
      if (accountsResponse.ok && Array.isArray(data)) {
        setAccounts(data);
      }
      if (statusResponse.ok && runtime.mode) {
        setStatus(runtime);
      }
    } catch {
      setAccounts([]);
    }
  }

  useEffect(() => {
    void loadAccounts();
  }, []);

  function readForm(form: FormData) {
    return {
      gameName: String(form.get("gameName") || "").trim(),
      tagLine: String(form.get("tagLine") || "").trim(),
      game: "LEAGUE_OF_LEGENDS",
      platformRoute: "LA1",
      regionalRoute: "AMERICAS"
    };
  }

  async function validateRiotId(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/riot/accounts/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(readForm(form))
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "No se pudo validar Riot ID.");
        return;
      }

      setLookup(data);
      setMessage("Riot ID encontrado. Esta validacion no confirma propiedad oficial de la cuenta.");
    } catch {
      setMessage("No se pudo conectar con la API Riot desde backend.");
    } finally {
      setLoading(false);
    }
  }

  async function saveTechnicalValidation() {
    const gameName = lookup?.account.gameName ?? primaryAccount?.riotGameName;
    const tagLine = lookup?.account.tagLine ?? primaryAccount?.riotTagLine;

    if (!gameName || !tagLine) {
      setMessage("Primero valida un Riot ID antes de guardar la validacion tecnica.");
      return;
    }

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
          gameName,
          tagLine,
          game: "LEAGUE_OF_LEGENDS",
          platformRoute: "LA1",
          regionalRoute: "AMERICAS"
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "No se pudo guardar la validacion tecnica.");
        return;
      }

      setMessage("Validacion tecnica guardada. Riot Sign On seguira pendiente para confirmar propiedad oficial.");
      await loadAccounts();
    } catch {
      setMessage("No se pudo conectar con la API.");
    } finally {
      setLoading(false);
    }
  }

  async function startRso() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/riot/rso/start`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setMessage(data.message ?? "Riot Sign On requiere aprobacion de Riot para activarse.");
    } catch {
      setMessage("No se pudo consultar el estado de Riot Sign On.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`surface-panel overflow-hidden ${compact ? "p-5" : "p-6"}`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#18e6f2] via-[#8b5cf6] to-[#ff3d81]" />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="page-kicker">Riot ID / RSO</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {primaryAccount ? "Perfil competitivo Riot" : "Prepara tu perfil competitivo"}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/62">{statusDescription(primaryAccount)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="status-badge status-open">RIOT_API_MODE={status.mode}</span>
          <span className="status-badge border-white/10 bg-white/8 text-white/70">
            RSO {status.readyForOfficialRso ? "configurado" : "pendiente"}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="surface-tile md:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-white/38">Riot ID</p>
          <p className="mt-2 font-semibold text-white">
            {primaryAccount ? `${primaryAccount.riotGameName}#${primaryAccount.riotTagLine}` : lookup ? `${lookup.account.gameName}#${lookup.account.tagLine}` : "Sin Riot ID"}
          </p>
        </div>
        <div className="surface-tile">
          <p className="text-xs uppercase tracking-[0.18em] text-white/38">Region</p>
          <p className="mt-2 font-semibold text-white">
            {primaryAccount?.platformRoute ?? lookup?.account.platformRoute ?? "LA1"} / {primaryAccount?.regionalRoute ?? lookup?.account.regionalRoute ?? "AMERICAS"}
          </p>
        </div>
        <div className="surface-tile">
          <p className="text-xs uppercase tracking-[0.18em] text-white/38">Estado</p>
          <p className="mt-2 font-semibold text-white">{statusLabel(primaryAccount)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100/90">
        Validar un Riot ID solo confirma que existe. La propiedad oficial requiere iniciar sesion en Riot mediante Riot Sign On cuando Riot apruebe el acceso de produccion.
      </div>

      <form onSubmit={validateRiotId} className="mt-5 grid gap-3 md:grid-cols-[1fr_0.65fr_auto]">
        <input name="gameName" placeholder="Nombre Riot" required defaultValue={formDefaults.gameName} />
        <input name="tagLine" placeholder="Tagline, ej. LAN" required defaultValue={formDefaults.tagLine} />
        <button className="btn-primary rounded-[10px]" disabled={loading}>
          {loading ? "Validando..." : "Validar Riot ID"}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="button" className="btn-secondary rounded-[10px]" onClick={saveTechnicalValidation} disabled={loading || !lookup}>
          Guardar validacion tecnica
        </button>
        <button type="button" className="rounded-[10px] border border-[#18e6f2]/35 bg-[#18e6f2]/10 px-4 py-2 text-sm font-semibold text-[#bffaff] hover:border-[#18e6f2]/70" onClick={startRso} disabled={loading}>
          Conectar con Riot
        </button>
      </div>

      {message ? <p className="mt-4 text-sm text-[#43d3ff]">{message}</p> : null}
    </section>
  );
}
