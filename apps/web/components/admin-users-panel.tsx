"use client";

import { useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/config";
import { getStoredUser, type AppRole } from "@/lib/session";
import { SectionCard } from "./section-card";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: AppRole;
  status: string;
};

const roleOptions: AppRole[] = ["USER", "ORGANIZER", "MODERATOR", "ADMIN", "SUPER_ADMIN", "FINANCE"];

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentRole, setCurrentRole] = useState<AppRole>("USER");
  const [message, setMessage] = useState("");

  async function loadUsers() {
    try {
      const response = await fetch(`${apiUrl}/admin/users`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "No se pudieron cargar usuarios.");
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron cargar usuarios.");
    }
  }

  useEffect(() => {
    setCurrentRole(getStoredUser()?.role ?? "USER");
    void loadUsers();
  }, []);

  async function updateRole(userId: string, role: AppRole) {
    const response = await fetch(`${apiUrl}/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({ role })
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message ?? "No se pudo actualizar el rol.");
      return;
    }

    setMessage("Rol actualizado por super administracion.");
    await loadUsers();
  }

  const canAssignRoles = currentRole === "SUPER_ADMIN";

  return (
    <SectionCard
      title="Usuarios y roles"
      description="El registro publico solo crea jugadores. Los roles operativos se asignan desde super administracion."
    >
      {message ? <p className="mb-4 text-sm text-brand-cyan">{message}</p> : null}
      <div className="space-y-3">
        {users.length === 0 ? (
          <p className="text-sm text-white/60">No hay usuarios para mostrar o tu rol no tiene permisos.</p>
        ) : null}
        {users.map((user) => (
          <article key={user.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-medium text-white">{user.displayName || user.username}</h3>
                <p className="mt-1 text-sm text-white/60">{user.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-brand-cyan">
                  {user.role} - {user.status}
                </p>
              </div>
              {canAssignRoles ? (
                <select
                  value={user.role}
                  onChange={(event) => void updateRole(user.id, event.target.value as AppRole)}
                  className="max-w-[220px]"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                  Solo lectura
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
