import { LayoutShell } from "@/components/layout-shell";
import { TeamDetail } from "@/components/team-detail";

export default async function TeamDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <LayoutShell title="Detalle del equipo">
      <TeamDetail teamId={id} />
    </LayoutShell>
  );
}
