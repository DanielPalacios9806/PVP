"use client";

import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { mockTeamInvitations, mockTeams } from "../lib/mock-data";
import { SectionCard } from "./section-card";

export function TeamDetail({ teamId }: { teamId: string }) {
  const [team, setTeam] = useState<any | null>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  async function load() {
    try {
      const [teamResponse, invitationsResponse] = await Promise.all([
        fetch(`${apiUrl}/teams/${teamId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${apiUrl}/teams/${teamId}/invitations`, {
          headers: getAuthHeaders()
        })
      ]);

      const teamData = await teamResponse.json();
      const invitationsData = await invitationsResponse.json();

      if (!teamResponse.ok) {
        throw new Error(teamData.message ?? "No se pudo cargar el equipo.");
      }

      setTeam(teamData);
      setInvitations(Array.isArray(invitationsData) ? invitationsData : []);
    } catch {
      setTeam(mockTeams.find((item) => item.id === teamId) ?? mockTeams[0]);
      setInvitations(mockTeamInvitations);
      setMessage("");
    }
  }

  useEffect(() => {
    void load();
  }, [teamId]);

  async function createInvitation(formData: FormData) {
    const response = await fetch(`${apiUrl}/teams/${teamId}/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        invitedUserId: String(formData.get("invitedUserId")),
        role: String(formData.get("role"))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setInviteMessage(data.message ?? "No se pudo crear la invitacion.");
      return;
    }

    setInviteMessage("Invitacion enviada.");
    await load();
  }

  async function respondInvitation(invitationId: string, action: "ACCEPT" | "DECLINE") {
    const response = await fetch(`${apiUrl}/teams/invitations/${invitationId}/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({ action })
    });

    const data = await response.json();

    if (!response.ok) {
      setInviteMessage(data.message ?? "No se pudo responder la invitacion.");
      return;
    }

    setInviteMessage(action === "ACCEPT" ? "Invitacion aceptada." : "Invitacion rechazada.");
    await load();
  }

  if (!team) {
    return (
      <SectionCard title="Detalle del equipo" description="Cargando equipo.">
        <p className="text-sm text-white/60">{message || "Cargando..."}</p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard title={team.name} description={`Tag: ${team.tag || "N/A"} | ${team.status}`}>
        <p className="text-sm text-white/75">{team.description || "Aun no hay descripcion para este equipo."}</p>
      </SectionCard>

      <SectionCard title="Roster" description="Miembros actuales del equipo.">
        <div className="grid gap-3 md:grid-cols-2">
          {(team.members ?? []).map((member: any) => (
            <article key={member.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <strong>{member.user?.displayName || member.user?.username || member.userId}</strong>
                <span className="text-xs text-brand-cyan">{member.role}</span>
              </div>
              <p className="mt-2 text-xs text-white/50">
                Se unio: {new Date(member.joinedAt).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Historial competitivo" description="Inscripciones recientes del equipo.">
        <div className="space-y-3">
          {(team.registrations ?? []).length === 0 ? (
            <p className="text-sm text-white/60">Aun no hay inscripciones registradas.</p>
          ) : null}
          {(team.registrations ?? []).map((registration: any) => (
            <article key={registration.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <strong>{registration.tournament?.name ?? "Torneo"}</strong>
                <span className="text-xs text-brand-cyan">{registration.status}</span>
              </div>
              <p className="mt-2 text-sm text-white/70">{registration.tournament?.game ?? "Juego sin definir"}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Invitaciones de roster" description="Invita usuarios por userId y gestiona respuestas.">
        {inviteMessage ? <p className="mb-4 text-sm text-brand-cyan">{inviteMessage}</p> : null}
        <form action={createInvitation} className="mb-6 grid gap-3 md:grid-cols-[1.2fr_0.8fr_auto]">
          <input name="invitedUserId" placeholder="UserId invitado" required />
          <select name="role" defaultValue="MEMBER">
            <option value="MEMBER">Miembro</option>
            <option value="CAPTAIN">Capitan</option>
            <option value="SUBSTITUTE">Suplente</option>
          </select>
          <button className="rounded-xl bg-brand-blue px-4 py-3 text-sm font-medium">Invitar</button>
        </form>
        <div className="space-y-3">
          {invitations.length === 0 ? <p className="text-sm text-white/60">No hay invitaciones pendientes.</p> : null}
          {invitations.map((invitation) => (
            <article key={invitation.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <strong>
                  {invitation.invitedUser?.displayName || invitation.invitedUser?.username || invitation.invitedUserId}
                </strong>
                <span className="text-xs text-brand-cyan">{invitation.status}</span>
              </div>
              <p className="mt-2 text-sm text-white/70">Rol propuesto: {invitation.role}</p>
              {invitation.status === "PENDING" ? (
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => respondInvitation(invitation.id, "ACCEPT")}
                    className="rounded-xl bg-brand-cyan px-4 py-2 text-sm font-medium text-brand-ink"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={() => respondInvitation(invitation.id, "DECLINE")}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm"
                  >
                    Rechazar
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
