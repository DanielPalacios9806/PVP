"use client";

import { ReactNode, useEffect, useState } from "react";
import { apiUrl, getAuthHeaders } from "../lib/config";
import { clearSession, getStoredToken, getStoredUser, persistSession, subscribeSessionChange, type AppRole } from "../lib/session";
import { SectionCard } from "./section-card";

interface AuthProfile {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  role: AppRole;
  mustChangePassword?: boolean;
  wallets?: Array<{
    balance: number;
    currencyCode: string;
  }>;
}

export function RoleGate({
  allowedRoles,
  title,
  children
}: {
  allowedRoles: AppRole[];
  title: string;
  children: ReactNode;
}) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  async function syncRole() {
    const localUser = getStoredUser();
    setRole(localUser?.role ?? "USER");

    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/users/me`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        clearSession();
        setRole("USER");
        return;
      }

      const profile = (await response.json()) as AuthProfile | null;

      if (profile?.id && profile.role) {
        persistSession({
          user: {
            id: profile.id,
            email: profile.email,
            username: profile.username,
            displayName: profile.displayName,
            role: profile.role,
            mustChangePassword: profile.mustChangePassword
          },
          wallet: profile.wallets?.[0]
            ? {
                balance: profile.wallets[0].balance,
                currencyCode: profile.wallets[0].currencyCode
              }
            : undefined
        }, { notify: false });
        setRole(profile.role);
      }
    } catch {
      // Keep the local role as a fallback when the API is temporarily unavailable.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void syncRole();
    return subscribeSessionChange(() => {
      void syncRole();
    });
  }, []);

  if (loading) {
    return (
      <SectionCard title={title} description="Verificando permisos">
        <p className="text-sm leading-7 text-white/72">Validando tu sesion y permisos actuales...</p>
      </SectionCard>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <SectionCard title={title} description="Acceso restringido">
        <p className="text-sm leading-7 text-white/72">
          Esta seccion esta disponible solo para perfiles autorizados. Si tu rol fue actualizado recientemente, cierra sesion e ingresa nuevamente.
        </p>
      </SectionCard>
    );
  }

  return <>{children}</>;
}
