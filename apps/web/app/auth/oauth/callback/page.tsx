"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { persistSession, type StoredUser, type StoredWallet } from "@/lib/session";

type OAuthPayload = {
  token: string;
  user: StoredUser;
  wallet: StoredWallet;
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Validando acceso social...");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const payload = hash.get("payload");

    if (!payload) {
      setMessage("No recibimos una sesion valida del proveedor.");
      return;
    }

    try {
      const decoded = JSON.parse(decodeBase64Url(payload)) as OAuthPayload;

      if (!decoded.token || !decoded.user) {
        setMessage("La respuesta de acceso social no contiene una sesion valida.");
        return;
      }

      persistSession(decoded);
      window.history.replaceState(null, "", "/auth/oauth/callback");
      router.replace("/dashboard");
    } catch {
      setMessage("No pudimos completar el acceso social. Intenta iniciar sesion nuevamente.");
    }
  }, [router]);

  return (
    <LayoutShell title="Acceso social">
      <div className="mx-auto max-w-xl rounded-[30px] border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="eyebrow">OAuth seguro</p>
        <h1 className="mt-3 text-3xl font-semibold uppercase">Conectando tu cuenta</h1>
        <p className="mt-4 text-sm leading-7 text-white/70">{message}</p>
        <Link href="/auth/login" className="btn-secondary mt-6 inline-flex">
          Volver a login
        </Link>
      </div>
    </LayoutShell>
  );
}
