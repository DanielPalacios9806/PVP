# Darkside.cool / PVP — Runbook de producción v0.7.1

## Objetivo

Esta versión prepara el proyecto para operar como **RC1 / beta cerrada** antes de solicitar Production API Key, RSO y Tournament API a Riot.

No agrega funcionalidades competitivas grandes. Agrega control operativo para evitar lanzar con rutas rotas, secretos expuestos, legal incompleto o smoke tests pendientes.

## Orden de trabajo por versión

1. Crear rama desde `main`.
2. Aplicar patch de la versión.
3. Ejecutar build completo.
4. Ejecutar revisión local.
5. Ejecutar smoke test local.
6. Commit y push.
7. Merge controlado a `main`.
8. Deploy Render.
9. Smoke test contra producción.
10. Crear tag.

## Comandos de v0.7.1

```powershell
cd D:\Codex

git checkout main
git pull origin main
git checkout -b chore/production-readiness-v0.7.1

git apply --check -p1 --ignore-whitespace D:\Codex\darkside_v0_7_1_production_guardrails.patch
git apply -p1 --ignore-whitespace D:\Codex\darkside_v0_7_1_production_guardrails.patch

npm.cmd run build
npm.cmd run check:release
```

Para el smoke test local, primero deja web y API corriendo en otra terminal:

```powershell
npm.cmd run dev
```

Luego, en una segunda terminal:

```powershell
npm.cmd run check:smoke
```

Si todo pasa:

```powershell
git add package.json scripts docs/PRODUCTION_LAUNCH_RUNBOOK.md
git commit -m "chore: add production readiness guardrails"
git push -u origin chore/production-readiness-v0.7.1
```

## Nota sobre check:release

El script `check:release` escanea principalmente archivos versionados con `git ls-files`. Esto evita falsos positivos por `.env` locales ignorados por Git. Si aparece una coincidencia de secreto en un archivo versionado, no hagas merge hasta corregirlo.

## Smoke test local

`check:smoke` hace peticiones HTTP reales. Si `localhost:3000` y `localhost:4000` no están levantados, fallará aunque el build esté correcto.

```powershell
# Terminal 1
cd D:\Codex
npm.cmd run dev

# Terminal 2
cd D:\Codex
npm.cmd run check:smoke
```

## Smoke test contra producción

Después del deploy en Render:

```powershell
$env:SMOKE_WEB_URL="https://darkside.cool"
$env:SMOKE_API_URL="https://api.darkside.cool/api"
npm.cmd run check:smoke
```

## Criterios para marcar RC1 como estable

- `npm run build` pasa.
- `npm run check:release` pasa.
- `npm run check:smoke` pasa local con `npm run dev` activo, o pasa contra producción usando `SMOKE_WEB_URL` y `SMOKE_API_URL`.
- Render Web despliega.
- Render API despliega.
- Smoke test producción pasa.
- No hay `RGAPI-` en Git.
- No hay `NEXT_PUBLIC_RIOT`.
- Riot sigue separado entre lookup técnico y RSO real.
- Legal pages son públicas.

## Variables mínimas de Render API

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN=7d`
- `CORS_ORIGIN=https://darkside.cool`
- `FRONTEND_URL=https://darkside.cool`
- `RIOT_API_MODE=development` o `mock` mientras no exista Production Key
- `RIOT_API_KEY` solo en API si se usa development key
- `RIOT_REGION=la1`
- `RIOT_REGIONAL_ROUTE=americas`
- `RIOT_TOURNAMENT_API_ENABLED=false`

## Variables mínimas de Render Web

- `NEXT_PUBLIC_API_URL=https://api.darkside.cool/api`

No colocar `RIOT_API_KEY` en Web.

## Siguiente versión sugerida

- `v0.7.2`: pulido visual y responsive del dashboard/landing.
- `v0.7.3`: flujo QA de beta cerrada y guion de demo para Riot.
- `v0.8.0`: paquete formal para Riot Developer Portal.
