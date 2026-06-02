"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gamepad2,
  KeyRound,
  Link2,
  LockKeyhole,
  LogOut,
  RadioTower,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  WalletCards
} from "lucide-react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { clearSession, getStoredUser, getStoredWallet, persistSession, subscribeSessionChange, type AppRole } from "../lib/session";
import { ConnectedOAuthAccounts } from "./connected-oauth-accounts";
import { RiotLinkCard } from "./riot-link-card";
import { SectionCard } from "./section-card";

const roleLabels: Record<AppRole, string> = {
  USER: "Jugador",
  ORGANIZER: "Organizador",
  MODERATOR: "Moderacion",
  ADMIN: "Administracion",
  SUPER_ADMIN: "Super admin",
  FINANCE: "Finanzas"
};

const roleDescriptions: Record<AppRole, string> = {
  USER: "Perfil de jugador competitivo con acceso a equipos, torneos, partidas y tokens internos.",
  ORGANIZER: "Puede operar experiencias competitivas y apoyar la gestion de torneos.",
  MODERATOR: "Puede revisar actividad comunitaria, incidencias y soporte competitivo.",
  ADMIN: "Acceso administrativo para gestion operativa, usuarios y torneos.",
  SUPER_ADMIN: "Control total de la plataforma, roles, auditoria y operacion interna.",
  FINANCE: "Perfil orientado a control de tokens internos, reportes y conciliacion."
};

const quickLinks = [
  { href: "/dashboard/tournaments", label: "Mis torneos", detail: "Explorar e inscribirse", icon: Trophy },
  { href: "/dashboard/teams", label: "Mis equipos", detail: "Rosters y tryouts", icon: Users },
  { href: "/dashboard/matches/demo", label: "Mis partidas", detail: "Match rooms", icon: Swords },
  { href: "/dashboard/tokens", label: "Mis tokens", detail: "Saldo interno", icon: WalletCards }
];

const competitiveStats = [
  { label: "Torneos activos", value: "3", hint: "pre-beta", icon: Trophy },
  { label: "Equipos visibles", value: "12", hint: "rosters", icon: Users },
  { label: "Partidas demo", value: "8", hint: "match rooms", icon: Gamepad2 },
  { label: "Riot mode", value: "DEV", hint: "backend", icon: RadioTower }
];

function isAdminRole(role?: AppRole) {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "MODERATOR";
}

function initials(name?: string, fallback = "DS") {
  if (!name) return fallback;
  const clean = name.trim();
  if (!clean) return fallback;
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AccountCenter() {
  const router = useRouter();
  const [user, setUser] = useState(getStoredUser());
  const [wallet, setWallet] = useState(getStoredWallet());
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const displayName = user?.displayName || user?.username || "Invitado";
  const role = user?.role ?? "USER";
  const adminLike = isAdminRole(user?.role);

  const sessionState = useMemo(() => {
    if (!user) {
      return {
        label: "Sesion invitada",
        tone: "border-amber-300/30 bg-amber-300/10 text-amber-100",
        description: "Inicia sesion para guardar Riot ID, equipos, tokens y torneos."
      };
    }

    if (user.mustChangePassword) {
      return {
        label: "Accion requerida",
        tone: "border-brand-red/30 bg-brand-red/10 text-brand-red",
        description: "Tu cuenta usa una contrasena temporal. Cambiala antes de operar."
      };
    }

    return {
      label: "Cuenta activa",
      tone: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
      description: "Sesion local activa con acceso al dashboard competitivo."
    };
  }, [user]);

  function syncLocalSession() {
    setUser(getStoredUser());
    setWallet(getStoredWallet());
  }

  useEffect(() => {
    syncLocalSession();
    return subscribeSessionChange(syncLocalSession);
  }, []);

  async function logout() {
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders()
      });
    } catch {
      // Keep local logout resilient in mock mode.
    }

    clearSession();
    setUser(null);
    setWallet({ balance: 100, currencyCode: "TOKENS" });
    setMessage("Sesion cerrada correctamente en este entorno.");
    router.push("/auth/login");
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`${apiUrl}/auth/change-password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        currentPassword: String(form.get("currentPassword") || ""),
        newPassword: String(form.get("newPassword") || "")
      })
    });
    const data = await response.json();

    if (!response.ok) {
      setPasswordMessage(data.message ?? "No se pudo cambiar la contrasena.");
      return;
    }

    const nextUser = user ? { ...user, ...data, mustChangePassword: false } : data;
    setUser(nextUser);
    persistSession({ user: nextUser });
    event.currentTarget.reset();
    setPasswordMessage("Contrasena actualizada correctamente.");
  }

  return (
    <div className="space-y-6 account-riot-profile-ux">
      <section className="surface-panel overflow-hidden p-0">
        <div className="relative isolate overflow-hidden rounded-[inherit] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(24,230,242,0.18),transparent_34%),linear-gradient(135deg,rgba(255,61,129,0.12),rgba(47,107,255,0.10)),rgba(4,7,18,0.96)] p-5 sm:p-6 lg:p-8">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-cyan/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-brand-red/10 blur-3xl" />
          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="status-badge status-open">Perfil competitivo</span>
                <span className={`status-badge ${sessionState.tone}`}>{sessionState.label}</span>
                <span className="status-badge border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">RIOT backend protegido</span>
              </div>
              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] border border-white/12 bg-white/[0.06] text-2xl font-black text-white shadow-[0_0_32px_rgba(24,230,242,0.16)]">
                  {initials(displayName)}
                </div>
                <div className="min-w-0">
                  <p className="page-kicker">Cuenta Darkside</p>
                  <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-white sm:text-4xl lg:text-5xl">
                    {displayName}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/66">
                    {sessionState.description} {roleDescriptions[role]}
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {competitiveStats.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-[24px] border border-white/10 bg-black/24 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/42">{item.label}</p>
                        <Icon className="h-4 w-4 text-brand-cyan" />
                      </div>
                      <strong className="mt-3 block text-2xl text-white">{item.value}</strong>
                      <span className="text-xs text-white/45">{item.hint}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/26 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Identidad</p>
                  <h3 className="mt-2 text-xl font-semibold uppercase text-white">{roleLabels[role]}</h3>
                </div>
                <ShieldCheck className="h-7 w-7 text-brand-cyan" />
              </div>
              <div className="mt-5 space-y-3 text-sm text-white/68">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3">
                  <span>Email</span>
                  <strong className="truncate text-white">{user?.email || "No configurado"}</strong>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3">
                  <span>Rol</span>
                  <strong className="text-brand-cyan">{user?.role ?? "USER"}</strong>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3">
                  <span>Saldo</span>
                  <strong className="text-white">{wallet.balance} {wallet.currencyCode}</strong>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                {user ? (
                  <button onClick={logout} className="btn-secondary !justify-center !px-4 !py-3 !text-xs" type="button">
                    <LogOut className="h-4 w-4" />
                    Cerrar sesion
                  </button>
                ) : (
                  <>
                    <Link href="/auth/login" className="btn-secondary !justify-center !px-4 !py-3 !text-xs">
                      Iniciar sesion
                    </Link>
                    <Link href="/auth/register" className="btn-primary !justify-center !px-4 !py-3 !text-xs">
                      Crear cuenta
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <RiotLinkCard />

          <SectionCard title="Accesos competitivos" description="Rutas principales para continuar desde tu cuenta sin mezclar administracion con navegacion de jugador.">
            <div className="grid gap-3 sm:grid-cols-2">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="group rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-brand-cyan/35 hover:bg-brand-cyan/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-brand-cyan">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs uppercase tracking-[0.18em] text-white/35 group-hover:text-brand-cyan">Abrir</span>
                    </div>
                    <strong className="mt-4 block text-lg uppercase tracking-[-0.02em] text-white">{item.label}</strong>
                    <p className="mt-2 text-sm text-white/58">{item.detail}</p>
                  </Link>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Seguridad y sesion" description="Controla el acceso local, contrasena y proveedores conectados sin exponer llaves privadas.">
            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="eyebrow">Sesion</p>
                    <h4 className="mt-2 text-lg font-semibold uppercase text-white">{sessionState.label}</h4>
                    <p className="mt-2 text-sm leading-6 text-white/62">{sessionState.description}</p>
                  </div>
                </div>
                {message ? <p className="mt-4 text-sm text-brand-cyan">{message}</p> : null}
              </div>

              <div className="rounded-[26px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-brand-cyan">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="eyebrow">Contrasena</p>
                    <h4 className="mt-2 text-lg font-semibold uppercase text-white">Cambio seguro</h4>
                  </div>
                </div>
                {user ? (
                  <form onSubmit={changePassword} className="mt-5 grid gap-3">
                    {user.mustChangePassword ? (
                      <p className="rounded-2xl border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
                        Tu cuenta fue creada con contrasena temporal. Cambiala antes de operar la plataforma.
                      </p>
                    ) : null}
                    <input name="currentPassword" type="password" placeholder="Contrasena actual" required />
                    <input name="newPassword" type="password" placeholder="Nueva contrasena segura" required />
                    <button type="submit" className="btn-secondary !justify-center !px-4 !py-2 !text-xs">
                      Cambiar contrasena
                    </button>
                    {passwordMessage ? <p className="text-sm text-brand-cyan">{passwordMessage}</p> : null}
                  </form>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-white/62">Inicia sesion para habilitar el cambio de contrasena.</p>
                )}
              </div>
            </div>

            <div className="mt-4">{user ? <ConnectedOAuthAccounts /> : null}</div>
          </SectionCard>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <SectionCard title="Riot readiness" description="Estado seguro para pruebas de desarrollo sin exponer la API key en frontend.">
            <div className="space-y-3">
              <div className="rounded-[22px] border border-emerald-300/20 bg-emerald-300/10 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                  <strong className="text-sm uppercase tracking-[0.08em] text-emerald-100">Backend Riot listo</strong>
                </div>
                <p className="mt-3 text-sm leading-6 text-emerald-50/72">
                  La key vive en API/Render backend. La web solo consume rutas protegidas.
                </p>
              </div>
              <div className="rounded-[22px] border border-amber-300/20 bg-amber-300/10 p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-100" />
                  <strong className="text-sm uppercase tracking-[0.08em] text-amber-100">RSO pendiente</strong>
                </div>
                <p className="mt-3 text-sm leading-6 text-amber-50/72">
                  Riot Sign On y Tournament API se activan oficialmente cuando Riot apruebe la aplicacion.
                </p>
              </div>
              <div className="grid gap-3 text-sm text-white/65">
                <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
                  <span>Region</span>
                  <strong className="text-white">LA1</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
                  <span>Regional</span>
                  <strong className="text-white">AMERICAS</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
                  <span>Key publica</span>
                  <strong className="text-brand-cyan">No expuesta</strong>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Operativa" description="Accesos administrativos solo visibles para roles internos.">
            <div className="space-y-3">
              {adminLike ? (
                <>
                  <Link href="/dashboard/admin" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white hover:border-brand-cyan/35">
                    Admin
                    <ShieldCheck className="h-4 w-4 text-brand-cyan" />
                  </Link>
                  <Link href="/dashboard/moderation" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white hover:border-brand-cyan/35">
                    Operacion
                    <Activity className="h-4 w-4 text-brand-cyan" />
                  </Link>
                </>
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white/60">
                  Los accesos Admin y Operacion se habilitan solo con rol autorizado.
                </p>
              )}
              <Link href="/legal/privacy" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/72 hover:border-brand-cyan/35 hover:text-white">
                Privacidad y datos
                <Link2 className="h-4 w-4 text-brand-cyan" />
              </Link>
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
