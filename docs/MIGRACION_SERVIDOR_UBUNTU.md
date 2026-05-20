# Migracion a Servidor Ubuntu

## Objetivo
Mover esta base tecnica al servidor local con Ubuntu Server y PostgreSQL de forma ordenada, repetible y segura.

## Supuestos
- El servidor Ubuntu estara encendido y accesible por red local o SSH.
- Tendras instalado Node.js, npm y PostgreSQL.
- El codigo del proyecto se copiara al servidor o se sincronizara desde tu equipo.

## Estructura relevante
- Schema Prisma: [prisma/schema.prisma](/D:/Codex/prisma/schema.prisma)
- Migracion inicial: [prisma/migrations/0001_init/migration.sql](/D:/Codex/prisma/migrations/0001_init/migration.sql)
- Seed: [prisma/seed.ts](/D:/Codex/prisma/seed.ts)
- Variables: [.env.example](/D:/Codex/.env.example)

## Diagrama de despliegue recomendado
```mermaid
flowchart LR
    A[PC de desarrollo] -->|SSH / SCP / Git pull| B[Ubuntu Server]
    B --> C[Node.js App API]
    B --> D[Node.js App Web]
    C --> E[(PostgreSQL)]
```

## Paso 1. Preparar Ubuntu
Instalar paquetes base:

```bash
sudo apt update
sudo apt install -y curl git build-essential
```

Instalar Node.js LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## Paso 2. Instalar PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql
```

## Paso 3. Crear usuario y base de datos
Entrar al usuario postgres:

```bash
sudo -u postgres psql
```

Crear base y usuario recomendados:

```sql
CREATE USER esports_app WITH PASSWORD 'cambia_esta_password';
CREATE DATABASE esports_platform OWNER esports_app;
GRANT ALL PRIVILEGES ON DATABASE esports_platform TO esports_app;
\q
```

## Paso 4. Copiar proyecto al servidor
Opciones recomendadas:
- `git clone` si usaras repositorio.
- `scp -r` si moveras archivos directos desde tu PC.
- `rsync` si haras sincronizacion incremental.

Ejemplo con `scp`:

```bash
scp -r /ruta/local/del/proyecto usuario@ip-servidor:/home/usuario/esports-platform
```

## Paso 5. Configurar variables de entorno
En el servidor, copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

Configurar al menos:

```env
DATABASE_URL="postgresql://esports_app:cambia_esta_password@localhost:5432/esports_platform?schema=public"
JWT_SECRET="cambia-por-un-secreto-largo"
JWT_EXPIRES_IN="7d"
API_PORT="4000"
WEB_PORT="3000"
NEXT_PUBLIC_API_URL="http://IP_DEL_SERVIDOR:4000/api"
CORS_ORIGIN="http://IP_DEL_SERVIDOR:3000"
RIOT_API_KEY=""
RIOT_API_BASE_URL="https://americas.api.riotgames.com"
```

## Paso 6. Instalar dependencias
```bash
npm install
```

## Paso 7. Generar Prisma Client
```bash
npm run db:generate
```

## Paso 8. Aplicar migraciones
Opcion recomendada:

```bash
npm run db:migrate
```

Si prefieres revisar SQL manualmente primero:
- Validar [migration.sql](/D:/Codex/prisma/migrations/0001_init/migration.sql)
- Aplicarlo con `psql`
- Luego generar cliente Prisma

Ejemplo manual:

```bash
psql "postgresql://esports_app:cambia_esta_password@localhost:5432/esports_platform" -f prisma/migrations/0001_init/migration.sql
```

## Paso 9. Ejecutar seed
```bash
npm run db:seed
```

Usuario semilla creado:
- Email: `admin@esports.local`
- Password: `Admin1234!`

## Paso 10. Levantar proyecto
En desarrollo:

```bash
npm run dev
```

O por separado:

```bash
npm run dev:api
npm run dev:web
```

En despliegue mas estable, recomendacion futura:
- `pm2` para procesos Node
- `nginx` como reverse proxy
- `systemd` para servicios

## Paso 11. Verificacion inicial
Checklist:
- `GET /api/health` responde `ok`
- Registro funciona
- Login retorna JWT
- Seed admin existe
- Creacion de team funciona
- Creacion de torneo funciona con admin
- Audit logs se generan

## Orden de migracion recomendado a futuro
```mermaid
flowchart TD
    A[Servidor listo] --> B[Instalar PostgreSQL]
    B --> C[Crear usuario y DB]
    C --> D[Copiar proyecto]
    D --> E[Configurar .env]
    E --> F[npm install]
    F --> G[npm run db:generate]
    G --> H[npm run db:migrate]
    H --> I[npm run db:seed]
    I --> J[npm run dev]
    J --> K[Pruebas funcionales]
```

## Recomendaciones para el servidor
- Crear usuario Linux dedicado para la app.
- No usar usuario root para correr Node.
- Restringir firewall a puertos necesarios.
- Guardar `.env` fuera de repositorios.
- Hacer backup de PostgreSQL antes de futuras migraciones.
- Usar contraseñas largas para DB y JWT.

## Backups recomendados
Backup simple:

```bash
pg_dump -U esports_app -d esports_platform > backup_esports_platform.sql
```

Restore:

```bash
psql -U esports_app -d esports_platform < backup_esports_platform.sql
```

## Riesgos comunes al migrar
- `DATABASE_URL` incorrecta.
- `NEXT_PUBLIC_API_URL` apuntando a localhost equivocado.
- CORS mal configurado.
- Puerto 3000 o 4000 bloqueado.
- Migracion aplicada parcialmente.
- Version de Node incompatible con dependencias futuras.

## Recomendacion operativa
Cuando enciendas el servidor, primero migra y valida solo backend + PostgreSQL. Luego levantamos frontend. Eso reduce superficie de error y hace debugging mucho mas rapido.
