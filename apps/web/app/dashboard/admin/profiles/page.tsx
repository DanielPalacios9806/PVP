import { AdminUserActivityPanel } from "@/components/admin-user-activity-panel";
import { AdminUsersPanel } from "@/components/admin-users-panel";
import { RoleGate } from "@/components/role-gate";

export default function AdminProfilesPage() {
  return (
    <div className="page-section space-y-6">
      <section className="surface-panel">
        <div className="page-header">
          <div>
            <p className="page-kicker">Super administracion</p>
            <h1 className="page-title">Centro de perfiles</h1>
            <p className="page-copy mt-3">
              Administra cuentas internas, roles operativos y estados de acceso sin mezclarlo con la experiencia del jugador.
            </p>
          </div>
        </div>
      </section>

      <RoleGate allowedRoles={["SUPER_ADMIN"]} title="Centro de perfiles">
        <div className="space-y-6">
          <AdminUsersPanel />
          <AdminUserActivityPanel />
        </div>
      </RoleGate>
    </div>
  );
}
