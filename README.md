# Darkside.gg - Plataforma de Torneos eSports

Plataforma modular de torneos de eSports inspirada en experiencias tipo Challengermode, enfocada en competicion organizada, comunidad, auditoria, tokens internos no monetarios y crecimiento seguro.

## Stack
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express modular, TypeScript
- ORM: Prisma
- Database: PostgreSQL

## Estructura
```text
apps/
  api/
  web/
packages/
  shared/
docs/
prisma/
```

## Primeros pasos

### Local (Development)
1. Copiar `.env.example` a `.env`.
2. Instalar dependencias con `npm install`.
3. Generar cliente Prisma con `npm run db:generate`.
4. Aplicar migraciones con `npm run db:migrate`.
5. Poblar datos base opcionales con `npm run db:seed`.
6. Levantar API y frontend con `npm run dev`.

### GitHub Repository Setup
1. Crear repositorio en https://github.com/new
   - Nombre sugerido: `Darkside.gg` o el nombre de repositorio disponible en GitHub
   - Visibilidad: Public
   - No inicializar (el código ya existe localmente)

2. Conectar repositorio local:
```bash
git remote add origin https://github.com/DanielPalacios9806/PVP.git
git branch -M main
git push -u origin main
```

3. Crear rama `develop` para staging:
```bash
git checkout -b develop
git push -u origin develop
```

4. Proteger ramas en GitHub → Settings → Branches:
   - `main`: Requerir PR reviews, pasar checks
   - `develop`: Solo pasar checks

5. Configurar GitHub Actions secrets (Settings → Secrets and variables → Actions):
   - `SERVER_HOST`: IP/hostname del servidor Ubuntu
   - `SERVER_USER`: Usuario SSH (ej: `deploy`)
   - `SERVER_SSH_KEY`: Private SSH key
   - `SERVER_PORT`: Puerto SSH (default: 22)
   - `SUPABASE_DB_URL`: PostgreSQL URL de Supabase
   - `RENDER_WEB_DEPLOY_HOOK_URL`: Webhook de Render
   - `RENDER_API_DEPLOY_HOOK_URL`: Webhook de Render

**Para más detalles**: Ver [DEPLOYMENT.md](DEPLOYMENT.md)

## Despliegue y Docker
El proyecto ya incluye una base de despliegue real para:
- `Ubuntu Server + Docker Compose` como produccion principal.
- `GitHub privado + GitHub Actions` para CI/CD.
- `Render` como staging o preview.

### Archivos clave
- `docker-compose.yml`
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `infra/Caddyfile`
- `.env.server.example`
- `.env.render.example`
- `render.yaml`
- `.github/workflows/*.yml`

### Comandos Docker
- `npm run docker:up`
- `npm run docker:down`
- `npm run docker:logs`
- `npm run docker:migrate`
- `npm run docker:seed`

### Primer arranque con Docker
1. Copiar `.env.server.example` a `.env.server`.
2. Ajustar `JWT_SECRET`, `POSTGRES_PASSWORD`, dominios y `NEXT_PUBLIC_API_URL`.
3. Levantar la base y servicios:
   - `docker compose --env-file .env.server up -d db`
   - `docker compose --env-file .env.server run --rm migrate`
   - `docker compose --env-file .env.server run --rm seed`
   - `docker compose --env-file .env.server up -d --build proxy api web`
4. Verificar:
   - `http://localhost`
   - `http://localhost/api/health`

## Scripts
- `npm run dev:web`
- `npm run dev:api`
- `npm run dev`
- `npm run build`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:migrate:deploy`
- `npm run docker:up`
- `npm run docker:down`
- `npm run docker:logs`
- `npm run docker:migrate`
- `npm run docker:seed`

## Monorepo
- `apps/web`: frontend Next.js con landing, auth, dashboard y vistas separadas para jugador y administracion.
- `apps/api`: API REST modular con auth, equipos, spaces, torneos, check-in, matches, disputas y auditoria.
- `packages/shared`: constantes y tipos compartidos.
- `prisma/schema.prisma`: modelo de datos central.
- `prisma/migrations/0001_init/migration.sql`: migracion inicial.
- `tests/bruno`: requests de referencia para pruebas manuales.

## Usuario semilla
El seed crea un administrador inicial:
- Correo: `admin@esports.local`
- Contrasena: `Admin1234!`

Usa este usuario como super administrador inicial. El registro publico siempre crea usuarios `USER`; los roles `ADMIN`, `ORGANIZER`, `MODERATOR` y `FINANCE` deben asignarse desde el panel interno por un `SUPER_ADMIN`.

## Roles de experiencia
- Jugador: se registra, inicia sesion, consulta torneos, participa, hace check-in y administra su saldo de tokens internos desde la vista de usuario. No crea torneos.
- Administracion: crea torneos, genera brackets, audita acciones, revisa disputas y controla asignacion o verificacion de tokens internos.
- Super administracion: asigna roles administrativos. No existe registro publico para super admin.
- Moderacion: revisa disputas y apoya la integridad competitiva.

## Tokens internos
- Cada usuario registrado recibe un saldo inicial de tokens internos.
- Los tokens son parte de la plataforma y no representan dinero, apuestas ni cash wagering.
- La recarga visible del frontend actual es solo una experiencia de prototipo; no procesa pagos reales.

## Estrategia de despliegue
- Produccion MVP recomendada: `Render + Supabase Postgres`.
- Alternativa/autohosting: `Ubuntu Server + Docker Compose`.
- Base de datos administrada inicial: `Supabase Postgres` con `DATABASE_URL` secreto en Render.
- Render corre dos servicios separados: `apps/api` y `apps/web`.

## GitHub Actions incluidas
- `ci.yml`: valida Prisma y compila el monorepo.
- `docker.yml`: construye y publica imagenes en GHCR.
- `deploy-ubuntu.yml`: despliegue por SSH a Ubuntu.
- `deploy-render-preview.yml`: despliegue a Render por hooks o API.

## Funcionalidad actual del MVP
- Registro e inicio de sesion con JWT.
- Consulta de perfil autenticado.
- Wallet interna inicial por usuario registrado.
- Roles separados para jugador, organizador, moderador, admin y finanzas.
- CRUD de teams.
- Alta y baja de miembros de teams.
- CRUD de spaces.
- Alta y baja de miembros de spaces.
- CRUD de torneos con ciclo `DRAFT`, `PUBLISHED`, `REGISTRATION_OPEN`, `REGISTRATION_CLOSED`, `IN_PROGRESS`, `COMPLETED`.
- Inscripcion pendiente, aprobacion/rechazo por organizer/admin y check-in de torneos.
- Generacion de bracket single elimination con rondas y matches.
- Creacion de matches.
- Reporte, aceptacion y confirmacion manual de resultados con avance automatico de ganador.
- Apertura y resolucion de disputas.
- Auditoria consultable para admin y moderacion.
- Riot mock mode para vincular Riot ID simulado, generar codigo de partida mock y simular resultados.
- Frontend base para auth, dashboard, torneos, tokens, moderacion y admin con vistas separadas por rol.

## Riot mock
El MVP no llama a Riot Games todavia. Usa `RIOT_MODE=mock` para probar el flujo completo sin API oficial:

- `POST /api/riot/accounts/link`
- `POST /api/riot/matches/:matchId/code`
- `POST /api/riot/mock/matches/:matchId/finish`
- `GET /api/riot/status`

Ver [RIOT_MOCK.md](/D:/Codex/docs/RIOT_MOCK.md) para el flujo demo y checklist previo a Production API Key.

## Notas de compliance
- No incluye apuestas, gambling ni cash wagering.
- Las recompensas internas no son convertibles a dinero.
- La wallet futura representa premios de torneos y requiere KYC/aprobacion manual en fases posteriores.

## Documentacion operativa
- [DEPLOY_DOCKER_UBUNTU.md](/D:/Codex/docs/DEPLOY_DOCKER_UBUNTU.md)
- [GITHUB_RENDER_STRATEGY.md](/D:/Codex/docs/GITHUB_RENDER_STRATEGY.md)
- [BACKUPS_Y_OPERACION.md](/D:/Codex/docs/BACKUPS_Y_OPERACION.md)
- [RIOT_MOCK.md](/D:/Codex/docs/RIOT_MOCK.md)
- [SUPABASE_RENDER_SETUP.md](/D:/Codex/docs/SUPABASE_RENDER_SETUP.md)
