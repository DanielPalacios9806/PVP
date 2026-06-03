# Darkside.cool - Runbook de producción

## Objetivo

Preparar Darkside.cool para operar como beta cerrada/RC antes de solicitar Production API Key, RSO y Tournament API a Riot. Esta guía cubre validación, deploy, smoke tests y rollback básico sin exponer secretos.

## Rama de trabajo actual

- Rama segura de cierre: `codex/complete-production-100`.
- `main` no debe recibir push directo sin revisión.
- Los cambios deben revisarse por PR o merge controlado.

## Orden recomendado de release

1. Crear rama desde `main`.
2. Aplicar cambios pequeños y commitear por fase.
3. Ejecutar build completo.
4. Ejecutar checks de release/Riot.
5. Ejecutar health check contra producción o staging.
6. Revisar que no haya secretos versionados.
7. Push de la rama de trabajo.
8. PR o merge controlado a `main`.
9. Deploy Render.
10. Smoke test contra dominio público.
11. Crear tag RC si todo pasa.

## Comandos de validación

```powershell
cd D:\Codex

npm run build
npm run check:release
npm run check:riot
npm run check:riotapp
npm run check:riotsubmit
```

## Health check contra producción

```powershell
$env:SMOKE_WEB_URL="https://darkside.cool"
$env:SMOKE_API_URL="https://api.darkside.cool/api"
npm run check:prodhealth
Remove-Item Env:\SMOKE_WEB_URL
Remove-Item Env:\SMOKE_API_URL
```

Resultado esperado:

- Web `/`, `/auth/login`, `/dashboard`, `/dashboard/tournaments`, `/dashboard/account` responden.
- API `/health`, `/health/runtime`, `/health/readiness` responden `200`.
- Riot protegido responde `401` o `403` sin token.

## Smoke test local

Levantar web y API:

```powershell
npm run dev
```

En otra terminal:

```powershell
npm run check:smoke
```

Si `localhost:3000` y `localhost:4000` no están activos, el smoke local fallará aunque el build esté correcto.

## Criterios para marcar RC como estable

- `npm run build` pasa.
- `npm run check:release` pasa.
- `npm run check:riot` pasa sin fallos bloqueantes.
- `npm run check:riotapp` pasa.
- `npm run check:riotsubmit` pasa.
- `npm run check:prodhealth` pasa contra `darkside.cool` y `api.darkside.cool`.
- No hay `RGAPI-` en archivos versionados.
- No hay `NEXT_PUBLIC_RIOT_API_KEY`.
- Riot API queda backend-only.
- RSO y Tournament API productiva siguen marcadas como pendientes de aprobación Riot.
- Tokens internos siguen definidos como no monetarios, no retirables y no convertibles.

## Variables mínimas de Render API

- `NODE_ENV=production`
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN=7d`
- `CORS_ORIGIN=https://darkside.cool`
- `CORS_ORIGINS=https://darkside.cool`
- `FRONTEND_URL=https://darkside.cool`
- `RIOT_API_MODE=development` o `mock` mientras no exista Production Key
- `RIOT_API_KEY` solo en API si se usa development key
- `RIOT_REGION=la1`
- `RIOT_REGIONAL_ROUTE=americas`
- `RIOT_TOURNAMENT_API_ENABLED=false`

## Variables mínimas de Render Web

- `NEXT_PUBLIC_API_URL=https://api.darkside.cool/api`

No colocar `RIOT_API_KEY`, `RIOT_API_SECRET`, `JWT_SECRET` ni secretos OAuth en Web.

## Rollback básico

1. En Render, usar rollback al deploy anterior estable.
2. Si el problema es backend/API, validar `/api/health` y `/api/health/readiness`.
3. Si el problema es frontend, validar `/`, `/auth/login` y assets.
4. Si el problema viene de variables, corregir en Render Environment y redeploy.
5. Si hay sospecha de key expuesta, rotar inmediatamente la Riot Development API Key.

## Pendientes antes de producción abierta

- Completar respuesta de Riot Developer Portal.
- Mantener Production API Key fuera del frontend.
- Ejecutar QA visual mobile/desktop antes del merge final.
- Documentar resultado de PR/merge y crear tag RC.
