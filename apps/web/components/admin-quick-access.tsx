"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser, type AppRole } from "@/lib/session";

export function AdminQuickAccess() {
  const [role, setRole] = useState<AppRole>("USER");

  useEffect(() => {
    setRole(getStoredUser()?.role ?? "USER");
  }, []);

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {role === "SUPER_ADMIN" ? (
        <Link href="/dashboard/admin/profiles" className="surface-tile p-5 transition hover:border-brand-cyan/35">
          <p className="page-kicker">Super admin</p>
          <h2 className="mt-3 text-xl font-semibold">Perfiles internos</h2>
          <p className="mt-3 text-sm leading-6 text-white/68">
            Busca usuarios, crea cuentas operativas y asigna roles desde una vista dedicada.
          </p>
        </Link>
      ) : null}
      <a href="#riot-api" className="surface-tile p-5 transition hover:border-brand-cyan/35">
        <p className="page-kicker">Integracion</p>
        <h2 className="mt-3 text-xl font-semibold">Riot API</h2>
        <p className="mt-3 text-sm leading-6 text-white/68">
          Revisa modo, region, llamadas, errores y prueba conexiones server-side.
        </p>
      </a>
      <a href="#operacion-torneos" className="surface-tile p-5 transition hover:border-brand-cyan/35">
        <p className="page-kicker">Operacion</p>
        <h2 className="mt-3 text-xl font-semibold">Torneos y auditoria</h2>
        <p className="mt-3 text-sm leading-6 text-white/68">
          Gestiona brackets, tokens internos y eventos criticos de plataforma.
        </p>
      </a>
    </section>
  );
}
