"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Flame,
  Plus,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  WalletCards
} from "lucide-react";
import { getStoredUser, getStoredWallet, type AppRole, type StoredUser } from "@/lib/session";

interface RailSectionProps {
  eyebrow: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

type ExtendedStoredUser = StoredUser & {
  riotLinked?: boolean;
  riotGameName?: string;
  riotPuuid?: string;
  name?: string;
  teamName?: string;
};

function RailSection({ eyebrow, children, action }: RailSectionProps) {
  return (
    <section className="border-b border-white/8 px-5 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8eb8ff]">{eyebrow}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ icon, title, description, actionLabel, href }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#101722] p-5 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#141c29] text-[#8eb8ff]">
        {icon}
      </div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-white/58">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex w-full justify-center rounded-xl border border-white/14 bg-black/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#58e0ff]/60 hover:text-[#58e0ff]"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

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
  const userProfile = user as ExtendedStoredUser | null;
  const displayName = userProfile?.displayName ?? userProfile?.username ?? userProfile?.name ?? "Jugador";
  const riotLinked = Boolean(userProfile?.riotLinked || userProfile?.riotGameName || userProfile?.riotPuuid);

  const activityItems = useMemo(() => {
    if (!userProfile) return [];

    return [
      {
        icon: <ShieldCheck className="h-4 w-4" />,
        title: riotLinked ? "Riot ID vinculado" : "Perfil competitivo pendiente",
        description: riotLinked
          ? "Tu perfil Riot esta listo para torneos con modo mock/development."
          : "Completa Riot ID, region y equipo antes de competir.",
        href: "/dashboard/account"
      },
      {
        icon: <Trophy className="h-4 w-4" />,
        title: "Torneos abiertos",
        description: "Revisa cupos, reglas, brackets y recompensas internas.",
        href: "/dashboard/tournaments"
      },
      {
        icon: <CalendarDays className="h-4 w-4" />,
        title: "Agenda competitiva",
        description: "Tus proximas partidas y check-ins apareceran aqui.",
        href: "/dashboard/matches/mock-match-1"
      }
    ];
  }, [riotLinked, userProfile]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[linear-gradient(180deg,rgba(5,8,12,0.98),rgba(7,11,18,0.98))]">
      <RailSection eyebrow="Your activities">
        {activityItems.length ? (
          <div className="grid gap-3">
            {activityItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex gap-3 rounded-2xl border border-white/10 bg-[#101722] p-4 transition hover:border-[#58e0ff]/50 hover:bg-[#121c2a]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#151f2d] text-[#8eb8ff] transition group-hover:text-[#58e0ff]">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/58">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Activity className="h-5 w-5" />}
            title="Sin actividad todavia"
            description="Tus inscripciones, partidas, invitaciones y resultados apareceran aqui."
            actionLabel="Iniciar sesion"
            href="/auth/login"
          />
        )}
      </RailSection>

      <RailSection
        eyebrow="Your party"
        action={
          <Link href="/dashboard/teams" title="Crear equipo" className="text-[#8eb8ff] transition hover:text-[#58e0ff]">
            <Plus className="h-4 w-4" />
          </Link>
        }
      >
        <div className="rounded-2xl border border-white/10 bg-[#101722] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#58e0ff]/30 bg-[#08202a] text-[#58e0ff]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Party competitiva</p>
              <p className="text-xs text-white/55">Coordina jugadores antes de entrar al bracket.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <Link href="/dashboard/teams" className="rounded-xl border border-white/12 bg-black/20 px-4 py-2.5 text-center text-sm font-semibold text-white hover:border-[#58e0ff]/60">
              Crear equipo
            </Link>
            <Link href="/dashboard/spaces" className="rounded-xl border border-white/10 bg-[#151c28] px-4 py-2.5 text-center text-sm font-semibold text-white/80 hover:text-white">
              Buscar comunidad
            </Link>
          </div>
        </div>
      </RailSection>

      <RailSection
        eyebrow="Your teams"
        action={
          <Link href="/dashboard/teams" title="Invitar jugador" className="text-[#8eb8ff] transition hover:text-[#58e0ff]">
            <UserPlus className="h-4 w-4" />
          </Link>
        }
      >
        {user ? (
          <div className="rounded-2xl border border-white/10 bg-[#101722] p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-[var(--ds-border-red)] bg-black/40">
                <Image src="/assets/darkside/logos/darkside-logo-mark.svg" alt="Darkside" fill className="object-contain p-2" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{userProfile?.teamName ?? `${displayName} Squad`}</p>
                <p className="text-xs text-white/55">0/5 jugadores confirmados</p>
              </div>
            </div>
            <Link href="/dashboard/teams" className="mt-4 inline-flex w-full justify-center rounded-xl border border-white/12 bg-black/20 px-4 py-2.5 text-sm font-semibold text-white hover:border-[#58e0ff]/60">
              Gestionar equipo
            </Link>
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No has creado equipo"
            description="Crea o une un equipo para competir en torneos abiertos."
            actionLabel="Crear equipo"
            href="/dashboard/teams"
          />
        )}
      </RailSection>

      {canOperate ? (
        <RailSection eyebrow="Operacion">
          <Link
            href="/dashboard/admin"
            className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-[#111722] p-5 transition hover:border-[var(--ds-border-red)]"
          >
            <Image src="/assets/darkside/official/hero-desktop.jpg" alt="" fill className="object-cover opacity-24 transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,11,17,0.96),rgba(8,11,17,0.62))]" />
            <div className="relative z-10">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ds-border-red)] bg-black/30 text-[var(--ds-red-primary)]">
                <Flame className="h-4 w-4" />
              </div>
              <p className="text-base font-semibold text-white">Panel de torneos y auditoria</p>
              <p className="mt-2 text-sm leading-5 text-white/66">
                Crea torneos, aprueba inscripciones, revisa resultados y consulta logs.
              </p>
              <p className="mt-4 text-sm font-semibold text-[#8eb8ff]">Abrir operacion</p>
            </div>
          </Link>
        </RailSection>
      ) : null}

      <RailSection eyebrow="Internal balance">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111722] p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_12%,rgba(255,36,56,0.28),transparent_32%),radial-gradient(circle_at_18%_88%,rgba(26,230,255,0.14),transparent_34%)]" />
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white text-[#f59e0b] shadow-[0_0_24px_rgba(255,36,56,0.18)]">
                <WalletCards className="h-5 w-5" />
              </div>
              <Link href="/dashboard/tokens" className="text-xs font-semibold text-[#8eb8ff] hover:text-[#58e0ff]">
                Ver wallet
              </Link>
            </div>
            <div className="text-3xl font-semibold text-white">{walletBalance} DS</div>
            <p className="mt-2 text-xs leading-5 text-white/62">
              Saldo interno no retirable, sin valor monetario y solo para beneficios visuales o experiencias futuras.
            </p>
          </div>
        </div>
      </RailSection>
    </div>
  );
}
