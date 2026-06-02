import { AccountCenter } from "@/components/account-center";

export default function AccountPage() {
  return (
    <div className="page-section space-y-6">
      <section className="surface-panel overflow-hidden p-0">
        <div className="relative isolate rounded-[inherit] border border-white/10 bg-[radial-gradient(circle_at_12%_0%,rgba(24,230,242,0.16),transparent_34%),linear-gradient(135deg,rgba(12,18,34,0.98),rgba(7,10,24,0.96))] p-5 sm:p-6 lg:p-8">
          <div className="absolute -right-20 top-0 h-48 w-48 rounded-full bg-brand-red/10 blur-3xl" />
          <div className="relative max-w-4xl">
            <p className="page-kicker">Mi cuenta</p>
            <h1 className="page-title mt-3">Perfil competitivo, Riot ID y seguridad</h1>
            <p className="page-copy mt-3 max-w-3xl">
              Centraliza tu identidad de jugador, el estado de Riot, tus accesos competitivos, tokens internos y controles de sesion sin exponer claves privadas en el frontend.
            </p>
          </div>
        </div>
      </section>
      <AccountCenter />
    </div>
  );
}
