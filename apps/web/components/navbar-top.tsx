"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountMenu } from "@/components/account-menu";
import { MobileAccountSheet } from "@/components/mobile-account-sheet";
import { brand } from "@/lib/brand";
import { getStoredUser, subscribeSessionChange, type AppRole } from "@/lib/session";

const playerLinks = [
  { label: "Inicio", href: "/dashboard" },
  { label: "Torneos", href: "/dashboard/tournaments" },
  { label: "Equipos", href: "/dashboard/teams" },
  { label: "Comunidad", href: "/dashboard/spaces" },
  { label: "Tokens", href: "/dashboard/tokens" }
];

const moderatorLinks = [
  { label: "Operacion", href: "/dashboard/moderation" }
];

const adminLinks = [
  { label: "Admin", href: "/dashboard/admin" }
];

const superAdminLinks = [
  { label: "Perfiles", href: "/dashboard/admin/profiles" }
];

export function NavbarTop() {
  const [role, setRole] = useState<AppRole>("USER");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  function syncRole() {
    const user = getStoredUser();
    setRole(user?.role ?? "USER");
  }

  useEffect(() => {
    syncRole();
    return subscribeSessionChange(syncRole);
  }, []);

  const canModerate = role === "ADMIN" || role === "SUPER_ADMIN" || role === "MODERATOR";
  const canAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const links = [
    ...playerLinks,
    ...(canModerate ? moderatorLinks : []),
    ...(canAdmin ? adminLinks : []),
    ...(role === "SUPER_ADMIN" ? superAdminLinks : [])
  ];
  const searchItems = useMemo(
    () => [
      { label: "Torneos", href: "/dashboard/tournaments", keywords: "torneos brackets competencias league valorant copa" },
      { label: "Equipos", href: "/dashboard/teams", keywords: "equipos roster escuadras jugadores" },
      { label: "Comunidades", href: "/dashboard/spaces", keywords: "comunidad comunidades spaces grupos universidad" },
      { label: "Tokens", href: "/dashboard/tokens", keywords: "tokens saldo recompensas economia interna" },
      { label: "Perfil", href: "/dashboard/account", keywords: "perfil cuenta riot seguridad usuario" },
      ...(canModerate ? [{ label: "Moderacion", href: "/dashboard/moderation", keywords: "moderacion disputas resultados revision" }] : []),
      ...(canAdmin ? [{ label: "Admin", href: "/dashboard/admin", keywords: "admin auditoria riot toornament operaciones" }] : []),
      ...(role === "SUPER_ADMIN" ? [{ label: "Perfiles internos", href: "/dashboard/admin/profiles", keywords: "usuarios roles super admin perfiles" }] : [])
    ],
    [canAdmin, canModerate, role]
  );
  const normalizedQuery = query.trim().toLowerCase();
  const suggestions = normalizedQuery
    ? searchItems
        .filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 5)
    : [];

  function submitSearch() {
    const value = query.trim();
    if (!value) {
      return;
    }

    const direct = suggestions[0];
    if (direct && direct.label.toLowerCase() === value.toLowerCase()) {
      router.push(direct.href);
      setQuery("");
      return;
    }

    router.push(`/dashboard/tournaments?q=${encodeURIComponent(value)}`);
    setFocused(false);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--ds-border-soft)] bg-[rgba(5,8,12,0.96)] backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-3 lg:px-5">
        <Link href="/dashboard" className="flex items-center">
          <Image src={brand.logoMark} alt={brand.name} width={34} height={34} className="h-8 w-8 sm:hidden" />
          <Image
            src={brand.logoHorizontal}
            alt={brand.name}
            width={180}
            height={36}
            className="hidden h-auto w-[160px] sm:block xl:w-[180px]"
          />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-semibold text-[#93a3c0] transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
          className="relative mx-auto hidden max-w-sm flex-1 lg:block"
        >
          <div className="rounded-[10px] border border-white/8 bg-[#101722] px-4 py-2.5 focus-within:border-[#18e6f2]/45">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 140)}
              placeholder="Buscar torneos, equipos o comunidades..."
              className="w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-[#94a3bf]"
            />
          </div>
          {focused && query.trim() ? (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-[80] overflow-hidden rounded-[16px] border border-white/10 bg-[#070b12]/98 p-2 shadow-[0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
              {suggestions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setQuery("")}
                  className="block rounded-[12px] px-3 py-2 text-sm font-semibold text-white/72 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="submit"
                className="mt-1 w-full rounded-[12px] border border-[#18e6f2]/25 bg-[#18e6f2]/10 px-3 py-2 text-left text-xs font-bold text-[#bffaff] transition hover:bg-[#18e6f2]/15"
              >
                Buscar torneos con "{query.trim()}"
              </button>
            </div>
          ) : null}
        </form>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/dashboard/matches/mock-match-1"
            className="hidden rounded-[10px] border border-white/8 bg-[#101722] px-4 py-2 text-sm font-semibold text-white/90 lg:inline-flex"
          >
            Mis partidas
          </Link>
          <Link
            href="/dashboard/tokens"
            className="hidden rounded-[10px] border border-white/8 bg-[#101722] px-4 py-2 text-sm font-semibold text-white/90 lg:inline-flex"
          >
            Mis tokens
          </Link>
          <div className="hidden border-l border-white/10 pl-3 lg:block">
            <AccountMenu onSessionChange={syncRole} />
          </div>
          <div className="lg:hidden">
            <MobileAccountSheet onSessionChange={syncRole} />
          </div>
        </div>
      </div>
    </nav>
  );
}
