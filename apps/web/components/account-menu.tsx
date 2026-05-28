"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { apiUrl, getAuthHeaders } from "@/lib/config";
import {
  clearSession,
  getStoredUser,
  getStoredWallet,
  subscribeSessionChange,
  type AppRole,
  type StoredUser,
  type StoredWallet
} from "@/lib/session";

const roleLabels: Record<AppRole, string> = {
  USER: "Jugador",
  ORGANIZER: "Organizador",
  MODERATOR: "Moderador",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
  FINANCE: "Finanzas"
};

const roleDescriptions: Record<AppRole, string> = {
  USER: "Participa en torneos, equipos y comunidades.",
  ORGANIZER: "Opera torneos, equipos y espacios competitivos.",
  MODERATOR: "Revisa reportes, disputas y actividad operativa.",
  ADMIN: "Supervisa administracion, auditoria y operacion interna.",
  SUPER_ADMIN: "Control total de usuarios, roles y perfiles internos.",
  FINANCE: "Gestiona tokens internos, saldos y reportes operativos."
};

type AccountLink = {
  label: string;
  href: string;
  description: string;
  roles?: AppRole[];
};

const accountSections: Array<{ title: string; links: AccountLink[] }> = [
  {
    title: "Cuenta y jugador",
    links: [
      { label: "Mi perfil", href: "/dashboard/account", description: "Datos de cuenta, seguridad y sesiones." },
      { label: "Riot ID mock", href: "/dashboard/account", description: "Vinculacion Riot en modo demo." },
      { label: "Mis equipos", href: "/dashboard/teams", description: "Equipos donde participas o administras." },
      { label: "Mis torneos", href: "/dashboard/tournaments", description: "Inscripciones, brackets y partidas." },
      { label: "Mis tokens", href: "/dashboard/tokens", description: "Saldo interno no monetario." }
    ]
  },
  {
    title: "Operacion por rol",
    links: [
      {
        label: "Gestionar torneos",
        href: "/dashboard/tournaments",
        description: "Crear, revisar y operar competencias.",
        roles: ["ORGANIZER", "ADMIN", "SUPER_ADMIN"]
      },
      {
        label: "Comunidades y spaces",
        href: "/dashboard/spaces",
        description: "Gestionar espacios competitivos.",
        roles: ["ORGANIZER", "ADMIN", "SUPER_ADMIN"]
      },
      {
        label: "Moderacion",
        href: "/dashboard/moderation",
        description: "Reportes, disputas y revision operativa.",
        roles: ["MODERATOR", "ADMIN", "SUPER_ADMIN"]
      },
      {
        label: "Panel interno",
        href: "/dashboard/admin",
        description: "Usuarios, auditoria y estado de servicios.",
        roles: ["ADMIN", "SUPER_ADMIN"]
      },
      {
        label: "Perfiles internos",
        href: "/dashboard/admin/profiles",
        description: "Roles, estados y cuentas internas.",
        roles: ["SUPER_ADMIN"]
      },
      {
        label: "Tokens y finanzas",
        href: "/dashboard/tokens",
        description: "Gestion y revision de tokens internos.",
        roles: ["FINANCE", "SUPER_ADMIN"]
      }
    ]
  }
];

function getVisibleSections(role: AppRole) {
  return accountSections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => !link.roles || link.roles.includes(role))
    }))
    .filter((section) => section.links.length > 0);
}

type AccountMenuProps = {
  onSessionChange?: () => void;
};

export function AccountMenu({ onSessionChange }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [wallet, setWallet] = useState<StoredWallet>({ balance: 100, currencyCode: "TOKENS" });
  const containerRef = useRef<HTMLDivElement>(null);

  function syncSession() {
    setUser(getStoredUser());
    setWallet(getStoredWallet());
  }

  useEffect(() => {
    syncSession();
    return subscribeSessionChange(syncSession);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function logout() {
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders()
      });
    } catch {
      // Local logout must remain resilient if the API is unavailable.
    }

    clearSession();
    setUser(null);
    setWallet({ balance: 100, currencyCode: "TOKENS" });
    setIsOpen(false);
    onSessionChange?.();
    window.location.href = "/auth/login";
  }

  const displayName = user?.displayName || user?.username || "Invitado";
  const initials = displayName.slice(0, 2).toUpperCase();
  const role = user?.role ?? "USER";
  const visibleSections = getVisibleSections(role);
  const tokenActionLabel = role === "FINANCE" || role === "SUPER_ADMIN" ? "Revisar tokens internos" : "Recargar en modo demo";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-[12px] border border-white/8 bg-[#101722] px-2.5 py-2 text-left transition hover:border-[var(--ds-border-cyan)] sm:gap-3 sm:px-3"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#364055] text-xs font-bold uppercase text-white">
          {initials}
        </span>
        <span className="hidden min-w-0 xl:block">
          <span className="block max-w-[130px] truncate text-sm font-semibold text-white">{displayName}</span>
          <span className="block text-[11px] text-white/45">{user ? roleLabels[user.role] : "Cuenta invitada"}</span>
        </span>
        <span className={`hidden text-sm text-[#93a3c0] transition xl:inline ${isOpen ? "rotate-180" : ""}`}>v</span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+12px)] z-[70] max-h-[calc(100vh-5.5rem)] w-[min(24rem,calc(100vw-1.5rem))] overflow-y-auto rounded-[20px] border border-white/10 bg-[rgba(5,8,12,0.98)] shadow-[0_24px_70px_rgba(0,0,0,0.58)] backdrop-blur-xl">
          {user ? (
            <>
              <div className="border-b border-white/8 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ds-cyan-primary)]">Cuenta Darkside</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ds-border-red)] bg-[rgba(255,36,56,0.14)] text-sm font-bold uppercase text-white">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-white">{displayName}</p>
                    <p className="truncate text-xs text-white/52">{user.email || roleLabels[user.role]}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[14px] border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/42">Rol</p>
                    <p className="mt-1 text-sm font-semibold text-white">{roleLabels[user.role]}</p>
                  </div>
                  <div className="rounded-[14px] border border-white/8 bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/42">Tokens internos</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--ds-gold-prize)]">
                      {wallet.balance} {wallet.currencyCode}
                    </p>
                  </div>
                </div>
                <p className="mt-3 rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-white/58">
                  {roleDescriptions[user.role]}
                </p>
              </div>

              <div className="grid gap-4 p-3">
                {visibleSections.map((section) => (
                  <div key={section.title}>
                    <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/36">{section.title}</p>
                    <div className="grid gap-1">
                      {section.links.map((link) => (
                        <Link
                          key={`${section.title}-${link.label}`}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className="group rounded-[14px] px-4 py-3 transition hover:bg-white/[0.06]"
                        >
                          <span className="block text-sm font-semibold text-white/82 group-hover:text-white">{link.label}</span>
                          <span className="mt-1 block text-xs leading-5 text-white/42 group-hover:text-white/58">{link.description}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/8 p-4">
                <Link
                  href="/dashboard/tokens"
                  onClick={() => setIsOpen(false)}
                  className="mb-3 flex items-center justify-between rounded-[14px] border border-[var(--ds-border-cyan)] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white"
                >
                  {tokenActionLabel}
                  <Image src="/assets/darkside/icons/icon-arrow-right.svg" alt="" width={14} height={14} />
                </Link>
                <p className="mb-3 text-xs leading-5 text-white/45">
                  Los tokens son internos y no se pueden retirar ni convertir a dinero.
                </p>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full rounded-[14px] border border-[var(--ds-border-red)] px-4 py-3 text-sm font-bold text-[var(--ds-red-primary)] transition hover:bg-[rgba(255,36,56,0.12)]"
                >
                  Cerrar sesion
                </button>
              </div>
            </>
          ) : (
            <div className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ds-cyan-primary)]">Cuenta invitada</p>
              <h3 className="mt-3 font-heading text-2xl font-bold text-white">Entra a Darkside</h3>
              <p className="mt-2 text-sm leading-6 text-white/58">
                Accede para crear equipos, vincular Riot ID mock e inscribirte a torneos universitarios.
              </p>
              <div className="mt-5 grid gap-3">
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="ds-button-secondary inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-sm font-semibold"
                >
                  <Image src="/assets/darkside/icons/icon-login.svg" alt="" width={16} height={16} />
                  Iniciar sesion
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsOpen(false)}
                  className="ds-button-primary inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-sm font-semibold"
                >
                  <Image src="/assets/darkside/icons/icon-register.svg" alt="" width={16} height={16} />
                  Crear cuenta
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
