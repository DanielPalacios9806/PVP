import { AdminAuditPanel } from "@/components/admin-audit-panel";
import { AdminOpsCommandCenter } from "@/components/admin-ops-command-center";
import { AdminQuickAccess } from "@/components/admin-quick-access";
import { AdminRiotPanel } from "@/components/admin-riot-panel";
import { AdminTokenPanel } from "@/components/admin-token-panel";
import { AdminToornamentPanel } from "@/components/admin-toornament-panel";
import { RoleGate } from "@/components/role-gate";
import { TournamentOpsPanel } from "@/components/tournament-ops-panel";

export default function AdminPage() {
  return (
    <div className="page-section space-y-6">
      <AdminOpsCommandCenter />

      <RoleGate allowedRoles={["ADMIN", "SUPER_ADMIN"]} title="Administracion">
        <div className="space-y-6">
          <AdminQuickAccess />
          <div id="riot-api" className="scroll-mt-28">
            <AdminRiotPanel />
          </div>
          <div id="toornament-bridge" className="scroll-mt-28">
            <AdminToornamentPanel />
          </div>
          <div id="operacion-torneos" className="scroll-mt-28">
            <TournamentOpsPanel />
          </div>
          <div id="tokens-internos" className="scroll-mt-28">
            <AdminTokenPanel />
          </div>
          <div id="auditoria-operativa" className="scroll-mt-28">
            <AdminAuditPanel />
          </div>
        </div>
      </RoleGate>
    </div>
  );
}
