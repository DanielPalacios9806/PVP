import { TokenCenter } from "@/components/token-center";

export default function TokensPage() {
  return (
    <div className="page-section space-y-6">
      <section className="surface-panel">
        <div className="page-header">
          <div>
            <p className="page-kicker">Economia interna</p>
            <h1 className="page-title">Tokens para la experiencia del jugador</h1>
            <p className="page-copy mt-3">
              Cada cuenta registrada inicia con saldo interno. Aqui puedes visualizar recargas y el estado de tu cuenta.
            </p>
          </div>
        </div>
      </section>
      <TokenCenter />
    </div>
  );
}
