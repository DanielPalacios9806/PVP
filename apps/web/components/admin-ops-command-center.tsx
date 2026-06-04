"use client";

import Link from "next/link";
import {Activity, Coins, Gavel, LockKeyhole, Radar, ScrollText, ShieldCheck, Users, type LucideIcon, Gamepad2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getStoredUser, subscribeSessionChange, type AppRole } from "@/lib/session";

type OpsCard = {
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: "cyan" | "amber" | "rose" | "violet";
  roles: AppRole[];
  status: string;
};

const opsCards: OpsCard[] = [
  {
    title: "Salas manuales asistidas",
    eyebrow: "Pre-beta",
    description: "Control de salas, horarios, códigos manuales y operación provisional mientras Riot Tournament API está pendiente.",
    href: "/dashboard/moderation",
    icon: Gamepad2,
    tone: "cyan",
    roles: ["MODERATOR", "ADMIN", "SUPER_ADMIN"],
    status: "manual"
  },
  {
    title: "Riot development bridge",
    eyebrow: "Integracion",
    description: "Modo, API key server-side, readiness RSO y pruebas controladas sin exponer secretos al frontend.",
    href: "/dashboard/admin#riot-api",
    icon: Radar,
    tone: "cyan",
    roles: ["ADMIN", "SUPER_ADMIN"],
    status: "development"
  },
  {
    title: "Operacion de torneos",
    eyebrow: "Competitivo",
    description: "Brackets, partidas, resultados y callback sandbox para validar flujo de torneo antes de credenciales oficiales.",
    href: "/dashboard/admin#operacion-torneos",
    icon: Activity,
    tone: "violet",
    roles: ["ADMIN", "SUPER_ADMIN"],
    status: "activo"
  },
  {
    title: "Moderacion y disputas",
    eyebrow: "Integridad",
    description: "Casos abiertos, evidencia, resultados pendientes y resolucion operacional para staff.",
    href: "/dashboard/moderation",
    icon: Gavel,
    tone: "rose",
    roles: ["MODERATOR", "ADMIN", "SUPER_ADMIN"],
    status: "watch"
  },
  {
    title: "Auditoria operativa",
    eyebrow: "Trazabilidad",
    description: "Eventos criticos por modulo, actor, severidad y cambios administrativos para control interno.",
    href: "/dashboard/admin#auditoria-operativa",
    icon: ScrollText,
    tone: "amber",
    roles: ["ADMIN", "SUPER_ADMIN"],
    status: "logs"
  },
  {
    title: "Tokens internos",
    eyebrow: "Ledger",
    description: "Revisiones no monetarias, asignaciones internas y control de solicitudes para beta cerrada.",
    href: "/dashboard/admin#tokens-internos",
    icon: Coins,
    tone: "cyan",
    roles: ["ADMIN", "SUPER_ADMIN"],
    status: "no monetario"
  },
  {
    title: "Perfiles internos",
    eyebrow: "Super admin",
    description: "Gestion de usuarios operativos, roles y cuentas internas separadas del jugador normal.",
    href: "/dashboard/admin/profiles",
    icon: Users,
    tone: "violet",
    roles: ["SUPER_ADMIN"],
    status: "restringido"
  }
];

const toneClasses = {
  cyan: "border-[#18e6f2]/25 bg-[#18e6f2]/10 text-[#18e6f2]",
  amber: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  rose: "border-rose-400/25 bg-rose-500/10 text-rose-100",
  violet: "border-violet-400/25 bg-violet-500/10 text-violet-100"
};

const roleLabels: Record<AppRole, string> = {
  USER: "Jugador",
  ORGANIZER: "Organizador",
  MODERATOR: "Moderador",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
  FINANCE: "Finanzas"
};

function canAccess(role: AppRole, card: OpsCard) {
  return card.roles.includes(role);
}

export function AdminOpsCommandCenter() {
  const [role, setRole] = useState<AppRole>("USER");

  function syncRole() {
    setRole(getStoredUser()?.role ?? "USER");
  }

  useEffect(() => {
    syncRole();
    return subscribeSessionChange(syncRole);
  }, []);

  const visibleCards = useMemo(() => opsCards.filter((card) => canAccess(role, card)), [role]);
  const lockedCount = opsCards.length - visibleCards.length;

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#081323]/90 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.42)] lg:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(24,230,242,0.18),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(255,43,91,0.16),transparent_30%)]" />
      <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#18e6f2]/25 bg-[#18e6f2]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#18e6f2]">
              Ops Center
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/55">
              {roleLabels[role] ?? role}
            </span>
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.08em] text-white sm:text-5xl lg:text-6xl">
            Centro de operaciones Darkside
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/64 sm:text-base">
            Consolida Riot development, moderacion, auditoria, tokens internos y operacion competitiva en un mismo puente administrativo. La API key vive solo en backend y los controles se habilitan por rol.
          </p>
        </div>

        <aside className="rounded-[26px] border border-white/10 bg-black/24 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-3 text-emerald-200">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/40">Readiness</p>
              <strong className="mt-1 block text-lg text-white">Pre-beta operativa</strong>
              <p className="mt-2 text-xs leading-5 text-white/55">
                Build, smoke remoto, Riot readiness y Prisma quedaron validados. Esta fase pule la consola interna.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <strong className="block text-xl text-white">{visibleCards.length}</strong>
              <span className="text-white/45">Activos</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <strong className="block text-xl text-white">{lockedCount}</strong>
              <span className="text-white/45">Bloq.</span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <strong className="block text-xl text-[#18e6f2]">API</strong>
              <span className="text-white/45">Server</span>
            </div>
          </div>
        </aside>
      </div>

      <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {opsCards.map((card) => {
          const Icon = card.icon;
          const enabled = canAccess(role, card);
          const className = `group rounded-[26px] border p-4 transition ${enabled ? "border-white/10 bg-white/[0.035] hover:border-[#18e6f2]/35 hover:bg-white/[0.055]" : "border-white/6 bg-black/18 opacity-55"}`;
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className={`rounded-2xl border p-3 ${toneClasses[card.tone]}`}>
                  <Icon size={21} />
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-white/50">
                  {enabled ? card.status : <span className="inline-flex items-center gap-1"><LockKeyhole size={11} /> rol</span>}
                </span>
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#18e6f2]/70">{card.eyebrow}</p>
              <h2 className="mt-2 text-lg font-black text-white">{card.title}</h2>
              <p className="mt-2 text-xs leading-5 text-white/58">{card.description}</p>
            </>
          );

          return enabled ? (
            <Link key={card.title} href={card.href} className={className}>
              {body}
            </Link>
          ) : (
            <article key={card.title} className={className}>
              {body}
            </article>
          );
        })}
      </div>
    </section>
  );
}
