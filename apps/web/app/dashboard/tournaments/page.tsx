import { TournamentsHub } from "@/components/tournaments-hub";

export default async function TournamentsPage({
  searchParams
}: {
  searchParams: Promise<{ game?: string; q?: string }>;
}) {
  const params = await searchParams;

  return <TournamentsHub game={params.game} initialQuery={params.q ?? ""} />;
}
