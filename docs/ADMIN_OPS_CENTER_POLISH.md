# Admin / Ops Center Polish

## Objetivo
La macrofase 2X-M convierte `/dashboard/admin` y `/dashboard/moderation` en un centro operativo más claro para pre-beta: Riot development, torneos, auditoría, tokens internos y moderación quedan separados por rol y por propósito.

## Alcance
- `AdminOpsCommandCenter` como hero operativo y mapa de capacidades.
- `AdminQuickAccess` con rutas por rol hacia Riot, torneos, tokens, auditoría, moderación y perfiles internos.
- `AdminTokenPanel` tratado como ledger interno no monetario.
- `/dashboard/moderation` presentado como war room de integridad competitiva.
- Checks de release para evitar que el área admin vuelva a quedar como paneles sueltos.

## Criterios UX
- Usuario normal no debe confundirse con herramientas admin.
- Admin/Super admin ve Riot, operaciones, tokens y auditoría.
- Moderador ve disputas e integridad competitiva.
- La Riot API key permanece solo en backend; la UI nunca la imprime.
- Tokens internos se comunican como no monetarios y no equivalentes a apuestas.

## Pendiente futuro
- Métricas reales en vivo de salud API/Render.
- Filtros avanzados de auditoría por rango de fechas.
- Dashboard de roles con permisos granulares.
- Centro de acciones batch para torneos y usuarios.
