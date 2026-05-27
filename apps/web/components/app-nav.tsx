"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser, type AppRole } from "../lib/session";

const playerLinks = [
  { label: "Inicio", href: "/" },
  { label: "Panel", href: "/dashboard" },
  { label: "Torneos", href: "/dashboard/tournaments" },
  { label: "Equipos", href: "/dashboard/teams" },
  { label: "Comunidades", href: "/dashboard/spaces" },
  { label: "Tokens", href: "/dashboard/tokens" }
];

const adminLinks = [
  { label: "Moderacion", href: "/dashboard/moderation" },
  { label: "Administracion", href: "/dashboard/admin" }
];

const superAdminLinks = [
  { label: "Perfiles", href: "/dashboard/admin/profiles" }
];

export function AppNav() {
  const [role, setRole] = useState<AppRole>("USER");

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role) {
      setRole(user.role);
    }
  }, []);

  const canOperate = role === "ADMIN" || role === "SUPER_ADMIN" || role === "MODERATOR" || role === "ORGANIZER";
  const links = canOperate
    ? [...playerLinks, ...adminLinks, ...(role === "SUPER_ADMIN" ? superAdminLinks : [])]
    : playerLinks;

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-white/80">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full border border-white/10 bg-black/20 px-4 py-2 hover:border-brand-cyan/50 hover:text-white"
        >
          {link.label}
        </Link>
      ))}
      <Link
        href="/dashboard/account"
        className="ml-1 flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 hover:border-brand-cyan/50 hover:text-white"
      >
        <Image src="/assets/icons/mando.svg" alt="Cuenta" width={16} height={16} />
        <span>Cuenta</span>
      </Link>
    </nav>
  );
}
