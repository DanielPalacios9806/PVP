# Supabase + Render Setup

## Objetivo

Usar Supabase como PostgreSQL administrado y Render como hosting de dos servicios:

- `arena-os-api-staging`: backend Express.
- `arena-os-web-staging`: frontend Next.js.

## Supabase

En Supabase se usa solo PostgreSQL en esta fase. No se necesita Supabase Auth para el MVP actual porque la autenticacion vive en `apps/api`.

Formato recomendado para `DATABASE_URL` en Render:

```env
postgresql://postgres:TU_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require
```

No guardes esta URL en el repositorio. Debe ir como variable secreta en Render.

## Render API Service

Configurar estas variables:

```env
NODE_ENV=production
API_PORT=10000
DATABASE_URL=postgresql://postgres:TU_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=valor-largo-aleatorio
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://tu-frontend.onrender.com
CORS_ORIGIN=https://tu-frontend.onrender.com
RIOT_MODE=mock
RIOT_API_KEY=
RIOT_PLATFORM=LA1
RIOT_REGION=AMERICAS
RIOT_CALLBACK_URL=
RIOT_PROVIDER_ID=
RIOT_TOURNAMENT_ID=
```

Build command:

```bash
npm ci && npm run db:generate && npm run build:shared && npm run build:api
```

Pre-deploy command:

```bash
npm run db:migrate:deploy
```

Start command:

```bash
npm --workspace apps/api run start
```

## Render Web Service

Configurar estas variables:

```env
NEXT_PUBLIC_API_URL=https://tu-api.onrender.com/api
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
```

La publishable key de Supabase puede ser publica, pero igualmente se configura desde Render para no fijarla en codigo.

## GitHub

El repositorio remoto previsto es:

```text
https://github.com/DanielPalacios9806/PVP.git
```

El proyecto debe subirse sin `.env`, sin `node_modules`, sin builds y sin dumps de base de datos.

## Checklist antes del primer deploy

- `package-lock.json` versionado para que `npm ci` funcione.
- `DATABASE_URL` configurado en Render con `sslmode=require`.
- `JWT_SECRET` largo y distinto al local.
- `CORS_ORIGIN` apuntando al frontend real.
- `NEXT_PUBLIC_API_URL` apuntando al backend real.
- `RIOT_MODE=mock` hasta tener API oficial de Riot.
- Migraciones Prisma revisadas antes del deploy.
