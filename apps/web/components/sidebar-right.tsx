"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser, getStoredWallet, type AppRole, type StoredUser } from "@/lib/session";

export function SidebarRight() {
  const [walletBalance, setWalletBalance] = useState(100);
  const [role, setRole] = useState<AppRole>("USER");
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setWalletBalance(getStoredWallet().balance);
    setRole(storedUser?.role ?? "USER");
  }, []);

  const canOperate = role === "ADMIN" || role === "SUPER_ADMIN" || role === "MODERATOR" || role === "ORGANIZER";

  return (
    <div className="flex h-full flex-col">
      <section className="border-b border-white/6 p-6">
        <h3 className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#8eb8ff]">
          Tu actividad
        </h3>
        <div className="rounded-2xl border border-white/6 bg-[#111722] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8eb8ff]">{user ? "Siguiente paso" : "Cuenta invitada"}</p>
          <p className="mt-3 text-lg font-semibold text-white">
            {user ? "Completa tu perfil competitivo" : "Inicia sesion para competir"}
          </p>
          <p className="mt-2 text-sm text-white/58">
            {user
              ? "Vincula tu Riot ID en modo mock, crea o une un equipo y revisa torneos abiertos."
              : "Crea tu cuenta para formar equipos, inscribirte a torneos y recibir tokens internos."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={user ? "/dashboard/account" : "/auth/login"}
              className="inline-flex rounded-xl border border-white/12 px-4 py-3 text-sm font-semibold text-white"
            >
              {user ? "Abrir perfil" : "Iniciar sesion"}
            </Link>
            {!user ? (
              <Link
                href="/auth/register"
                className="inline-flex rounded-xl border border-[var(--ds-border-red)] px-4 py-3 text-sm font-semibold text-[var(--ds-red-primary)]"
              >
                Crear cuenta
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-b border-white/6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
            {canOperate ? "Operacion" : "Torneos"}
          </h3>
        </div>
        <Link href={canOperate ? "/dashboard/admin" : "/dashboard/tournaments"} className="block rounded-2xl border border-white/6 bg-[#111722] p-5 transition hover:border-white/14">
          <p className="text-base font-semibold text-white">
            {canOperate ? "Panel de torneos y auditoria" : "Explorar torneos disponibles"}
          </p>
          <p className="mt-2 text-sm text-white/58">
            {canOperate
              ? "Crea torneos, aprueba inscripciones, revisa resultados y consulta logs."
              : "Consulta estados, reglas, cupos e inscripciones desde una vista segura."}
          </p>
          <p className="mt-4 text-sm text-[#8eb8ff]">{canOperate ? "Abrir operacion" : "Ver torneos"}</p>
        </Link>
      </section>

      <section className="border-b border-white/6 p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Saldo interno</h3>
        </div>
        <div className="rounded-2xl border border-white/6 bg-[#111722] p-6">
          <div className="mb-4 text-4xl font-semibold text-white">{walletBalance} TOKENS</div>
          <p className="text-sm text-white/60">
            Tokens internos para beneficios visuales y futuras experiencias. No son retirables ni convertibles a dinero.
          </p>
          <Link
            href="/dashboard/tokens"
            className="mt-5 inline-flex w-full justify-center rounded-xl border border-white/14 px-4 py-3 text-sm font-semibold text-white"
          >
            Ir a tokens
          </Link>
        </div>
      </section>

      <section className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Accesos rapidos</h3>
        </div>
        <div className="grid gap-3">
          <Link href="/dashboard/teams" className="rounded-xl border border-white/10 bg-[#111722] px-4 py-3 text-sm font-semibold text-white">
            Mis equipos
          </Link>
          <Link href="/dashboard/spaces" className="rounded-xl border border-white/10 bg-[#111722] px-4 py-3 text-sm font-semibold text-white">
            Comunidades
          </Link>
          <Link href="/dashboard/account" className="rounded-xl border border-white/10 bg-[#111722] px-4 py-3 text-sm font-semibold text-white">
            Perfil y Riot mock
          </Link>
          {canOperate ? (
            <Link href="/dashboard/moderation" className="rounded-xl border border-[var(--ds-border-red)] bg-[#111722] px-4 py-3 text-sm font-semibold text-white">
              Moderacion
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
