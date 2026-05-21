"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/config";
import { getStoredUser } from "@/lib/session";

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
    image: "/assets/games/lol-cover.jpg",
    accent: "text-[#43d3ff]",
    href: "/dashboard/tournaments?game=lol"
  },
  {
    title: "VALORANT",
    copy: "Circuitos tacticos por escuadra, check-in y resultados auditables.",
    image: "/assets/games/valorant-viper.png",
    accent: "text-[#ff4655]",
    href: "/dashboard/tournaments?game=valorant"
  }
];

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
    <main className="min-h-screen bg-[#05080d] text-white">
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#070b12]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#ff2f43] font-heading text-xl font-bold">
              P
            </span>
            <span className="font-heading text-xl font-bold tracking-[0.02em]">
              PVP<span className="text-[#43d3ff]">.GG</span>
            </span>
          </Link>

          <nav className="ml-10 hidden items-center gap-8 text-sm font-semibold text-white/62 lg:flex">
            <Link className="text-white" href="/">Inicio</Link>
            <Link href="/dashboard/tournaments">Torneos</Link>
            <span className="cursor-not-allowed text-white/35">Rankings proximamente</span>
            <Link href="/dashboard/teams">Equipos</Link>
            <Link href="/dashboard/spaces">Comunidad</Link>
          </nav>

          <div className="ml-auto hidden items-center gap-3 sm:flex">
            {isLoggedIn ? (
              <Link href="/dashboard" className="rounded-[8px] border border-[#43d3ff]/40 px-5 py-2 text-sm font-semibold text-[#43d3ff]">
                Abrir panel
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="rounded-[8px] border border-[#43d3ff]/40 px-5 py-2 text-sm font-semibold text-[#43d3ff]">
                  Login
                </Link>
                <Link href="/auth/register" className="rounded-[8px] bg-[#ff2f43] px-5 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(255,47,67,0.28)]">
                  Registrarse
                </Link>
              </>
            )}
          </div>

          <button className="ml-auto flex h-10 w-10 items-center justify-center rounded-[8px] border border-white/10 text-2xl text-white/75 sm:hidden">
            =
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/assets/games/valorant-viper.png" alt="Arena competitiva" fill priority className="object-cover object-center opacity-52" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#05080d_0%,rgba(5,8,13,0.82)_35%,rgba(5,8,13,0.34)_70%,#05080d_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(67,211,255,0.18),transparent_24%),radial-gradient(circle_at_86%_35%,rgba(255,47,67,0.28),transparent_22%)]" />
        </div>

        <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#ff4655]">Compite. Mejora. Domina.</p>
            <h1 className="mt-5 font-heading text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Compite en torneos de <span className="text-[#43d3ff]">LoL</span> y{" "}
              <span className="text-[#ff4655]">VALORANT</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/70 sm:text-base">
              Plataforma universitaria para crear equipos, inscribirse a torneos, jugar brackets y reportar resultados con trazabilidad.
            </p>

            <div className="mt-7 grid gap-3 sm:flex">
              <Link href="/dashboard/tournaments" className="inline-flex items-center justify-center gap-3 rounded-[8px] bg-[#ff2f43] px-6 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(255,47,67,0.26)]">
                Explorar torneos <span aria-hidden>-&gt;</span>
              </Link>
              <Link
                href={isLoggedIn ? "/dashboard/teams" : "/auth/register"}
                className="inline-flex items-center justify-center gap-3 rounded-[8px] border border-[#43d3ff]/45 bg-[#061118]/80 px-6 py-4 text-sm font-bold text-white"
              >
                Crear equipo
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-3 overflow-hidden rounded-[10px] border border-white/8 bg-[#0c121b]/82">
              <div className="p-4">
                <p className="font-heading text-2xl font-semibold">{formatCount(counts.tournaments, "0")}</p>
                <p className="mt-1 text-xs text-white/56">Torneos</p>
              </div>
              <div className="border-x border-white/8 p-4">
                <p className="font-heading text-2xl font-semibold">{formatCount(counts.teams, "0")}</p>
                <p className="mt-1 text-xs text-white/56">Equipos</p>
              </div>
              <div className="p-4">
                <p className="font-heading text-2xl font-semibold">{formatCount(counts.spaces, "0")}</p>
                <p className="mt-1 text-xs text-white/56">Spaces</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-6 md:grid-cols-2">
        {gameCards.map((card) => (
          <Link key={card.title} href={card.href} className="group relative min-h-[160px] overflow-hidden rounded-[10px] border border-white/8 bg-[#0b111a]">
            <Image src={card.image} alt={card.title} fill className="object-cover opacity-42 transition group-hover:scale-105" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,13,0.94),rgba(5,8,13,0.48))]" />
            <div className="relative flex h-full min-h-[160px] flex-col justify-end p-5">
              <h2 className={`font-heading text-xl font-bold uppercase ${card.accent}`}>{card.title}</h2>
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
          <Link href="/dashboard/tournaments" className="text-sm font-semibold text-[#43d3ff]">Ver todos</Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {featuredTournaments.map((item) => (
            <Link key={item.id} href={item.href} className="rounded-[10px] border border-white/8 bg-[#0b111a] p-4 transition hover:border-[#ff4655]/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#43d3ff]">{item.status}</p>
                  <h3 className="mt-2 font-heading text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-white/54">{item.meta}</p>
                </div>
                <span className="rounded-[6px] border border-[#ff4655]/50 px-2 py-1 text-[10px] font-bold uppercase text-[#ff4655]">
                  MVP
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[#ffc857]">{item.reward}</p>
                  <p className="text-xs text-white/48">No monetario</p>
                </div>
                <div>
                  <p>{item.participants}</p>
                  <p className="text-xs text-white/48">Participantes</p>
                </div>
              </div>
              <span className="mt-5 inline-flex w-full justify-center rounded-[7px] border border-[#ff4655]/60 px-4 py-2 text-sm font-bold text-[#ff4655]">
                Ver detalles
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 lg:pb-12">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[10px] border border-white/8 bg-[#0b111a] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ff4655]">En vivo ahora</p>
            <h2 className="mt-3 font-heading text-3xl font-bold">Datos reales primero</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              Las estadisticas globales se activaran cuando existan eventos suficientes. Por ahora mostramos actividad real y estados honestos del MVP.
            </p>
          </article>
          <article className="rounded-[10px] border border-white/8 bg-[#0b111a] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#43d3ff]">Preparado para Riot</p>
            <h2 className="mt-3 font-heading text-3xl font-bold">Riot ID en modo mock</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              Puedes probar vinculacion simulada, codigos mock y resultados mock. La API oficial se activara solo con aprobacion y llaves seguras del backend.
            </p>
          </article>
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-white/8 bg-[#05080d]/96 px-2 py-2 backdrop-blur-xl lg:hidden">
        {[
          ["Inicio", "/"],
          ["Torneos", "/dashboard/tournaments"],
          ["Equipos", "/dashboard/teams"],
          ["Perfil", isLoggedIn ? "/dashboard/account" : "/auth/login"]
        ].map(([label, href]) => (
          <Link key={label} href={href} className="flex flex-col items-center gap-1 rounded-[8px] px-2 py-2 text-xs font-semibold text-white/58 first:text-[#ff4655]">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
