import { LayoutShell } from "../../../../components/layout-shell";
import { MatchRoom } from "../../../../components/match-room";

export default async function MatchDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <LayoutShell title="Sala de partida">
      <MatchRoom matchId={id} />
    </LayoutShell>
  );
}
