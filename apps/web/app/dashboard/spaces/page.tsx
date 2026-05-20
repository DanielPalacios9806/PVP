import { ResourcePanel } from "../../../components/resource-panel";

export default function SpacesPage() {
  return (
    <div className="page-section space-y-6">
      <section className="surface-panel">
        <div className="page-header">
          <div>
            <p className="page-kicker">Espacios</p>
            <h1 className="page-title">Comunidades, hubs y temporadas activas</h1>
            <p className="page-copy mt-3">
              Reune comunidades, organiza ligas recurrentes y conecta jugadores con torneos y formatos competitivos.
            </p>
          </div>
        </div>
      </section>
      <ResourcePanel kind="spaces" />
    </div>
  );
}
