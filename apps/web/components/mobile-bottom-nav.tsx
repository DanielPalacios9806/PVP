"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Inicio", href: "/dashboard", icon: "/assets/darkside/icons/icon-trophy.svg" },
  { label: "Torneos", href: "/dashboard/tournaments", icon: "/assets/darkside/icons/icon-bracket.svg" },
  { label: "Equipos", href: "/dashboard/teams", icon: "/assets/darkside/icons/icon-users.svg" },
  { label: "Perfil", href: "/dashboard/account", icon: "/assets/darkside/icons/icon-user.svg" }
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-[var(--ds-border-soft)] bg-[rgba(5,8,12,0.96)] px-2 py-2 backdrop-blur-xl lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 rounded-[8px] px-2 py-2 text-xs font-semibold ${
              active ? "text-[#ff4655]" : "text-white/50"
            }`}
          >
            <Image src={item.icon} alt="" width={19} height={19} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
