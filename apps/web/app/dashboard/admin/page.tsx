import { AdminAuditPanel } from "../../../components/admin-audit-panel";
import { AdminTokenPanel } from "../../../components/admin-token-panel";
import { RoleGate } from "../../../components/role-gate";
import { TournamentOpsPanel } from "../../../components/tournament-ops-panel";

export default function AdminPage() {
  return (
    <div className="page-section space-y-6">
      <section className="surface-panel">
        <div className="page-header">
          <div>
            <p className="page-kicker">Administracion</p>
            <h1 className="page-title">Control operativo de torneos y economia interna</h1>
            <p className="page-copy mt-3">
              Desde aqui se crean torneos, se revisan acciones criticas y se supervisa la experiencia interna de la plataforma.
            </p>
          </div>
        </div>
      </section>
      <RoleGate allowedRoles={["ADMIN", "MODERATOR"]} title="Administracion">
        <div className="space-y-6">
          <TournamentOpsPanel />
          <AdminTokenPanel />
          <AdminAuditPanel />
        </div>
      </RoleGate>
    </div>
  );
}
