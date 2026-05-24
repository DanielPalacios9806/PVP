import { NavbarTop } from "@/components/navbar-top";
import { DashboardGridWrapper } from "@/components/dashboard-grid-wrapper";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { ReactNode } from "react";

export const metadata = {
  title: "Dashboard | Darkside.cool",
  description: "Plataforma de torneos de eSports"
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--ds-bg-950)]">
      <NavbarTop />
      <DashboardGridWrapper
        leftSidebar={<SidebarLeft />}
        mainContent={<div className="flex flex-col pb-20 lg:pb-0">{children}</div>}
        rightSidebar={<SidebarRight />}
      />
      <MobileBottomNav />
    </div>
  );
}
