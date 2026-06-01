# CODEX_REPO_MAP.md

## Resumen

Mapa compacto para trabajar en Darkside.cool con bajo consumo de tokens.

- Stack: monorepo Node/TypeScript.
- Frontend: `apps/web` con Next.js 15, React 19 y Tailwind.
- Backend: `apps/api` con Express 5, TypeScript, Prisma y Zod.
- Base de datos: `prisma/schema.prisma` y migraciones PostgreSQL.
- Deploy: `render.yaml`, Docker, GitHub Actions e infraestructura en `infra`.
- Documentacion: `README.md`, `SECURITY.md`, `DEPLOYMENT.md`, `docs`.

## Arbol resumido

```text
apps/
  api/
    src/app.ts
    src/routes/index.ts
    src/config/env.ts
    src/middlewares/
    src/modules/
      admin auth users teams spaces tournaments registrations brackets matches disputes audit riot
  web/
    app/
      auth dashboard legal
    components/
    lib/
packages/shared/
prisma/
  schema.prisma
  migrations/
docs/
infra/
scripts/
tests/bruno/
```

## Rutas criticas

- Backend/API: `apps/api/src/app.ts`, `apps/api/src/routes/index.ts`, `apps/api/src/modules`.
- Auth/RBAC: `apps/api/src/modules/auth`, `apps/api/src/middlewares/auth.ts`, `apps/web/components/role-gate.tsx`.
- Frontend/UI: `apps/web/app`, `apps/web/components`, `apps/web/lib/session.ts`.
- Torneos/matches: `apps/api/src/modules/tournaments`, `apps/api/src/modules/matches`, `apps/web/components/tournament-detail.tsx`, `apps/web/components/match-room.tsx`.
- Riot/API: `apps/api/src/modules/riot`, `apps/api/src/modules/integrations/riot.adapter.ts`, `docs/RIOT_API_INTEGRATION.md`.
- Datos: `prisma/schema.prisma`, `prisma/migrations`.
- Deploy: `render.yaml`, `.github/workflows`, `DEPLOYMENT.md`, `scripts/check-release-readiness.mjs`.

## Orden optimo de lectura

1. `package.json`, `apps/web/package.json`, `apps/api/package.json`.
2. `AGENTS.md`, `README.md`, `SECURITY.md`, `DEPLOYMENT.md`.
3. `render.yaml`, `.github/workflows/ci.yml`.
4. `prisma/schema.prisma`.
5. `apps/api/src/app.ts`, `apps/api/src/routes/index.ts`.
6. Modulo backend especifico de la tarea.
7. `apps/web/app` y componente frontend especifico de la tarea.
8. Docs relacionadas con la tarea.

## Exclusiones

No leer ni empaquetar por defecto:

- `node_modules`
- `.git`
- `.agents`
- `apps/web/.next`
- `apps/api/dist`
- `logs`
- `.runtime`
- `.env`
- `*.env`
- `repomix-output.xml`

## Repomix

Ultima ejecucion recomendada:

```powershell
npx repomix@latest --compress --output repomix-output.xml --ignore "node_modules,.git,.agents,apps/web/.next,apps/api/dist,logs,.runtime,.env,*.env,repomix-output.xml"
```

Resultado observado:

- Archivos empaquetados: 257.
- Tokens estimados: 102.051.
- Output: `repomix-output.xml`.
- Top pesado: `prisma/schema.prisma`, `prisma/migrations/0001_init/migration.sql`, `DEPLOYMENT.md`, `SECURITY.md`, `docs/RIOT_INTEGRATION_PLAN.md`.

## Estrategia de ahorro de tokens

- Leer primero este mapa y el archivo especifico de la tarea.
- Evitar abrir `repomix-output.xml` completo.
- Usar `rg` para buscar simbolos/rutas concretas.
- Leer solo contratos, schemas, rutas y componentes relacionados.
- Trabajar por fases pequenas: diagnostico, cambio, validacion, reporte.

## Fases recomendadas hacia posproduccion

1. Preflight/build con Node 22.
2. Auditoria backend/API por modulo.
3. Auditoria frontend/UI por flujo.
4. Riot compliance y callbacks.
5. Seguridad/RBAC.
6. Pruebas Bruno y smoke checks.
7. CI/GitHub Actions.
8. Render/domains/env vars.
9. Runbook, tag RC y roadmap.
