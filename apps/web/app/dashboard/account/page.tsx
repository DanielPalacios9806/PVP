import { AccountCenter } from "@/components/account-center";

export default function AccountPage() {
  return (
    <div className="page-section space-y-6">
      <section className="surface-panel">
        <div className="page-header">
          <div>
            <p className="page-kicker">Mi cuenta</p>
            <h1 className="page-title">Perfil, acceso y saldo interno</h1>
            <p className="page-copy mt-3">
              Revisa tu cuenta, cambia entre vistas del sistema y controla tu saldo de tokens internos.
            </p>
          </div>
        </div>
      </section>
      <AccountCenter />
    </div>
  );
}
