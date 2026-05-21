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
    <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 bg-[var(--ds-bg-900)] lg:grid-cols-[64px_minmax(0,1fr)_284px]">
      <aside className="hidden border-r border-white/6 bg-[var(--ds-bg-950)] px-2 py-4 lg:block">
        {leftSidebar}
      </aside>

      <main className="min-w-0 overflow-y-auto bg-[var(--ds-bg-900)]">
        {mainContent}
      </main>

      {showRightSidebar && rightSidebar ? (
        <aside className="hidden border-l border-white/6 bg-[var(--ds-bg-950)] lg:block">
          {rightSidebar}
        </aside>
      ) : null}
    </div>
  );
}
