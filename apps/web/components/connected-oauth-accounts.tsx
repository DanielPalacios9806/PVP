"use client";

import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";

type ConnectedAccount = {
  id: string;
  provider: "GOOGLE" | "FACEBOOK";
  email: string;
  emailVerified: boolean;
  displayName?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
};

const providerLabels: Record<ConnectedAccount["provider"], string> = {
  GOOGLE: "Google",
  FACEBOOK: "Facebook"
};

export function ConnectedOAuthAccounts() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/auth/oauth/accounts`, {
      headers: getAuthHeaders()
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: ConnectedAccount[]) => setAccounts(data))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Cuentas conectadas</p>
          <h4 className="mt-2 text-lg font-semibold uppercase">Google / Facebook</h4>
        </div>
        <span className="rounded-full border border-brand-cyan/25 px-3 py-1 text-xs text-brand-cyan">
          {loading ? "..." : accounts.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-sm text-white/60">Sincronizando proveedores...</p>
        ) : accounts.length ? (
          accounts.map((account) => (
            <div key={account.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm uppercase tracking-[0.08em]">
                  {providerLabels[account.provider]}
                </strong>
                <span className="text-xs text-brand-cyan">
                  {account.emailVerified ? "Correo verificado" : "Pendiente"}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/72">{account.displayName || account.email}</p>
              <p className="mt-1 text-xs text-white/45">{account.email}</p>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-white/62">
            Aun no has conectado Google o Facebook. Cuando los proveedores esten configurados, podras vincularlos iniciando sesion con el mismo correo.
          </p>
        )}
      </div>
    </div>
  );
}
