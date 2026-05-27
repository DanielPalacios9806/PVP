import { LayoutShell } from "@/components/layout-shell";
import { brand } from "@/lib/brand";

export default function DataDeletionPage() {
  return (
    <LayoutShell title="Eliminación de datos">
      <article className="mx-auto max-w-4xl space-y-6 rounded-[30px] border border-white/10 bg-white/[0.04] p-6 text-sm leading-7 text-white/72 md:p-8">
        <p>
          Para solicitar eliminación de datos de {brand.name}, envía una solicitud desde el
          correo asociado a tu cuenta indicando tu usuario, correo y proveedor conectado si
          aplica.
        </p>
        <p>
          Si tu cuenta fue creada con Google o Facebook, eliminaremos la vinculación social,
          los datos básicos del proveedor y la información personal asociada, salvo registros
          mínimos que deban conservarse temporalmente por auditoría de torneos o seguridad.
        </p>
        <p>
          También puedes revocar el acceso desde la configuración de seguridad de Google o
          Facebook. Esa revocación no elimina automáticamente tu perfil competitivo interno,
          por lo que debes solicitar la eliminación dentro de la plataforma si deseas cerrar
          la cuenta.
        </p>
        <p>
          Contacto operativo: usa el correo administrativo configurado para Darkside.cool o el
          canal oficial que se publique en la plataforma.
        </p>
      </article>
    </LayoutShell>
  );
}
