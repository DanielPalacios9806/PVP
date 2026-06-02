"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, ShieldCheck, Trophy, UserRound, Users, WalletCards, X } from "lucide-react";
import { apiUrl, getAuthHeaders } from "@/lib/config";
import {
  clearSession,
  getStoredUser,
  getStoredWallet,
  roleLabels,
  subscribeSessionChange,
  type AppRole,
  type StoredUser,
  type StoredWallet
} from "@/lib/session";

type MobileAccountSheetProps = {
  onSessionChange?: () => void;
};

type MobileAccountLink = {
  label: string;
  href: string;
  description: string;
  icon: typeof UserRound;
  roles?: AppRole[];
};

const accountLinks: MobileAccountLink[] = [
  {
    label: "Mi perfil",
    href: "/dashboard/account",
    description: "Cuenta, seguridad y Riot ID mock.",
    icon: UserRound
  },
  {
    label: "Mis equipos",
    href: "/dashboard/teams",
    description: "Rosters, capitanes y administracion.",
    icon: Users
  },
  {
    label: "Mis torneos",
    href: "/dashboard/tournaments",
    description: "Inscripciones, brackets y partidas.",
    icon: Trophy
  },
  {
    label: "Mis tokens",
    href: "/dashboard/tokens",
    description: "Saldo interno no monetario.",
    icon: WalletCards
  },
  {
    label: "Operacion",
    href: "/dashboard/moderation",
    description: "Reportes, disputas y revision operativa.",
    icon: ShieldCheck,
    roles: ["MODERATOR", "ADMIN", "SUPER_ADMIN"]
  },
  {
    label: "Admin",
    href: "/dashboard/admin",
    description: "Usuarios, auditoria y estado interno.",
    icon: ShieldCheck,
    roles: ["ADMIN", "SUPER_ADMIN"]
  }
];

function getVisibleLinks(role: AppRole) {
  return accountLinks.filter((link) => !link.roles || link.roles.includes(role));
}

export function MobileAccountSheet({ onSessionChange }: MobileAccountSheetProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [wallet, setWallet] = useState<StoredWallet>({ balance: 100, currencyCode: "TOKENS" });

  function syncSession() {
    setUser(getStoredUser());
    setWallet(getStoredWallet());
  }

  useEffect(() => {
    syncSession();
    return subscribeSessionChange(syncSession);
  }, []);

  async function logout() {
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders()
      });
    } catch {
      // Local logout must work even if the API is unavailable during local UI tests.
    }

    clearSession();
    setUser(null);
    setWallet({ balance: 100, currencyCode: "TOKENS" });
    setOpen(false);
    onSessionChange?.();
    window.location.href = "/auth/login";
  }

  const displayName = user?.displayName || user?.username || "Invitado";
  const initials = displayName.slice(0, 2).toUpperCase();
  const role = user?.role ?? "USER";
  const visibleLinks = getVisibleLinks(role);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Abrir menu de cuenta"
          className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[var(--ds-border-cyan)] bg-[#101722] text-xs font-bold uppercase text-white shadow-[0_0_22px_rgba(52,211,255,0.14)] transition active:scale-95"
        >
          {initials}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-sm lg:hidden" />
        <Dialog.Content className="fixed inset-x-3 bottom-[5.35rem] top-[4.75rem] z-[130] flex flex-col overflow-hidden rounded-[24px] border border-white/12 bg-[rgba(5,8,12,0.98)] shadow-[0_28px_90px_rgba(0,0,0,0.62)] outline-none backdrop-blur-xl lg:hidden">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
            <div>
              <Dialog.Title className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ds-cyan-primary)]">
                Cuenta Darkside
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-white/45">
                Accesos de jugador, equipo, torneos y sesion.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Cerrar menu de cuenta"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-[var(--ds-border-cyan)] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {user ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,36,56,0.16),rgba(0,224,255,0.08))] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ds-border-red)] bg-black/45 text-sm font-bold uppercase text-white">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold text-white">{displayName}</p>
                      <p className="truncate text-xs text-white/55">{user.email || roleLabels[role]}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-[16px] border border-white/10 bg-black/25 p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/42">Rol</p>
                      <p className="mt-1 text-sm font-semibold text-white">{roleLabels[role]}</p>
                    </div>
                    <div className="rounded-[16px] border border-white/10 bg-black/25 p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/42">Tokens</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--ds-gold-prize)]">
                        {wallet.balance} {wallet.currencyCode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  {visibleLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:border-[var(--ds-border-cyan)] hover:bg-white/[0.06]"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-[var(--ds-cyan-primary)]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-white">{link.label}</span>
                          <span className="mt-0.5 block truncate text-xs text-white/45">{link.description}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="shrink-0 border-t border-white/10 bg-[rgba(5,8,12,0.99)] p-4">
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-[var(--ds-border-red)] px-4 py-3 text-sm font-bold text-[var(--ds-red-primary)] transition hover:bg-[rgba(255,36,56,0.12)]"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesion
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                <h3 className="font-heading text-2xl font-bold uppercase text-white">Entra a Darkside</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Accede para crear equipos, vincular Riot ID mock e inscribirte a torneos universitarios.
                </p>
              </div>
              <div className="mt-auto grid gap-3 border-t border-white/10 pt-4">
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="ds-button-secondary inline-flex items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-sm font-bold"
                >
                  <Image src="/assets/darkside/icons/icon-login.svg" alt="" width={16} height={16} />
                  Iniciar sesion
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setOpen(false)}
                  className="ds-button-primary inline-flex items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-sm font-bold"
                >
                  <Image src="/assets/darkside/icons/icon-register.svg" alt="" width={16} height={16} />
                  Crear cuenta
                </Link>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
