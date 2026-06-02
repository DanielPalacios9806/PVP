import { ModerationPanel } from "@/components/moderation-panel";
import { RoleGate } from "@/components/role-gate";

export default function ModerationPage() {
  return (
    <div className="page-section space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#081323]/90 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.42)] lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(255,43,91,0.18),transparent_34%),radial-gradient(circle_at_82%_0%,rgba(24,230,242,0.14),transparent_30%)]" />
        <div className="relative z-10 max-w-4xl">
          <p className="page-kicker">Moderacion / War room</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.07em] text-white sm:text-5xl">Revision de disputas e incidencias</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/64 sm:text-base">
            Supervisa reportes, evidencia, resultados pendientes y resoluciones para mantener integridad competitiva sin mezclar herramientas de staff con la experiencia del jugador.
          </p>
        </div>
      </section>
      <RoleGate allowedRoles={["ADMIN", "SUPER_ADMIN", "MODERATOR"]} title="Moderacion">
        <ModerationPanel />
      </RoleGate>
    </div>
  );
}
