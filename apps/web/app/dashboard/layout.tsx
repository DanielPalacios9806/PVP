import { NavbarTop } from "@/components/navbar-top";
import { DashboardGridWrapper } from "@/components/dashboard-grid-wrapper";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { ReactNode } from "react";

export const metadata = {
  title: "Dashboard | Arena OS",
  description: "Plataforma de torneos de eSports"
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--cm-bg)]">
      <NavbarTop />
      <DashboardGridWrapper
        leftSidebar={<SidebarLeft />}
        mainContent={<div className="flex flex-col">{children}</div>}
        rightSidebar={<SidebarRight />}
      />
    </div>
  );
}
