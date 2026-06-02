# Beta Launch Checklist

## Objetivo

Este documento centraliza el cierre de la beta controlada de Darkside.cool / Arena OS antes de compartir la plataforma con usuarios de prueba o preparar una solicitud formal ante Riot.

## Estado esperado antes de invitar testers

- Web staging activa.
- API staging activa.
- Base de datos Supabase disponible.
- `npm run build` aprobado.
- `npm run check:release` aprobado.
- `npm run check:riot` aprobado.
- `npm run check:riotapp` aprobado.
- `npm run check:prodhealth` aprobado.
- `npm run check:visual` ejecutado después del último deploy.
- `npm run check:beta` aprobado.
- No hay secretos en GitHub.
- `RIOT_API_KEY` se mantiene solo en backend/API.
- No existe `NEXT_PUBLIC_RIOT_API_KEY`.
- Legal pages activas: Terms, Privacy, Data Deletion.
- Smoke remoto aprobado con Web/API reales.

## URLs de referencia

| Servicio | URL |
|---|---|
| Web staging | https://arena-os-web-staging-6x5f.onrender.com |
| API staging | https://arena-os-api-staging.onrender.com/api |
| Terms | /legal/terms |
| Privacy | /legal/privacy |
| Data deletion | /legal/data-deletion |

## Flujo mínimo de validación manual

1. Abrir Home.
2. Crear cuenta o iniciar sesión.
3. Revisar Dashboard.
4. Abrir Torneos.
5. Abrir Tournament Detail.
6. Revisar bracket.
7. Abrir Teams.
8. Abrir Account + Riot status.
9. Revisar Tokens.
10. Revisar Admin/Ops con rol permitido.
11. Ejecutar smoke remoto.
12. Ejecutar production health.
13. Generar capturas visuales.

## Criterios de aceptación

- El usuario puede navegar sin errores visibles.
- Las rutas protegidas de Riot responden 401/403 si no hay sesión.
- La API no filtra secretos.
- Los tokens internos se presentan como no monetarios.
- RSO y Tournament API se documentan como pendientes de aprobación Riot.
- Se puede volver a modo `mock` si la development key diaria expira.

