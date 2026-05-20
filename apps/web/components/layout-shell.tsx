import Link from "next/link";
import { ReactNode } from "react";
import { AppNav } from "./app-nav";

interface LayoutShellProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  isDashboard?: boolean;
}

/**
 * Layout Shell - For landing/auth pages (simple layout)
 * For dashboard, use app/dashboard/layout.tsx instead
 */
export function LayoutShell({
  title,
  children,
  actions,
  isDashboard = false
}: LayoutShellProps) {
  if (isDashboard) {
    // Dashboard layout - should use app/dashboard/layout.tsx instead
    return <>{children}</>;
  }

  return (
    <div className="panel-grid mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 md:px-6 md:py-8">
      <header className="glass-panel mb-10 flex flex-col gap-5 rounded-[4px] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7 border-l-4 border-l-accent-red/50">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex h-14 w-14 items-center justify-center rounded-[4px] border border-accent-red/30 bg-accent-red/10 text-sm font-semibold uppercase tracking-[0.18em] text-accent-red"
          >
            AO
          </Link>
          <div>
            <Link href="/" className="text-[11px] uppercase tracking-[0.35em] text-accent-cyan">
              Arena OS
            </Link>
            <h1 className="mt-2 text-3xl font-heading font-semibold uppercase tracking-[0.06em]">
              {title}
            </h1>
          </div>
        </div>
        <AppNav />
        {actions}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
