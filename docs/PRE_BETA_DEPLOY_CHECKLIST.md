# Pre-beta deploy checklist

## Objetivo

Checklist mínimo para llevar Darkside.cool de la rama visual/funcional a `main` y desplegar en Render sin romper variables, Riot API ni Supabase.

## Antes del merge

```powershell
cd D:\Codex

git status --short
npm run build
npm run check:release
npm run check:riot
npx prisma validate --schema prisma/schema.prisma
npx prisma migrate status --schema prisma/schema.prisma
```

Si el smoke depende de servidores locales:

```powershell
npm run dev
npm run check:prebeta
```

## Variables locales mínimas

```text
DATABASE_URL
JWT_SECRET
CORS_ORIGIN
FRONTEND_URL
RIOT_API_MODE
RIOT_API_KEY
RIOT_REGION
RIOT_REGIONAL_ROUTE
```

## Variables Render API

```text
DATABASE_URL
DIRECT_URL
JWT_SECRET
JWT_EXPIRES_IN
CORS_ORIGIN
FRONTEND_URL
RIOT_API_MODE
RIOT_API_KEY
RIOT_REGION
RIOT_REGIONAL_ROUTE
RIOT_API_TIMEOUT_MS
RIOT_TOURNAMENT_API_ENABLED
RIOT_CALLBACK_URL
RIOT_TOURNAMENT_PROVIDER_ID
RIOT_TOURNAMENT_CALLBACK_SECRET
RIOT_TOURNAMENT_ID
```

## Variables Render Web

```text
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

No usar en web:

```text
NEXT_PUBLIC_RIOT_API_KEY
```

## Merge a main

```powershell
git checkout main
git pull origin main

git merge --no-ff feat/external-ui-fusion -m "merge: external UI fusion pre-beta release"

npm run build
npm run check:release
npm run check:riot
npx prisma validate --schema prisma/schema.prisma
npx prisma migrate status --schema prisma/schema.prisma

git push origin main
```

## Verificación post-deploy

Rutas web:

```text
/
/auth/login
/auth/register
/dashboard
/dashboard/tournaments
/dashboard/teams
/dashboard/tokens
/dashboard/account
/legal/terms
/legal/privacy
/legal/data-deletion
```

Rutas API:

```text
/api/health
/api/riot/health
/api/riot/status
/api/riot/rso/status
```

Las rutas Riot protegidas pueden responder `401` o `403` si no hay sesión. Eso es válido en smoke test.

## Criterio de cierre

- Build OK.
- Release check OK.
- Riot readiness OK.
- Prisma validate OK.
- Migraciones al día.
- Render API y Web activos.
- No hay secretos en GitHub.
- Home, dashboard, torneos y equipos cargan sin errores de frontend.
