"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, Coins, FileSearch, Radar, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { getStoredUser, subscribeSessionChange, type AppRole } from "@/lib/session";

type QuickAccessItem = {
  href: string;
  kicker: string;
  title: string;
  copy: string;
  icon: LucideIcon;
  roles: AppRole[];
  meta: string;
};

const quickAccess: QuickAccessItem[] = [
  {
    href: "/dashboard/admin#riot-api",
    kicker: "Riot",
    title: "Operacion Riot",
    copy: "Modo development, readiness, pruebas de lookup y callback sandbox desde backend.",
    icon: Radar,
    roles: ["ADMIN", "SUPER_ADMIN"],
    meta: "server-side"
  },
  {
    href: "/dashboard/admin#operacion-torneos",
    kicker: "Torneos",
    title: "Brackets y partidas",
    copy: "Revisa flujo competitivo, estados y operaciones previas a la beta cerrada.",
    icon: Activity,
    roles: ["ADMIN", "SUPER_ADMIN"],
    meta: "ops"
  },
  {
    href: "/dashboard/admin#tokens-internos",
    kicker: "Tokens",
    title: "Ledger interno",
    copy: "Control no monetario de solicitudes, verificaciones y asignaciones de prueba.",
    icon: Coins,
    roles: ["ADMIN", "SUPER_ADMIN"],
    meta: "no monetario"
  },
  {
    href: "/dashboard/admin#auditoria-operativa",
    kicker: "Auditoria",
    title: "Trazabilidad",
    copy: "Eventos por modulo, severidad, usuario y cambios administrativos relevantes.",
    icon: FileSearch,
    roles: ["ADMIN", "SUPER_ADMIN"],
    meta: "logs"
  },
  {
    href: "/dashboard/moderation",
    kicker: "Moderacion",
    title: "Disputas e integridad",
    copy: "Casos abiertos, resultados pendientes y resoluciones de staff.",
    icon: ShieldCheck,
    roles: ["MODERATOR", "ADMIN", "SUPER_ADMIN"],
    meta: "staff"
  },
  {
    href: "/dashboard/admin/profiles",
    kicker: "Super admin",
    title: "Perfiles internos",
    copy: "Gestion de roles, usuarios operativos y control de acceso administrativo.",
    icon: Users,
    roles: ["SUPER_ADMIN"],
    meta: "roles"
  }
];

function canAccess(role: AppRole, roles: AppRole[]) {
  return roles.includes(role);
}

function AccessCard({ item, children }: { item: QuickAccessItem; children: ReactNode }) {
  return (
    <Link href={item.href} className="group rounded-[26px] border border-white/10 bg-white/[0.035] p-5 transition hover:border-[#18e6f2]/35 hover:bg-white/[0.055]">
      {children}
    </Link>
  );
}

export function AdminQuickAccess() {
  const [role, setRole] = useState<AppRole>("USER");

  function syncRole() {
    setRole(getStoredUser()?.role ?? "USER");
  }

  useEffect(() => {
    syncRole();
    return subscribeSessionChange(syncRole);
  }, []);

  return (
    <section className="rounded-[30px] border border-white/10 bg-[#07111f]/82 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.34)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="page-kicker">Comandos rapidos</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Rutas operativas por rol</h2>
        </div>
        <p className="text-xs leading-5 text-white/50 md:max-w-sm md:text-right">
          Los accesos bloqueados no se muestran para evitar mezclar jugador normal con operacion interna.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {quickAccess.filter((item) => canAccess(role, item.roles)).map((item) => {
          const Icon = item.icon;
          return (
            <AccessCard key={item.href} item={item}>
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-2xl border border-[#18e6f2]/24 bg-[#18e6f2]/10 p-3 text-[#18e6f2]">
                  <Icon size={21} />
                </div>
                <span className="rounded-full border border-white/10 bg-black/24 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-white/48">
                  {item.meta}
                </span>
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7bb7ff]">{item.kicker}</p>
              <h3 className="mt-2 text-lg font-black text-white">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-white/58">{item.copy}</p>
            </AccessCard>
          );
        })}
      </div>
    </section>
  );
}
