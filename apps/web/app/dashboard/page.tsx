"use client";

import Image from "next/image";
import Link from "next/link";
import { getStoredUser } from "@/lib/session";
import { useEffect, useState } from "react";

const featuredMoments = [
  {
    title: "Circuito Valorant Prime",
    subtitle: "Inscripciones abiertas para escuadras tacticas.",
    href: "/dashboard/tournaments"
  },
  {
    title: "Liga del Invocador",
    subtitle: "Calendario semanal, brackets y seguimiento competitivo.",
    href: "/dashboard/tournaments"
  }
];

const pillars = [
  {
    title: "Competicion organizada",
    copy: "Torneos, brackets y cronogramas con una experiencia clara para jugadores y administracion.",
    icon: "/assets/icons/mando.svg"
  },
  {
    title: "Reglas e integridad",
    copy: "Resultados auditables, disputas y trazabilidad para mantener el orden competitivo.",
    icon: "/assets/icons/reglas-del-juego.svg"
  },
  {
    title: "Economia interna",
    copy: "Cada cuenta inicia con tokens internos para recargas, beneficios y experiencias futuras.",
    icon: "/assets/icons/monedas.svg"
  },
  {
    title: "Formatos flexibles",
    copy: "Desde 1vs1 hasta 5vs5 para circuitos casuales, clasificatorios y ligas recurrentes.",
    icon: "/assets/icons/dados-d6.svg"
  }
];

export default function DashboardPage() {
  const [role, setRole] = useState("USER");

  useEffect(() => {
    setRole(getStoredUser()?.role ?? "USER");
  }, []);

  return (
    <div className="page-section space-y-6">
      <section className="surface-panel overflow-hidden p-0">
        <div className="grid min-h-[420px] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[320px]">
            <Image
              src="/assets/games/lol-cover.jpg"
              alt="League of Legends"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,17,24,0.2),rgba(13,17,24,0.9))]" />
            <div className="absolute inset-x-0 bottom-0 top-auto h-40 bg-[linear-gradient(180deg,rgba(13,17,24,0),rgba(13,17,24,0.92))]" />
          </div>

          <div className="flex flex-col justify-center gap-6 p-6 lg:p-8">
            <p className="page-kicker">Arena competitiva</p>
            <div>
              <h1 className="page-title max-w-xl">Torneos, equipos y espacios listos para competir.</h1>
              <p className="page-copy mt-4 max-w-xl">
                Organiza circuitos para League of Legends, VALORANT y otros juegos con una experiencia clara,
                visual y orientada a operaciones reales.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/tournaments" className="btn-primary">
                Explorar torneos
              </Link>
              <Link href="/dashboard/teams" className="btn-secondary">
                Ver equipos
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="stat-tile">
                <span className="eyebrow">Modo</span>
                <strong className="mt-3 block text-2xl text-white">5vs5</strong>
                <p className="mt-2 text-sm text-white/58">Circuitos principales y ligas.</p>
              </div>
              <div className="stat-tile">
                <span className="eyebrow">Rol activo</span>
                <strong className="mt-3 block text-2xl text-white">
                  {role === "ADMIN" ? "Admin" : role === "MODERATOR" ? "Moderacion" : "Jugador"}
                </strong>
                <p className="mt-2 text-sm text-white/58">La interfaz se adapta al tipo de acceso.</p>
              </div>
              <div className="stat-tile">
                <span className="eyebrow">Estado</span>
                <strong className="mt-3 block text-2xl text-white">Activo</strong>
                <p className="mt-2 text-sm text-white/58">Prototipo visual conectado al flujo del producto.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-panel">
          <div className="page-header">
            <div>
              <p className="page-kicker">Panel principal</p>
              <h2 className="text-3xl font-semibold text-white">Lo mas importante de tu plataforma</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {featuredMoments.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="surface-tile block transition hover:border-white/18"
              >
                <p className="eyebrow">Actividad destacada</p>
                <h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{item.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="surface-panel">
          <p className="page-kicker">Accesos directos</p>
          <div className="mt-5 grid gap-3">
            <Link href="/dashboard/tournaments" className="surface-tile transition hover:border-white/18">
              <strong className="text-lg text-white">Torneos</strong>
              <p className="mt-2 text-sm text-white/58">Revisa calendarios, brackets, estados y cupos.</p>
            </Link>
            <Link href="/dashboard/spaces" className="surface-tile transition hover:border-white/18">
              <strong className="text-lg text-white">Espacios</strong>
              <p className="mt-2 text-sm text-white/58">Agrupa comunidades, temporadas y ligas recurrentes.</p>
            </Link>
            <Link href="/dashboard/tokens" className="surface-tile transition hover:border-white/18">
              <strong className="text-lg text-white">Tokens</strong>
              <p className="mt-2 text-sm text-white/58">Gestiona el saldo interno y la experiencia del jugador.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="surface-panel">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Image src={pillar.icon} alt={pillar.title} width={28} height={28} />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">{pillar.title}</h3>
            <p className="mt-3 text-sm leading-7 text-white/62">{pillar.copy}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
