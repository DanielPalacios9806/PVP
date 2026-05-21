"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/config";
import { getStoredUser } from "@/lib/session";
import { brand } from "@/lib/brand";

type PublicTournament = {
  id: string;
  name: string;
  game: string;
  type: string;
  format: string;
  status: string;
  maxParticipants?: number;
  registrations?: unknown[];
};

type LandingCounts = {
  tournaments: number | null;
  teams: number | null;
  spaces: number | null;
};

const gameCards = [
  {
    title: "League of Legends",
    copy: "Torneos 5v5, drafts y brackets para equipos universitarios.",
    icon: "/assets/darkside/logos/game-lol-icon.svg",
    image: "/assets/games/lol-cover.jpg",
    accent: "#18e6f2",
    href: "/dashboard/tournaments?game=lol"
  },
  {
    title: "VALORANT",
    copy: "Circuitos tacticos por escuadra, check-in y resultados auditables.",
    icon: "/assets/darkside/logos/game-valorant-icon.svg",
    image: "/assets/games/valorant-viper.png",
    accent: "#ff2438",
    href: "/dashboard/tournaments?game=valorant"
  }
];

const icons = {
  arrow: "/assets/darkside/icons/icon-arrow-right.svg",
  bracket: "/assets/darkside/icons/icon-bracket.svg",
  login: "/assets/darkside/icons/icon-login.svg",
  menu: "/assets/darkside/icons/icon-menu.svg",
  register: "/assets/darkside/icons/icon-register.svg",
  trophy: "/assets/darkside/icons/icon-trophy.svg",
  user: "/assets/darkside/icons/icon-user.svg",
  users: "/assets/darkside/icons/icon-users.svg"
};

function formatCount(value: number | null, fallback: string) {
  return value === null ? fallback : new Intl.NumberFormat("es-EC").format(value);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicado",
    REGISTRATION_OPEN: "Inscripcion abierta",
    REGISTRATION_CLOSED: "Inscripcion cerrada",
    CHECK_IN: "Check-in",
    IN_PROGRESS: "En curso",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado"
  };

  return labels[status] ?? status;
}

export function PublicLanding() {
  const [counts, setCounts] = useState<LandingCounts>({ tournaments: null, teams: null, spaces: null });
  const [tournaments, setTournaments] = useState<PublicTournament[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getStoredUser()));

    async function loadPublicData() {
      const [tournamentsResponse, teamsResponse, spacesResponse] = await Promise.allSettled([
        fetch(`${apiUrl}/tournaments`),
        fetch(`${apiUrl}/teams`),
        fetch(`${apiUrl}/spaces`)
      ]);

      const nextCounts: LandingCounts = { tournaments: null, teams: null, spaces: null };

      if (tournamentsResponse.status === "fulfilled" && tournamentsResponse.value.ok) {
        const data = await tournamentsResponse.value.json();
        if (Array.isArray(data)) {
          nextCounts.tournaments = data.length;
          setTournaments(data.slice(0, 3));
        }
      }

      if (teamsResponse.status === "fulfilled" && teamsResponse.value.ok) {
        const data = await teamsResponse.value.json();
        if (Array.isArray(data)) {
          nextCounts.teams = data.length;
        }
      }

      if (spacesResponse.status === "fulfilled" && spacesResponse.value.ok) {
        const data = await spacesResponse.value.json();
        if (Array.isArray(data)) {
          nextCounts.spaces = data.length;
        }
      }

      setCounts(nextCounts);
    }

    void loadPublicData();
  }, []);

  const featuredTournaments = useMemo(() => {
    if (tournaments.length) {
      return tournaments.map((item) => ({
        id: item.id,
        title: item.name,
        meta: `${item.game} - ${item.type === "TEAM" ? "Equipos" : "Individual"} - ${item.format.replaceAll("_", " ")}`,
        status: statusLabel(item.status),
        participants: `${item.registrations?.length ?? 0} / ${item.maxParticipants ?? "?"}`,
        href: `/dashboard/tournaments/${item.id}`,
        reward: "Recompensas internas"
      }));
    }

    return [
      {
        id: "empty-1",
        title: "Primer torneo universitario",
        meta: "League of Legends - 5v5 - Single elimination",
        status: "En preparacion",
        participants: "Sin datos aun",
        href: "/dashboard/tournaments",
        reward: "Tokens internos y badges"
      },
      {
        id: "empty-2",
        title: "Circuito tactico VALORANT",
        meta: "VALORANT - equipos - check-in manual",
        status: "Modo demo",
        participants: "Sin datos aun",
        href: "/dashboard/tournaments",
        reward: "XP y beneficios no monetarios"
      }
    ];
  }, [tournaments]);

  return (
    <main className="min-h-screen bg-[var(--ds-bg-950)] text-[var(--ds-text-primary)]">
      <header className="sticky top-0 z-50 border-b border-[var(--ds-border-soft)] bg-[rgba(5,8,12,0.94)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-5">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
            <Image src={brand.logoMark} alt={`${brand.name} logo`} width={36} height={36} className="h-7 w-7 sm:h-9 sm:w-9" />
            <span className="font-heading text-lg font-bold tracking-[0.02em] sm:text-xl">
              Darkside<span className="hidden text-[var(--ds-cyan-primary)] sm:inline">.gg</span>
            </span>
          </Link>

          <nav className="ml-10 hidden items-center gap-8 text-sm font-semibold text-[var(--ds-text-secondary)] lg:flex">
            <Link className="text-white" href="/">Inicio</Link>
            <Link href="/dashboard/tournaments">Torneos</Link>
            <span className="cursor-not-allowed text-white/35">Rankings proximamente</span>
            <Link href="/dashboard/teams">Equipos</Link>
            <Link href="/dashboard/spaces">Comunidad</Link>
          </nav>

          <div className="ml-auto hidden items-center gap-3 sm:flex">
            {isLoggedIn ? (
              <Link href="/dashboard" className="ds-button-secondary inline-flex items-center gap-2 rounded-[8px] px-5 py-2 text-sm font-semibold">
                <Image src={icons.user} alt="" width={16} height={16} />
                Abrir panel
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="ds-button-secondary inline-flex items-center gap-2 rounded-[8px] px-5 py-2 text-sm font-semibold">
                  <Image src={icons.login} alt="" width={16} height={16} />
                  Login
                </Link>
                <Link href="/auth/register" className="ds-button-primary inline-flex items-center gap-2 rounded-[8px] px-5 py-2 text-sm font-semibold">
                  <Image src={icons.register} alt="" width={16} height={16} />
                  Registrarse
                </Link>
              </>
            )}
          </div>

          <div className="ml-auto sm:hidden" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-3 px-5 pb-4 sm:hidden">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/auth/login" className="ds-button-secondary inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-3 text-sm font-semibold">
              <Image src={icons.login} alt="" width={16} height={16} />
              Login
            </Link>
            <Link href="/auth/register" className="ds-button-primary inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-3 text-sm font-semibold">
              <Image src={icons.register} alt="" width={16} height={16} />
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/assets/games/valorant-viper.png" alt="Escena competitiva de VALORANT" fill priority className="object-cover object-center opacity-52" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--ds-bg-950)_0%,rgba(5,8,12,0.86)_35%,rgba(5,8,12,0.4)_70%,var(--ds-bg-950)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(24,230,242,0.2),transparent_24%),radial-gradient(circle_at_86%_35%,rgba(255,36,56,0.32),transparent_22%)]" />
        </div>

        <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[var(--ds-red-primary)]">{brand.tagline}</p>
            <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Compite en torneos de <span className="text-[var(--ds-cyan-primary)]">LoL</span> y{" "}
              <span className="text-[var(--ds-red-primary)]">VALORANT</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/70 sm:text-base">
              Plataforma universitaria para crear equipos, inscribirse a torneos, jugar brackets y reportar resultados con trazabilidad.
            </p>

            <div className="mt-7 grid gap-3 sm:flex">
              <Link href="/dashboard/tournaments" className="ds-button-primary inline-flex items-center justify-center gap-3 rounded-[8px] px-6 py-4 text-sm font-bold">
                Explorar torneos <Image src={icons.arrow} alt="" width={17} height={17} />
              </Link>
              <Link
                href={isLoggedIn ? "/dashboard/teams" : "/auth/register"}
                className="ds-button-secondary inline-flex items-center justify-center gap-3 rounded-[8px] px-6 py-4 text-sm font-bold"
              >
                <Image src={icons.users} alt="" width={18} height={18} /> Crear equipo
              </Link>
            </div>

            <div className="ds-card mt-7 grid grid-cols-3 overflow-hidden">
              <div className="p-4">
                <Image src={icons.trophy} alt="" width={22} height={22} />
                <p className="font-heading text-2xl font-semibold">{formatCount(counts.tournaments, "0")}</p>
                <p className="mt-1 text-xs text-white/56">Torneos</p>
              </div>
              <div className="border-x border-white/8 p-4">
                <Image src={icons.users} alt="" width={22} height={22} />
                <p className="font-heading text-2xl font-semibold">{formatCount(counts.teams, "0")}</p>
                <p className="mt-1 text-xs text-white/56">Equipos</p>
              </div>
              <div className="p-4">
                <Image src={icons.bracket} alt="" width={22} height={22} />
                <p className="font-heading text-2xl font-semibold">{formatCount(counts.spaces, "0")}</p>
                <p className="mt-1 text-xs text-white/56">Comunidades</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-6 md:grid-cols-2">
        {gameCards.map((card) => (
          <Link key={card.title} href={card.href} className="ds-card group relative min-h-[160px] overflow-hidden">
            <Image src={card.image} alt={card.title} fill className="object-cover opacity-42 transition group-hover:scale-105" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,13,0.94),rgba(5,8,13,0.48))]" />
            <div className="relative flex h-full min-h-[160px] flex-col justify-end p-5">
              <Image src={card.icon} alt="" width={44} height={44} className="mb-4 h-11 w-11" />
              <h2 className="font-heading text-xl font-bold uppercase" style={{ color: card.accent }}>{card.title}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/68">{card.copy}</p>
              <div className="mt-5 flex gap-8 text-sm text-white/58">
                <span>{formatCount(counts.tournaments, "En preparacion")} torneos</span>
                <span>Riot mock listo</span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold uppercase tracking-[0.08em]">Torneos destacados</h2>
          <Link href="/dashboard/tournaments" className="text-sm font-semibold text-[var(--ds-cyan-primary)]">Ver todos</Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {featuredTournaments.map((item) => (
            <Link key={item.id} href={item.href} className="ds-card p-4 transition hover:border-[var(--ds-border-red)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ds-cyan-primary)]">{item.status}</p>
                  <h3 className="mt-2 font-heading text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-white/54">{item.meta}</p>
                </div>
                <span className="rounded-[6px] border border-[var(--ds-border-red)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--ds-red-primary)]">
                  MVP
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[var(--ds-gold-prize)]">{item.reward}</p>
                  <p className="text-xs text-white/48">No monetario</p>
                </div>
                <div>
                  <p>{item.participants}</p>
                  <p className="text-xs text-white/48">Participantes</p>
                </div>
              </div>
              <span className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[7px] border border-[var(--ds-border-red)] px-4 py-2 text-sm font-bold text-[var(--ds-red-primary)]">
                Ver detalles <Image src={icons.arrow} alt="" width={14} height={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 lg:pb-12">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="ds-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ds-red-primary)]">En vivo ahora</p>
            <h2 className="mt-3 font-heading text-3xl font-bold">Datos reales primero</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              Las estadisticas globales se activaran cuando existan eventos suficientes. Por ahora mostramos actividad real y estados honestos del MVP.
            </p>
          </article>
          <article className="ds-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ds-cyan-primary)]">Preparado para Riot</p>
            <h2 className="mt-3 font-heading text-3xl font-bold">Riot ID en modo mock</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              Puedes probar vinculacion simulada, codigos mock y resultados mock. La API oficial se activara solo con aprobacion y llaves seguras del backend.
            </p>
          </article>
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-[var(--ds-border-soft)] bg-[rgba(5,8,12,0.96)] px-2 py-2 backdrop-blur-xl lg:hidden">
        {[
          ["Inicio", "/", icons.trophy],
          ["Torneos", "/dashboard/tournaments", icons.bracket],
          ["Equipos", "/dashboard/teams", icons.users],
          ["Perfil", isLoggedIn ? "/dashboard/account" : "/auth/login", icons.user]
        ].map(([label, href, icon]) => (
          <Link key={label} href={href} className="flex flex-col items-center gap-1 rounded-[8px] px-2 py-2 text-xs font-semibold text-white/58 first:text-[var(--ds-red-primary)]">
            <Image src={icon} alt="" width={19} height={19} />
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
