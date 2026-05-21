"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "../lib/config";
import { persistSession } from "../lib/session";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");

  async function onSubmit(formData: FormData) {
    const payload =
      mode === "register"
        ? {
            email: String(formData.get("email")),
            username: String(formData.get("username")),
            displayName: String(formData.get("displayName")),
            password: String(formData.get("password"))
          }
        : {
            email: String(formData.get("email")),
            password: String(formData.get("password"))
          };

    const response = await fetch(`${apiUrl}/auth/${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message ?? "No se pudo completar la solicitud.");
      return;
    }

    if (data.token) {
      persistSession({
        token: data.token,
        user: data.user,
        wallet: data.wallet ?? {
          balance: 100,
          currencyCode: "TOKENS"
        }
      });
      setToken(data.token);
      setMessage("Sesion iniciada correctamente.");
      router.push("/dashboard");
      return;
    }

    persistSession({
      user: {
        email: payload.email,
        username: mode === "register" ? payload.username : undefined,
        displayName: mode === "register" ? payload.displayName : undefined,
        role: "USER",
        id: "local-user"
      },
      wallet: {
        balance: 100,
        currencyCode: "TOKENS"
      }
    });
    setMessage("Cuenta creada correctamente. Ya puedes iniciar sesion.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="glass-panel relative overflow-hidden rounded-[30px] p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(47,107,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,79,99,0.14),transparent_30%)]" />
        <div className="relative space-y-5">
          <p className="eyebrow">{mode === "register" ? "Alta de jugador" : "Acceso a plataforma"}</p>
          <h2 className="text-3xl font-semibold uppercase leading-none">
            {mode === "register" ? "Crea tu identidad competitiva." : "Vuelve al circuito."}
          </h2>
          <p className="text-sm leading-7 text-white/72">
            {mode === "register"
              ? "Tu perfil, tus equipos, tus torneos y tu saldo inicial de tokens empiezan aqui."
              : "Accede a tu panel para participar, revisar partidas y consultar tu cuenta."}
          </p>
          <div className="grid gap-3">
            {[
              "Sin apuestas ni juego por dinero.",
              "Roles, auditoria y operacion competitiva.",
              "Base preparada para League of Legends, VALORANT y mas."
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/78">
                {item}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <form action={onSubmit} className="glass-panel space-y-4 rounded-[30px] p-6">
        <div className="mb-2">
          <p className="eyebrow">{mode === "register" ? "Unete a Arena OS" : "Inicio seguro"}</p>
          <h3 className="mt-2 text-2xl font-semibold uppercase">
            {mode === "register" ? "Registro de jugador" : "Inicio de sesion"}
          </h3>
        </div>
        {mode === "register" ? (
          <>
            <input name="displayName" placeholder="Nombre visible" required />
            <input name="username" placeholder="Usuario" required />
          </>
        ) : null}
        <input name="email" type="email" placeholder="Correo" required />
        <input name="password" type="password" placeholder="Contrasena" required />
        <button className="btn-primary w-full">
          {mode === "register" ? "Crear cuenta" : "Iniciar sesion"}
        </button>
        {message ? <p className="text-sm text-brand-cyan">{message}</p> : null}
        {token ? (
          <p className="break-all text-xs text-white/60">
            Tu acceso quedo guardado localmente para esta revision visual.
          </p>
        ) : null}
      </form>
    </div>
  );
}
