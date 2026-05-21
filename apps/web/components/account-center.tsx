"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { clearSession, getStoredUser, getStoredWallet, persistSession, type AppRole } from "../lib/session";
import { RiotLinkCard } from "./riot-link-card";
import { SectionCard } from "./section-card";

const roleOptions: Array<{ role: AppRole; label: string; description: string }> = [
  {
    role: "USER",
    label: "Jugador",
    description: "Explora torneos, participa y recarga tokens internos."
  },
  {
    role: "MODERATOR",
    label: "Moderacion",
    description: "Revisa disputas y valida incidencias competitivas."
  },
  {
    role: "ORGANIZER",
    label: "Organizador",
    description: "Publica torneos, aprueba inscripciones y opera brackets."
  },
  {
    role: "ADMIN",
    label: "Administracion",
    description: "Gestiona torneos, brackets, auditoria y control interno."
  }
];

export function AccountCenter() {
  const [user, setUser] = useState(getStoredUser());
  const [wallet, setWallet] = useState(getStoredWallet());
  const [message, setMessage] = useState("");

  useEffect(() => {
    setUser(getStoredUser());
    setWallet(getStoredWallet());
  }, []);

  function switchRole(role: AppRole) {
    const nextUser = {
      id: user?.id ?? "local-user",
      email: user?.email ?? "demo@arena.local",
      username: user?.username ?? "demo",
      displayName: user?.displayName ?? "Jugador Demo",
      role
    };

    persistSession({ user: nextUser, wallet });
    setUser(nextUser);
    setMessage(`La vista actual cambio a ${roleOptions.find((item) => item.role === role)?.label}.`);
  }

  async function logout() {
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders()
      });
    } catch {
      // Keep local logout resilient in mock mode.
    }

    clearSession();
    setUser(null);
    setWallet({ balance: 100, currencyCode: "TOKENS" });
    setMessage("Sesion cerrada correctamente en este entorno.");
  }

  return (
    <div className="space-y-6">
      <RiotLinkCard />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title="Cuenta" description="Resumen de la cuenta actual y su saldo interno.">
        <div className="space-y-5">
          <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
            <p className="eyebrow">Perfil actual</p>
            <h3 className="mt-3 text-2xl font-semibold">{user?.displayName || user?.username || "Invitado"}</h3>
            <p className="mt-2 text-sm text-white/70">{user?.email || "Sin correo configurado"}</p>
            <div className="mt-4 inline-flex rounded-full border border-brand-cyan/30 px-3 py-1 text-xs text-brand-cyan">
              {roleOptions.find((item) => item.role === (user?.role ?? "USER"))?.label ?? "Jugador"}
            </div>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,79,99,0.12),rgba(47,107,255,0.12))] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/25">
                <Image src="/assets/icons/monedas.svg" alt="Tokens" width={22} height={22} />
              </div>
              <div>
                <p className="eyebrow">Saldo interno</p>
                <strong className="mt-2 block text-2xl">{wallet.balance} {wallet.currencyCode}</strong>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/auth/login" className="btn-secondary !px-4 !py-2 !text-xs">
              Iniciar sesion
            </Link>
            <Link href="/auth/register" className="btn-primary !px-4 !py-2 !text-xs">
              Crear cuenta
            </Link>
            <button onClick={logout} className="btn-secondary !px-4 !py-2 !text-xs" type="button">
              Cerrar sesion
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Perfil de acceso" description="Revisa como se comporta la plataforma para jugador, moderacion y administracion.">
        <div className="space-y-4">
          {roleOptions.map((option) => (
            <button
              key={option.role}
              onClick={() => switchRole(option.role)}
              className="w-full rounded-[26px] border border-white/10 bg-black/20 p-5 text-left transition hover:border-brand-cyan/40"
            >
              <div className="flex items-center justify-between gap-3">
                <strong className="text-lg uppercase tracking-[0.06em]">{option.label}</strong>
                <span className="text-xs text-brand-cyan">{option.role}</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/72">{option.description}</p>
            </button>
          ))}
          {message ? <p className="text-sm text-brand-cyan">{message}</p> : null}
        </div>
      </SectionCard>
      </div>
    </div>
  );
}
