"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/config";
import { getStoredUser, type AppRole } from "@/lib/session";
import { SectionCard } from "./section-card";

type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING";
type MessageTone = "info" | "success" | "error";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: AppRole;
  status: UserStatus;
  mustChangePassword?: boolean;
  passwordChangedAt?: string | null;
  createdAt?: string;
};

type CreateUserResponse = {
  user: AdminUser;
  temporaryPassword: string;
  message?: string;
};

const roleOptions: AppRole[] = ["USER", "ORGANIZER", "MODERATOR", "ADMIN", "SUPER_ADMIN", "FINANCE"];
const createRoleOptions: AppRole[] = ["USER", "ORGANIZER", "MODERATOR", "ADMIN", "FINANCE"];
const statusOptions: UserStatus[] = ["ACTIVE", "SUSPENDED", "PENDING"];

const roleLabels: Record<AppRole, string> = {
  USER: "Jugador",
  ORGANIZER: "Organizador",
  MODERATOR: "Moderador",
  ADMIN: "Administrador",
  SUPER_ADMIN: "Super administrador",
  FINANCE: "Finanzas"
};

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
  PENDING: "Pendiente"
};

function getHumanApiMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const payload = data as { message?: unknown; errors?: unknown };

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    if (Array.isArray(payload.errors)) {
      const details = payload.errors
        .map((error) => {
          if (error && typeof error === "object" && "message" in error) {
            return String((error as { message?: unknown }).message ?? "");
          }
          return "";
        })
        .filter(Boolean);

      if (details.length > 0) {
        return details.join(" ");
      }
    }
  }

  return fallback;
}

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentRole, setCurrentRole] = useState<AppRole>("USER");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("info");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copying, setCopying] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState<CreateUserResponse | null>(null);

  const canAssignRoles = currentRole === "SUPER_ADMIN";

  const params = useMemo(() => {
    const search = new URLSearchParams();
    if (query.trim()) {
      search.set("q", query.trim());
    }
    if (roleFilter) {
      search.set("role", roleFilter);
    }
    if (statusFilter) {
      search.set("status", statusFilter);
    }
    search.set("limit", "100");
    return search;
  }, [query, roleFilter, statusFilter]);

  function showMessage(text: string, tone: MessageTone = "info") {
    setMessage(text);
    setMessageTone(tone);
  }

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/admin/users?${params.toString()}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(getHumanApiMessage(data, "No se pudieron cargar usuarios."));
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "No se pudieron cargar usuarios.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCurrentRole(getStoredUser()?.role ?? "USER");
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [params]);

  async function updateRole(userId: string, role: AppRole) {
    showMessage("Actualizando rol...", "info");
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
      showMessage(getHumanApiMessage(data, "No se pudo actualizar el rol."), "error");
      return;
    }

    showMessage("Rol actualizado correctamente.", "success");
    await loadUsers();
  }

  async function updateStatus(userId: string, status: UserStatus) {
    showMessage("Actualizando estado...", "info");
    const response = await fetch(`${apiUrl}/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({ status })
    });
    const data = await response.json();

    if (!response.ok) {
      showMessage(getHumanApiMessage(data, "No se pudo actualizar el estado."), "error");
      return;
    }

    showMessage("Estado actualizado correctamente.", "success");
    await loadUsers();
  }

  async function createInternalUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    setCreating(true);
    showMessage("Creando cuenta interna...", "info");
    setTemporaryPassword(null);

    try {
      const response = await fetch(`${apiUrl}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          displayName: String(form.get("displayName") || ""),
          username: String(form.get("username") || ""),
          email: String(form.get("email") || ""),
          role: String(form.get("role") || "ADMIN"),
          status: String(form.get("status") || "ACTIVE")
        })
      });
      const data = await response.json();

      if (!response.ok) {
        showMessage(getHumanApiMessage(data, "No se pudo crear la cuenta interna."), "error");
        return;
      }

      formElement.reset();
      setTemporaryPassword(data as CreateUserResponse);
      showMessage("Cuenta interna creada correctamente. Copia la contrasena temporal antes de cerrar esta pantalla.", "success");
      await loadUsers();
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "No se pudo crear la cuenta interna.", "error");
    } finally {
      setCreating(false);
    }
  }

  async function copyTemporaryPassword() {
    if (!temporaryPassword?.temporaryPassword || copying) {
      return;
    }

    try {
      setCopying(true);
      await navigator.clipboard.writeText(temporaryPassword.temporaryPassword);
      showMessage("Contrasena temporal copiada al portapapeles.", "success");
    } catch {
      showMessage("No se pudo copiar automaticamente. Selecciona la contrasena y copiala manualmente.", "error");
    } finally {
      setCopying(false);
    }
  }

  const messageClass =
    messageTone === "error" ? "text-brand-red" : messageTone === "success" ? "text-brand-cyan" : "text-white/70";

  return (
    <div className="space-y-6">
      <SectionCard
        title="Crear cuenta interna"
        description="Solo super administracion puede crear cuentas operativas. La contrasena temporal se muestra una sola vez."
      >
        {!canAssignRoles ? (
          <p className="text-sm text-white/60">Solo SUPER_ADMIN puede crear o modificar perfiles internos.</p>
        ) : (
          <form onSubmit={createInternalUser} className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_0.7fr_0.7fr_auto]">
            <input name="displayName" placeholder="Nombre visible" required minLength={2} maxLength={50} />
            <input name="username" placeholder="Usuario" required minLength={3} maxLength={24} />
            <input name="email" type="email" placeholder="Correo" required />
            <select name="role" defaultValue="ADMIN" aria-label="Rol inicial">
              {createRoleOptions.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
            <select name="status" defaultValue="ACTIVE" aria-label="Estado inicial">
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            <button className="btn-primary whitespace-nowrap rounded-[12px]" disabled={creating}>
              {creating ? "Creando..." : "Crear"}
            </button>
          </form>
        )}

        {temporaryPassword ? (
          <div className="mt-5 rounded-2xl border border-brand-cyan/30 bg-brand-cyan/10 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-cyan">Contrasena temporal generada</p>
                <p className="mt-2 text-sm text-white/70">
                  Usuario: <span className="font-semibold text-white">{temporaryPassword.user.email}</span>. Esta clave no se guarda ni se vuelve a mostrar.
                </p>
              </div>
              <button type="button" onClick={() => void copyTemporaryPassword()} className="btn-secondary rounded-[12px]" disabled={copying}>
                {copying ? "Copiando..." : "Copiar clave"}
              </button>
            </div>
            <code className="mt-3 block break-all rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white">
              {temporaryPassword.temporaryPassword}
            </code>
            <p className="mt-3 text-xs leading-5 text-white/60">
              Entrega esta clave al usuario por un canal seguro. Al iniciar sesion, la plataforma marcara que debe cambiarla.
            </p>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Centro de perfiles"
        description="Busca usuarios registrados por correo, nombre o rol y administra permisos operativos."
      >
        {message ? <p className={`mb-4 text-sm ${messageClass}`}>{message}</p> : null}

        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_0.35fr_0.35fr_auto]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por correo, usuario o nombre..." />
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Filtrar por rol">
            <option value="">Todos los roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => void loadUsers()} className="btn-secondary rounded-[12px]" disabled={loading}>
            {loading ? "Buscando..." : "Actualizar"}
          </button>
        </div>

        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-sm text-white/60">No hay usuarios para mostrar con estos filtros.</p>
          ) : null}
          {users.map((user) => (
            <article key={user.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="grid gap-4 xl:grid-cols-[1fr_0.3fr_0.3fr] xl:items-center">
                <div>
                  <h3 className="font-medium text-white">{user.displayName || user.username}</h3>
                  <p className="mt-1 text-sm text-white/60">{user.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
                    <span className="rounded-full border border-brand-cyan/20 px-3 py-1 text-brand-cyan">{roleLabels[user.role]}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-white/60">{statusLabels[user.status]}</span>
                    {user.mustChangePassword ? (
                      <span className="rounded-full border border-brand-red/30 px-3 py-1 text-brand-red">Debe cambiar clave</span>
                    ) : null}
                  </div>
                </div>
                {canAssignRoles ? (
                  <select value={user.role} onChange={(event) => void updateRole(user.id, event.target.value as AppRole)} aria-label={`Cambiar rol de ${user.email}`}>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">Rol solo lectura</span>
                )}
                {canAssignRoles ? (
                  <select value={user.status} onChange={(event) => void updateStatus(user.id, event.target.value as UserStatus)} aria-label={`Cambiar estado de ${user.email}`}>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">Estado solo lectura</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
