import { ModerationPanel } from "../../../components/moderation-panel";
import { RoleGate } from "../../../components/role-gate";

export default function ModerationPage() {
  return (
    <div className="page-section space-y-6">
      <section className="surface-panel">
        <div className="page-header">
          <div>
            <p className="page-kicker">Moderacion</p>
            <h1 className="page-title">Revision de disputas e incidencias</h1>
            <p className="page-copy mt-3">
              Supervisa reportes, evidencia y resoluciones para mantener integridad y claridad competitiva.
            </p>
          </div>
        </div>
      </section>
      <RoleGate allowedRoles={["ADMIN", "SUPER_ADMIN", "MODERATOR"]} title="Moderacion">
        <ModerationPanel />
      </RoleGate>
    </div>
  );
}
