"use client";

import Link from "next/link";
import { ExternalLink, ListChecks, Upload, UsersRound } from "lucide-react";
import { SectionCard } from "./section-card";

const toornamentSteps = [
  {
    title: "Crear torneo espejo",
    copy: "El organizador crea el evento en Toornament Free y conserva Darkside.cool como panel comunitario, perfiles, equipos y auditoria.",
    icon: ExternalLink
  },
  {
    title: "Registrar participantes",
    copy: "Staff agrega equipos o jugadores manualmente en Toornament. Darkside mantiene la inscripcion, aprobacion y trazabilidad interna.",
    icon: UsersRound
  },
  {
    title: "Publicar estructura",
    copy: "Toornament genera bracket y encuentros. El moderador copia referencias, horarios y codigos de sala en la match room de Darkside.",
    icon: Upload
  },
  {
    title: "Cerrar resultados",
    copy: "El resultado oficial operativo se confirma en Darkside con evidencia, fuente Toornament/manual y audit log.",
    icon: ListChecks
  }
];

const syncFields = [
  ["ID torneo Toornament", "Guardar temporalmente en notas operativas del torneo hasta habilitar campo persistente."],
  ["URL publica del bracket", "Compartir en reglas o descripcion del torneo para jugadores y moderadores."],
  ["Codigo / referencia de match", "Usar el campo Codigo o referencia de la sala manual."],
  ["Nombre y password de sala", "Usar campos de lobby manual en cada match room."],
  ["Fuente del resultado", "Cerrar con Confirmacion staff del bracket usando Toornament manual o bracket externo."]
];

export function AdminToornamentPanel() {
  return (
    <SectionCard
      title="Puente Toornament manual"
      description="Operacion temporal para brackets externos mientras Riot Tournament API no este aprobada. No usa apuestas, pagos ni API key publica."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-3 md:grid-cols-2">
          {toornamentSteps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-[#18e6f2]/25 bg-[#18e6f2]/10 p-3 text-[#18e6f2]">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-white">{step.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/58">{step.copy}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="rounded-[26px] border border-[#ff2b5b]/20 bg-[#ff2b5b]/8 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ff8da1]">Modo actual</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Manual / Free plan</h3>
          <p className="mt-3 text-sm leading-6 text-white/62">
            Se opera con Toornament Organizer como bracket externo y Darkside como capa de identidad, sala, evidencia y auditoria.
          </p>
          <div className="mt-4 space-y-2">
            <Link href="/dashboard/moderation" className="btn-primary flex w-full items-center justify-center gap-2">
              Abrir moderacion
            </Link>
            <Link href="/dashboard/tournaments" className="btn-secondary flex w-full items-center justify-center gap-2">
              Ver torneos
            </Link>
          </div>
        </aside>
      </div>

      <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10">
        <div className="grid grid-cols-[0.8fr_1.2fr] border-b border-white/10 bg-white/[0.045] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white/55">
          <span>Dato operativo</span>
          <span>Uso en Darkside</span>
        </div>
        {syncFields.map(([field, use]) => (
          <div key={field} className="grid gap-3 border-b border-white/8 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[0.8fr_1.2fr]">
            <strong className="text-white">{field}</strong>
            <span className="text-white/58">{use}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
        Limite operativo recomendado para la beta: torneos pequenos compatibles con el plan Free. Si se supera el limite, se planifica importacion por CSV/API o upgrade de Toornament antes de automatizar.
      </p>
    </SectionCard>
  );
}
