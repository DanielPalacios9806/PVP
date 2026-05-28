"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser, subscribeSessionChange, type AppRole } from "../lib/session";

const playerLinks = [
  { label: "Inicio", href: "/" },
  { label: "Panel", href: "/dashboard" },
  { label: "Torneos", href: "/dashboard/tournaments" },
  { label: "Equipos", href: "/dashboard/teams" },
  { label: "Comunidades", href: "/dashboard/spaces" },
  { label: "Tokens", href: "/dashboard/tokens" }
];

const moderatorLinks = [
  { label: "Moderacion", href: "/dashboard/moderation" }
];

const adminLinks = [
  { label: "Administracion", href: "/dashboard/admin" }
];

const superAdminLinks = [
  { label: "Perfiles", href: "/dashboard/admin/profiles" }
];

export function AppNav() {
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
