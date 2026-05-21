"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { brand } from "@/lib/brand";
import { getStoredUser, type AppRole } from "@/lib/session";

interface RailItem {
  id: string;
  href: string;
  label: string;
  icon: string;
  roles?: AppRole[];
}

const railItems: RailItem[] = [
  { id: "lol", href: "/dashboard/tournaments?game=lol", label: "League of Legends", icon: "/assets/darkside/logos/game-lol-icon.svg" },
  { id: "valo", href: "/dashboard/tournaments?game=valorant", label: "VALORANT", icon: "/assets/darkside/logos/game-valorant-icon.svg" },
  { id: "teams", href: "/dashboard/teams", label: "Equipos", icon: "/assets/darkside/icons/icon-users.svg" },
  { id: "spaces", href: "/dashboard/spaces", label: "Comunidades", icon: "/assets/darkside/icons/icon-comment.svg" },
  { id: "tokens", href: "/dashboard/tokens", label: "Tokens internos", icon: "/assets/darkside/icons/icon-trophy.svg" },
  { id: "admin", href: "/dashboard/admin", label: "Operacion admin", icon: "/assets/darkside/icons/icon-bracket.svg", roles: ["ADMIN", "MODERATOR", "ORGANIZER"] }
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
      <Link href="/dashboard" className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ds-border-red)] bg-black/30 shadow-[var(--ds-glow-red)]">
        <Image src={brand.logoMark} alt={brand.name} width={30} height={30} />
      </Link>
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
            <Image src={item.icon} alt="" width={26} height={26} />
          </Link>
        );
      })}

      <Link href="/dashboard/account" title="Perfil" className="mt-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-[#111722]">
        <Image src="/assets/darkside/icons/icon-user.svg" alt="" width={24} height={24} />
      </Link>
    </div>
  );
}
