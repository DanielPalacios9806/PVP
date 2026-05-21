import Link from "next/link";
import { ReactNode } from "react";

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
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 md:px-6 md:py-8">
      <header className="mb-10 flex flex-col gap-5 rounded-[10px] border border-white/8 bg-[#070b12]/86 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex h-12 w-12 items-center justify-center rounded-[6px] bg-[#ff2f43] text-lg font-semibold uppercase text-white"
          >
            P
          </Link>
          <div>
            <Link href="/" className="text-[11px] uppercase tracking-[0.35em] text-[#43d3ff]">
              PVP.GG
            </Link>
            <h1 className="mt-2 text-3xl font-heading font-semibold uppercase tracking-[0.06em]">
              {title}
            </h1>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white/72">
          <Link href="/" className="rounded-[8px] border border-white/10 px-4 py-2 hover:text-white">
            Inicio
          </Link>
          <Link href="/dashboard/tournaments" className="rounded-[8px] border border-white/10 px-4 py-2 hover:text-white">
            Torneos
          </Link>
          <Link href="/auth/login" className="rounded-[8px] border border-[#43d3ff]/40 px-4 py-2 text-[#43d3ff]">
            Login
          </Link>
          <Link href="/auth/register" className="rounded-[8px] bg-[#ff2f43] px-4 py-2 text-white">
            Registro
          </Link>
        </nav>
        {actions}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
