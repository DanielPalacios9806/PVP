import { LayoutShell } from "@/components/layout-shell";
import { brand } from "@/lib/brand";

export default function PrivacyPage() {
  return (
    <LayoutShell title="Política de Privacidad">
      <article className="mx-auto max-w-4xl space-y-6 rounded-[30px] border border-white/10 bg-white/[0.04] p-6 text-sm leading-7 text-white/72 md:p-8">
        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Introducción
          </h2>
          <p>
            {brand.name} valora tu privacidad y se compromete a proteger tus datos personales 
            de acuerdo con GDPR y CCPA. Esta política explica qué datos recopilamos, cómo los usamos 
            y tus derechos al usar nuestra plataforma.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Datos que Recopilamos
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-white/90">Al Registrarte Directamente</h3>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>Email y contraseña (hasheada)</li>
                <li>Nombre visible (displayName)</li>
                <li>Nombre de usuario (username)</li>
                <li>Dirección IP y timestamp de registro</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white/90">Si Usas Google OAuth</h3>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>Email verificado de Google (requerido)</li>
                <li>Nombre visible de Google (si disponible)</li>
                <li>Avatar de Google (si disponible)</li>
                <li>ID único de Google (no tu contraseña)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white/90">Si Usas Facebook OAuth</h3>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>Email verificado de Facebook (requerido)</li>
                <li>Nombre visible de Facebook (si disponible)</li>
                <li>Foto de perfil de Facebook (si disponible)</li>
                <li>ID único de Facebook (no tu contraseña)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white/90">Durante el Uso de la Plataforma</h3>
              <ul className="ml-6 mt-2 list-disc space-y-1">
                <li>Participación en torneos y equipos</li>
                <li>Resultados de partidas</li>
                <li>Disputas abiertas</li>
                <li>Tokens ganados o revocados</li>
                <li>Logs de auditoría (acciones críticas)</li>
                <li>Dirección IP de acceso</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Cómo Usamos Tus Datos
          </h2>
          <ul className="ml-6 list-disc space-y-2">
            <li><strong>Autenticación</strong>: Crear y proteger tu cuenta.</li>
            <li><strong>Operación de Torneos</strong>: Organizar, registrarte y ejecutar torneos.</li>
            <li><strong>Comunicación</strong>: Enviar notificaciones sobre torneos, resultados y cambios de política.</li>
            <li><strong>Seguridad</strong>: Detectar fraude, cheating y actividad sospechosa.</li>
            <li><strong>Mejora de Servicio</strong>: Analizar uso sin revelar identidad personal.</li>
            <li><strong>Cumplimiento Legal</strong>: Responder a solicitudes legales o gubernamentales.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Seguridad OAuth
          </h2>
          <p className="mb-3">
            <strong>NO</strong> hacemos:
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Guardar o mostrar access tokens de Google o Facebook.</li>
            <li>Publicar en tu nombre en redes sociales.</li>
            <li>Solicitar permisos innecesarios más allá de email y perfil básico.</li>
            <li>Compartir tu ID de proveedor con terceros.</li>
          </ul>
          <p className="mt-3">
            <strong>SÍ</strong> hacemos:
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Validar tu email verificado del proveedor.</li>
            <li>Almacenar tu ID único de Google/Facebook vinculado a tu cuenta.</li>
            <li>Vincular múltiples proveedores a una sola cuenta si el email coincide.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Retención de Datos
          </h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-white/90">Datos Personales Activos</h3>
              <p>Mientras tu cuenta esté activa. Al solicitar eliminación, se anonimizarán en 30 días.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white/90">Logs de Auditoría</h3>
              <p>Se retienen indefinidamente con fines de compliance e integridad competitiva.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white/90">Resultados de Torneos</h3>
              <p>Se retienen indefinidamente para mantener la historia competitiva precisa.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white/90">Backups</h3>
              <p>Los backups automáticos se retienen 30 días. Una vez vence el período de eliminación, la copia de seguridad no contendrá tus datos.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Tus Derechos
          </h2>
          <p className="mb-3">Tienes derecho a:</p>
          <ul className="ml-6 list-disc space-y-2">
            <li><strong>Acceso</strong>: Solicitar copia de tus datos.</li>
            <li><strong>Corrección</strong>: Actualizar datos inexactos.</li>
            <li><strong>Eliminación</strong>: Solicitar borrado de datos personales (ver Política de Eliminación).</li>
            <li><strong>Portabilidad</strong>: Recibir tus datos en formato estructurado.</li>
            <li><strong>Objeción</strong>: Oponerte a usos específicos de tus datos.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Riot Games Disclaimer
          </h2>
          <p>
            Si vinculas tu cuenta de Riot a {brand.name}, no recopilamos ni almacenamos datos de Riot 
            sin tu consentimiento explícito. Los datos de Riot (si están disponibles) se usan solo para 
            validar cuentas de jugadores y operación de torneos. <strong>No usamos datos de Riot para 
            apuestas, gambling, ventajas competitivas injustas ni ningún propósito comercial no autorizado.</strong>
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Cambios a Esta Política
          </h2>
          <p>
            Nos reservamos el derecho de actualizar esta política. Los cambios significativos serán 
            comunicados a través de la plataforma. El uso continuado implica aceptación de cambios.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Contacto
          </h2>
          <p>
            Si tienes preguntas sobre tu privacidad o deseas ejercer tus derechos, contacta a: 
            <br />
            <strong>Email:</strong> admin@{brand.name}
            <br />
            <strong>También puedes:</strong> Usar la{" "}
            <a href="/legal/data-deletion" className="text-brand-cyan underline">
              Política de Eliminación de Datos
            </a>
            {" "}para solicitar borrado de tu cuenta.
          </p>
        </section>

        <section className="mt-8 border-t border-white/10 pt-6">
          <p className="text-xs text-white/50">
            Última actualización: Mayo 2026
          </p>
        </section>
      </article>
    </LayoutShell>
  );
}
