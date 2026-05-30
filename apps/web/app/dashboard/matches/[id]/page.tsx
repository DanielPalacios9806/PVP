import { MatchRoom } from "@/components/match-room";

export default async function MatchDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="page-section">
      <MatchRoom matchId={id} />
    </div>
  );
}
