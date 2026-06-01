# RELEASE_VALIDATION.md

## Objetivo

Validar que Darkside.cool compila y pasa controles mínimos antes de publicar o abrir una fase profunda de backend/frontend.

## Entorno recomendado

- Node.js 22, igual que CI.
- No usar `.env` reales para build estático.
- No exponer secretos en logs.

En Windows, si Node 22 no está instalado globalmente, se puede ejecutar validación temporal con:

```powershell
npx -y -p node@22 -p npm@10 npm run build:web
npx -y -p node@22 -p npm@10 npm run build:api
npx -y -p node@22 -p npm@10 npm run check:release
```

## Comandos de build

```powershell
npm run build:web
npm run build:api
```

## Release check

```powershell
npm run check:release
```

Valida estructura, rutas legales, scripts, variables ejemplo y patrones obvios de secretos en archivos versionados.

## Checklist web

- Landing publica compila.
- Auth login/register compilan.
- Dashboard usuario compila.
- Panel admin compila.
- Paginas legales compilan.
- No hay imports rotos ni rutas duplicadas.

## Checklist API

- TypeScript compila con `tsc`.
- Rutas principales registran sin errores de tipos.
- Middlewares de auth/error/rate limit compilan.
- Modulos admin, auth, teams, spaces, tournaments, matches, disputes, audit y riot compilan.

## Checklist Riot mock mode

- `RIOT_API_MODE=mock` debe ser el valor seguro por defecto.
- `RIOT_API_KEY` no debe ser `NEXT_PUBLIC`.
- Production Riot/Tournament API no debe activarse sin variables obligatorias.
- El disclaimer Riot debe existir en UI/legal.

## Checklist Render

- `render.yaml` mantiene servicios separados para API y Web.
- API usa `preDeployCommand` para migraciones Prisma.
- Web usa `NEXT_PUBLIC_API_URL` apuntando al dominio API.
- Secretos quedan con `sync: false`.
- CORS y `FRONTEND_URL` apuntan al dominio publico.

## Si falla produccion

1. Revisar healthcheck/API logs en Render.
2. Verificar variables de entorno faltantes.
3. Confirmar migraciones Prisma.
4. Revisar ultimo deploy exitoso.
5. Ejecutar smoke check contra produccion si la API responde.

## Rollback basico

- En Render: usar rollback al ultimo deploy estable.
- En Git: crear commit de revert, no usar `reset --hard` ni force push sin autorizacion.
- En base de datos: restaurar solo desde backup verificado y con ventana de mantenimiento.
