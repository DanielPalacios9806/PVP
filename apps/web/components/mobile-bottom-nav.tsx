"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Inicio", href: "/dashboard" },
  { label: "Torneos", href: "/dashboard/tournaments" },
  { label: "Equipos", href: "/dashboard/teams" },
  { label: "Perfil", href: "/dashboard/account" }
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-white/8 bg-[#080c13]/96 px-2 py-2 backdrop-blur-xl lg:hidden">
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
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
