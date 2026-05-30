"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/config";
import { mockTournaments } from "@/lib/mock-data";
import { getStoredUser, type StoredUser } from "@/lib/session";

const hubConfig = {
  lol: {
    title: "League of Legends",
    subtitle: "Torneos, brackets, reglas y comunidades competitivas.",
    cover: "/assets/games/lol-cover.jpg",
    avatar: "/assets/games/lol-cover.jpg",
    owner: "Darkside Ops",
    ownerRole: "Operacion competitiva",
    accent: "from-[#1d2444]/85 via-[#1c2230]/88 to-[#1a1f2b]/95"
  },
  valorant: {
    title: "VALORANT",
    subtitle: "Circuitos tacticos, scrims y competencias por escuadras.",
    cover: "/assets/games/valorant-viper.png",
    avatar: "/assets/games/valorant-viper.png",
    owner: "Darkside Ops",
    ownerRole: "Operacion competitiva",
    accent: "from-[#4b1f2e]/78 via-[#2a2135]/86 to-[#151a28]/94"
  }
} as const;

const topTabs = [
  "Descripcion general",
  "Torneos",
  "Equipos inscritos",
  "Reglas",
  "Brackets",
  "Match rooms",
  "Comunidad",
  "Riot mock"
];

const formatFilters = ["1vs1", "2vs2", "3vs3", "4vs4", "5vs5"];

const gameShowcase = [
  {
    id: "lol",
    title: "Liga del invocador",
    copy: "Torneos por equipos, brackets semanales y seguimiento competitivo para rosters de LoL.",
    href: "/dashboard/tournaments?game=lol",
    image: "/assets/games/lol-cover.jpg"
  },
  {
    id: "valorant",
    title: "Circuito tactico VALORANT",
    copy: "Calendarios, scrims y copas por escuadra con una identidad visual mas agresiva y contemporanea.",
    href: "/dashboard/tournaments?game=valorant",
    image: "/assets/games/valorant-viper.png"
  }
];

const utilityPanels = [
  {
    title: "Check-in y reportes",
    copy: "Los capitanes pueden revisar el estado de check-in, abrir la sala y reportar resultados manuales.",
    href: "/dashboard/matches/mock-match-1"
  },
  {
    title: "Espacios activos",
    copy: "Agrupa comunidades, temporadas y torneos recurrentes con moderacion y reglas visibles.",
    href: "/dashboard/spaces"
  },
  {
    title: "Economia interna",
    copy: "Cada cuenta registrada inicia con tokens internos para beneficios no monetarios y recompensas visuales.",
    href: "/dashboard/tokens"
  }
];

const curatedCards = [
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

function statusToCardStatus(status?: string) {
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

function mapTournamentCard(item: any, user?: StoredUser | null) {
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

export function TournamentsHub({ game = "lol" }: { game?: string }) {
  const gameKey = game === "valorant" ? "valorant" : "lol";
  const config = hubConfig[gameKey];
  const [items, setItems] = useState<any[]>([]);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [role, setRole] = useState("USER");
  const [activeTab, setActiveTab] = useState("Torneos");
  const [activeFormats, setActiveFormats] = useState<string[]>(["5vs5"]);

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

  const visibleCards = cards.filter((card) => activeFormats.length === 0 || activeFormats.includes(card.mode));
  const canCreate = role === "ADMIN" || role === "SUPER_ADMIN" || role === "ORGANIZER";

  function toggleFormat(format: string) {
    setActiveFormats((current) =>
      current.includes(format) ? current.filter((item) => item !== format) : [...current, format]
    );
  }

  return (
    <div className="min-w-0 bg-[#05080d] pb-10 text-white">
      <div className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 lg:grid-cols-[286px_minmax(0,1fr)] lg:px-6">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-[18px] border border-white/10 bg-[#0b111b]/92 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff4254]">Explorar torneos</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Explorar torneos</h1>
            <p className="mt-3 text-sm leading-6 text-white/58">Encuentra torneos abiertos, revisa cupos y entra a competir desde una vista segura.</p>

            <div className="mt-6 space-y-3">
              {gameShowcase.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center justify-between rounded-[14px] border px-4 py-3 text-sm font-semibold transition ${
                    item.id === gameKey ? "border-[#18e6f2]/45 bg-[#18e6f2]/10 text-white" : "border-white/10 bg-white/[0.035] text-white/70 hover:border-white/20"
                  }`}
                >
                  <span>{item.id === "lol" ? "League of Legends" : "VALORANT"}</span>
                  <span className="text-[#18e6f2]">{item.id === "lol" ? cards.length * 2 : cards.length}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] border border-white/10 bg-[#0b111b]/92 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Filtros</p>
              <button onClick={() => setActiveFormats([])} className="text-xs font-semibold text-[#18e6f2]">Limpiar</button>
            </div>
            <div className="mt-4 space-y-2">
              {formatFilters.map((format) => (
                <button
                  key={format}
                  onClick={() => toggleFormat(format)}
                  className={`flex w-full items-center justify-between rounded-[12px] border px-4 py-3 text-left text-sm font-semibold transition ${
                    activeFormats.includes(format)
                      ? "border-[#ff2438]/45 bg-[#ff2438]/10 text-white"
                      : "border-white/10 bg-white/[0.035] text-white/62 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span>{format}</span>
                  <span className="text-xs text-white/35">Formato</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] border border-white/10 bg-[#0b111b]/92 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Estadísticas en vivo</p>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex items-center justify-between"><dt className="text-white/55">Torneos visibles</dt><dd className="font-semibold text-white">{cards.length}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-white/55">Inscripciones abiertas</dt><dd className="font-semibold text-[#40ff91]">{cards.filter((card) => card.status === "OPEN").length}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-white/55">Mis torneos</dt><dd className="font-semibold text-[#18e6f2]">{cards.filter((card) => card.participating).length}</dd></div>
            </dl>
          </section>

          <section className="rounded-[18px] border border-white/10 bg-[#0b111b]/92 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Herramientas</p>
            <div className="mt-4 space-y-2">
              {utilityPanels.map((item) => (
                <Link key={item.title} href={item.href} className="block rounded-[14px] border border-white/10 bg-white/[0.035] p-4 transition hover:border-white/20">
                  <strong className="text-sm text-white">{item.title}</strong>
                  <p className="mt-2 text-xs leading-5 text-white/52">{item.copy}</p>
                </Link>
              ))}
            </div>
          </section>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0b111b] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.26)] lg:p-6">
            <Image src={config.cover} alt={config.title} fill className="object-cover object-center opacity-42" priority />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,16,0.96),rgba(7,10,16,0.7)_48%,rgba(7,10,16,0.3))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_38%,rgba(255,36,56,0.26),transparent_24%),radial-gradient(circle_at_78%_62%,rgba(24,230,242,0.16),transparent_22%)]" />
            <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_230px] xl:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff4254]">Destacado</p>
                <h2 className="mt-3 font-heading text-4xl font-semibold leading-none text-white sm:text-5xl">Darkside Cup</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68">Torneos competitivos con brackets, check-in, salas y recompensas internas no monetarias.</p>
                <Link href={visibleCards[0] ? `/dashboard/tournaments/${visibleCards[0].id}` : "/dashboard/tournaments"} className="mt-5 inline-flex rounded-[12px] border border-[#ff2438]/50 px-5 py-3 text-sm font-semibold text-[#ff5868] transition hover:bg-[#ff2438]/10">
                  Ver detalles
                </Link>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="rounded-[14px] border border-white/10 bg-black/30 p-4"><strong className="block text-xl text-white">{cards.length}</strong><span className="text-white/45">Torneos</span></div>
                <div className="rounded-[14px] border border-white/10 bg-black/30 p-4"><strong className="block text-xl text-[#18e6f2]">{visibleCards.length}</strong><span className="text-white/45">Filtrados</span></div>
              </div>
            </div>
          </section>

          <section className="overflow-x-auto rounded-[18px] border border-white/10 bg-[#0b111b]/92 px-4">
            <div className="flex min-w-max gap-6">
              {topTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm font-semibold transition ${
                    activeTab === tab ? "border-b-2 border-[#ff2438] text-white" : "text-white/45 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[20px] border border-white/10 bg-[#0b111b]/92 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] border border-white/10 bg-black/28 px-4 py-3 text-sm text-white/45">
                <span>⌕</span>
                <span>Buscar torneos, equipos o comunidades...</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.18em] text-white/35">Ordenar por</span>
                <button className="rounded-[12px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-white/70">Más recientes</button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            {visibleCards.map((card) => (
              <Link
                key={card.id}
                href={`/dashboard/tournaments/${card.id}`}
                className="group block overflow-hidden rounded-[18px] border border-white/10 bg-[#0b111b]/92 transition hover:border-[#18e6f2]/25 hover:shadow-[0_18px_50px_rgba(24,230,242,0.08)]"
              >
                <div className="grid gap-0 xl:grid-cols-[230px_minmax(0,1fr)_190px]">
                  <div className="relative min-h-[150px] bg-[#111722]">
                    <Image src={config.cover} alt={card.name} fill className="object-cover opacity-72 transition group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,12,18,0.12),rgba(8,12,18,0.86))]" />
                    {card.participating ? <span className="absolute left-3 top-3 rounded-full bg-[#18e6f2] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-black">Participando</span> : null}
                    {(card as any).requiresRiot ?? tournamentRequiresRiotAccount(card.game) ? (
                      <span className="absolute bottom-3 left-3 rounded-full border border-[#18e6f2]/35 bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#bffaff] backdrop-blur">
                        Riot ID requerido
                      </span>
                    ) : null}
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#18e6f2]">{card.game}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{card.name}</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">{card.copy}</p>
                    <div className="mt-5 grid gap-3 text-sm text-white/55 sm:grid-cols-4">
                      <span>{card.prize}</span>
                      <span>{card.mode}</span>
                      <span>{(card as any).requiresRiot ?? tournamentRequiresRiotAccount(card.game) ? "Riot ID requerido" : "Sin requisito Riot"}</span>
                      <span>{card.startsAt}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/8 p-5 xl:border-l xl:border-t-0">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        card.status === "LIVE" ? "bg-[#18e6f2]/12 text-[#bffaff]" : card.status === "OPEN" ? "bg-[#40ff91]/12 text-[#9dffc4]" : "bg-white/8 text-white/55"
                      }`}
                    >
                      {card.status === "LIVE" ? "En vivo" : card.status === "OPEN" ? "Inscripciones abiertas" : "Completado"}
                    </span>
                    <p className="mt-4 text-sm text-white/45">Inscripción</p>
                    <strong className="mt-1 block text-lg text-white">Tokens internos</strong>
                    <span className="mt-5 inline-flex w-full justify-center rounded-[12px] bg-[#ff2438] px-4 py-3 text-sm font-semibold text-white transition group-hover:bg-[#ff4254]">
                      {card.participating ? "Ver mi inscripción" : card.status === "OPEN" ? "Inscribirse" : "Ver detalles"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </section>

          {canCreate ? (
            <section className="rounded-[18px] border border-dashed border-white/10 bg-[#0b111b]/92 p-5">
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1b2332] text-3xl text-white/70">+</div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Crear torneo</h2>
                  <p className="mt-2 text-sm text-white/58">Define reglas, fechas, formato y publica el flujo competitivo.</p>
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
