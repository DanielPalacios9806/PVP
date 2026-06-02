"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { brand } from "@/lib/brand";
import { apiUrl } from "@/lib/config";
import { getStoredUser } from "@/lib/session";
import { DSBadge, DSContainer, DSPanel, DSSectionHeader, DSStatTile } from "@/components/ui/ds-primitives";
import { RiotLegalDisclaimer } from "./riot-legal-disclaimer";

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
  search: "/assets/darkside/icons/icon-search.svg",
  trophy: "/assets/darkside/icons/icon-trophy.svg",
  user: "/assets/darkside/icons/icon-user.svg",
  users: "/assets/darkside/icons/icon-users.svg"
};

const gameCards = [
  {
    title: "League of Legends",
    gameKey: "LEAGUE_OF_LEGENDS",
    copy: "Torneos 5v5 con brackets, check-in y salas competitivas para equipos universitarios.",
    logo: officialAssets.lolLogo,
    image: officialAssets.lolCard,
    tone: "cyan",
    href: "/dashboard/tournaments?game=lol"
  },
  {
    title: "VALORANT",
    gameKey: "VALORANT",
    copy: "Circuitos tacticos por escuadra, resultados auditables y experiencia lista para beta cerrada.",
    logo: officialAssets.valorantLogo,
    image: officialAssets.valorantCard,
    tone: "red",
    href: "/dashboard/tournaments?game=valorant"
  }
] as const;

const processSteps = [
  { label: "Crea tu perfil", copy: "Registra tu cuenta y prepara tu identidad competitiva." },
  { label: "Forma equipo", copy: "Invita jugadores, define roles y entra a la comunidad." },
  { label: "Compite", copy: "Inscripcion, bracket, match room y reporte de resultados." },
  { label: "Escala", copy: "Tokens internos, progreso y reputacion sin apuestas." }
];

const sponsorTiles = ["Riot-ready", "No gambling", "Beta cerrada", "Supabase", "Render", "Ubuntu Server"];

function formatCount(value: number | null, fallback: string) {
  return value === null ? fallback : new Intl.NumberFormat("es-EC").format(value);
}

function countLabel(value: number | null, status: PublicDataStatus) {
  if (status === "loading") return "...";
  if (status === "error") return "N/D";
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

function gameLogo(game: string) {
  return game === "VALORANT" ? officialAssets.valorantLogo : officialAssets.lolLogo;
}

function gameImage(game: string) {
  return game === "VALORANT" ? officialAssets.valorantCard : officialAssets.lolCard;
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
            setTournaments(data.slice(0, 4));
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
        image: gameImage(item.game),
        logo: gameLogo(item.game)
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
    <Link href="/dashboard" className="ds-nav-action ds-nav-action-secondary">
      <Image src={icons.user} alt="" width={16} height={16} />
      Panel
    </Link>
  ) : (
    <>
      <Link href="/auth/login" className="ds-nav-action ds-nav-action-secondary">
        <Image src={icons.login} alt="" width={16} height={16} />
        Login
      </Link>
      <Link href="/auth/register" className="ds-nav-action ds-nav-action-primary">
        <Image src={icons.register} alt="" width={16} height={16} />
        Registrarse
      </Link>
    </>
  );

  return (
    <main className="ds-home-shell min-h-screen overflow-hidden text-[var(--ds-text-primary)]">
      <header className="sticky top-0 z-50 w-full border-b border-[var(--ds-border-soft)] bg-[rgba(3,6,10,0.9)] shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-[22px]">
        <DSContainer className="flex h-[74px] items-center gap-3 sm:h-20">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center sm:hidden">
              <Image src={brand.logoMark} alt={`${brand.name} logo`} fill sizes="36px" className="object-contain" />
            </span>
            <span className="hidden sm:block">
              <Image src={brand.logoHorizontal} alt={brand.name} width={224} height={45} priority className="h-auto w-[190px] lg:w-[224px]" />
            </span>
          </Link>

          <nav className="ml-8 hidden items-center gap-8 text-sm font-semibold text-[var(--ds-text-secondary)] lg:flex">
            <Link className="ds-nav-link-active" href="/">Inicio</Link>
            <Link className="ds-nav-link" href="/dashboard/tournaments">Torneos</Link>
            <Link className="ds-nav-link" href="/dashboard/teams">Equipos</Link>
            <Link className="ds-nav-link" href="/dashboard/spaces">Comunidad</Link>
            <span className="cursor-not-allowed text-white/35">Rankings pronto</span>
          </nav>

          <div className="mx-auto hidden max-w-[360px] flex-1 lg:block">
            <div className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.035] px-4 py-2.5 text-sm text-white/55">
              <Image src={icons.search} alt="" width={15} height={15} />
              Buscar torneos, equipos o comunidades
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">{authActions}</div>
        </DSContainer>
      </header>

      <section className="ds-home-hero relative overflow-hidden border-b border-[var(--ds-border-soft)]">
        <picture className="absolute inset-0">
          <source media="(max-width: 767px)" srcSet={officialAssets.heroMobile} />
          <Image
            src={officialAssets.heroDesktop}
            alt="Arena competitiva Darkside"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-[0.86]"
          />
        </picture>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,6,10,0.96)_0%,rgba(3,6,10,0.78)_42%,rgba(3,6,10,0.34)_72%,rgba(3,6,10,0.74)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(255,36,56,0.22),transparent_26%),radial-gradient(circle_at_82%_48%,rgba(24,230,242,0.18),transparent_28%),linear-gradient(180deg,transparent_0%,rgba(3,6,10,0.62)_72%,rgba(3,6,10,0.98)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--ds-bg-950)] to-transparent" />

        <DSContainer className="relative grid min-h-[780px] items-center gap-8 py-12 md:min-h-[720px] md:grid-cols-[0.86fr_1.14fr] md:py-16 lg:min-h-[780px]">
          <div className="max-w-[680px] animate-ds-fade-up">
            <div className="flex flex-wrap items-center gap-3">
              <DSBadge tone="red">Beta cerrada</DSBadge>
              <DSBadge tone="cyan">Riot mock/development</DSBadge>
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/58">
                Sin apuestas ni premios monetarios
              </span>
            </div>

            <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.32em] text-[var(--ds-red-primary)]">{brand.tagline}</p>
            <h1 className="mt-4 font-heading text-[2.75rem] font-black leading-[0.94] tracking-[-0.06em] text-white sm:text-6xl lg:text-[5.3rem]">
              La arena para <span className="ds-text-gradient-cyan">equipos</span> y torneos <span className="ds-text-gradient-red">esports</span>
            </h1>
            <p className="mt-6 max-w-[560px] text-base leading-8 text-white/72 md:text-lg">
              Crea equipos, explora torneos, juega brackets y reporta resultados en una experiencia competitiva lista para beta universitaria y revision Riot.
            </p>

            <div className="mt-8 grid gap-3 sm:max-w-[520px] sm:grid-cols-2">
              <Link href="/dashboard/tournaments" className="ds-button-primary group inline-flex min-h-14 items-center justify-center gap-3 rounded-[12px] px-6 text-base font-bold">
                Explorar torneos
                <Image src={icons.arrow} alt="" width={18} height={18} className="transition group-hover:translate-x-1" />
              </Link>
              <Link
                href={isLoggedIn ? "/dashboard/teams" : "/auth/register"}
                className="ds-button-secondary inline-flex min-h-14 items-center justify-center gap-3 rounded-[12px] px-6 text-base font-bold"
              >
                <Image src={icons.users} alt="" width={19} height={19} /> Crear equipo
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 overflow-hidden rounded-[22px] border border-white/10 bg-[rgba(5,8,12,0.74)] shadow-[0_18px_56px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:max-w-[720px]">
              <DSStatTile label="Torneos" value={countLabel(counts.tournaments, publicDataStatus)} icon={<Image src={icons.trophy} alt="" width={24} height={24} />} className="rounded-none border-0 bg-transparent shadow-none" />
              <DSStatTile label="Equipos" value={countLabel(counts.teams, publicDataStatus)} icon={<Image src={icons.users} alt="" width={24} height={24} />} className="rounded-none border-y-0 border-l border-r border-white/10 bg-transparent shadow-none" />
              <DSStatTile label="Comunidades" value={countLabel(counts.spaces, publicDataStatus)} icon={<Image src={icons.bracket} alt="" width={24} height={24} />} className="rounded-none border-0 bg-transparent shadow-none" />
            </div>
          </div>

          <div className="hidden justify-end md:flex">
            <DSPanel strong className="relative w-full max-w-[520px] overflow-hidden p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_10%,rgba(255,36,56,0.18),transparent_28%),radial-gradient(circle_at_78%_26%,rgba(24,230,242,0.14),transparent_30%)]" />
              <div className="relative overflow-hidden rounded-[22px] border border-white/10">
                <Image src={officialAssets.heroDesktop} alt="Vista de arena Darkside" width={960} height={680} className="h-[320px] w-full object-cover opacity-80" priority />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,10,0.08),rgba(3,6,10,0.92))]" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-[16px] border border-white/10 bg-black/38 p-3 backdrop-blur-lg">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Modo</p>
                      <p className="mt-1 font-heading text-lg font-bold text-[var(--ds-cyan-primary)]">Mock</p>
                    </div>
                    <div className="rounded-[16px] border border-white/10 bg-black/38 p-3 backdrop-blur-lg">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Flow</p>
                      <p className="mt-1 font-heading text-lg font-bold text-white">Bracket</p>
                    </div>
                    <div className="rounded-[16px] border border-white/10 bg-black/38 p-3 backdrop-blur-lg">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Riot</p>
                      <p className="mt-1 font-heading text-lg font-bold text-[var(--ds-red-primary)]">Ready</p>
                    </div>
                  </div>
                </div>
              </div>
            </DSPanel>
          </div>
        </DSContainer>
      </section>

      <section className="relative -mt-10 pb-8">
        <DSContainer>
          <div className="grid gap-4 md:grid-cols-2">
            {gameCards.map((card) => {
              const gameCount =
                publicDataStatus === "loading"
                  ? "Sincronizando"
                  : publicDataStatus === "error"
                    ? "Sin datos"
                    : `${formatCount(tournamentsByGame[card.gameKey] ?? 0, "0")} torneos`;

              return (
                <Link key={card.title} href={card.href} className="group ds-game-card relative min-h-[245px] overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(8,13,18,0.9)] shadow-[0_20px_62px_rgba(0,0,0,0.42)]">
                  <Image src={card.image} alt={card.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover opacity-70 transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,7,11,0.96),rgba(4,7,11,0.5)_62%,rgba(4,7,11,0.24))]" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                  <div className="relative flex min-h-[245px] flex-col justify-end p-6">
                    <Image src={card.logo} alt="" width={76} height={76} className="mb-6 h-14 w-auto object-contain" />
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-2xl font-black uppercase tracking-[-0.03em] text-white">{card.title}</h2>
                      <DSBadge tone={card.tone}>{card.tone === "red" ? "Activo" : "Scrims"}</DSBadge>
                    </div>
                    <p className="mt-3 max-w-md text-sm leading-6 text-white/68">{card.copy}</p>
                    <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.12em] text-white/58">
                      <span>{gameCount}</span>
                      <span className="text-[var(--ds-cyan-primary)]">Riot mock listo</span>
                      <span className="text-[var(--ds-gold-prize)]">No monetario</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </DSContainer>
      </section>

      <section className="py-10 md:py-14">
        <DSContainer>
          <DSSectionHeader
            eyebrow="Competencias destacadas"
            title="Torneos listos para la beta"
            description="Cards con imagen, estado, recompensa interna y participantes para que la exploracion sea rapida en desktop y mobile."
            action={<Link href="/dashboard/tournaments" className="ds-button-secondary rounded-[12px] px-5 py-3 text-sm font-bold">Ver todos</Link>}
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {featuredTournaments.map((item) => (
              <Link key={item.id} href={item.href} className="group overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(7,11,16,0.94)] shadow-[0_18px_52px_rgba(0,0,0,0.36)] transition hover:-translate-y-1 hover:border-[var(--ds-border-red)] hover:shadow-[0_0_28px_rgba(255,36,56,0.22)]">
                <div className="relative min-h-[170px]">
                  <Image src={item.image} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover opacity-74 transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,10,0.05),rgba(3,6,10,0.92))]" />
                  <Image src={item.logo} alt="" width={62} height={62} className="absolute left-4 top-4 h-12 w-auto object-contain" />
                  <span className="absolute right-4 top-4 rounded-full border border-[var(--ds-border-red)] bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ds-red-primary)] backdrop-blur">
                    Beta controlada
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ds-red-primary)]">{item.status}</p>
                  <h3 className="mt-2 font-heading text-xl font-black tracking-[-0.03em] text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-white/58">{item.meta}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-[14px] border border-white/10 bg-white/[0.035] p-3">
                      <p className="font-bold text-[var(--ds-gold-prize)]">{item.reward}</p>
                      <p className="mt-1 text-xs text-white/45">No monetario</p>
                    </div>
                    <div className="rounded-[14px] border border-white/10 bg-white/[0.035] p-3">
                      <p className="font-bold text-white">{item.participants}</p>
                      <p className="mt-1 text-xs text-white/45">Participantes</p>
                    </div>
                  </div>
                  <span className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--ds-border-red)] px-4 py-3 text-sm font-bold text-[var(--ds-red-primary)] transition group-hover:bg-[rgba(255,36,56,0.08)]">
                    Ver detalles <Image src={icons.arrow} alt="" width={14} height={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </DSContainer>
      </section>

      <section className="py-8 md:py-12">
        <DSContainer className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <DSPanel strong className="overflow-hidden p-6">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[var(--ds-red-primary)]">Experiencia guiada</p>
            <h2 className="mt-3 font-heading text-3xl font-black tracking-[-0.04em] md:text-4xl">De visitante a competidor en 4 pasos</h2>
            <p className="mt-4 text-sm leading-7 text-white/62">
              La home ahora comunica el camino real del usuario y prepara la Fase 3 para que el hub de torneos siga la misma arquitectura visual.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {processSteps.map((step, index) => (
                <div key={step.label} className="rounded-[18px] border border-white/10 bg-white/[0.035] p-4">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ds-cyan-primary)]">0{index + 1}</span>
                  <h3 className="mt-2 font-heading text-lg font-bold text-white">{step.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">{step.copy}</p>
                </div>
              ))}
            </div>
          </DSPanel>

          <div className="grid gap-4">
            <article className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,36,56,0.14),rgba(8,13,18,0.9))] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ds-red-primary)]">Datos reales primero</p>
              <h2 className="mt-3 font-heading text-3xl font-black tracking-[-0.04em]">Sin funciones fantasma</h2>
              <p className="mt-3 text-sm leading-7 text-white/62">
                La actividad publica sale de torneos, equipos y comunidades reales. Las estadisticas avanzadas se activaran cuando existan eventos suficientes.
              </p>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(24,230,242,0.14),rgba(8,13,18,0.9))] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ds-cyan-primary)]">Preparado para Riot</p>
              <h2 className="mt-3 font-heading text-3xl font-black tracking-[-0.04em]">Riot ID en modo controlado</h2>
              <p className="mt-3 text-sm leading-7 text-white/62">
                Puedes probar vinculacion simulada, codigos mock y resultados mock. La API oficial se activara solo con aprobacion y llaves seguras del backend.
              </p>
            </article>
          </div>
        </DSContainer>
      </section>

      <section className="border-y border-white/10 bg-white/[0.025] py-5">
        <DSContainer>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {sponsorTiles.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/50">
                {item}
              </span>
            ))}
          </div>
        </DSContainer>
      </section>

      <RiotLegalDisclaimer />

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-[var(--ds-border-soft)] bg-[rgba(3,6,10,0.96)] px-2 py-2 backdrop-blur-xl lg:hidden">
        {[
          ["Inicio", "/", icons.trophy],
          ["Torneos", "/dashboard/tournaments", icons.bracket],
          ["Equipos", "/dashboard/teams", icons.users],
          ["Perfil", isLoggedIn ? "/dashboard/account" : "/auth/login", icons.user]
        ].map(([label, href, icon]) => (
          <Link key={label} href={href} className="flex flex-col items-center gap-1 rounded-[10px] px-2 py-2 text-xs font-semibold text-white/58 first:text-[var(--ds-red-primary)]">
            <Image src={icon} alt="" width={19} height={19} />
            {label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
