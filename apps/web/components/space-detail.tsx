"use client";

import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { mockSpaceInvitations, mockSpaces } from "../lib/mock-data";
import { SectionCard } from "./section-card";

export function SpaceDetail({ spaceId }: { spaceId: string }) {
  const [space, setSpace] = useState<any | null>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  async function load() {
    try {
      const [spaceResponse, invitationsResponse] = await Promise.all([
        fetch(`${apiUrl}/spaces/${spaceId}`, {
          headers: getAuthHeaders()
        }),
        fetch(`${apiUrl}/spaces/${spaceId}/invitations`, {
          headers: getAuthHeaders()
        })
      ]);

      const spaceData = await spaceResponse.json();
      const invitationsData = await invitationsResponse.json();

      if (!spaceResponse.ok) {
        throw new Error(spaceData.message ?? "No se pudo cargar la comunidad.");
      }

      setSpace(spaceData);
      setInvitations(Array.isArray(invitationsData) ? invitationsData : []);
    } catch {
      setSpace(mockSpaces.find((item) => item.id === spaceId) ?? mockSpaces[0]);
      setInvitations(mockSpaceInvitations);
      setMessage("");
    }
  }

  useEffect(() => {
    void load();
  }, [spaceId]);

  async function createInvitation(formData: FormData) {
    const response = await fetch(`${apiUrl}/spaces/${spaceId}/invitations`, {
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
    const response = await fetch(`${apiUrl}/spaces/invitations/${invitationId}/respond`, {
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

  if (!space) {
    return (
      <SectionCard title="Detalle de la comunidad" description="Cargando comunidad.">
        <p className="text-sm text-white/60">{message || "Cargando..."}</p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard title={space.name} description={`${space.visibility} | ${space.status}`}>
        <p className="text-sm text-white/75">{space.description || "Aun no hay descripcion para esta comunidad."}</p>
      </SectionCard>

      <SectionCard title="Miembros" description="Miembros actuales de la comunidad.">
        <div className="grid gap-3 md:grid-cols-2">
          {(space.members ?? []).map((member: any) => (
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

      <SectionCard title="Torneos asociados" description="Torneos vinculados a esta comunidad.">
        <div className="space-y-3">
          {(space.tournaments ?? []).length === 0 ? (
            <p className="text-sm text-white/60">Aun no hay torneos vinculados.</p>
          ) : null}
          {(space.tournaments ?? []).map((tournament: any) => (
            <article key={tournament.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <strong>{tournament.name}</strong>
                <span className="text-xs text-brand-cyan">{tournament.status}</span>
              </div>
              <p className="mt-2 text-sm text-white/70">{tournament.game}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Invitaciones de comunidad" description="Invita usuarios a esta comunidad por userId.">
        {inviteMessage ? <p className="mb-4 text-sm text-brand-cyan">{inviteMessage}</p> : null}
        <form action={createInvitation} className="mb-6 grid gap-3 md:grid-cols-[1.2fr_0.8fr_auto]">
          <input name="invitedUserId" placeholder="UserId invitado" required />
          <select name="role" defaultValue="MEMBER">
            <option value="MEMBER">Miembro</option>
            <option value="ADMIN">Administrador</option>
            <option value="MODERATOR">Moderador</option>
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
