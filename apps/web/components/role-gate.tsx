"use client";

import { ReactNode, useEffect, useState } from "react";
import { getStoredUser, type AppRole } from "../lib/session";
import { SectionCard } from "./section-card";

export function RoleGate({
  allowedRoles,
  title,
  children
}: {
  allowedRoles: AppRole[];
  title: string;
  children: ReactNode;
}) {
  const [role, setRole] = useState<AppRole>("USER");

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role) {
      setRole(user.role);
    }
  }, []);

  if (!allowedRoles.includes(role)) {
    return (
      <SectionCard title={title} description="Acceso restringido">
        <p className="text-sm leading-7 text-white/72">
          Esta seccion esta disponible solo para perfiles administrativos o de moderacion.
        </p>
      </SectionCard>
    );
  }

  return <>{children}</>;
}
