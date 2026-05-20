# GitHub, Actions y estrategia Render

## GitHub
Repositorio recomendado:
- privado
- ramas `main` y `develop`

## Flujo de ramas
- `main`: produccion Ubuntu
- `develop`: preview o staging

## Workflows incluidos
### `ci.yml`
- instala dependencias
- valida Prisma
- genera cliente Prisma
- compila `shared`, `api` y `web`

### `docker.yml`
- construye imagenes Docker
- publica `web` y `api` en GHCR

### `deploy-ubuntu.yml`
- conecta por SSH al servidor
- actualiza el repo
- levanta `db`
- ejecuta `migrate`
- ejecuta `seed`
- relanza `proxy`, `api` y `web`

### `deploy-render-preview.yml`
- pensado para `develop`
- soporta hooks de Render
- soporta Render API si defines:
  - `RENDER_API_KEY`
  - `RENDER_WEB_SERVICE_ID`
  - `RENDER_API_SERVICE_ID`

## Secretos de GitHub recomendados
- `SERVER_HOST`
- `SERVER_USER`
- `SERVER_SSH_KEY`
- `SERVER_PORT`
- `RENDER_WEB_DEPLOY_HOOK_URL`
- `RENDER_API_DEPLOY_HOOK_URL`
- `RENDER_API_KEY`

## Variables de GitHub recomendadas
- `DOCKER_WEB_API_URL`
- `RENDER_WEB_SERVICE_ID`
- `RENDER_API_SERVICE_ID`

## Render como preview
Render queda como entorno externo de validacion, no como produccion principal.

### Recomendacion de servicios
- `arena-os-web-staging`
- `arena-os-api-staging`

### Requisito importante
Si corres `api` en Render, necesitas una base de datos externa de staging.

Recomendacion:
- `Supabase Postgres` para staging

No se recomienda conectar un API de Render a la base PostgreSQL privada de produccion en Ubuntu.

## `render.yaml`
El repo ya incluye `render.yaml` para bootstrap inicial de servicios `web` y `api`.

Debes completar manualmente en Render:
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `NEXT_PUBLIC_API_URL`
- `RIOT_API_KEY` si aplica

## Secuencia recomendada
1. Subir repo privado a GitHub
2. Configurar `main` y `develop`
3. Activar Actions
4. Desplegar produccion en Ubuntu
5. Configurar preview en Render
6. Vincular subdominio `preview` o `staging`
