# Playwright Visual QA Screenshots

## Objetivo

La fase 2X-O agrega evidencia visual automatizada para validar que el despliegue de Darkside.cool no solo responda HTTP 200, sino que también conserve la experiencia visual esperada en desktop y mobile.

## Script

```powershell
npm run check:visual
```

Alias equivalente:

```powershell
npm run visual:screenshots
```

## Uso local

Con la aplicación levantada:

```powershell
npm run dev
npm run check:visual
```

Por defecto captura `http://localhost:3000`.

## Uso remoto Render

```powershell
$env:VISUAL_QA_BASE_URL="https://arena-os-web-staging-6x5f.onrender.com"
npm run check:visual
```

## Rutas capturadas

El set estándar incluye:

```text
/
/auth/login
/dashboard
/dashboard/tournaments
/dashboard/tournaments/mock-tournament-1
/dashboard/teams
/dashboard/account
/dashboard/admin
/dashboard/moderation
```

Si el detalle de torneo real cambia, se puede definir:

```powershell
$env:VISUAL_QA_TOURNAMENT_PATH="/dashboard/tournaments/<id-real>"
npm run check:visual
```

También se puede personalizar el set completo:

```powershell
$env:VISUAL_QA_ROUTES="/,/dashboard,/dashboard/tournaments,/dashboard/account"
npm run check:visual
```

## Salida

Las capturas se guardan en:

```text
visual-qa-artifacts/<run-id>/
```

Cada ejecución genera:

```text
manifest.json
VISUAL_QA_REPORT.md
desktop-*.png
mobile-*.png
```

La carpeta `visual-qa-artifacts/` está ignorada por Git para evitar subir capturas pesadas al repositorio.

## Criterio de aprobación

La fase visual se considera aprobada cuando:

- Todas las rutas principales responden `2xx` o `3xx`.
- Existen capturas desktop y mobile.
- Home, Dashboard, Tournaments, Tournament Detail, Teams, Account y Admin mantienen la estética Darkside.
- No se observan overflow horizontal, menús imposibles de cerrar ni cards rotas en mobile.
- Las capturas pueden adjuntarse como evidencia en revisión interna o pre-beta.

## Relación con otros checks

Este QA visual complementa, pero no reemplaza:

```powershell
npm run build
npm run check:release
npm run check:riot
npm run check:prebeta
npm run check:prodhealth
```
