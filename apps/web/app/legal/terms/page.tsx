import { LayoutShell } from "@/components/layout-shell";
import { brand } from "@/lib/brand";

export default function TermsPage() {
  return (
    <LayoutShell title="Términos del servicio">
      <article className="mx-auto max-w-4xl space-y-6 rounded-[30px] border border-white/10 bg-white/[0.04] p-6 text-sm leading-7 text-white/72 md:p-8">
        <p>
          Al usar {brand.name}, aceptas participar en torneos universitarios y comunidades
          competitivas bajo reglas claras, respeto entre jugadores y trazabilidad de resultados.
        </p>
        <p>
          La plataforma no permite apuestas, cash wagering, gambling, blockchain, cripto,
          skins betting ni tokens convertibles a dinero real.
        </p>
        <p>
          Los tokens internos, XP, badges o beneficios visuales son recompensas no monetarias.
          Cualquier premio futuro de torneo deberá pasar por aprobación manual, auditoría y
          cumplimiento legal aplicable.
        </p>
        <p>
          Los organizadores y administradores pueden revisar inscripciones, resultados,
          evidencias y disputas para mantener la integridad competitiva.
        </p>
      </article>
    </LayoutShell>
  );
}
