# Tournament Detail Mockup Fidelity

Esta fase corrige el detalle de torneo y la experiencia inmersiva de torneos para acercarse al mockup original.

## Decisiones UX

- Las páginas de torneos usan un workspace ancho sin el rail derecho global del dashboard.
- El detalle de torneo usa un hero cinematográfico con countdown, métricas principales y CTA visible.
- La información lateral ahora es contextual al torneo: inscripción, requisitos Riot, información, recompensas y organizador.
- Las acciones operativas quedan abajo del panel lateral y solo aparecen para roles autorizados.
- La tab pública `Automatización` se retira del set principal para evitar ruido; la operación avanzada vive en el panel admin/organizador.
- El hub de torneos reduce tabs a información útil para el jugador: descripción, torneos, equipos, reglas y brackets.

## Criterio de aceptación

- `/dashboard/tournaments/[id]` debe parecerse al mockup de tournament detail, sin columna derecha global.
- El panel derecho debe tener utilidad real y contexto del torneo, no actividad genérica.
- Los botones visibles deben llevar a inscripción, compartir, bracket, reglas o panel operativo según rol.
- `npm run build`, `npm run check:release` y Prisma validate deben pasar.
