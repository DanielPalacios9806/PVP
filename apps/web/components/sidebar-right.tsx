"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { mockMatch, mockTournaments } from "@/lib/mock-data";
import { getStoredWallet } from "@/lib/session";

export function SidebarRight() {
  const [walletBalance, setWalletBalance] = useState(100);
  const featuredTournament = mockTournaments[0];

  useEffect(() => {
    setWalletBalance(getStoredWallet().balance);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <section className="border-b border-white/6 p-6">
        <h3 className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#8eb8ff]">
          Agenda de hoy
        </h3>
        <div className="rounded-2xl border border-white/6 bg-[#111722] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8eb8ff]">Siguiente enfrentamiento</p>
          <p className="mt-3 text-lg font-semibold text-white">
            {mockMatch.homeRegistration.team.name} vs {mockMatch.awayRegistration.team.name}
          </p>
          <p className="mt-2 text-sm text-white/58">Hoy a las 20:00 - Sala lista para reporte manual.</p>
          <Link
            href="/dashboard/matches/mock-match-1"
            className="mt-5 inline-flex rounded-xl border border-white/12 px-4 py-3 text-sm font-semibold text-white"
          >
            Abrir match room
          </Link>
        </div>
      </section>

      <section className="border-b border-white/6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Torneo destacado</h3>
        </div>
        <Link
          href="/dashboard/tournaments/mock-tournament-1"
          className="block rounded-2xl border border-white/6 bg-[#111722] p-5 transition hover:border-white/14"
        >
          <p className="text-base font-semibold text-white">{featuredTournament.name}</p>
          <p className="mt-2 text-sm text-white/58">
            {featuredTournament.game} - {featuredTournament.status}
          </p>
          <p className="mt-4 text-sm text-[#8eb8ff]">Ver calendario y bracket</p>
        </Link>
      </section>

      <section className="border-b border-white/6 p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Saldo interno</h3>
        </div>
        <div className="rounded-2xl border border-white/6 bg-[#111722] p-6">
          <div className="mb-4 text-4xl font-semibold text-white">{walletBalance} TOKENS</div>
          <p className="text-sm text-white/60">
            Disponibles para recompensas internas, beneficios visuales y futuras experiencias de plataforma.
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
            Ver equipos
          </Link>
          <Link href="/dashboard/spaces" className="rounded-xl border border-white/10 bg-[#111722] px-4 py-3 text-sm font-semibold text-white">
            Explorar espacios
          </Link>
          <Link href="/dashboard/account" className="rounded-xl border border-white/10 bg-[#111722] px-4 py-3 text-sm font-semibold text-white">
            Abrir cuenta
          </Link>
        </div>
      </section>
    </div>
  );
}
