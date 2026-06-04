"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "../lib/config";
import { persistSession } from "../lib/session";
import { brand } from "@/lib/brand";
import { OAuthButtons } from "./oauth-buttons";

type Mode = "login" | "register";
type MessageType = "info" | "success" | "error";

type ApiErrorResponse = {
  message?: string;
  issues?: {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
};

function getApiErrorMessage(data: ApiErrorResponse) {
  const fieldErrors = data.issues?.fieldErrors;
  const firstFieldError = fieldErrors ? Object.values(fieldErrors).flat().find(Boolean) : undefined;
  const firstFormError = data.issues?.formErrors?.find(Boolean);

  return firstFieldError ?? firstFormError ?? data.message ?? "No se pudo completar la solicitud.";
}

function isLikelyRealEmail(value: string) {
  const normalized = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(normalized)) return false;

  const domain = normalized.split("@")[1]?.toLowerCase() ?? "";
  if (!domain || domain.endsWith(".local") || domain.endsWith(".test") || domain.endsWith(".invalid")) return false;

  return true;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("info");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error === "oauth_failed") {
      setMessageType("error");
      setMessage("No se pudo completar el acceso social. Revisa la configuracion o intenta con correo.");
    }
  }, []);

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);
    setMessage("");
    setMessageType("info");

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

    if (mode === "register") {
      if (!isLikelyRealEmail(email)) {
        setMessageType("error");
        setMessage("Ingresa un correo valido con dominio real. Los usuarios antiguos no se modifican.");
        setIsSubmitting(false);
        return;
      }

      if (password !== passwordConfirm) {
        setMessageType("error");
        setMessage("Las contrasenas no coinciden. Revisa la confirmacion antes de crear la cuenta.");
        setIsSubmitting(false);
        return;
      }
    }

    const payload =
      mode === "register"
        ? {
            email,
            username: String(formData.get("username") ?? "").trim(),
            displayName: String(formData.get("displayName") ?? "").trim(),
            password,
            passwordConfirm
          }
        : {
            email,
            password
          };

    try {
      const response = await fetch(`${apiUrl}/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessageType("error");
        setMessage(getApiErrorMessage(data));
        return;
      }

      if (data.token && data.user) {
        persistSession({
          token: data.token,
          user: data.user,
          wallet: data.wallet ?? {
            balance: 100,
            currencyCode: "TOKENS"
          }
        });

        setMessageType("success");
        setMessage(
          mode === "register"
            ? "Cuenta creada correctamente. Redirigiendo al panel..."
            : "Sesion iniciada correctamente. Redirigiendo..."
        );

        window.setTimeout(() => {
          router.push("/dashboard");
        }, mode === "register" ? 900 : 500);
        return;
      }

      setMessageType("error");
      setMessage("El servidor respondio sin una sesion valida. Intenta iniciar sesion manualmente.");
    } catch {
      setMessageType("error");
      setMessage("No se pudo conectar con el servidor. Verifica que la API este encendida.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const messageClass =
    messageType === "success"
      ? "text-emerald-300"
      : messageType === "error"
        ? "text-red-300"
        : "text-brand-cyan";

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="glass-panel relative order-2 overflow-hidden rounded-[30px] p-5 sm:p-6 lg:order-1">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(47,107,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,79,99,0.14),transparent_30%)]" />
        <div className="relative space-y-5">
          <p className="eyebrow">{mode === "register" ? "Alta de jugador" : `Acceso a ${brand.name}`}</p>
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

      <form action={onSubmit} className="glass-panel order-1 space-y-4 rounded-[30px] p-5 sm:p-6 lg:order-2">
        <div className="mb-2">
          <p className="eyebrow">{mode === "register" ? `Unete a ${brand.name}` : "Inicio seguro"}</p>
          <h3 className="mt-2 text-2xl font-semibold uppercase">
            {mode === "register" ? "Registro de jugador" : "Inicio de sesion"}
          </h3>
        </div>
        <OAuthButtons />
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-white/40">
          <span className="h-px flex-1 bg-white/10" />
          O usa correo
          <span className="h-px flex-1 bg-white/10" />
        </div>
        {mode === "register" ? (
          <>
            <input name="displayName" placeholder="Nombre visible" required />
            <input
              name="username"
              placeholder="Usuario"
              required
              minLength={3}
              maxLength={24}
              pattern="[a-zA-Z0-9._-]+"
              title="Usa solo letras, numeros, punto, guion o guion bajo."
            />
          </>
        ) : null}
        <input
          name="email"
          type={mode === "login" ? "text" : "email"}
          inputMode="email"
          autoComplete={mode === "register" ? "email" : "username"}
          placeholder={mode === "register" ? "Correo real" : "Correo o usuario"}
          required
        />
        <p className="-mt-2 text-xs leading-5 text-white/42">
          {mode === "register"
            ? "Para beta, los registros nuevos deben usar un correo con formato real. Las cuentas de prueba existentes no se modifican."
            : "Puedes iniciar con correo o usuario. El acceso por nickname se mantiene como evolucion no destructiva."}
        </p>
        <input
          name="password"
          type="password"
          placeholder="Contrasena"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          required
          minLength={8}
          title="Debe tener minimo 8 caracteres, una mayuscula, una minuscula, un numero y un caracter especial."
        />
        {mode === "register" ? (
          <input
            name="passwordConfirm"
            type="password"
            placeholder="Confirmar contrasena"
            autoComplete="new-password"
            required
            minLength={8}
            title="Repite la misma contrasena para evitar errores de escritura."
          />
        ) : null}
        <button className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "register"
              ? "Creando cuenta..."
              : "Ingresando..."
            : mode === "register"
              ? "Crear cuenta"
              : "Iniciar sesion"}
        </button>
        {message ? <p className={`text-sm ${messageClass}`}>{message}</p> : null}
      </form>
    </div>
  );
}
