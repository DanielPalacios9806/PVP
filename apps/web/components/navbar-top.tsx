"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountMenu } from "@/components/account-menu";
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

        <div className="mx-auto hidden max-w-sm flex-1 lg:block">
          <div className="rounded-[10px] border border-white/8 bg-[#101722] px-4 py-2.5">
            <input
              type="text"
              placeholder="Buscar torneos, equipos o comunidades..."
              className="w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-[#94a3bf]"
            />
          </div>
        </div>

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
          <div className="border-l border-white/10 pl-3">
            <AccountMenu onSessionChange={syncRole} />
          </div>
        </div>
      </div>
    </nav>
  );
}
