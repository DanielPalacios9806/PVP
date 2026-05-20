import Link from "next/link";
import { AuthForm } from "../../../components/auth-form";
import { LayoutShell } from "../../../components/layout-shell";

export default function RegisterPage() {
  return (
    <LayoutShell title="Crear cuenta">
      <div className="mx-auto w-full max-w-5xl">
        <AuthForm mode="register" />
        <p className="mt-4 text-center text-sm text-white/70">
          Ya tienes cuenta? <Link href="/auth/login" className="text-brand-cyan">Inicia sesion</Link>
        </p>
      </div>
    </LayoutShell>
  );
}
