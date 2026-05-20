import { LayoutShell } from "../../../../components/layout-shell";
import { TournamentDetail } from "../../../../components/tournament-detail";

export default async function TournamentDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <LayoutShell title="Detalle del torneo">
      <TournamentDetail tournamentId={id} />
    </LayoutShell>
  );
}
