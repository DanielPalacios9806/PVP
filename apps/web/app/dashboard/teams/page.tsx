import { ResourcePanel } from "@/components/resource-panel";

export default function TeamsPage() {
  return (
    <div className="page-section space-y-6">
      <section className="surface-panel">
        <div className="page-header">
          <div>
            <p className="page-kicker">Equipos</p>
            <h1 className="page-title">Rosters, capitanes y actividad competitiva</h1>
            <p className="page-copy mt-3">
              Consulta equipos, revisa su estado dentro de la plataforma y gestiona la experiencia segun el tipo de acceso.
            </p>
          </div>
        </div>
      </section>
      <ResourcePanel kind="teams" />
    </div>
  );
}
