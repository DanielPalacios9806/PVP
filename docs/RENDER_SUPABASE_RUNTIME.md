# Render + Supabase Runtime

## Arquitectura

Darkside.cool opera como monolito modular en un monorepo, con dos servicios Render:

- `arena-os-api-staging`: backend Express/API.
- `arena-os-web-staging`: frontend Next.js.

La base de datos vive en Supabase PostgreSQL. Riot API se usa solo desde backend.

## Variables API necesarias

```text
DATABASE_URL
DIRECT_URL
JWT_SECRET
JWT_EXPIRES_IN
CORS_ORIGIN
CORS_ORIGINS
FRONTEND_URL
RIOT_API_MODE
RIOT_API_KEY
RIOT_REGION
RIOT_REGIONAL_ROUTE
RIOT_API_TIMEOUT_MS
RIOT_TOURNAMENT_API_ENABLED
```

## Variables Web necesarias

```text
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Nunca usar en Web:

```text
RIOT_API_KEY
NEXT_PUBLIC_RIOT_API_KEY
```

## Health endpoints

```text
/api/health
/api/health/runtime
/api/health/readiness
```

`/api/health/runtime` no debe exponer secretos. Solo informa modo, entorno, cantidad de orígenes CORS y estado general de Riot.

`/api/health/readiness` verifica conexión mínima con Supabase mediante `SELECT 1`. Si la base no responde, devuelve `503` sin filtrar credenciales.

## CORS staging

Para staging, el API debe aceptar:

```text
https://arena-os-web-staging-6x5f.onrender.com
https://darkside.cool
```

El Web staging debe apuntar a:

```text
https://arena-os-api-staging.onrender.com/api
```
