import { ReactNode } from "react";

interface DashboardGridWrapperProps {
  leftSidebar: ReactNode;
  mainContent: ReactNode;
  rightSidebar?: ReactNode;
  showRightSidebar?: boolean;
}

export function DashboardGridWrapper({
  leftSidebar,
  mainContent,
  rightSidebar,
  showRightSidebar = true
}: DashboardGridWrapperProps) {
  return (
    <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 bg-[#161d28] lg:grid-cols-[64px_minmax(0,1fr)_264px]">
      <aside className="hidden border-r border-white/6 bg-[#131924] px-2 py-4 lg:block">
        {leftSidebar}
      </aside>

      <main className="min-w-0 overflow-y-auto bg-[#161d28]">
        {mainContent}
      </main>

      {showRightSidebar && rightSidebar ? (
        <aside className="hidden border-l border-white/6 bg-[#131924] lg:block">
          {rightSidebar}
        </aside>
      ) : null}
    </div>
  );
}
