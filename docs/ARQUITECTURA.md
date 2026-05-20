# Arquitectura

## Arquitectura general del sistema
Se propone una arquitectura modular tipo monorepo con separacion clara entre experiencia web, API de negocio, esquema de datos y artefactos compartidos.

- `apps/web`: frontend con Next.js, React, TypeScript y Tailwind CSS.
- `apps/api`: backend con Express modular, TypeScript, JWT, validaciones y servicios por dominio.
- `packages/shared`: tipos, enums y utilidades compartidas.
- `prisma`: schema, migraciones y seed de base de datos PostgreSQL.
- `docs`: especificacion funcional y tecnica.

## Diagrama textual de componentes
```text
[Browser / Mobile Web]
        |
        v
[Next.js Web App]
        |
        v
[REST API - Express]
        |
        +--> [Auth Module]
        +--> [Users Module]
        +--> [Teams Module]
        +--> [Spaces Module]
        +--> [Tournaments Module]
        +--> [Matches Module]
        +--> [Disputes Module]
        +--> [Rewards Module]
        +--> [Audit Module]
        |
        +--> [Riot Adapter Interface - future]
        +--> [Notification Service]
        +--> [Job Queue Producer]
        |
        v
[Prisma ORM]
        |
        v
[PostgreSQL]
        |
        +--> [Redis Cache / Sessions / Rate Limits]
        +--> [Object Storage for evidence]
        +--> [Queue Workers]
```

## Frontend
- Next.js App Router.
- React + TypeScript.
- Tailwind CSS.
- Estructura por modulos: auth, teams, spaces, tournaments, admin.
- Componentes reutilizables para layout, formularios, tablas y badges.
- Cliente HTTP centralizado con manejo de token.
- Rutas protegidas del lado cliente para dashboard.

## Backend
- Express modular con TypeScript.
- API REST versionable.
- Capas recomendadas:
  - `routes`: declaracion de endpoints.
  - `controllers`: coordinacion HTTP.
  - `services`: reglas de negocio.
  - `repositories`: acceso a datos via Prisma cuando la complejidad crezca.
  - `middlewares`: auth, roles, validacion, errores, auditoria.
- JWT para autenticacion inicial.
- Adaptadores externos desacoplados por interfaz.

## Base de datos
- PostgreSQL como fuente de verdad principal.
- Prisma ORM para modelado y migraciones.
- UUID o CUID para identificadores externos.
- Soft delete opcional en modulos sensibles.
- Indices en relaciones criticas, slugs y estados.

## Redis / cache
Uso recomendado desde MVP extendido:
- Rate limiting.
- Cache de rankings y listados populares.
- Almacenamiento temporal de check-in o locks de generacion de bracket.
- Cola de notificaciones y jobs.

## Colas / jobs
Para fase posterior al MVP:
- BullMQ o similar sobre Redis.
- Jobs para:
  - notificaciones,
  - recalculo de rankings,
  - verificacion asincrona de integraciones,
  - moderacion asistida,
  - expiracion de check-in,
  - cierre de torneos y asignacion de recompensas.

## Storage
- Evidencias de match y disputas en object storage.
- MVP local o S3-compatible segun entorno.
- Guardar metadata en base de datos y URLs firmadas desde backend.

## Sistema de notificaciones
- In-app notifications en base de datos.
- Email transaccional opcional para:
  - confirmacion de registro,
  - invitaciones,
  - check-in,
  - cambios de bracket,
  - disputas.
- Webhooks internos o jobs para desacoplar envios.

## Seguridad
- Hash de passwords con bcrypt.
- JWT con expiracion y secreto por entorno.
- API keys solo en backend y variables de entorno.
- Validacion de entrada con Zod.
- CORS configurado por entorno.
- Helmet y rate limiting.
- Logs de auditoria para cambios criticos.
- Preparacion para MFA y refresh tokens en una fase posterior.

## Escalabilidad
### MVP
- Un frontend Next.js.
- Una API Express.
- Un PostgreSQL.
- Storage local o S3-compatible.
- Logs estructurados.

### Escala media
- Frontend desplegado en Vercel o infraestructura CDN.
- API en contenedores horizontales.
- PostgreSQL administrado con replicas de lectura.
- Redis para cache y colas.
- Workers dedicados para jobs.
- Storage S3-compatible.
- Observabilidad con OpenTelemetry, logs centralizados y metricas.

## Infraestructura recomendada
### MVP
- Web: Vercel.
- API: Railway, Render o Fly.io.
- DB: Neon, Supabase Postgres o Railway Postgres.
- Storage: Cloudflare R2, S3 o local en desarrollo.

### Escala media
- Web: CDN + edge cache.
- API: Kubernetes ligero o servicios administrados.
- DB: Postgres administrado con backup point-in-time.
- Redis administrado.
- Workers dedicados.
- WAF, secretos administrados y CI/CD con entornos separados.
