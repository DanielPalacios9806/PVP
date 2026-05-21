"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/config";
import { mockTournaments } from "@/lib/mock-data";
import { getStoredUser } from "@/lib/session";

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
    prize: "1.500 tokens"
  },
  {
    id: "hub-2",
    name: "Midnight Clash Series",
    startsAt: "Hoy, 08:30 PM",
    game: "League of Legends",
    mode: "3vs3",
    status: "LIVE",
    copy: "Serie nocturna para comunidades activas y rosters en crecimiento.",
    prize: "900 tokens"
  },
  {
    id: "hub-3",
    name: "Solo Queue Faceoff",
    startsAt: "Manana, 06:00 PM",
    game: "League of Legends",
    mode: "1vs1",
    status: "COMPLETE",
    copy: "Encuentros individuales para medir mecanicas y reflejos.",
    prize: "350 tokens"
  }
];

function mapTournamentCard(item: any) {
  return {
    id: item.id,
    name: item.name,
    startsAt: item.status === "IN_PROGRESS" ? "En curso ahora" : "Programacion pendiente",
    game: item.game,
    mode: item.type === "TEAM" ? "5vs5" : "1vs1",
    status:
      item.status === "IN_PROGRESS"
        ? "LIVE"
        : item.status === "PUBLISHED" || item.status === "CHECK_IN"
          ? "OPEN"
          : "COMPLETE",
    copy: item.rules || item.description || "Torneo competitivo listo para inscripciones y seguimiento.",
    prize: `${item.maxParticipants || 8} slots`
  };
}

export function TournamentsHub({ game = "lol" }: { game?: string }) {
  const gameKey = game === "valorant" ? "valorant" : "lol";
  const config = hubConfig[gameKey];
  const [items, setItems] = useState<any[]>([]);
  const [role, setRole] = useState("USER");
  const [activeTab, setActiveTab] = useState("Torneos");
  const [activeFormats, setActiveFormats] = useState<string[]>(["5vs5"]);

  useEffect(() => {
    const user = getStoredUser();
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
    return items.length ? items.map(mapTournamentCard) : curatedCards;
  }, [items]);

  const visibleCards = cards.filter((card) => activeFormats.length === 0 || activeFormats.includes(card.mode));
  const canCreate = role === "ADMIN" || role === "SUPER_ADMIN" || role === "ORGANIZER";

  function toggleFormat(format: string) {
    setActiveFormats((current) =>
      current.includes(format) ? current.filter((item) => item !== format) : [...current, format]
    );
  }

  return (
    <div className="space-y-0">
      <section className="overflow-hidden border-b border-white/6 bg-[#1a2230]">
        <div className="relative min-h-[360px] xl:min-h-[420px]">
          <Image src={config.cover} alt={config.title} fill className="object-cover object-center" priority />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,19,28,0.62),rgba(14,19,28,0.12))]" />
          <div className={`absolute inset-0 bg-gradient-to-b ${config.accent}`} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(16,21,31,0.7)_68%,rgba(16,21,31,0.96)_100%)]" />

          <div className="relative z-10 mx-auto flex min-h-[360px] max-w-[1140px] flex-col justify-end gap-6 px-5 pb-0 pt-6 lg:px-8 xl:min-h-[420px]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-end gap-6">
                <div className="relative hidden h-46 w-36 overflow-hidden rounded-2xl border border-white/10 bg-[#121925] shadow-2xl shadow-black/40 md:block">
                  <Image src={config.avatar} alt={config.title} fill className="object-cover" />
                </div>

                <div className="space-y-4">
                  <div>
                    <h1 className="text-5xl font-semibold leading-none text-white md:text-6xl">
                      {config.title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                      {config.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-white/78">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-xs font-semibold uppercase text-white">
                      {config.owner.slice(0, 2)}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{config.owner}</p>
                      <p className="text-white/55">{config.ownerRole}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start lg:self-end">
                <Link
                  href="/dashboard/matches/mock-match-1"
                  className="rounded-xl border border-white/12 bg-[#202839] px-4 py-3 text-sm font-semibold text-white/72"
                >
                  Abrir partida
                </Link>
                <button className="rounded-xl bg-[#3d4760] px-8 py-3 text-sm font-semibold text-white">
                  {canCreate ? "Crear torneo" : "Participar"}
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-7 overflow-x-auto border-b border-white/8 pb-3">
              {topTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-base font-semibold transition ${
                    activeTab === tab ? "border-b-2 border-[#33d7ff] text-white" : "text-[#8d9bb8] hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1140px] px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-xl border border-white/12 bg-[#131a25] px-4 py-3 text-sm font-semibold text-white">
              Proximos
            </button>
            {formatFilters.map((format) => (
              <button
                key={format}
                onClick={() => toggleFormat(format)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeFormats.includes(format)
                    ? "border border-[#7b61ff]/50 bg-[#251f3d] text-white"
                    : "border border-white/10 bg-[#131a25] text-white/70 hover:text-white"
                }`}
              >
                {format}
              </button>
            ))}
          </div>

          <button className="rounded-xl border border-white/12 bg-[#131a25] px-6 py-3 text-sm font-semibold text-white">
            Filtros avanzados
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-[1140px] px-5 lg:px-8">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-2">
            {gameShowcase.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="relative min-h-[220px] overflow-hidden rounded-[18px] border border-white/8"
              >
                <Image src={item.image} alt={item.title} fill className="object-cover object-center" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,18,0.08),rgba(8,12,18,0.86))]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(51,215,255,0.18),transparent_20%)]" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8eb8ff]">
                    {item.id === "lol" ? "League of Legends" : "VALORANT"}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 max-w-md text-sm leading-7 text-white/70">{item.copy}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="rounded-[18px] border border-white/8 bg-[#181f2b] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8eb8ff]">Herramientas del torneo</p>
            <div className="mt-4 grid gap-3">
              {utilityPanels.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-2xl border border-white/8 bg-[#111722] p-4 transition hover:border-white/16"
                >
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/62">{item.copy}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {canCreate ? (
        <section className="mx-auto max-w-[1140px] px-5 pt-6 lg:px-8">
          <div className="rounded-[18px] border border-dashed border-white/10 bg-[#181f2b] p-5">
            <div className="flex items-center gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3b4760] text-3xl text-white/70">
                +
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Crear torneo</h2>
                <p className="mt-2 text-sm text-white/58">
                  Crea un torneo para tu comunidad, define formato, fechas y publica el flujo competitivo.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-[1140px] space-y-4 px-5 pb-10 pt-6 lg:px-8">
        {visibleCards.map((card) => (
          <Link
            key={card.id}
            href={card.id.startsWith("mock-") ? `/dashboard/tournaments/${card.id}` : "/dashboard/tournaments/mock-tournament-1"}
            className="block overflow-hidden rounded-[18px] border border-white/8 bg-[#1a2230] p-0 transition hover:border-white/18"
          >
            <div className="grid gap-0 lg:grid-cols-[180px_minmax(0,1fr)]">
              <div className="relative min-h-[120px] bg-[#1a2130]">
                <Image src={config.cover} alt={card.name} fill className="object-cover opacity-55" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,20,30,0.2),rgba(15,20,30,0.88))]" />
              </div>

              <div className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8eb8ff]">
                      {card.startsAt}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{card.name}</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/62">{card.copy}</p>
                  </div>

                  <span
                    className={`status-badge ${
                      card.status === "LIVE" ? "status-live" : card.status === "OPEN" ? "status-open" : "status-complete"
                    }`}
                  >
                    {card.status === "LIVE" ? "En vivo" : card.status === "OPEN" ? "Abierto" : "Completado"}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/58">
                  <span>{card.game}</span>
                  <span>{card.mode}</span>
                  <span>{card.prize}</span>
                  <span>Bracket activo</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
