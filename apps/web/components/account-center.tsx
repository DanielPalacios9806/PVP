"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { clearSession, getStoredUser, getStoredWallet, type AppRole } from "../lib/session";
import { RiotLinkCard } from "./riot-link-card";
import { SectionCard } from "./section-card";

const roleLabels: Record<AppRole, string> = {
  USER: "Jugador",
  ORGANIZER: "Organizador",
  MODERATOR: "Moderacion",
  ADMIN: "Administracion",
  SUPER_ADMIN: "Super admin",
  FINANCE: "Finanzas"
};

export function AccountCenter() {
  const [user, setUser] = useState(getStoredUser());
  const [wallet, setWallet] = useState(getStoredWallet());
  const [message, setMessage] = useState("");

  useEffect(() => {
    setUser(getStoredUser());
    setWallet(getStoredWallet());
  }, []);

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
              {roleLabels[user?.role ?? "USER"]}
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
            {user ? (
              <button onClick={logout} className="btn-secondary !px-4 !py-2 !text-xs" type="button">
                Cerrar sesion
              </button>
            ) : (
              <>
                <Link href="/auth/login" className="btn-secondary !px-4 !py-2 !text-xs">
                  Iniciar sesion
                </Link>
                <Link href="/auth/register" className="btn-primary !px-4 !py-2 !text-xs">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Acceso y permisos" description="Los roles administrativos no se solicitan desde el registro publico. Se asignan manualmente desde super administracion.">
        <div className="space-y-4">
          <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <strong className="text-lg uppercase tracking-[0.06em]">Rol actual</strong>
              <span className="text-xs text-brand-cyan">{user?.role ?? "USER"}</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-white/72">
              Tu cuenta publica inicia como jugador. Si formas parte del equipo operativo, un super admin debe asignar tu rol desde el panel interno.
            </p>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
            <p className="eyebrow">Seguridad</p>
            <p className="mt-3 text-sm leading-7 text-white/72">
              La creacion de torneos, la administracion de usuarios y la auditoria no aparecen para jugadores normales.
            </p>
          </div>
          {message ? <p className="text-sm text-brand-cyan">{message}</p> : null}
        </div>
      </SectionCard>
      </div>
    </div>
  );
}
