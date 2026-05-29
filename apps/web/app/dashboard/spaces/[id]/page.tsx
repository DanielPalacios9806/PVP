import { LayoutShell } from "@/components/layout-shell";
import { SpaceDetail } from "@/components/space-detail";

export default async function SpaceDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <LayoutShell title="Detalle de la comunidad">
      <SpaceDetail spaceId={id} />
    </LayoutShell>
  );
}
