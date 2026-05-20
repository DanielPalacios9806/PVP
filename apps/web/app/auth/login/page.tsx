import Link from "next/link";
import { AuthForm } from "../../../components/auth-form";
import { LayoutShell } from "../../../components/layout-shell";

export default function LoginPage() {
  return (
    <LayoutShell title="Iniciar sesion">
      <div className="mx-auto w-full max-w-5xl">
        <AuthForm mode="login" />
        <p className="mt-4 text-center text-sm text-white/70">
          No tienes cuenta? <Link href="/auth/register" className="text-brand-cyan">Registrate</Link>
        </p>
      </div>
    </LayoutShell>
  );
}
