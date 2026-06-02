"use client";

import Image from "next/image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Flame,
  ListFilter,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  X,
  UsersRound
} from "lucide-react";
import { apiUrl, getAuthHeaders } from "@/lib/config";
import { mockTournaments } from "@/lib/mock-data";
import { getStoredUser, type StoredUser } from "@/lib/session";

const hubConfig = {
  lol: {
    title: "League of Legends",
    eyebrow: "Centro competitivo LoL",
    subtitle: "Torneos, brackets, reglas y comunidades competitivas.",
    cover: "/assets/games/lol-cover.jpg",
    logo: "/assets/darkside/official/game-lol-logo.png",
    owner: "Darkside Ops",
    ownerRole: "Operacion competitiva",
    accent: "from-[#07111b]/94 via-[#101a28]/86 to-[#111827]/96",
    glow: "rgba(24,230,242,0.16)"
  },
  valorant: {
    title: "VALORANT",
    eyebrow: "Circuito tactico",
    subtitle: "Circuitos tacticos, partidas programadas y competencias por escuadras.",
    cover: "/assets/games/valorant-viper.png",
    logo: "/assets/darkside/official/game-valorant-logo.png",
    owner: "Darkside Ops",
    ownerRole: "Operacion competitiva",
    accent: "from-[#1e0d15]/94 via-[#191523]/88 to-[#101520]/96",
    glow: "rgba(255,36,56,0.18)"
  }
} as const;

const topTabs = ["Torneos", "Calendario", "Equipos inscritos", "Reglas", "Brackets"];
const formatFilters = ["1vs1", "2vs2", "3vs3", "4vs4", "5vs5"];
const statusFilters = ["OPEN", "LIVE", "COMPLETE"] as const;

type HubStatus = "OPEN" | "LIVE" | "COMPLETE";

type HubCard = {
  id: string;
  name: string;
  startsAt: string;
  game: string;
  mode: string;
  status: HubStatus;
  copy: string;
  prize: string;
  requiresRiot?: boolean;
  participating?: boolean;
};

const gameShowcase = [
  {
    id: "lol",
    title: "League of Legends",
    href: "/dashboard/tournaments?game=lol",
    image: "/assets/darkside/official/game-lol-logo.png"
  },
  {
    id: "valorant",
    title: "VALORANT",
    href: "/dashboard/tournaments?game=valorant",
    image: "/assets/darkside/official/game-valorant-logo.png"
  }
];

const utilityPanels = [
  {
    title: "Check-in y reportes",
    copy: "Abre salas, valida capitanes y reporta resultados manuales.",
    href: "/dashboard/matches/mock-match-1"
  },
  {
    title: "Espacios activos",
    copy: "Agrupa comunidades, temporadas y torneos recurrentes.",
    href: "/dashboard/spaces"
  },
  {
    title: "Economia interna",
    copy: "Tokens internos no monetarios para beneficios y recompensas visuales.",
    href: "/dashboard/tokens"
  }
];

const curatedCards: HubCard[] = [
  {
    id: "hub-1",
    name: "Darkside Rift Weekly",
    startsAt: "En 10 minutos, 02:00 PM",
    game: "League of Legends",
    mode: "5vs5",
    status: "OPEN",
    copy: "Bracket abierto con cupos para escuadras competitivas.",
    prize: "1.500 tokens",
    participating: false
  },
  {
    id: "hub-2",
    name: "Midnight Clash Series",
    startsAt: "Hoy, 08:30 PM",
    game: "League of Legends",
    mode: "3vs3",
    status: "LIVE",
    copy: "Serie nocturna para comunidades activas y rosters en crecimiento.",
    prize: "900 tokens",
    participating: false
  },
  {
    id: "hub-3",
    name: "Solo Queue Faceoff",
    startsAt: "Manana, 06:00 PM",
    game: "League of Legends",
    mode: "1vs1",
    status: "COMPLETE",
    copy: "Encuentros individuales para medir mecanicas y reflejos.",
    prize: "350 tokens",
    participating: false
  }
];

const liveStatuses = ["IN_PROGRESS", "CHECK_IN"];
const openStatuses = ["REGISTRATION_OPEN", "PUBLISHED", "CHECK_IN", "IN_PROGRESS"];

function tournamentRequiresRiotAccount(game?: string | null) {
  const normalized = String(game || "")
    .toUpperCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim();

  return normalized.includes("LEAGUE") || normalized === "LOL" || normalized.includes("VALORANT");
}

function tournamentDateLabel(value?: string | Date | null, status?: string) {
  if (status === "IN_PROGRESS") {
    return "En curso ahora";
  }

  if (!value) {
    return "Programacion pendiente";
  }

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusToCardStatus(status?: string): HubStatus {
  if (status && liveStatuses.includes(status)) {
    return "LIVE";
  }

  if (status && openStatuses.includes(status)) {
    return "OPEN";
  }

  return "COMPLETE";
}

function isUserTournament(item: any, user?: StoredUser | null) {
  if (!user) {
    return false;
  }

  return Boolean(
    item.registrations?.some((registration: any) =>
      registration.userId === user.id ||
      registration.user?.id === user.id
    )
  );
}

function compareTournamentDates(a: any, b: any) {
  const aTime = a.startsAt ? new Date(a.startsAt).getTime() : Number.MAX_SAFE_INTEGER;
  const bTime = b.startsAt ? new Date(b.startsAt).getTime() : Number.MAX_SAFE_INTEGER;

  return aTime - bTime;
}

function sortTournamentsForViewer(items: any[], user?: StoredUser | null) {
  const pool = user
    ? [...items]
    : items.filter((item) => openStatuses.includes(item.status));

  return pool.sort((a, b) => {
    const aMine = isUserTournament(a, user);
    const bMine = isUserTournament(b, user);

    if (aMine !== bMine) {
      return aMine ? -1 : 1;
    }

    const aOpen = openStatuses.includes(a.status);
    const bOpen = openStatuses.includes(b.status);

    if (aOpen !== bOpen) {
      return aOpen ? -1 : 1;
    }

    return compareTournamentDates(a, b);
  });
}

function mapTournamentCard(item: any, user?: StoredUser | null): HubCard {
  const participating = isUserTournament(item, user);

  return {
    id: item.id,
    name: item.name,
    startsAt: tournamentDateLabel(item.startsAt, item.status),
    game: item.game,
    mode: item.teamSize ? `${item.teamSize}vs${item.teamSize}` : item.type === "TEAM" ? "5vs5" : "1vs1",
    status: statusToCardStatus(item.status),
    copy: item.publicRules || item.rules || item.description || "Torneo competitivo listo para inscripciones y seguimiento.",
    prize: item.prizes || `${item.maxParticipants || 8} slots`,
    requiresRiot: tournamentRequiresRiotAccount(item.game),
    participating
  };
}

function statusLabel(status: HubStatus) {
  if (status === "LIVE") return "En vivo";
  if (status === "OPEN") return "Inscripciones abiertas";
  return "Finalizado";
}

function statusClass(status: HubStatus) {
  if (status === "LIVE") return "border-[#18e6f2]/35 bg-[#18e6f2]/12 text-[#bffaff]";
  if (status === "OPEN") return "border-[#40ff91]/30 bg-[#40ff91]/12 text-[#9dffc4]";
  return "border-white/10 bg-white/[0.06] text-white/55";
}

function normalizeForSearch(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function HubMetric({ icon, label, value, tone = "text-white" }: { icon: ReactNode; label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-black/28 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#18e6f2]">{icon}</span>
        <div>
          <strong className={`block text-xl leading-none ${tone}`}>{value}</strong>
          <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-white/35">{label}</span>
        </div>
      </div>
    </div>
  );
}

export function TournamentsHub({ game = "lol" }: { game?: string }) {
  const gameKey = game === "valorant" ? "valorant" : "lol";
  const config = hubConfig[gameKey];
  const [items, setItems] = useState<any[]>([]);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [role, setRole] = useState("USER");
  const [activeTab, setActiveTab] = useState("Torneos");
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [activeStatus, setActiveStatus] = useState<HubStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    setUser(user);
    setRole(user?.role ?? "USER");

    async function load() {
      try {
        const response = await fetch(`${apiUrl}/tournaments`, {
          headers: getAuthHeaders()
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error("api");
        }
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems(mockTournaments);
      }
    }

    void load();
  }, []);

  const cards = useMemo(() => {
    return items.length ? sortTournamentsForViewer(items, user).map((item) => mapTournamentCard(item, user)) : curatedCards;
  }, [items, user]);

  const visibleCards = useMemo(() => {
    const normalizedQuery = normalizeForSearch(query.trim());

    return cards.filter((card) => {
      const matchesFormat = activeFormats.length === 0 || activeFormats.includes(card.mode);
      const matchesStatus = activeStatus === "ALL" || card.status === activeStatus;
      const searchable = normalizeForSearch(`${card.name} ${card.game} ${card.mode} ${card.copy}`);
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);

      return matchesFormat && matchesStatus && matchesQuery;
    });
  }, [activeFormats, activeStatus, cards, query]);

  const openCount = cards.filter((card) => card.status === "OPEN").length;
  const liveCount = cards.filter((card) => card.status === "LIVE").length;
  const myCount = cards.filter((card) => card.participating).length;
  const highlighted = visibleCards[0] ?? cards[0];
  const canCreate = role === "ADMIN" || role === "SUPER_ADMIN" || role === "ORGANIZER";

  function toggleFormat(format: string) {
    setActiveFormats((current) =>
      current.includes(format) ? current.filter((item) => item !== format) : [...current, format]
    );
  }

  function resetFilters() {
    setActiveFormats([]);
    setActiveStatus("ALL");
    setQuery("");
  }

  function clearAndCloseMobileFilters() {
    resetFilters();
    setMobileFiltersOpen(false);
  }

  const hasActiveFilters = Boolean(query.trim()) || activeFormats.length > 0 || activeStatus !== "ALL";

  const mobileFilterPanel = (
    <div className="space-y-5">
      <section className="rounded-[20px] border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ff4254]">Juego activo</p>
        <div className="mt-4 grid gap-3">
          {gameShowcase.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMobileFiltersOpen(false)}
              className={`flex items-center justify-between rounded-[16px] border px-4 py-3 text-sm font-semibold transition ${
                item.id === gameKey
                  ? "border-[#18e6f2]/45 bg-[#18e6f2]/10 text-white"
                  : "border-white/10 bg-black/24 text-white/70 hover:border-white/20"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Image src={item.image} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                <span className="truncate">{item.title}</span>
              </span>
              <span className="text-[#18e6f2]">{item.id === "lol" ? cards.length * 2 : cards.length}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[20px] border border-white/10 bg-white/[0.035] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Formato</p>
          <button onClick={clearAndCloseMobileFilters} className="text-xs font-bold text-[#18e6f2]">Limpiar</button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {formatFilters.map((format) => (
            <button
              key={format}
              onClick={() => toggleFormat(format)}
              className={`rounded-[14px] border px-4 py-3 text-left text-sm font-bold transition ${
                activeFormats.includes(format)
                  ? "border-[#ff2438]/45 bg-[#ff2438]/10 text-white"
                  : "border-white/10 bg-black/24 text-white/62 hover:border-white/20 hover:text-white"
              }`}
            >
              {format}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[20px] border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Estado</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveStatus("ALL")}
            className={`rounded-[14px] border px-3 py-3 text-xs font-black uppercase tracking-[0.12em] ${
              activeStatus === "ALL" ? "border-white/25 bg-white/10 text-white" : "border-white/10 text-white/48"
            }`}
          >
            Todos
          </button>
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`rounded-[14px] border px-3 py-3 text-xs font-black uppercase tracking-[0.12em] ${
                activeStatus === status ? statusClass(status) : "border-white/10 text-white/48"
              }`}
            >
              {status === "OPEN" ? "Abiertos" : status === "LIVE" ? "En vivo" : "Final"}
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <div className="tournaments-hub-stage min-w-0 overflow-hidden bg-[#05080d] pb-20 text-white lg:pb-12">
      <div className="mx-auto grid max-w-[1480px] gap-5 px-3 py-4 sm:px-4 lg:grid-cols-[292px_minmax(0,1fr)] lg:px-6 lg:py-5 2xl:px-8">
        <aside className="hidden space-y-5 lg:sticky lg:top-24 lg:block lg:self-start">
          <section className="rounded-[22px] border border-white/10 bg-[#0b111b]/94 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#18e6f2]/25 bg-[#18e6f2]/10">
                <SlidersHorizontal className="h-5 w-5 text-[#18e6f2]" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ff4254]">Explorar torneos</p>
                <h1 className="mt-1 text-2xl font-black text-white">Arena competitiva</h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/58">Filtra por juego, formato y estado sin perder la vista central de competencias.</p>

            <div className="mt-6 grid gap-3">
              {gameShowcase.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center justify-between rounded-[16px] border px-4 py-3 text-sm font-semibold transition ${
                    item.id === gameKey ? "border-[#18e6f2]/45 bg-[#18e6f2]/10 text-white" : "border-white/10 bg-white/[0.035] text-white/70 hover:border-white/20"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Image src={item.image} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                    <span className="truncate">{item.title}</span>
                  </span>
                  <span className="text-[#18e6f2]">{item.id === "lol" ? cards.length * 2 : cards.length}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] border border-white/10 bg-[#0b111b]/94 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Filtros</p>
              <button onClick={resetFilters} className="text-xs font-bold text-[#18e6f2]">Limpiar</button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 lg:grid lg:gap-2">
              {formatFilters.map((format) => (
                <button
                  key={format}
                  onClick={() => toggleFormat(format)}
                  className={`flex min-w-[86px] flex-1 items-center justify-between rounded-[14px] border px-4 py-3 text-left text-sm font-bold transition lg:w-full ${
                    activeFormats.includes(format)
                      ? "border-[#ff2438]/45 bg-[#ff2438]/10 text-white"
                      : "border-white/10 bg-white/[0.035] text-white/62 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span>{format}</span>
                  <span className="hidden text-xs text-white/35 sm:inline">Formato</span>
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveStatus("ALL")}
                className={`rounded-[14px] border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${activeStatus === "ALL" ? "border-white/25 bg-white/10 text-white" : "border-white/10 text-white/48"}`}
              >
                Todos
              </button>
              {statusFilters.map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`rounded-[14px] border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${activeStatus === status ? statusClass(status) : "border-white/10 text-white/48"}`}
                >
                  {status === "OPEN" ? "Abiertos" : status === "LIVE" ? "En vivo" : "Final"}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] border border-white/10 bg-[#0b111b]/94 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Estadisticas en vivo</p>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between"><dt className="text-white/55">Torneos visibles</dt><dd className="font-bold text-white">{visibleCards.length}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-white/55">Inscripciones abiertas</dt><dd className="font-bold text-[#40ff91]">{openCount}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-white/55">Mis torneos</dt><dd className="font-bold text-[#18e6f2]">{myCount}</dd></div>
            </dl>
          </section>

          <section className="hidden rounded-[22px] border border-white/10 bg-[#0b111b]/94 p-5 xl:block">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Herramientas</p>
            <div className="mt-4 space-y-2">
              {utilityPanels.map((item) => (
                <Link key={item.title} href={item.href} className="block rounded-[16px] border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#18e6f2]/30">
                  <strong className="text-sm text-white">{item.title}</strong>
                  <p className="mt-2 text-xs leading-5 text-white/52">{item.copy}</p>
                </Link>
              ))}
            </div>
          </section>
        </aside>

        <main className="min-w-0 space-y-4 lg:space-y-5">
          <section className="tournaments-mobile-command rounded-[22px] border border-white/10 bg-[#0b111b]/94 p-4 shadow-[0_16px_36px_rgba(0,0,0,0.28)] lg:hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ff4254]">Arena competitiva</p>
                <h1 className="mt-1 text-2xl font-black text-white">Torneos Darkside</h1>
                <p className="mt-2 text-sm leading-6 text-white/55">Explora juegos, estados y formatos sin perder el centro de entretenimiento.</p>
              </div>

              <Dialog.Root open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <Dialog.Trigger asChild>
                  <button className="relative inline-flex shrink-0 items-center gap-2 rounded-[14px] border border-[#18e6f2]/35 bg-[#18e6f2]/10 px-4 py-3 text-sm font-black text-[#bffaff] shadow-[0_12px_30px_rgba(24,230,242,0.12)]">
                    <ListFilter className="h-4 w-4" />
                    Filtros
                    {hasActiveFilters ? <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-[#05080d] bg-[#ff2438]" /> : null}
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/72 backdrop-blur-sm lg:hidden" />
                  <Dialog.Content className="fixed inset-x-3 bottom-[82px] top-4 z-[90] overflow-hidden rounded-[24px] border border-white/10 bg-[#070b12]/98 text-white shadow-[0_26px_90px_rgba(0,0,0,0.62)] lg:hidden">
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                      <div>
                        <Dialog.Title className="text-lg font-black text-white">Filtros de torneos</Dialog.Title>
                        <Dialog.Description className="mt-1 text-xs text-white/45">Juego, estado y formato competitivo.</Dialog.Description>
                      </div>
                      <Dialog.Close asChild>
                        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70">
                          <X className="h-4 w-4" />
                        </button>
                      </Dialog.Close>
                    </div>
                    <div className="max-h-[calc(100vh-168px)] overflow-y-auto px-4 py-5">
                      {mobileFilterPanel}
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>

            <label className="mt-4 flex min-w-0 items-center gap-3 rounded-[16px] border border-white/10 bg-black/28 px-4 py-3 text-sm text-white/45 focus-within:border-[#18e6f2]/45 focus-within:text-white/70">
              <Search className="h-4 w-4 text-[#18e6f2]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar torneo, formato o comunidad..."
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/35"
              />
            </label>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-[14px] border border-white/10 bg-white/[0.035] p-3"><strong className="block text-lg text-[#40ff91]">{openCount}</strong><span className="text-[10px] uppercase tracking-[0.12em] text-white/35">Abiertos</span></div>
              <div className="rounded-[14px] border border-white/10 bg-white/[0.035] p-3"><strong className="block text-lg text-[#18e6f2]">{liveCount}</strong><span className="text-[10px] uppercase tracking-[0.12em] text-white/35">En vivo</span></div>
              <div className="rounded-[14px] border border-white/10 bg-white/[0.035] p-3"><strong className="block text-lg text-white">{visibleCards.length}</strong><span className="text-[10px] uppercase tracking-[0.12em] text-white/35">Visibles</span></div>
            </div>
          </section>
          <section className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#0b111b] p-4 shadow-[0_22px_50px_rgba(0,0,0,0.26)] sm:p-5 lg:rounded-[24px] lg:p-6">
            <Image src={config.cover} alt={config.title} fill className="object-cover object-center opacity-45" priority />
            <div className={`absolute inset-0 bg-gradient-to-r ${config.accent}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(255,36,56,0.24),transparent_25%),radial-gradient(circle_at_78%_70%,rgba(24,230,242,0.16),transparent_24%)]" />
            <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-stretch">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ff4254]">Destacado</p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <h2 className="font-heading text-[clamp(2rem,14vw,4.7rem)] font-black leading-[0.92] text-white sm:text-[clamp(2.25rem,6vw,4.7rem)]">Darkside Cup</h2>
                  <Image src={config.logo} alt={config.title} width={62} height={62} className="hidden h-14 w-14 object-contain sm:block" />
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">Torneos competitivos con brackets, check-in, salas y recompensas internas no monetarias. Tu centro de entretenimiento competitivo.</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <HubMetric icon={<Trophy className="h-4 w-4" />} label="Abiertos" value={openCount} tone="text-[#40ff91]" />
                  <HubMetric icon={<Flame className="h-4 w-4" />} label="En vivo" value={liveCount} tone="text-[#18e6f2]" />
                  <HubMetric icon={<UsersRound className="h-4 w-4" />} label="Filtrados" value={visibleCards.length} />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={highlighted ? `/dashboard/tournaments/${highlighted.id}` : "/dashboard/tournaments"} className="inline-flex items-center gap-2 rounded-[14px] bg-[#ff2438] px-5 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(255,36,56,0.28)] transition hover:bg-[#ff4254]">
                    Ver torneo destacado
                  </Link>
                  {canCreate ? (
                    <Link href="/dashboard/admin" className="inline-flex items-center gap-2 rounded-[14px] border border-[#18e6f2]/35 bg-[#18e6f2]/8 px-5 py-3 text-sm font-black text-[#bffaff] transition hover:bg-[#18e6f2]/12">
                      <Plus className="h-4 w-4" /> Crear torneo
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 rounded-[20px] border border-white/10 bg-black/28 p-4 backdrop-blur-md">
                <div className="rounded-[16px] border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#18e6f2]">Siguiente evento</p>
                  <strong className="mt-2 block text-xl text-white">{highlighted?.name ?? "Darkside Cup"}</strong>
                  <p className="mt-2 text-sm text-white/56">{highlighted?.startsAt ?? "Programacion pendiente"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.035] p-4"><strong className="text-2xl text-white">{cards.length}</strong><span className="block text-xs uppercase tracking-[0.14em] text-white/38">Torneos</span></div>
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.035] p-4"><strong className="text-2xl text-[#18e6f2]">{myCount}</strong><span className="block text-xs uppercase tracking-[0.14em] text-white/38">Mis cupos</span></div>
                </div>
              </div>
            </div>
          </section>

          <section className="tournaments-hub-tabs overflow-x-auto rounded-[18px] border border-white/10 bg-[#0b111b]/92 px-4">
            <div className="flex min-w-max gap-6">
              {topTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm font-bold transition ${
                    activeTab === tab ? "border-b-2 border-[#ff2438] text-white" : "text-white/45 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>

          <section className="hidden rounded-[22px] border border-white/10 bg-[#0b111b]/92 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.25)] lg:block">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-center">
              <label className="flex min-w-0 items-center gap-3 rounded-[16px] border border-white/10 bg-black/28 px-4 py-3 text-sm text-white/45 focus-within:border-[#18e6f2]/45 focus-within:text-white/70">
                <Search className="h-4 w-4 text-[#18e6f2]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar torneos, equipos o comunidades..."
                  className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/35"
                />
              </label>
              <div className="flex items-center gap-3 xl:justify-end">
                <span className="hidden text-xs uppercase tracking-[0.18em] text-white/35 sm:inline">Ordenar por</span>
                <button className="rounded-[14px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-white/70">Más recientes</button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            {visibleCards.length ? visibleCards.map((card) => (
              <Link
                key={card.id}
                href={`/dashboard/tournaments/${card.id}`}
                className="tournaments-hub-card group block overflow-hidden rounded-[22px] border border-white/10 bg-[#0b111b]/94 transition hover:border-[#18e6f2]/25 hover:shadow-[0_18px_50px_rgba(24,230,242,0.08)]"
              >
                <div className="grid gap-0 xl:grid-cols-[260px_minmax(0,1fr)_210px]">
                  <div className="relative min-h-[128px] bg-[#111722] sm:min-h-[170px]">
                    <Image src={config.cover} alt={card.name} fill className="object-cover opacity-76 transition duration-500 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,12,18,0.10),rgba(8,12,18,0.9))]" />
                    {card.participating ? <span className="absolute left-3 top-3 rounded-full bg-[#18e6f2] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-black">Participando</span> : null}
                    {card.requiresRiot ?? tournamentRequiresRiotAccount(card.game) ? (
                      <span className="absolute bottom-3 left-3 rounded-full border border-[#18e6f2]/35 bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#bffaff] backdrop-blur">
                        Riot ID requerido
                      </span>
                    ) : null}
                  </div>

                  <div className="p-5 lg:p-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#18e6f2]">{card.game}</p>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(card.status)}`}>{statusLabel(card.status)}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-black text-white sm:text-3xl">{card.name}</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-white/58 sm:leading-7">{card.copy}</p>
                    <div className="mt-5 grid gap-2 text-xs text-white/58 sm:grid-cols-2 sm:text-sm xl:grid-cols-4">
                      <span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-[#ffb21d]" />{card.prize}</span>
                      <span className="inline-flex items-center gap-2"><UsersRound className="h-4 w-4 text-[#ff4254]" />{card.mode}</span>
                      <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#18e6f2]" />{card.requiresRiot ?? tournamentRequiresRiotAccount(card.game) ? "Riot ID requerido" : "Sin requisito Riot"}</span>
                      <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-white/45" />{card.startsAt}</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between border-t border-white/8 p-4 sm:p-5 xl:border-l xl:border-t-0">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">Inscripción</p>
                      <strong className="mt-2 block text-xl text-white">Tokens internos</strong>
                      <p className="mt-2 text-xs leading-5 text-white/45">Beneficios no monetarios y trazabilidad competitiva.</p>
                    </div>
                    <span className="mt-5 inline-flex w-full justify-center rounded-[14px] bg-[#ff2438] px-4 py-3 text-sm font-black text-white transition group-hover:bg-[#ff4254]">
                      {card.participating ? "Ver mi inscripción" : card.status === "OPEN" ? "Inscribirse" : "Ver detalles"}
                    </span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-[#0b111b]/92 p-8 text-center">
                <p className="text-lg font-bold text-white">No hay torneos con esos filtros.</p>
                <button onClick={resetFilters} className="mt-4 rounded-[14px] border border-[#18e6f2]/35 px-5 py-3 text-sm font-bold text-[#18e6f2]">Restablecer filtros</button>
              </div>
            )}
          </section>

          {canCreate ? (
            <section className="rounded-[22px] border border-dashed border-white/10 bg-[#0b111b]/92 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1b2332] text-3xl text-white/70">+</div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Crear torneo</h2>
                    <p className="mt-2 text-sm text-white/58">Define reglas, fechas, formato y publica el flujo competitivo.</p>
                  </div>
                </div>
                <Link href="/dashboard/admin" className="rounded-[14px] border border-[#18e6f2]/35 px-5 py-3 text-center text-sm font-bold text-[#18e6f2]">Abrir operación</Link>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
