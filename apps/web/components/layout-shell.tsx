import Link from "next/link";
import { ReactNode } from "react";
import Image from "next/image";
import { brand } from "@/lib/brand";

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
      <header className="mb-6 flex flex-col gap-4 rounded-[10px] border border-white/8 bg-[#070b12]/86 px-4 py-4 md:mb-10 md:flex-row md:items-center md:justify-between md:px-7 md:py-5">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="hidden lg:inline-flex flex h-12 w-12 items-center justify-center rounded-[6px] border border-[var(--ds-border-red)] bg-black/30"
          >
            <Image src={brand.logoMark} alt={brand.name} width={30} height={30} />
          </Link>
          <div>
            <Link href="/" className="text-[11px] uppercase tracking-[0.35em] text-[#43d3ff]">
              {brand.name}
            </Link>
            <h1 className="mt-2 text-3xl font-heading font-semibold uppercase tracking-[0.06em]">
              {title}
            </h1>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white/72">
          <Link href="/" className="hidden rounded-[8px] border border-white/10 px-4 py-2 hover:text-white sm:inline-flex">
            Inicio
          </Link>
          <Link href="/dashboard/tournaments" className="hidden lg:inline-flex rounded-[8px] border border-white/10 px-4 py-2 hover:text-white">
            Torneos
          </Link>
          <Link href="/auth/login" className="rounded-[8px] border border-[#43d3ff]/40 px-3 py-2 text-[#43d3ff] sm:px-3 sm:px-4">
            Login
          </Link>
          <Link href="/auth/register" className="rounded-[8px] bg-[#ff2f43] px-3 py-2 text-white sm:px-3 sm:px-4">
            Registro
          </Link>
        </nav>
        {actions}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
