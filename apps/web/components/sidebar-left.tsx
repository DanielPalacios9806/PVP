"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, type AppRole } from "@/lib/session";

interface RailItem {
  id: string;
  href: string;
  label: string;
  short: string;
  tone: string;
  roles?: AppRole[];
}

const railItems: RailItem[] = [
  { id: "lol", href: "/dashboard/tournaments?game=lol", label: "League of Legends", short: "LD", tone: "text-[#d6af37]" },
  { id: "valo", href: "/dashboard/tournaments?game=valorant", label: "VALORANT", short: "V", tone: "text-[#ff7187]" },
  { id: "teams", href: "/dashboard/teams", label: "Equipos", short: "TA", tone: "text-white" },
  { id: "spaces", href: "/dashboard/spaces", label: "Espacios", short: "A", tone: "text-white" },
  { id: "tokens", href: "/dashboard/tokens", label: "Tokens", short: "6", tone: "text-white" },
  { id: "admin", href: "/dashboard/admin", label: "Admin", short: "+", tone: "text-white", roles: ["ADMIN", "MODERATOR", "ORGANIZER"] }
];

export function SidebarLeft() {
  const pathname = usePathname();
  const [role, setRole] = useState<AppRole>("USER");

  useEffect(() => {
    const user = getStoredUser();
    setRole(user?.role ?? "USER");
  }, []);

  const items = railItems.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <div className="flex h-full flex-col items-center gap-4 py-2">
      <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2f2f68] text-lg font-semibold text-[#d6af37] shadow-[0_0_28px_rgba(96,84,255,0.25)]">
        LD
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#202938] text-3xl text-white/55">
        +
      </div>
      <div className="h-px w-7 bg-white/8" />

      {items.map((item) => {
        const active = pathname.startsWith(item.href.split("?")[0]);
        return (
          <Link
            key={item.id}
            href={item.href}
            title={item.label}
            className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border transition ${
              active
                ? "border-[#58e0ff] bg-[#20283b] shadow-[0_0_24px_rgba(88,224,255,0.2)]"
                : "border-white/8 bg-[#151c28] hover:border-white/20 hover:bg-[#1b2332]"
            }`}
          >
            <span className={`text-sm font-bold uppercase ${item.tone}`}>{item.short}</span>
          </Link>
        );
      })}

      <div className="mt-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-[#1b2332] text-3xl text-white/55">
        +
      </div>
    </div>
  );
}
