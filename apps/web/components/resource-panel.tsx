"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { mockSpaces, mockTeams, mockTournaments } from "../lib/mock-data";
import { getStoredUser, type AppRole } from "../lib/session";
import { SectionCard } from "./section-card";

type ResourceKind = "teams" | "spaces" | "tournaments";

const copy: Record<ResourceKind, { title: string; description: string; endpoint: string; fields: string[] }> = {
  teams: {
    title: "Equipos",
    description: "Consulta equipos competitivos y su actividad dentro de la plataforma.",
    endpoint: "teams",
    fields: ["name", "tag", "description"]
  },
  spaces: {
    title: "Comunidades",
    description: "Explora comunidades, hubs competitivos y espacios de actividad.",
    endpoint: "spaces",
    fields: ["name", "visibility", "description"]
  },
  tournaments: {
    title: "Torneos",
    description: "Explora torneos activos, su progreso y las acciones disponibles para competir.",
    endpoint: "tournaments",
    fields: ["name", "game", "format", "type", "maxParticipants"]
  }
};

function canManage(kind: ResourceKind, role: AppRole | undefined) {
  if (!role) {
    return false;
  }

  if (kind === "tournaments") {
    return role === "ADMIN" || role === "SUPER_ADMIN" || role === "ORGANIZER";
  }

  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "ORGANIZER" || role === "MODERATOR";
}

export function ResourcePanel({ kind }: { kind: ResourceKind }) {
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<AppRole>("USER");

  async function load() {
    try {
      const response = await fetch(`${apiUrl}/${copy[kind].endpoint}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error("API unavailable");
      }

      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems(kind === "teams" ? mockTeams : kind === "spaces" ? mockSpaces : mockTournaments);
      setMessage("");
    }
  }

  useEffect(() => {
    const user = getStoredUser();
    setRole(user?.role ?? "USER");
    void load();
  }, [kind]);

  async function onSubmit(formData: FormData) {
    const payload =
      kind === "teams"
        ? {
            name: String(formData.get("name")),
            tag: String(formData.get("tag") || ""),
            description: String(formData.get("description") || "")
          }
        : kind === "spaces"
          ? {
              name: String(formData.get("name")),
              visibility: String(formData.get("visibility") || "PUBLIC"),
              description: String(formData.get("description") || "")
            }
          : {
              name: String(formData.get("name")),
              game: String(formData.get("game")),
              format: String(formData.get("format")),
              type: String(formData.get("type")),
              maxParticipants: Number(formData.get("maxParticipants")),
              checkInEnabled: true
            };

    const response = await fetch(`${apiUrl}/${copy[kind].endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message ?? "No se pudo completar la accion.");
      return;
    }

    setMessage(
      kind === "teams"
        ? "Equipo creado correctamente."
        : kind === "spaces"
          ? "Comunidad creada correctamente."
          : "Torneo creado correctamente."
    );
    await load();
  }

  const canManageThisResource = canManage(kind, role);

  const sectionTitle = canManageThisResource
    ? kind === "teams"
      ? "Gestion de equipos"
      : kind === "spaces"
        ? "Gestion de comunidades"
        : "Gestion administrativa"
    : kind === "teams"
      ? "Vista de jugador"
      : kind === "spaces"
        ? "Explorar comunidades"
        : "Vista de jugador";

  const sectionDescription = canManageThisResource
    ? kind === "tournaments"
      ? "La creacion y administracion de torneos se ejecuta desde perfiles autorizados."
      : "Completa la informacion principal."
    : kind === "tournaments"
      ? "Los jugadores pueden explorar torneos, revisar fechas y participar."
      : kind === "teams"
        ? "Aqui puedes revisar equipos e identificar en cuales quieres participar."
        : "Consulta comunidades y torneos asociados antes de unirte.";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <SectionCard title={copy[kind].title} description={copy[kind].description}>
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="stat-tile">
            <p className="eyebrow">Total</p>
            <h3 className="mt-2 text-3xl font-semibold">{items.length}</h3>
          </div>
          <div className="stat-tile">
            <p className="eyebrow">Estado</p>
            <h3 className="mt-2 text-lg font-semibold uppercase">Activo</h3>
          </div>
          <div className="stat-tile">
            <p className="eyebrow">Categoria</p>
            <h3 className="mt-2 text-lg font-semibold uppercase">{copy[kind].title}</h3>
          </div>
        </div>
        <div className="space-y-3">
          {items.length === 0 ? <p className="text-sm text-white/60">No hay elementos disponibles.</p> : null}
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.2))] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold uppercase tracking-[0.05em]">{item.name}</h3>
                <span className="rounded-full border border-brand-cyan/30 px-3 py-1 text-xs text-brand-cyan">
                  {item.status ?? item.visibility ?? "ACTIVO"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/70">
                {item.description ?? item.game ?? "Disponible para competir"}
              </p>
              {kind === "tournaments" ? (
                <Link href={`/dashboard/tournaments/${item.id}`} className="mt-4 inline-flex items-center gap-2 text-sm uppercase tracking-[0.08em] text-brand-cyan">
                  <Image src="/assets/icons/reglas-del-juego.svg" alt="" width={16} height={16} />
                  Ver detalle del torneo
                </Link>
              ) : null}
              {kind === "teams" ? (
                <Link href={`/dashboard/teams/${item.id}`} className="mt-4 inline-flex items-center gap-2 text-sm uppercase tracking-[0.08em] text-brand-cyan">
                  <Image src="/assets/icons/mando.svg" alt="" width={16} height={16} />
                  Ver equipo
                </Link>
              ) : null}
              {kind === "spaces" ? (
                <Link href={`/dashboard/spaces/${item.id}`} className="mt-4 inline-flex items-center gap-2 text-sm uppercase tracking-[0.08em] text-brand-cyan">
                  <Image src="/assets/icons/dados-d6.svg" alt="" width={16} height={16} />
                  Ver comunidad
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={sectionTitle} description={sectionDescription}>
        {!canManageThisResource ? (
          <div className="space-y-4">
            <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
              <p className="eyebrow">{kind === "tournaments" ? "Participacion" : "Acceso"}</p>
              <p className="mt-3 text-sm leading-7 text-white/72">
                {kind === "tournaments"
                  ? "Aqui puedes explorar torneos, revisar detalles, consultar fechas, hacer check-in y participar. La creacion, calendarizacion y validacion se gestiona desde administracion."
                  : kind === "teams"
                    ? "Los jugadores consultan sus equipos, historial y estado competitivo. La configuracion estructural queda reservada a perfiles autorizados."
                    : "Los jugadores exploran comunidades, revisan torneos asociados y solicitan acceso cuando corresponda."}
              </p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
              <p className="eyebrow">Tus acciones</p>
              <div className="mt-4 grid gap-3">
                {(
                  kind === "tournaments"
                    ? ["Explorar torneos activos", "Revisar fechas y brackets", "Inscribirte y hacer check-in"]
                    : kind === "teams"
                      ? ["Ver tu roster", "Revisar historial competitivo", "Seguir inscripciones y resultados"]
                      : ["Explorar comunidades", "Revisar torneos asociados", "Identificar espacios activos"]
                ).map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/78">
                    <Image src="/assets/icons/monedas.svg" alt="" width={20} height={20} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <form action={onSubmit} className="space-y-4">
            {copy[kind].fields.includes("name") ? <input name="name" placeholder="Nombre" required /> : null}
            {kind === "teams" ? <input name="tag" placeholder="Tag" /> : null}
            {kind === "spaces" ? (
              <select name="visibility" defaultValue="PUBLIC">
                <option value="PUBLIC">Publica</option>
                <option value="PRIVATE">Privada</option>
                <option value="UNLISTED">Oculta</option>
              </select>
            ) : null}
            {kind === "tournaments" ? (
              <>
                <input name="game" placeholder="Juego" required />
                <select name="format" defaultValue="SINGLE_ELIMINATION">
                  <option value="SINGLE_ELIMINATION">Eliminacion simple</option>
                  <option value="DOUBLE_ELIMINATION">Eliminacion doble</option>
                  <option value="ROUND_ROBIN">Todos contra todos</option>
                </select>
                <select name="type" defaultValue="TEAM">
                  <option value="TEAM">Por equipos</option>
                  <option value="SOLO">Individual</option>
                </select>
                <input name="maxParticipants" type="number" min="2" defaultValue="8" required />
              </>
            ) : null}
            <textarea name="description" placeholder="Descripcion" rows={4} />
            <button className="btn-primary w-full">
              {kind === "teams" ? "Crear equipo" : kind === "spaces" ? "Crear comunidad" : "Crear torneo"}
            </button>
            {message ? <p className="text-sm text-brand-cyan">{message}</p> : null}
          </form>
        )}
      </SectionCard>
    </div>
  );
}
