# Darkside.cool - Plataforma de Torneos eSports

Darkside.cool es una plataforma modular para torneos universitarios de esports, enfocada en competicion organizada, comunidad, auditoria, roles claros, Riot API server-side y tokens internos no monetarios.

## Stack
- Frontend: Next.js 15, React, TypeScript y Tailwind CSS.
- Backend: Node.js, Express modular y TypeScript.
- ORM/Base de datos: Prisma + PostgreSQL.
- Deploy objetivo: Render + Supabase Postgres.
- Alternativa operativa: Ubuntu Server + Docker Compose.

## Estructura
```text
apps/
  api/
  web/
packages/
  shared/
docs/
prisma/
tests/bruno/
```

## Primeros pasos locales
1. Copiar `.env.example` a `.env`.
2. Instalar dependencias con `npm install`.
3. Generar cliente Prisma con `npm run db:generate`.
4. Aplicar migraciones con `npm run db:migrate`.
5. Poblar datos base opcionales con `npm run db:seed`.
6. Levantar API y frontend con `npm run dev`.

## Estado de produccion
- Ciclo 1 de hardening activo: RBAC, UI por rol, Riot compliance y release preflight.
- Runtime recomendado para validacion local y CI: Node 22 con npm 10.
- Produccion recomendada: Render con servicios separados para `apps/api` y `apps/web`.
- Base de datos administrada inicial: Supabase Postgres con `DATABASE_URL` y `DIRECT_URL` como secretos.
- Dominio publico: `https://darkside.cool`.
- API publica esperada: `https://api.darkside.cool/api`.

## Preflight de release
Ejecutar antes de push a `main`:

```powershell
npx -y -p node@22 -p npm@10 npm run build:web
npx -y -p node@22 -p npm@10 npm run build:api
npx -y -p node@22 -p npm@10 npm run check:release
```

El push a `main` debe hacerse solo si los tres comandos pasan y `git status --short` contiene unicamente cambios esperados.

## Scripts principales
- `npm run dev:web`
- `npm run dev:api`
- `npm run dev`
- `npm run build`
- `npm run build:web`
- `npm run build:api`
- `npm run check:release`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:migrate:deploy`
- `npm run db:seed`

## Render y variables
Render usa `render.yaml` como blueprint. Los secretos no se versionan.

Variables backend esperadas:
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `CORS_ORIGIN`
- `RIOT_API_MODE`
- `RIOT_MODE`
- `RIOT_API_KEY`
- `RIOT_PLATFORM`
- `RIOT_REGION`
- `RIOT_REGIONAL_ROUTE`
- `RIOT_CALLBACK_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`
- `OAUTH_STATE_SECRET`

Variable frontend publica:
- `NEXT_PUBLIC_API_URL`

## Roles de experiencia
- `USER`: jugador. Consulta torneos, crea equipo, participa, hace check-in, reporta resultados y administra tokens internos.
- `ORGANIZER`: opera torneos propios, inscripciones, brackets y matches de sus eventos.
- `MODERATOR`: revisa disputas y casos de integridad competitiva.
- `ADMIN`: opera torneos, Riot panel, auditoria y moderacion global.
- `SUPER_ADMIN`: administra perfiles internos, roles y privilegios administrativos.
- `FINANCE`: gestiona ajustes de tokens internos cuando aplique.

El registro publico siempre crea `USER`. No existe registro publico para `ADMIN` ni `SUPER_ADMIN`.

## Funcionalidad actual
- Registro e inicio de sesion con JWT.
- Perfil autenticado y wallet interna inicial.
- Equipos, miembros e invitaciones.
- Spaces/comunidades.
- Torneos con ciclo operativo y estados.
- Inscripciones pendientes, aprobacion/rechazo y check-in.
- Bracket single elimination con rondas y matches.
- Reporte, aceptacion, confirmacion y disputa de resultados.
- Avance automatico del ganador.
- Auditoria para acciones criticas.
- Riot API preparada de forma server-side con modos mock/development/production.
- Paneles separados para jugador, admin, super admin, moderacion y tokens.

## Riot API
Darkside.cool mantiene `RIOT_API_MODE=mock` por defecto. En este modo no se llama a Riot Games y se puede probar el flujo competitivo sin exponer secretos. Para pruebas con Development API Key, configurar `RIOT_API_KEY` solo en backend o Render.

Endpoints relevantes:
- `POST /api/riot/accounts/link`
- `POST /api/riot/matches/:matchId/code`
- `POST /api/riot/mock/matches/:matchId/finish`
- `GET /api/riot/status`
- `GET /api/admin/riot/overview`
- `POST /api/admin/riot/test-connection`

Guias:
- [RIOT_API_INTEGRATION.md](docs/RIOT_API_INTEGRATION.md)
- [RIOT_MOCK.md](docs/RIOT_MOCK.md)

## Compliance
- No incluye apuestas, gambling, cash wagering, blockchain, cripto ni skins betting.
- Los tokens internos no son convertibles a dinero.
- Las recompensas visibles deben ser internas: tokens, XP, badges, beneficios o premios futuros sujetos a aprobacion.
- Riot API Key nunca debe exponerse en frontend ni en archivos versionados.
- Riot Sign On real queda pendiente hasta aprobacion oficial.

## Documentacion operativa
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [SECURITY.md](SECURITY.md)
- [docs/RELEASE_VALIDATION.md](docs/RELEASE_VALIDATION.md)
- [docs/PRODUCTION_LAUNCH_RUNBOOK.md](docs/PRODUCTION_LAUNCH_RUNBOOK.md)
- [docs/SUPABASE_RENDER_SETUP.md](docs/SUPABASE_RENDER_SETUP.md)
- [docs/GITHUB_RENDER_STRATEGY.md](docs/GITHUB_RENDER_STRATEGY.md)
- [docs/BACKUPS_Y_OPERACION.md](docs/BACKUPS_Y_OPERACION.md)
