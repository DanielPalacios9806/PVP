"use client";

import Image from "next/image";
import Link from "next/link";
import { getStoredUser } from "@/lib/session";
import { useEffect, useState } from "react";
import { RiotLinkCard } from "@/components/riot-link-card";
import { brand } from "@/lib/brand";

const featuredMoments = [
  {
    title: "Circuito Valorant Prime",
    subtitle: "Inscripciones abiertas para escuadras tacticas.",
    href: "/dashboard/tournaments",
    image: "/assets/darkside/official/game-valorant-card.jpg",
    tag: "VALORANT"
  },
  {
    title: "Liga del Invocador",
    subtitle: "Calendario semanal, brackets y seguimiento competitivo.",
    href: "/dashboard/tournaments",
    image: "/assets/darkside/official/game-lol-card.jpg",
    tag: "LEAGUE OF LEGENDS"
  }
];

const pillars = [
  {
    title: "Competicion organizada",
    copy: "Torneos, brackets y cronogramas con una experiencia clara para jugadores y administracion.",
    icon: "/assets/darkside/icons/icon-bracket.svg"
  },
  {
    title: "Reglas e integridad",
    copy: "Resultados auditables, disputas y trazabilidad para mantener el orden competitivo.",
    icon: "/assets/darkside/icons/icon-comment.svg"
  },
  {
    title: "Economia interna",
    copy: "Cada cuenta inicia con tokens internos para recargas, beneficios y experiencias futuras.",
    icon: "/assets/darkside/icons/icon-trophy.svg"
  },
  {
    title: "Formatos flexibles",
    copy: "Desde 1vs1 hasta 5vs5 para circuitos casuales, clasificatorios y ligas recurrentes.",
    icon: "/assets/darkside/icons/icon-users.svg"
  }
];

export default function DashboardPage() {
  const [role, setRole] = useState("USER");

  useEffect(() => {
    setRole(getStoredUser()?.role ?? "USER");
  }, []);

  return (
    <div className="page-section max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
      <section className="surface-panel motion-section overflow-hidden p-0">
        <div className="grid min-h-[360px] lg:min-h-[420px] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[230px] sm:min-h-[320px]">
            <Image
              src="/assets/darkside/official/hero-desktop.jpg"
              alt="Darkside.cool arena"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,12,0.05),rgba(5,8,12,0.88))]" />
            <div className="absolute inset-x-0 bottom-0 top-auto h-40 bg-[linear-gradient(180deg,rgba(13,17,24,0),rgba(13,17,24,0.92))]" />
          </div>

          <div className="flex min-w-0 flex-col justify-center gap-5 p-4 sm:gap-6 sm:p-6 lg:p-8">
            <p className="page-kicker">{brand.name}</p>
            <div>
              <h1 className="page-title max-w-xl">Tu centro competitivo universitario.</h1>
              <p className="page-copy mt-4 max-w-xl">
                Revisa torneos, administra tus equipos, vincula Riot ID en modo mock y sigue tus partidas desde una experiencia separada por rol.
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
              <div className="stat-tile min-w-0">
                <span className="eyebrow">Perfil</span>
                <strong className="mt-3 block text-xl text-white sm:text-2xl">Jugador</strong>
                <p className="mt-2 break-words text-sm leading-6 text-white/58">Participa, reporta resultados y gestiona equipos.</p>
              </div>
              <div className="stat-tile min-w-0">
                <span className="eyebrow">Rol activo</span>
                <strong className="mt-3 block text-xl text-white sm:text-2xl">
                  {role === "SUPER_ADMIN" ? "Super admin" : role === "ADMIN" ? "Admin" : role === "MODERATOR" ? "Moderacion" : "Jugador"}
                </strong>
                <p className="mt-2 break-words text-sm leading-6 text-white/58">La interfaz se adapta al tipo de acceso.</p>
              </div>
              <div className="stat-tile min-w-0">
                <span className="eyebrow">Riot</span>
                <strong className="mt-3 block text-xl text-white sm:text-2xl">Mock</strong>
                <p className="mt-2 break-words text-sm leading-6 text-white/58">Preparado para integracion oficial futura.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="motion-section stagger-1 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-panel min-w-0 p-4 sm:p-6">
          <div className="page-header">
            <div>
              <p className="page-kicker">Panel principal</p>
              <h2 className="break-words text-[2rem] font-semibold leading-tight text-white sm:text-3xl">Acciones principales</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {featuredMoments.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="surface-tile motion-card group relative block min-h-[148px] overflow-hidden transition hover:border-white/18 sm:min-h-[170px]"
              >
                <Image src={item.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(6,9,14,0.95),rgba(6,9,14,0.55),rgba(6,9,14,0.2))]" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(6,9,14,0),rgba(6,9,14,0.92))]" />
                <div className="relative z-10 min-w-0 p-4 sm:p-5">
                  <p className="eyebrow">{item.tag}</p>
                  <h3 className="mt-3 break-words text-[1.35rem] font-semibold leading-tight text-white sm:text-xl">{item.title}</h3>
                  <p className="mt-3 max-w-sm break-words text-sm leading-6 text-white/70 sm:leading-7">{item.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="surface-panel min-w-0 p-4 sm:p-6">
          <p className="page-kicker">Accesos directos</p>
          <div className="mt-5 grid gap-3">
            <Link href="/dashboard/tournaments" className="surface-tile motion-card group relative overflow-hidden p-4 transition hover:border-white/18 sm:p-5">
              <Image src="/assets/darkside/official/game-lol-card.jpg" alt="" fill className="object-cover opacity-28 transition group-hover:scale-105" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,23,34,0.96),rgba(17,23,34,0.72))]" />
              <div className="relative z-10 min-w-0">
                <strong className="break-words text-[1.35rem] leading-tight text-white sm:text-lg">Torneos</strong>
                <p className="mt-2 break-words text-sm leading-6 text-white/62">Revisa calendarios, brackets, estados y cupos.</p>
              </div>
            </Link>
            <Link href="/dashboard/spaces" className="surface-tile motion-card group relative overflow-hidden p-4 transition hover:border-white/18 sm:p-5">
              <Image src="/assets/darkside/official/game-valorant-card.jpg" alt="" fill className="object-cover opacity-25 transition group-hover:scale-105" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,23,34,0.96),rgba(17,23,34,0.72))]" />
              <div className="relative z-10 min-w-0">
                <strong className="break-words text-[1.35rem] leading-tight text-white sm:text-lg">Comunidades</strong>
                <p className="mt-2 break-words text-sm leading-6 text-white/62">Agrupa comunidades, temporadas y ligas recurrentes.</p>
              </div>
            </Link>
            <Link href="/dashboard/tokens" className="surface-tile motion-card relative overflow-hidden p-4 transition hover:border-white/18 sm:p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_25%,rgba(255,36,56,0.24),transparent_34%),linear-gradient(120deg,rgba(17,23,34,0.98),rgba(8,18,24,0.94))]" />
              <div className="relative z-10 min-w-0">
                <strong className="break-words text-[1.35rem] leading-tight text-white sm:text-lg">Tokens</strong>
                <p className="mt-2 break-words text-sm leading-6 text-white/62">Gestiona el saldo interno y la experiencia del jugador.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <RiotLinkCard compact />

      <section className="motion-section stagger-2 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="surface-panel motion-card min-w-0 overflow-hidden p-4 sm:p-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white shadow-[0_0_24px_rgba(255,36,56,0.22)] sm:h-14 sm:w-14">
              <Image src={pillar.icon} alt={pillar.title} width={28} height={28} />
            </div>
            <h3 className="mt-5 break-words text-[1.35rem] font-semibold leading-tight text-white sm:text-xl">{pillar.title}</h3>
            <p className="mt-3 max-w-full break-words text-[0.95rem] leading-7 text-white/68 sm:text-sm">{pillar.copy}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
