# RELEASE_VALIDATION.md

## Objetivo

Validar que Darkside.cool compila y pasa controles minimos antes de publicar en Render o abrir una fase profunda de backend/frontend.

## Entorno recomendado

- Node.js 22, alineado con CI.
- npm 10 para reproducibilidad.
- No usar `.env` reales para build estatico.
- No exponer secretos en logs.

En Windows, si Node 22 no esta instalado globalmente, ejecutar validacion temporal con:

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

Valida estructura, rutas legales, scripts, variables ejemplo, Next standalone y patrones obvios de secretos en archivos versionados.

## Resultado Ciclo 1

Fecha: 2026-06-01

Comandos ejecutados con Node 22/npm 10:
- `npm run build:web`: OK.
- `npm run build:api`: OK.
- `npm run check:release`: OK.

Cambios validados:
- RBAC de Riot tournament codes restringido a admin/super admin u organizador propietario.
- Registro de jugadores por terceros restringido a admin/super admin u organizador propietario.
- UI visible sin mojibake en componentes principales revisados.
- README actualizado para produccion Render/Supabase y preflight Node 22.

## Checklist web

- Landing publica compila.
- Auth login/register compilan.
- Dashboard usuario compila.
- Panel admin y super admin compilan.
- Paginas legales compilan.
- No hay imports rotos ni rutas duplicadas.
- No mostrar premios monetarios falsos, sponsors no autorizados ni claims Riot oficiales sin aprobacion.

## Checklist API

- TypeScript compila con `tsc`.
- Rutas principales registran sin errores de tipos.
- Middlewares de auth/error/rate limit compilan.
- Modulos admin, auth, teams, spaces, tournaments, registrations, matches, disputes, audit y riot compilan.
- `USER` no puede ejecutar operaciones administrativas.
- `ORGANIZER` solo opera recursos de torneos propios salvo reglas explicitas.

## Checklist Riot mock mode

- `RIOT_API_MODE=mock` o `RIOT_MODE=mock` debe ser el valor seguro por defecto.
- `RIOT_API_KEY` no debe usar prefijo `NEXT_PUBLIC`.
- Production Riot/Tournament API no debe activarse sin variables obligatorias.
- Tournament codes no se generan masivamente: solo por match programado/listo.
- El disclaimer Riot debe existir en UI/legal.

## Checklist Render

- `render.yaml` mantiene servicios separados para API y Web.
- API usa `preDeployCommand` para migraciones Prisma.
- Web usa `NEXT_PUBLIC_API_URL` apuntando al dominio API.
- Secretos quedan con `sync: false`.
- CORS y `FRONTEND_URL` apuntan al dominio publico.

## Si falla produccion

1. Revisar healthcheck y logs del servicio API en Render.
2. Verificar variables de entorno faltantes.
3. Confirmar migraciones Prisma.
4. Revisar ultimo deploy exitoso.
5. Ejecutar smoke check contra produccion si la API responde.

## Rollback basico

- En Render: usar rollback al ultimo deploy estable.
- En Git: crear commit de revert, no usar `reset --hard` ni force push sin autorizacion.
- En base de datos: restaurar solo desde backup verificado y con ventana de mantenimiento.
