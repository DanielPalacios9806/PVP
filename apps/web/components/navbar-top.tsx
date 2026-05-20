"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser } from "@/lib/session";

const links = [
  { label: "Juegos", href: "/dashboard/tournaments" },
  { label: "Actividades", href: "/dashboard" },
  { label: "Espacios", href: "/dashboard/spaces" },
  { label: "Tienda", href: "/dashboard/tokens" },
  { label: "Feed", href: "/dashboard" }
];

export function NavbarTop() {
  const [name, setName] = useState("Invitado");

  useEffect(() => {
    const user = getStoredUser();
    setName(user?.displayName || user?.username || "Invitado");
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#181f2b]/95 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-3 lg:px-5">
        <Link href="/dashboard/tournaments" className="flex items-center gap-3">
          <div className="relative h-8 w-8">
            <span className="absolute left-0 top-4 h-1.5 w-4 -rotate-[62deg] rounded-full bg-[#ff7a2f]" />
            <span className="absolute left-2 top-2 h-1.5 w-4 rotate-[62deg] rounded-full bg-[#ff7a2f]" />
            <span className="absolute left-4 top-4 h-1.5 w-4 -rotate-[62deg] rounded-full bg-[#ff7a2f]" />
          </div>
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
          <button className="text-2xl leading-none text-[#93a3c0] transition hover:text-white">
            ...
          </button>
        </div>

        <div className="mx-auto hidden max-w-sm flex-1 lg:block">
          <div className="rounded-[10px] bg-[#3a4661]/85 px-4 py-2.5">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-[#94a3bf]"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/dashboard/matches/mock-match-1"
            className="hidden rounded-[10px] border border-white/8 bg-[#202839] px-4 py-2 text-sm font-semibold text-white/90 lg:inline-flex"
          >
            Mi partida
          </Link>
          <Link
            href="/dashboard/tokens"
            className="hidden rounded-[10px] border border-white/8 bg-[#202839] px-4 py-2 text-sm font-semibold text-white/90 lg:inline-flex"
          >
            Mis tokens
          </Link>
          <Link href="/dashboard/account" className="flex items-center gap-3 border-l border-white/10 pl-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#364055] text-xs font-semibold uppercase text-white">
              {name.slice(0, 2)}
            </div>
            <span className="hidden text-sm font-semibold text-white xl:inline">{name}</span>
            <span className="hidden text-sm text-[#93a3c0] xl:inline">v</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
