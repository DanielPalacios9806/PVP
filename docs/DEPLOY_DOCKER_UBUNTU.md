# Deploy Docker en Ubuntu Server

## Objetivo
Levantar el stack completo en un unico host Ubuntu usando Docker Compose, con:
- `proxy` via Caddy
- `web` Next.js
- `api` Express
- `db` PostgreSQL

## Estructura recomendada en servidor
```text
/opt/arena-os/
  app/
  env/
  backups/
  logs/
```

## Requisitos del host
- Ubuntu Server 22.04 o superior
- Docker Engine
- Docker Compose Plugin
- Acceso SSH por llave
- Dominio en Cloudflare o proveedor equivalente

## Instalacion base
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## Usuario y carpetas
```bash
sudo adduser deploy
sudo usermod -aG docker deploy
sudo mkdir -p /opt/arena-os/{app,env,backups,logs}
sudo chown -R deploy:deploy /opt/arena-os
```

## Carga inicial del proyecto
```bash
cd /opt/arena-os/app
git clone <REPO_PRIVADO_GITHUB> .
cp .env.server.example /opt/arena-os/env/.env.server
```

## Variables minimas a editar
- `APP_DOMAIN`
- `API_DOMAIN`
- `CADDY_EMAIL`
- `CADDY_AUTO_HTTPS`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `NEXT_PUBLIC_API_URL`

## Primer arranque
```bash
cd /opt/arena-os/app
docker compose --env-file /opt/arena-os/env/.env.server up -d db
docker compose --env-file /opt/arena-os/env/.env.server run --rm migrate
docker compose --env-file /opt/arena-os/env/.env.server run --rm seed
docker compose --env-file /opt/arena-os/env/.env.server up -d --build proxy api web
docker compose --env-file /opt/arena-os/env/.env.server ps
```

## Dominio y SSL
### Produccion
- `APP_DOMAIN=app.tudominio.com`
- `API_DOMAIN=api.tudominio.com`
- `CADDY_AUTO_HTTPS=on`

### Local o IP inicial
- `APP_DOMAIN=localhost`
- `API_DOMAIN=api.localhost`
- `CADDY_AUTO_HTTPS=off`

## Firewall recomendado
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Recursos recomendados
- Reservar `20% a 25%` del host para sistema y picos.
- Dar prioridad de memoria a PostgreSQL.
- Mantener limites moderados en `web` y `api`.
- No usar GPU en esta etapa.

## Healthchecks
- API: `GET /api/health`
- Frontend: respuesta HTTP del root
- DB: `pg_isready`

## Verificacion post-deploy
```bash
curl http://127.0.0.1/api/health
docker compose --env-file /opt/arena-os/env/.env.server logs -f api
docker compose --env-file /opt/arena-os/env/.env.server logs -f web
docker compose --env-file /opt/arena-os/env/.env.server logs -f proxy
```

## Rollback basico
1. `git checkout` al commit anterior en `/opt/arena-os/app`
2. `docker compose --env-file /opt/arena-os/env/.env.server up -d --build`
3. Verificar logs y healthchecks
