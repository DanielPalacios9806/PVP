# Production Hardening 2X-N

## Objetivo

Cerrar una capa de estabilidad antes de beta pública: Render, Supabase, Riot API, health checks, smoke remoto y rollback sin exponer secretos.

## Alcance

Esta fase agrega controles operativos, no rediseña la UX principal:

- Health runtime en API: `/api/health/runtime`.
- Readiness con base de datos: `/api/health/readiness`.
- Auditoría estática de `render.yaml`.
- Smoke de producción con Web/API/DB/Riot protegido.
- Documentación de Render, Supabase y rollback.
- Validaciones nuevas en `check:release`.

## Nuevos comandos

```powershell
npm run check:render
npm run check:prodhealth
npm run release:production
```

Para staging remoto:

```powershell
$env:SMOKE_WEB_URL="https://arena-os-web-staging-6x5f.onrender.com"
$env:SMOKE_API_URL="https://arena-os-api-staging.onrender.com/api"
npm run check:prodhealth
```

Si Supabase está intermitente y se requiere diagnóstico no bloqueante:

```powershell
$env:REQUIRE_DB_READY="false"
npm run check:prodhealth
```

## Criterios de producción

- `npm run build` OK.
- `npm run check:release` OK.
- `npm run check:riot` OK.
- `npm run check:render` OK.
- Prisma validate OK.
- Migraciones al día.
- Smoke remoto Web/API OK.
- `/api/health/readiness` responde 200 cuando Supabase está disponible.
- Ninguna API key está versionada.
