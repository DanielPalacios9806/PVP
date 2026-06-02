"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Crown,
  Gamepad2,
  LogIn,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  Zap,
  type LucideIcon
} from "lucide-react";
import { brand } from "@/lib/brand";
import { apiUrl } from "@/lib/config";
import { getStoredUser } from "@/lib/session";
import { cn } from "@/lib/styles";
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

const gameCards = [
  {
    title: "League of Legends",
    gameKey: "LEAGUE_OF_LEGENDS",
    copy: "Torneos 5v5, drafts, brackets y espacios para equipos universitarios.",
    logo: officialAssets.lolLogo,
    image: officialAssets.lolCard,
    accent: "cyan",
    href: "/dashboard/tournaments?game=lol"
  },
  {
    title: "VALORANT",
    gameKey: "VALORANT",
    copy: "Circuitos tacticos por escuadra con check-in, salas de partida y resultados auditables.",
    logo: officialAssets.valorantLogo,
    image: officialAssets.valorantCard,
    accent: "red",
    href: "/dashboard/tournaments?game=valorant"
  }
] as const;

const platformSignalLabels = ["Brackets auditables", "Tokens internos", "Riot mock/development", "Roles protegidos", "Sin apuestas"];

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

function cardImageForGame(game: string) {
  return game === "VALORANT" ? officialAssets.valorantCard : officialAssets.lolCard;
}

function logoForGame(game: string) {
  return game === "VALORANT" ? officialAssets.valorantLogo : officialAssets.lolLogo;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group rounded-[18px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:border-[var(--ds-border-cyan)]"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/10 bg-[rgba(24,230,242,0.08)] text-[var(--ds-cyan-primary)] group-hover:shadow-[var(--ds-glow-cyan)]">
        <Icon size={19} />
      </div>
      <p className="font-heading text-2xl font-black leading-none text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-sm font-semibold text-white/72">{label}</p>
      <p className="mt-2 text-xs leading-5 text-white/45">{helper}</p>
    </motion.div>
  );
}

function FeaturePill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white/70 backdrop-blur-md">
      <Icon size={14} className="text-[var(--ds-cyan-primary)]" />
      {label}
    </span>
  );
}

function GameCard({ card, count }: { card: (typeof gameCards)[number]; count: string }) {
  const isValorant = card.accent === "red";

  return (
    <Link
      href={card.href}
      className="group relative min-h-[300px] overflow-hidden rounded-[28px] border border-white/10 bg-[#080d12] shadow-[0_28px_80px_rgba(0,0,0,0.48)] transition duration-300 hover:-translate-y-1 hover:border-[var(--ds-border-cyan)] lg:min-h-[360px]"
    >
      <Image
        src={card.image}
        alt={card.title}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover opacity-70 transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,10,0.08),rgba(3,6,10,0.22)_42%,rgba(3,6,10,0.94))]" />
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          isValorant ? "bg-[var(--ds-red-primary)]" : "bg-[var(--ds-cyan-primary)]"
        )}
      />
      <div className="relative flex min-h-[300px] flex-col justify-between p-6 lg:min-h-[360px] lg:p-7">
        <div className="flex items-start justify-between">
          <Image src={card.logo} alt="" width={72} height={72} className="h-14 w-auto object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.8)]" />
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]",
              isValorant
                ? "border-[var(--ds-border-red)] bg-[rgba(255,36,56,0.12)] text-[var(--ds-red-primary)]"
                : "border-[var(--ds-border-cyan)] bg-[rgba(24,230,242,0.1)] text-[var(--ds-cyan-primary)]"
            )}
          >
            {count}
          </span>
        </div>

        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-white/45">Juego competitivo</p>
          <h2 className="font-heading text-3xl font-black uppercase tracking-[0.03em] text-white">{card.title}</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/68">{card.copy}</p>
          <span className="mt-6 inline-flex items-center gap-2 rounded-[12px] border border-white/12 bg-white/[0.06] px-4 py-3 text-sm font-black text-white transition group-hover:border-white/20">
            Explorar brackets <ChevronRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
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
      return tournaments.map((item, index) => ({
        id: item.id,
        title: item.name,
        meta: `${normalizeGameLabel(item.game)} / ${item.type === "TEAM" ? "Equipos" : "Individual"} / ${item.format.replaceAll("_", " ")}`,
        status: statusLabel(item.status),
        participants: `${item.registrations?.length ?? 0} / ${item.maxParticipants ?? "?"}`,
        href: `/dashboard/tournaments/${item.id}`,
        reward: "Badges + tokens internos",
        image: cardImageForGame(item.game),
        logo: logoForGame(item.game),
        seed: `#0${index + 1}`
      }));
    }

    if (publicDataStatus === "loading") {
      return [
        {
          id: "loading-1",
          title: "Sincronizando torneos",
          meta: "Consultando datos reales de la plataforma",
          status: "Loading",
          participants: "...",
          href: "/dashboard/tournaments",
          reward: "Recompensas internas",
          image: officialAssets.lolCard,
          logo: officialAssets.lolLogo,
          seed: "#01"
        }
      ];
    }

    return [
      {
        id: "empty-1",
        title: "Darkside Campus Cup",
        meta: "League of Legends / 5v5 / Single elimination",
        status: "Demo visual",
        participants: "Beta",
        href: "/dashboard/tournaments",
        reward: "Badges no monetarios",
        image: officialAssets.lolCard,
        logo: officialAssets.lolLogo,
        seed: "#01"
      },
      {
        id: "empty-2",
        title: "VALORANT Night Circuit",
        meta: "VALORANT / equipos / check-in manual",
        status: "Modo mock",
        participants: "Beta",
        href: "/dashboard/tournaments",
        reward: "XP interno",
        image: officialAssets.valorantCard,
        logo: officialAssets.valorantLogo,
        seed: "#02"
      }
    ];
  }, [publicDataStatus, tournaments]);

  const gameCounts = {
    LEAGUE_OF_LEGENDS:
      publicDataStatus === "loading"
        ? "sync"
        : publicDataStatus === "error"
          ? "demo"
          : `${formatCount(tournamentsByGame.LEAGUE_OF_LEGENDS ?? 0, "0")} torneos`,
    VALORANT:
      publicDataStatus === "loading"
        ? "sync"
        : publicDataStatus === "error"
          ? "demo"
          : `${formatCount(tournamentsByGame.VALORANT ?? 0, "0")} torneos`
  };

  const heroStats = [
    {
      icon: Trophy,
      label: "Torneos",
      value: countLabel(counts.tournaments, publicDataStatus),
      helper: "Brackets y eventos auditables"
    },
    {
      icon: Users,
      label: "Equipos",
      value: countLabel(counts.teams, publicDataStatus),
      helper: "Plantillas listas para competir"
    },
    {
      icon: Radio,
      label: "Comunidades",
      value: countLabel(counts.spaces, publicDataStatus),
      helper: "Espacios privados y publicos"
    }
  ];

  const mobileNavItems: Array<{ label: string; href: string; icon: LucideIcon }> = [
    { label: "Inicio", href: "/", icon: Trophy },
    { label: "Torneos", href: "/dashboard/tournaments", icon: Gamepad2 },
    { label: "Equipos", href: "/dashboard/teams", icon: Users },
    { label: "Perfil", href: isLoggedIn ? "/dashboard/account" : "/auth/login", icon: Activity }
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05080c] text-[var(--ds-text-primary)]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_8%,rgba(255,36,56,0.18),transparent_26%),radial-gradient(circle_at_88%_18%,rgba(24,230,242,0.16),transparent_28%),linear-gradient(180deg,#05080c_0%,#080d12_46%,#020409_100%)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(3,6,10,0.74)] backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-[1520px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.04] shadow-[0_0_34px_rgba(255,36,56,0.18)]">
              <Image src={brand.logoMark} alt={`${brand.name} logo`} fill sizes="44px" className="object-contain p-2" />
            </span>
            <Image src={brand.logoHorizontal} alt={brand.name} width={214} height={42} priority className="hidden h-auto w-[188px] sm:block xl:w-[214px]" />
          </Link>

          <nav className="ml-7 hidden items-center gap-7 text-sm font-bold text-white/58 lg:flex">
            <Link className="text-white" href="/">Inicio</Link>
            <Link className="transition hover:text-white" href="/dashboard/tournaments">Torneos</Link>
            <span className="cursor-not-allowed text-white/30">Rankings</span>
            <Link className="transition hover:text-white" href="/dashboard/teams">Equipos</Link>
            <Link className="transition hover:text-white" href="/dashboard/spaces">Comunidad</Link>
          </nav>

          <div className="mx-auto hidden max-w-[360px] flex-1 xl:block">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2.5 text-sm text-white/42">
              <Search size={16} />
              Buscar torneos, equipos o jugadores
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {isLoggedIn ? (
              <Link href="/dashboard" className="ds-button-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-black">
                <Activity size={16} />
                Panel
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="hidden min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white/70 transition hover:text-white sm:inline-flex">
                  <LogIn size={16} />
                  Login
                </Link>
                <Link href="/auth/register" className="ds-button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-black">
                  <UserPlus size={16} />
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-10">
          <Image src={officialAssets.heroMobile} alt="Escenario Darkside competitivo" fill priority sizes="100vw" className="object-cover object-center opacity-60 md:hidden" />
          <Image src={officialAssets.heroDesktop} alt="Escenario Darkside competitivo" fill priority sizes="100vw" className="hidden object-cover object-right opacity-74 md:block" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,10,0.34),rgba(3,6,10,0.88)_58%,#05080c_100%)] md:bg-[linear-gradient(90deg,#05080c_0%,rgba(5,8,12,0.94)_32%,rgba(5,8,12,0.44)_68%,rgba(5,8,12,0.86)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(255,36,56,0.28),transparent_24%),radial-gradient(circle_at_64%_60%,rgba(24,230,242,0.2),transparent_28%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#05080c] to-transparent" />
        </div>

        <div className="mx-auto grid min-h-[780px] max-w-[1520px] gap-10 px-4 py-10 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-20 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="max-w-[720px]">
            <div className="mb-5 flex flex-wrap gap-2">
              <FeaturePill icon={Sparkles} label="Beta cerrada" />
              <FeaturePill icon={ShieldCheck} label="Riot mock/development" />
              <FeaturePill icon={BadgeCheck} label="Sin apuestas" />
            </div>

            <p className="text-xs font-black uppercase tracking-[0.34em] text-[var(--ds-red-primary)]">{brand.tagline}</p>
            <h1 className="mt-4 max-w-[780px] font-heading text-[3.15rem] font-black uppercase leading-[0.94] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl xl:text-[5.8rem]">
              Compite en torneos
              <span className="block bg-gradient-to-r from-[var(--ds-cyan-primary)] via-white to-[var(--ds-red-primary)] bg-clip-text text-transparent">
                de LoL y VALORANT
              </span>
            </h1>
            <p className="mt-6 max-w-[560px] text-base leading-8 text-white/68 sm:text-lg">
              Una plataforma competitiva para organizar torneos universitarios, equipos, brackets, salas de partida y resultados con trazabilidad.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/tournaments" className="ds-button-primary inline-flex min-h-[58px] items-center justify-center gap-3 rounded-[16px] px-7 text-base font-black">
                Explorar torneos <ChevronRight size={18} />
              </Link>
              <Link href={isLoggedIn ? "/dashboard/teams" : "/auth/register"} className="ds-button-secondary inline-flex min-h-[58px] items-center justify-center gap-3 rounded-[16px] px-7 text-base font-black">
                <Users size={18} />
                Crear equipo
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {heroStats.map((item) => (
                <MetricCard key={item.label} {...item} />
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.08 }} className="hidden md:block">
            <div className="relative ml-auto max-w-[560px]">
              <div className="absolute -inset-6 rounded-[42px] bg-[radial-gradient(circle_at_50%_45%,rgba(255,36,56,0.28),transparent_58%)] blur-2xl" />
              <div className="relative overflow-hidden rounded-[34px] border border-white/12 bg-[#080d12]/72 p-4 shadow-[0_36px_100px_rgba(0,0,0,0.56)] backdrop-blur-2xl">
                <div className="relative min-h-[520px] overflow-hidden rounded-[26px] border border-white/10">
                  <Image src={officialAssets.valorantCard} alt="Darkside tournament preview" fill sizes="560px" className="object-cover opacity-82" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,6,10,0.08),rgba(3,6,10,0.28)_42%,rgba(3,6,10,0.92))]" />
                  <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                    <span className="rounded-full border border-[var(--ds-border-red)] bg-[rgba(255,36,56,0.14)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[var(--ds-red-primary)]">
                      En vivo
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-bold text-white/70 backdrop-blur">
                      32 equipos
                    </span>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="rounded-[24px] border border-white/12 bg-black/42 p-5 backdrop-blur-xl">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--ds-cyan-primary)]">Featured tournament</p>
                      <h3 className="mt-2 font-heading text-3xl font-black uppercase text-white">VALORANT Night Circuit</h3>
                      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                        {[
                          ["Check-in", "19:00"],
                          ["Formato", "Bo1"],
                          ["Estado", "Mock"]
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-[16px] border border-white/10 bg-white/[0.055] p-3">
                            <p className="text-xs text-white/44">{label}</p>
                            <p className="mt-1 font-heading text-lg font-black text-white">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -left-5 top-28 w-48 rounded-[20px] border border-[var(--ds-border-cyan)] bg-[#071116]/92 p-4 shadow-[var(--ds-glow-cyan)] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[rgba(24,230,242,0.12)] text-[var(--ds-cyan-primary)]">
                      <Zap size={19} />
                    </div>
                    <div>
                      <p className="text-xs text-white/45">Riot status</p>
                      <p className="font-heading text-base font-black text-white">Mock ready</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-5 bottom-24 w-52 rounded-[20px] border border-[var(--ds-border-red)] bg-[#15070a]/92 p-4 shadow-[var(--ds-glow-red)] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[rgba(255,36,56,0.12)] text-[var(--ds-red-primary)]">
                      <Crown size={19} />
                    </div>
                    <div>
                      <p className="text-xs text-white/45">Recompensas</p>
                      <p className="font-heading text-base font-black text-white">No monetarias</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-[1520px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[var(--ds-red-primary)]">Elige arena</p>
            <h2 className="mt-2 font-heading text-3xl font-black uppercase text-white sm:text-4xl">Juegos principales</h2>
          </div>
          <Link href="/dashboard/tournaments" className="inline-flex items-center gap-2 text-sm font-black text-[var(--ds-cyan-primary)]">
            Ver calendario competitivo <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {gameCards.map((card) => (
            <GameCard key={card.title} card={card} count={gameCounts[card.gameKey]} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1520px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.26em] text-[var(--ds-cyan-primary)]">Featured</p>
                <h2 className="mt-2 font-heading text-3xl font-black uppercase text-white">Torneos destacados</h2>
              </div>
              <Link href="/dashboard/tournaments" className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-black text-white/70 transition hover:text-white sm:inline-flex">
                Ver todos
              </Link>
            </div>

            <div className="grid gap-4">
              {featuredTournaments.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group grid overflow-hidden rounded-[24px] border border-white/10 bg-[#080d12]/86 shadow-[0_18px_52px_rgba(0,0,0,0.3)] transition hover:-translate-y-0.5 hover:border-[var(--ds-border-red)] md:grid-cols-[210px_1fr]"
                >
                  <div className="relative min-h-[150px] md:min-h-full">
                    <Image src={item.image} alt="" fill sizes="210px" className="object-cover opacity-76 transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,6,10,0.12),rgba(3,6,10,0.72))]" />
                    <Image src={item.logo} alt="" width={62} height={62} className="absolute left-4 top-4 h-12 w-auto object-contain" />
                    <span className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-black text-white/70 backdrop-blur">
                      {item.seed}
                    </span>
                  </div>

                  <div className="flex flex-col justify-between p-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[var(--ds-border-red)] bg-[rgba(255,36,56,0.11)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--ds-red-primary)]">
                          {item.status}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">
                          Beta controlada
                        </span>
                      </div>
                      <h3 className="mt-3 font-heading text-2xl font-black uppercase text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-white/58">{item.meta}</p>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-xs text-white/42">Recompensa</p>
                        <p className="mt-1 text-sm font-black text-[var(--ds-gold-prize)]">{item.reward}</p>
                      </div>
                      <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-xs text-white/42">Participantes</p>
                        <p className="mt-1 text-sm font-black text-white">{item.participants}</p>
                      </div>
                      <div className="flex items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.04] p-3 text-sm font-black text-[var(--ds-cyan-primary)]">
                        Ver detalles
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <aside className="grid gap-5">
            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,36,56,0.12),rgba(8,13,18,0.86))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] border border-[var(--ds-border-red)] bg-[rgba(255,36,56,0.12)] text-[var(--ds-red-primary)]">
                <CalendarDays size={22} />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[var(--ds-red-primary)]">Flujo guiado</p>
              <h2 className="mt-2 font-heading text-3xl font-black uppercase text-white">De jugador a competidor</h2>
              <div className="mt-5 space-y-3">
                {["Crea tu perfil", "Forma o une tu equipo", "Inscribete a un bracket", "Reporta resultados"].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.04] p-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 font-heading text-sm font-black text-white">{index + 1}</span>
                    <span className="text-sm font-bold text-white/72">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(24,230,242,0.12),rgba(8,13,18,0.86))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] border border-[var(--ds-border-cyan)] bg-[rgba(24,230,242,0.12)] text-[var(--ds-cyan-primary)]">
                <ShieldCheck size={22} />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[var(--ds-cyan-primary)]">Compliance</p>
              <h2 className="mt-2 font-heading text-3xl font-black uppercase text-white">Riot seguro y controlado</h2>
              <p className="mt-3 text-sm leading-7 text-white/62">
                La beta opera con mock/development. La API oficial de Riot se habilita solo con aprobacion, llaves backend y endpoints administrados.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-[1520px] px-4 py-8 pb-24 sm:px-6 lg:px-8 lg:pb-12">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
          <p className="text-center text-xs font-black uppercase tracking-[0.26em] text-white/38">Preparado para operación competitiva segura</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-5">
            {platformSignalLabels.map((label) => (
              <div key={label} className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-5 text-center font-heading text-sm font-black uppercase tracking-[0.16em] text-white/45">
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <RiotLegalDisclaimer />

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-white/10 bg-[rgba(3,6,10,0.96)] px-2 py-2 backdrop-blur-xl lg:hidden">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1 rounded-[10px] px-2 py-2 text-xs font-bold text-white/56 first:text-[var(--ds-red-primary)]">
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
