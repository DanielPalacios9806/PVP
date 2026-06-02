"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ChevronLeft, ChevronRight, Trophy, Users, WalletCards } from "lucide-react";
import { motion } from "motion/react";

interface DashboardGridWrapperProps {
  leftSidebar: ReactNode;
  mainContent: ReactNode;
  rightSidebar?: ReactNode;
  showRightSidebar?: boolean;
}

const RIGHT_RAIL_KEY = "darkside:right-activity-rail-collapsed";

function CollapsedActivityRail() {
  const quickItems = [
    { label: "Actividad", href: "/dashboard", icon: Activity },
    { label: "Equipos", href: "/dashboard/teams", icon: Users },
    { label: "Torneos", href: "/dashboard/tournaments", icon: Trophy },
    { label: "Tokens", href: "/dashboard/tokens", icon: WalletCards }
  ];

  return (
    <div className="flex h-full flex-col items-center gap-5 px-2 py-6">
      <span
        className="select-none text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8eb8ff]"
        style={{ writingMode: "vertical-rl" }}
      >
        Actividad
      </span>
      <div className="h-px w-7 bg-white/10" />
      {quickItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#101722] text-white/70 transition hover:border-[#58e0ff]/60 hover:text-[#58e0ff]"
          >
            <Icon className="h-4 w-4" />
          </Link>
        );
      })}
    </div>
  );
}

export function DashboardGridWrapper({
  leftSidebar,
  mainContent,
  rightSidebar,
  showRightSidebar = true
}: DashboardGridWrapperProps) {
  const pathname = usePathname();
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(RIGHT_RAIL_KEY);
    if (stored === "1") setRightRailCollapsed(true);
  }, []);

  function toggleRightRail() {
    setRightRailCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(RIGHT_RAIL_KEY, next ? "1" : "0");
      return next;
    });
  }

  const immersiveWorkspace =
    pathname.startsWith("/dashboard/tournaments") ||
    pathname.startsWith("/dashboard/matches");
  const shouldRenderLeftRail = !immersiveWorkspace;
  const shouldRenderRightRail = showRightSidebar && Boolean(rightSidebar);
  const rightRailExpandedColumns = immersiveWorkspace
    ? "lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_344px]"
    : "lg:grid-cols-[64px_minmax(0,1fr)_320px] xl:grid-cols-[64px_minmax(0,1fr)_344px]";
  const rightRailCollapsedColumns = immersiveWorkspace
    ? "lg:grid-cols-[minmax(0,1fr)_58px]"
    : "lg:grid-cols-[64px_minmax(0,1fr)_58px]";
  const noRightRailColumns = immersiveWorkspace
    ? "lg:grid-cols-[minmax(0,1fr)]"
    : "lg:grid-cols-[64px_minmax(0,1fr)]";

  return (
    <div
      className={`grid min-h-[calc(100vh-64px)] grid-cols-1 bg-[var(--ds-bg-900)] ${
        shouldRenderRightRail
          ? rightRailCollapsed
            ? rightRailCollapsedColumns
            : rightRailExpandedColumns
          : noRightRailColumns
      }`}
    >
      {shouldRenderLeftRail ? (
        <aside className="hidden border-r border-white/6 bg-[var(--ds-bg-950)] px-2 py-4 lg:block">
          {leftSidebar}
        </aside>
      ) : null}

      <main className="min-w-0 overflow-y-auto bg-[var(--ds-bg-900)]">
        {mainContent}
      </main>

      {shouldRenderRightRail ? (
        <motion.aside
          layout
          className="relative hidden border-l border-white/10 bg-[var(--ds-bg-950)] lg:block"
          aria-label="Panel lateral de actividad"
        >
          <button
            type="button"
            onClick={toggleRightRail}
            className="absolute -left-4 top-8 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-[#101722] text-white/70 shadow-[0_0_18px_rgba(0,0,0,0.35)] transition hover:border-[#58e0ff]/60 hover:text-[#58e0ff]"
            title={rightRailCollapsed ? "Expandir actividad" : "Colapsar actividad"}
            aria-label={rightRailCollapsed ? "Expandir actividad" : "Colapsar actividad"}
          >
            {rightRailCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {rightRailCollapsed ? <CollapsedActivityRail /> : rightSidebar}
        </motion.aside>
      ) : null}
    </div>
  );
}
