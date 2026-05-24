"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { brand } from "@/lib/brand";
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

type PublicDataStatus = "loading" | "ready" | "error";

const officialAssets = {
  heroDesktop: "/assets/darkside/official/hero-desktop.jpg",
  heroMobile: "/assets/darkside/official/hero-mobile.jpg",
  lolCard: "/assets/darkside/official/game-lol-card.jpg",
  valorantCard: "/assets/darkside/official/game-valorant-card.jpg",
  lolLogo: "/assets/darkside/official/game-lol-logo.png",
  valorantLogo: "/assets/darkside/official/game-valorant-logo.png"
};

const icons = {
  arrow: "/assets/darkside/icons/icon-arrow-right.svg",
  bracket: "/assets/darkside/icons/icon-bracket.svg",
  login: "/assets/darkside/icons/icon-login.svg",
  register: "/assets/darkside/icons/icon-register.svg",
  trophy: "/assets/darkside/icons/icon-trophy.svg",
  user: "/assets/darkside/icons/icon-user.svg",
  users: "/assets/darkside/icons/icon-users.svg"
};

const gameCards = [
  {
    title: "League of Legends",
    gameKey: "LEAGUE_OF_LEGENDS",
    copy: "Torneos 5v5, drafts y brackets para equipos universitarios.",
    logo: officialAssets.lolLogo,
    image: officialAssets.lolCard,
    accent: "#18e6f2",
    href: "/dashboard/tournaments?game=lol"
  },
  {
    title: "VALORANT",
    gameKey: "VALORANT",
    copy: "Circuitos tacticos por escuadra, check-in y resultados auditables.",
    logo: officialAssets.valorantLogo,
    image: officialAssets.valorantCard,
    accent: "#ff2438",
    href: "/dashboard/tournaments?game=valorant"
  }
];

function formatCount(value: number | null, fallback: string) {
  return value === null ? fallback : new Intl.NumberFormat("es-EC").format(value);
}

function countLabel(value: number | null, status: PublicDataStatus) {
  if (status === "loading") {
    return "...";
  }

  if (status === "error") {
    return "N/D";
  }

  return formatCount(value, "0");
}

function normalizeGameLabel(game: string) {
  const labels: Record<string, string> = {
    LEAGUE_OF_LEGENDS: "League of Legends",
    VALORANT: "VALORANT"
  };

  return labels[game] ?? game.replaceAll("_", " ");
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
  const [publicDataStatus, setPublicDataStatus] = useState<PublicDataStatus>("loading");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getStoredUser()));

    async function loadPublicData() {
      try {
        const [tournamentsResponse, teamsResponse, spacesResponse] = await Promise.allSettled([
          fetch(`${apiUrl}/tournaments`),
          fetch(`${apiUrl}/teams`),
          fetch(`${apiUrl}/spaces`)
        ]);

        const nextCounts: LandingCounts = { tournaments: null, teams: null, spaces: null };
        let hasAnySuccessfulResponse = false;

        if (tournamentsResponse.status === "fulfilled" && tournamentsResponse.value.ok) {
          const data = await tournamentsResponse.value.json();
          if (Array.isArray(data)) {
            hasAnySuccessfulResponse = true;
            nextCounts.tournaments = data.length;
            setTournaments(data.slice(0, 3));
          }
        }

        if (teamsResponse.status === "fulfilled" && teamsResponse.value.ok) {
          const data = await teamsResponse.value.json();
          if (Array.isArray(data)) {
            hasAnySuccessfulResponse = true;
            nextCounts.teams = data.length;
          }
        }

        if (spacesResponse.status === "fulfilled" && spacesResponse.value.ok) {
          const data = await spacesResponse.value.json();
          if (Array.isArray(data)) {
            hasAnySuccessfulResponse = true;
            nextCounts.spaces = data.length;
          }
        }

        setCounts(nextCounts);
        setPublicDataStatus(hasAnySuccessfulResponse ? "ready" : "error");
      } catch {
        setPublicDataStatus("error");
      }
    }

    void loadPublicData();
  }, []);

  const tournamentsByGame = useMemo(() => {
    return tournaments.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.game] = (accumulator[item.game] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [tournaments]);

  const featuredTournaments = useMemo(() => {
    if (tournaments.length) {
      return tournaments.map((item) => ({
        id: item.id,
        title: item.name,
        meta: `${normalizeGameLabel(item.game)} - ${item.type === "TEAM" ? "Equipos" : "Individual"} - ${item.format.replaceAll("_", " ")}`,
        status: statusLabel(item.status),
        participants: `${item.registrations?.length ?? 0} / ${item.maxParticipants ?? "?"}`,
        href: `/dashboard/tournaments/${item.id}`,
        reward: "Recompensas internas",
        image: item.game === "VALORANT" ? officialAssets.valorantCard : officialAssets.lolCard,
        logo: item.game === "VALORANT" ? officialAssets.valorantLogo : officialAssets.lolLogo
      }));
    }

    if (publicDataStatus === "loading") {
      return [
        {
          id: "loading-1",
          title: "Cargando torneos",
          meta: "Consultando datos reales de la plataforma",
          status: "Sincronizando",
          participants: "Cargando",
          href: "/dashboard/tournaments",
          reward: "Recompensas internas",
          image: officialAssets.lolCard,
          logo: officialAssets.lolLogo
        }
      ];
    }

    return [
      {
        id: "empty-1",
        title: "Primer torneo universitario",
        meta: "League of Legends - 5v5 - Single elimination",
        status: "En preparacion",
        participants: "Sin datos aun",
        href: "/dashboard/tournaments",
        reward: "Tokens internos y badges",
        image: officialAssets.lolCard,
        logo: officialAssets.lolLogo
      },
      {
        id: "empty-2",
        title: "Circuito tactico VALORANT",
        meta: "VALORANT - equipos - check-in manual",
        status: "Modo demo",
        participants: "Sin datos aun",
        href: "/dashboard/tournaments",
        reward: "XP y beneficios no monetarios",
        image: officialAssets.valorantCard,
        logo: officialAssets.valorantLogo
      }
    ];
  }, [publicDataStatus, tournaments]);

  const authActions = isLoggedIn ? (
    <Link href="/dashboard" className="ds-button-secondary inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-3 text-sm font-semibold sm:px-5">
      <Image src={icons.user} alt="" width={16} height={16} />
      Panel
    </Link>
  ) : (
    <>
      <Link href="/auth/login" className="ds-button-secondary inline-flex items-center justify-center gap-2 rounded-[10px] px-3 py-3 text-sm font-semibold sm:px-5">
        <Image src={icons.login} alt="" width={16} height={16} />
        Login
      </Link>
      <Link href="/auth/register" className="ds-button-primary inline-flex items-center justify-center gap-2 rounded-[10px] px-3 py-3 text-sm font-semibold sm:px-5">
        <Image src={icons.register} alt="" width={16} height={16} />
        Registrarse
      </Link>
    </>
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--ds-bg-950)] text-[var(--ds-text-primary)]">
      <header className="sticky top-0 z-50 border-b border-[var(--ds-border-soft)] bg-[rgba(3,6,10,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center gap-3 px-4 sm:h-20 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center sm:hidden">
              <Image src={brand.logoMark} alt={`${brand.name} logo`} fill sizes="36px" className="object-contain" />
            </span>
            <span className="hidden sm:block">
              <Image src={brand.logoHorizontal} alt={brand.name} width={224} height={45} priority className="h-auto w-[190px] lg:w-[224px]" />
            </span>
          </Link>

          <nav className="ml-8 hidden items-center gap-8 text-sm font-semibold text-[var(--ds-text-secondary)] lg:flex">
            <Link className="text-white" href="/">Inicio</Link>
            <Link href="/dashboard/tournaments">Torneos</Link>
            <span className="cursor-not-allowed text-white/35">Rankings proximamente</span>
            <Link href="/dashboard/teams">Equipos</Link>
            <Link href="/dashboard/spaces">Comunidad</Link>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">{authActions}</div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[var(--ds-border-soft)]">
        <div className="absolute inset-0">
          <Image src={officialAssets.heroMobile} alt="Escenario Darkside competitivo" fill priority sizes="100vw" className="object-cover object-center md:hidden" />
          <Image src={officialAssets.heroDesktop} alt="Escenario Darkside competitivo" fill priority sizes="100vw" className="hidden object-cover object-center md:block" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,10,0.08)_0%,rgba(3,6,10,0.74)_58%,var(--ds-bg-950)_100%)] md:bg-[linear-gradient(90deg,rgba(3,6,10,0.96)_0%,rgba(3,6,10,0.78)_34%,rgba(3,6,10,0.24)_68%,rgba(3,6,10,0.72)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(255,36,56,0.18),transparent_24%),radial-gradient(circle_at_72%_48%,rgba(24,230,242,0.14),transparent_24%)]" />
        </div>

        <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-start px-4 pb-10 pt-12 sm:px-6 md:min-h-[680px] md:grid-cols-[0.82fr_1.18fr] md:items-center md:py-16 lg:min-h-[720px]">
          <div className="max-w-[620px]">
            <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-[var(--ds-red-primary)]">{brand.tagline}</p>
            <h1 className="mt-4 font-heading text-[2.35rem] font-bold leading-[1.06] text-white sm:text-5xl lg:text-6xl">
              Compite en torneos de <span className="text-[var(--ds-cyan-primary)]">LoL</span> y{" "}
              <span className="text-[var(--ds-red-primary)]">VALORANT</span>
            </h1>
            <p className="mt-5 max-w-[470px] text-base leading-8 text-white/72">
              Plataforma universitaria para crear equipos, inscribirse a torneos, jugar brackets y reportar resultados con trazabilidad.
            </p>

            <div className="mt-7 grid gap-3 sm:max-w-[470px] sm:grid-cols-2">
              <Link href="/dashboard/tournaments" className="ds-button-primary inline-flex min-h-14 items-center justify-center gap-3 rounded-[10px] px-6 text-base font-bold">
                Explorar torneos <Image src={icons.arrow} alt="" width={18} height={18} />
              </Link>
              <Link
                href={isLoggedIn ? "/dashboard/teams" : "/auth/register"}
                className="ds-button-secondary inline-flex min-h-14 items-center justify-center gap-3 rounded-[10px] px-6 text-base font-bold"
              >
                <Image src={icons.users} alt="" width={19} height={19} /> Crear equipo
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-3 overflow-hidden rounded-[18px] border border-white/10 bg-[rgba(5,8,12,0.72)] shadow-[0_16px_44px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:max-w-[680px]">
              <div className="p-4 sm:p-5">
                <Image src={icons.trophy} alt="" width={26} height={26} />
                <p className="mt-2 truncate font-heading text-xl font-bold sm:text-2xl lg:text-3xl">{countLabel(counts.tournaments, publicDataStatus)}</p>
                <p className="mt-1 text-xs text-white/62 sm:text-sm">Torneos</p>
              </div>
              <div className="border-x border-white/12 p-4 sm:p-5">
                <Image src={icons.users} alt="" width={26} height={26} />
                <p className="mt-2 truncate font-heading text-xl font-bold sm:text-2xl lg:text-3xl">{countLabel(counts.teams, publicDataStatus)}</p>
                <p className="mt-1 text-xs text-white/62 sm:text-sm">Equipos</p>
              </div>
              <div className="p-4 sm:p-5">
                <Image src={icons.bracket} alt="" width={26} height={26} />
                <p className="mt-2 truncate font-heading text-xl font-bold sm:text-2xl lg:text-3xl">{countLabel(counts.spaces, publicDataStatus)}</p>
                <p className="mt-1 text-xs text-white/62 sm:text-sm">Comunidades</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 md:grid-cols-2">
        {gameCards.map((card) => {
          const gameCount =
            publicDataStatus === "loading"
              ? "Sincronizando"
              : publicDataStatus === "error"
                ? "Sin datos"
                : `${formatCount(tournamentsByGame[card.gameKey] ?? 0, "0")} torneos`;

          return (
            <Link key={card.title} href={card.href} className="group relative min-h-[190px] overflow-hidden rounded-[18px] border border-white/10 bg-[rgba(8,13,18,0.9)] shadow-[0_16px_42px_rgba(0,0,0,0.36)]">
              <Image src={card.image} alt={card.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-62 transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,7,11,0.94),rgba(4,7,11,0.46))]" />
              <div className="relative flex min-h-[190px] flex-col justify-end p-5">
                <Image src={card.logo} alt="" width={58} height={58} className="mb-5 h-12 w-auto object-contain" />
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-xl font-bold uppercase text-white">{card.title}</h2>
                  {card.title === "VALORANT" ? (
                    <span className="rounded-full border border-[var(--ds-border-red)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--ds-red-primary)]">Activo</span>
                  ) : null}
                </div>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/68">{card.copy}</p>
                <div className="mt-5 flex gap-6 text-sm text-white/62">
                  <span>{gameCount}</span>
                  <span>Riot mock listo</span>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold uppercase tracking-[0.08em]">Torneos destacados</h2>
          <Link href="/dashboard/tournaments" className="text-sm font-semibold text-[var(--ds-cyan-primary)]">Ver todos</Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {featuredTournaments.map((item) => (
            <Link key={item.id} href={item.href} className="group overflow-hidden rounded-[18px] border border-white/10 bg-[rgba(7,11,16,0.92)] shadow-[0_14px_38px_rgba(0,0,0,0.34)] transition hover:border-[var(--ds-border-red)]">
              <div className="grid grid-cols-[116px_1fr] sm:grid-cols-1">
                <div className="relative min-h-[128px] sm:min-h-[150px]">
                  <Image src={item.image} alt="" fill sizes="(min-width: 1024px) 33vw, 120px" className="object-cover opacity-74 transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,6,10,0.18),rgba(3,6,10,0.74))] sm:bg-[linear-gradient(180deg,rgba(3,6,10,0.04),rgba(3,6,10,0.86))]" />
                  <Image src={item.logo} alt="" width={58} height={58} className="absolute left-3 top-3 h-10 w-auto object-contain sm:h-12" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ds-red-primary)]">{item.status}</p>
                      <h3 className="mt-2 font-heading text-lg font-bold text-white">{item.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-white/58">{item.meta}</p>
                    </div>
                    <span className="hidden rounded-[6px] border border-[var(--ds-border-red)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--ds-red-primary)] sm:inline-flex">MVP</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[var(--ds-gold-prize)]">{item.reward}</p>
                      <p className="text-xs text-white/48">No monetario</p>
                    </div>
                    <div>
                      <p>{item.participants}</p>
                      <p className="text-xs text-white/48">Participantes</p>
                    </div>
                  </div>
                  <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[8px] border border-[var(--ds-border-red)] px-4 py-2 text-sm font-bold text-[var(--ds-red-primary)]">
                    Ver detalles <Image src={icons.arrow} alt="" width={14} height={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:pb-12">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[18px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,36,56,0.12),rgba(8,13,18,0.88))] p-5 shadow-[0_14px_38px_rgba(0,0,0,0.34)]">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ds-red-primary)]">Datos reales primero</p>
            <h2 className="mt-3 font-heading text-3xl font-bold">Sin funciones fantasma</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              La actividad publica sale de torneos, equipos y comunidades reales. Las estadisticas avanzadas se activaran cuando existan eventos suficientes.
            </p>
          </article>
          <article className="rounded-[18px] border border-white/10 bg-[linear-gradient(135deg,rgba(24,230,242,0.12),rgba(8,13,18,0.88))] p-5 shadow-[0_14px_38px_rgba(0,0,0,0.34)]">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ds-cyan-primary)]">Preparado para Riot</p>
            <h2 className="mt-3 font-heading text-3xl font-bold">Riot ID en modo mock</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              Puedes probar vinculacion simulada, codigos mock y resultados mock. La API oficial se activara solo con aprobacion y llaves seguras del backend.
            </p>
          </article>
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-[var(--ds-border-soft)] bg-[rgba(3,6,10,0.96)] px-2 py-2 backdrop-blur-xl lg:hidden">
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
