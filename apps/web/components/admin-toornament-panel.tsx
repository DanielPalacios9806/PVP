"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, ListChecks, Upload, UsersRound } from "lucide-react";
import { apiUrl, getAuthHeaders } from "../lib/config";
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
  ["ID torneo Toornament", "Guardar en el puente externo persistente del torneo."],
  ["URL publica del bracket", "Guardar como URL externa del torneo o match."],
  ["Codigo / referencia de match", "Usar referencia externa del match o codigo de sala manual."],
  ["Nombre y password de sala", "Usar campos de lobby manual en cada match room."],
  ["Fuente del resultado", "Cerrar con Confirmacion staff del bracket usando Toornament manual o bracket externo."]
];

const fieldClass = "w-full rounded-2xl border border-white/10 bg-[#0c1324] p-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-[#18e6f2]/50";

function parseTable(text: string) {
  const rows = text
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (!rows.length) {
    return [];
  }

  const separator = rows[0].includes("\t") ? "\t" : rows[0].includes(";") ? ";" : ",";
  const first = rows[0].split(separator).map((cell) => cell.trim());
  const hasHeader = first.some((cell) => ["name", "email", "teamName", "roundName", "home", "away"].includes(cell));
  const headers = hasHeader ? first : [];
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows.map((row) => {
    const cells = row.split(separator).map((cell) => cell.trim());
    if (headers.length) {
      return Object.fromEntries(headers.map((header, index) => [header, cells[index] || undefined]));
    }

    return cells;
  });
}

function participantsFromText(text: string) {
  return parseTable(text).map((row: any) => {
    if (Array.isArray(row)) {
      return {
        name: row[0],
        email: row[1] || undefined,
        teamName: row[2] || undefined,
        teamTag: row[3] || undefined,
        externalParticipantId: row[4] || undefined
      };
    }

    return {
      name: row.name || row.teamName || row.email,
      email: row.email,
      teamName: row.teamName,
      teamTag: row.teamTag,
      externalParticipantId: row.externalParticipantId
    };
  }).filter((row: any) => row.name);
}

function matchesFromText(text: string) {
  return parseTable(text).map((row: any) => {
    if (Array.isArray(row)) {
      return {
        roundName: row[0] || "Ronda 1",
        externalMatchId: row[1] || undefined,
        home: row[2],
        away: row[3] || undefined,
        scheduledAt: row[4] || undefined,
        lobbyCode: row[5] || undefined,
        externalBracketUrl: row[6] || undefined
      };
    }

    return {
      roundName: row.roundName || "Ronda 1",
      externalMatchId: row.externalMatchId,
      home: row.home,
      away: row.away,
      scheduledAt: row.scheduledAt,
      lobbyCode: row.lobbyCode,
      externalBracketUrl: row.externalBracketUrl
    };
  }).filter((row: any) => row.home);
}

export function AdminToornamentPanel() {
  const [tournamentId, setTournamentId] = useState("");
  const [externalTournamentId, setExternalTournamentId] = useState("");
  const [externalBracketUrl, setExternalBracketUrl] = useState("");
  const [participantsText, setParticipantsText] = useState("name,email,teamName,teamTag,externalParticipantId\n");
  const [matchesText, setMatchesText] = useState("roundName,externalMatchId,home,away,scheduledAt,lobbyCode,externalBracketUrl\n");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function importToornament(dryRun: boolean) {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch(`${apiUrl}/tournaments/${tournamentId.trim()}/toornament/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          dryRun,
          externalTournamentId: externalTournamentId.trim() || undefined,
          externalBracketUrl: externalBracketUrl.trim() || undefined,
          participants: participantsFromText(participantsText),
          matches: matchesFromText(matchesText)
        })
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "No se pudo importar desde Toornament.");
      }

      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

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

      <form className="mt-5 rounded-[26px] border border-[#18e6f2]/18 bg-[#18e6f2]/8 p-4" onSubmit={(event) => {
        event.preventDefault();
        importToornament(false);
      }}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#18e6f2]">Importacion fase 3</p>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Pegar CSV desde Toornament</h3>
            <p className="mt-2 text-sm leading-6 text-white/58">
              Resuelve participantes existentes, confirma inscripciones y crea/actualiza matches con referencias externas.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
            Staff only
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <input value={tournamentId} onChange={(event) => setTournamentId(event.target.value)} placeholder="Tournament ID Darkside" className={fieldClass} required />
          <input value={externalTournamentId} onChange={(event) => setExternalTournamentId(event.target.value)} placeholder="Tournament ID Toornament" className={fieldClass} />
          <input value={externalBracketUrl} onChange={(event) => setExternalBracketUrl(event.target.value)} placeholder="URL bracket Toornament" className={fieldClass} />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-white/48">Participantes CSV</span>
            <textarea value={participantsText} onChange={(event) => setParticipantsText(event.target.value)} rows={7} className={`${fieldClass} mt-2 font-mono text-xs`} />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-white/48">Matches CSV</span>
            <textarea value={matchesText} onChange={(event) => setMatchesText(event.target.value)} rows={7} className={`${fieldClass} mt-2 font-mono text-xs`} />
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" disabled={loading || !tournamentId.trim()} onClick={() => importToornament(true)} className="btn-secondary flex-1 disabled:opacity-50">
            {loading ? "Procesando..." : "Previsualizar"}
          </button>
          <button disabled={loading || !tournamentId.trim()} className="btn-primary flex-1 disabled:opacity-50">
            {loading ? "Importando..." : "Importar a Darkside"}
          </button>
        </div>

        {result ? (
          <pre className="mt-4 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/35 p-4 text-xs leading-5 text-white/72">
            {result}
          </pre>
        ) : null}
      </form>

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
