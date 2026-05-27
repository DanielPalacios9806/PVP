import { AdminAuditPanel } from "../../../components/admin-audit-panel";
import { AdminQuickAccess } from "../../../components/admin-quick-access";
import { AdminRiotPanel } from "../../../components/admin-riot-panel";
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
            <h1 className="page-title">Panel interno de administracion</h1>
            <p className="page-copy mt-3">
              Este espacio esta separado del dashboard de jugador. Solo perfiles administrativos pueden crear torneos, revisar auditoria y operar configuraciones internas.
            </p>
          </div>
        </div>
      </section>
      <RoleGate allowedRoles={["ADMIN", "SUPER_ADMIN"]} title="Administracion">
        <div className="space-y-6">
          <AdminQuickAccess />
          <div id="riot-api">
            <AdminRiotPanel />
          </div>
          <div id="operacion-torneos">
            <TournamentOpsPanel />
          </div>
          <AdminTokenPanel />
          <AdminAuditPanel />
        </div>
      </RoleGate>
    </div>
  );
}
