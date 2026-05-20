# Deployment & Operations Guide

## Overview

This document covers deployment strategies, infrastructure setup, CI/CD pipelines, and emergency procedures for the eSports Platform.

**Architecture**:
- **Staging**: Render (web + api) + Supabase (PostgreSQL)
- **Production**: Ubuntu Server (Docker Compose) + PostgreSQL
- **CI/CD**: GitHub Actions (automated tests, builds, deploys)

---

## Environment Strategy

### Development (Local)
- `.env.example` → `.env` (copy and modify)
- PostgreSQL: local or Docker
- Next.js dev server: `npm run dev:web`
- Express dev server: `npm run dev:api`

### Staging (Render + Supabase)
- Branch: `develop`
- Configuration: `.env.render.example` template
- Render Services:
  - `pvp-api-staging`: Node.js API service
  - `pvp-web-staging`: Next.js frontend service
- Database: Supabase PostgreSQL
- Deploy Trigger: GitHub push to `develop` → Actions → Render webhook

### Production (Ubuntu Server)
- Branch: `main`
- Configuration: `.env.server.example` template
- Docker Compose Stack:
  - `proxy`: Caddy reverse proxy (SSL, domain routing)
  - `web`: Next.js frontend (port 3000)
  - `api`: Express backend (port 4000)
  - `db`: PostgreSQL (port 5432)
- Deploy Trigger: GitHub push to `main` → Actions → SSH deploy

---

## GitHub Secrets Required

### For GitHub Actions CI/CD

**Set in**: Repository → Settings → Secrets and variables → Actions

| Secret | Value | Usage |
|--------|-------|-------|
| `SERVER_HOST` | IP or hostname of Ubuntu server | SSH deploy |
| `SERVER_USER` | SSH user (e.g., `deploy`) | SSH deploy |
| `SERVER_SSH_KEY` | Private SSH key (multiline) | SSH deploy |
| `SERVER_PORT` | SSH port (default: 22) | SSH deploy |
| `SUPABASE_DB_URL` | PostgreSQL connection string from Supabase | Staging DB migrations |
| `RENDER_WEB_DEPLOY_HOOK_URL` | Webhook URL from Render web service | Trigger Render deploy |
| `RENDER_API_DEPLOY_HOOK_URL` | Webhook URL from Render api service | Trigger Render deploy |

### For GitHub Actions Variables (Non-Secret)

**Set in**: Repository → Settings → Secrets and variables → Variables

| Variable | Value | Usage |
|----------|-------|-------|
| `DOCKER_WEB_API_URL` | API URL for Next.js build-time env (default: `http://localhost/api`) | Web build |
| `RENDER_WEB_SERVICE_ID` | Service ID from Render web service | Monitoring/status checks |
| `RENDER_API_SERVICE_ID` | Service ID from Render api service | Monitoring/status checks |

---

## Deployment Workflows

### Workflow: `ci.yml` (Code Validation)
**Trigger**: Push to any branch or PR
**Steps**:
1. Install dependencies
2. Validate Prisma schema
3. Generate Prisma Client
4. Build `shared`, `api`, `web` packages
5. **Pass/Fail**: Blocks merges if failed

### Workflow: `docker.yml` (Container Build)
**Trigger**: Push to `main` or `develop`
**Steps**:
1. Build Docker images for `api` and `web`
2. Push to GitHub Container Registry (GHCR)
3. Tags: `latest`, git SHA, branch name
**Example**: `ghcr.io/danielpalacios98/pvp-project/api:develop`

### Workflow: `deploy-ubuntu.yml` (Production Deploy)
**Trigger**: Push to `main` branch ONLY
**Steps**:
1. SSH into Ubuntu server
2. `cd /opt/pvp-os/app && git pull origin main`
3. Rebuild Docker images: `docker compose --env-file /opt/pvp-os/env/.env.server build`
4. Restart services: `docker compose --env-file /opt/pvp-os/env/.env.server up -d`
5. **No automatic migration** (manual safety step)
**Approx Duration**: 5-10 minutes

### Workflow: `deploy-render-preview.yml` (Staging Deploy)
**Trigger**: Push to `develop` branch
**Steps**:
1. Trigger Render deploy via webhook URLs
2. Render automatically pulls `develop`, builds, deploys
**Approx Duration**: 3-5 minutes

---

## Manual Deployment Procedures

### Deploy to Production (Emergency/Manual)

If GitHub Actions fails or you need manual control:

```bash
# SSH into server
ssh -i /path/to/key deploy@SERVER_HOST -p SERVER_PORT

# Navigate to project
cd /opt/pvp-os/app

# Pull latest main branch
git fetch origin main
git reset --hard origin/main

# Rebuild and restart
docker compose --env-file /opt/pvp-os/env/.env.server build --no-cache
docker compose --env-file /opt/pvp-os/env/.env.server up -d

# Verify
docker compose --env-file /opt/pvp-os/env/.env.server ps
curl https://api.ejemplo.com/api/health
```

### Deploy to Staging (Manual via Render)

In Render Dashboard:
1. Go to `pvp-api-staging` service → Manual Deploy
2. Go to `pvp-web-staging` service → Manual Deploy
3. Monitor in Render Logs tab

Or trigger via webhook:
```bash
curl -X POST $RENDER_WEB_DEPLOY_HOOK_URL
curl -X POST $RENDER_API_DEPLOY_HOOK_URL
```

---

## Database Migrations

### Production (Ubuntu)

**Before running migrations**:
1. Take backup: `docker compose --env-file /opt/pvp-os/env/.env.server run --rm db pg_dump -U postgres esports_platform > /opt/pvp-os/backups/pre-migration-$(date +%s).sql`
2. Inform team: notify on Slack/Discord

**Run migration**:
```bash
cd /opt/pvp-os/app
docker compose --env-file /opt/pvp-os/env/.env.server run --rm api npx prisma migrate deploy --schema prisma/schema.prisma
```

**After migration**:
- Monitor API logs for errors
- Test critical endpoints
- Keep backup for 1 week

### Staging (Supabase)

```bash
# Locally with Supabase connection
DATABASE_URL="postgresql://..." npx prisma migrate deploy --schema prisma/schema.prisma
```

---

## Seed Data

### Production

Only run ONCE after first deploy:
```bash
cd /opt/pvp-os/app
docker compose --env-file /opt/pvp-os/env/.env.server run --rm api npm run db:seed
```

This creates:
- Admin user: `admin@esports.local` / `Admin1234!`
- Sample data if seed script includes it

### Staging

```bash
cd apps/api
DATABASE_URL="postgresql://..." npm run db:seed
```

---

## Backup & Recovery

### PostgreSQL Backup (Ubuntu)

**Automatic via Cron** (pre-configured):
```bash
0 2 * * * cd /opt/pvp-os/app && docker compose --env-file /opt/pvp-os/env/.env.server run --rm db pg_dump -U postgres esports_platform > /opt/pvp-os/backups/backup-$(date +\%Y\%m\%d-\%H\%M\%S).sql
```

Backups stored in: `/opt/pvp-os/backups/`

**Manual Backup**:
```bash
docker compose --env-file /opt/pvp-os/env/.env.server run --rm db pg_dump -U postgres esports_platform > /opt/pvp-os/backups/backup-$(date +%Y%m%d-%H%M%S).sql
```

### PostgreSQL Recovery (Ubuntu)

**Warning**: This will DROP and recreate the database. Ensure you have backups.

```bash
# Stop services
docker compose --env-file /opt/pvp-os/env/.env.server down

# Restore from backup file
BACKUP_FILE="/opt/pvp-os/backups/backup-20260518-020000.sql"
docker compose --env-file /opt/pvp-os/env/.env.server up -d db
sleep 10
docker compose --env-file /opt/pvp-os/env/.env.server run --rm db psql -U postgres esports_platform < $BACKUP_FILE

# Restart services
docker compose --env-file /opt/pvp-os/env/.env.server up -d api web proxy

# Verify
docker compose --env-file /opt/pvp-os/env/.env.server ps
curl https://api.ejemplo.com/api/health
```

---

## Emergency Procedures

### Service Down - API

**Diagnosis**:
```bash
ssh deploy@SERVER_HOST
docker compose --env-file /opt/pvp-os/env/.env.server logs api | tail -100
docker compose --env-file /opt/pvp-os/env/.env.server ps api
```

**Recovery**:
```bash
# Restart API
docker compose --env-file /opt/pvp-os/env/.env.server restart api

# If still down, check DB
docker compose --env-file /opt/pvp-os/env/.env.server logs db

# If DB issue, restart
docker compose --env-file /opt/pvp-os/env/.env.server restart db
```

### Database Corruption

**Immediate Actions**:
1. Notify team
2. Stop write operations (put API in read-only mode via middleware if possible)
3. Take backup of corrupted state (for forensics): `pg_dump -U postgres esports_platform > /opt/pvp-os/backups/corrupted-$(date +%s).sql`
4. Restore from last known good backup

**Restore Process**:
```bash
cd /opt/pvp-os/app
docker compose --env-file /opt/pvp-os/env/.env.server down
docker compose --env-file /opt/pvp-os/env/.env.server up -d db
sleep 10
# Restore from backup
docker compose --env-file /opt/pvp-os/env/.env.server run --rm db psql -U postgres esports_platform < /opt/pvp-os/backups/backup-XXXXX.sql
docker compose --env-file /opt/pvp-os/env/.env.server up -d api web proxy
```

### Rollback to Previous Version

If a deploy breaks production:

```bash
ssh deploy@SERVER_HOST
cd /opt/pvp-os/app

# Check last good commit
git log --oneline | head -5

# Revert to previous commit
git revert --no-edit HEAD

# Or hard reset (if revert doesn't work)
git reset --hard <COMMIT_SHA>

# Rebuild and restart
docker compose --env-file /opt/pvp-os/env/.env.server build --no-cache
docker compose --env-file /opt/pvp-os/env/.env.server up -d

# Test
curl https://api.ejemplo.com/api/health
```

---

## SSL/TLS Certificates (Let's Encrypt)

Caddy automatically handles SSL via Let's Encrypt if `CADDY_AUTO_HTTPS=on`.

**Certificate Renewal**:
- Automatic (Caddy manages it)
- Stored in: `caddy_data` Docker volume
- Logs: `docker compose logs proxy`

**Manual Renewal** (if needed):
```bash
docker compose --env-file /opt/pvp-os/env/.env.server restart proxy
```

**Verify Certificate**:
```bash
echo | openssl s_client -connect api.ejemplo.com:443 2>/dev/null | openssl x509 -text
```

---

## Monitoring & Logs

### Ubuntu Production

**Real-time logs**:
```bash
docker compose --env-file /opt/pvp-os/env/.env.server logs -f api
docker compose --env-file /opt/pvp-os/env/.env.server logs -f web
docker compose --env-file /opt/pvp-os/env/.env.server logs -f db
docker compose --env-file /opt/pvp-os/env/.env.server logs -f proxy
```

**Specific timeframe**:
```bash
docker compose --env-file /opt/pvp-os/env/.env.server logs --since 1h api
```

**Disk Usage**:
```bash
docker system df
docker volume ls
```

### Render Staging

In Render Dashboard:
- Service → Logs tab: real-time output
- Service → Events tab: deployment history
- Service → Metrics tab: CPU, memory, requests

### GitHub Actions

In GitHub:
- Repository → Actions tab: workflow runs
- Click workflow → View logs
- Scroll to specific job for details

---

## DNS Configuration (If using custom domains)

For Ubuntu production with custom domains (e.g., `app.ejemplo.com`, `api.ejemplo.com`):

1. Update DNS A records (or CNAME):
   ```
   app.ejemplo.com    A    <SERVER_IP>
   api.ejemplo.com    A    <SERVER_IP>
   ```

2. Update `.env.server`:
   ```
   APP_DOMAIN=app.ejemplo.com
   API_DOMAIN=api.ejemplo.com
   CADDY_EMAIL=admin@ejemplo.com
   CADDY_AUTO_HTTPS=on
   ```

3. Restart Caddy: `docker compose --env-file /opt/pvp-os/env/.env.server restart proxy`

4. Wait 30-60s for Let's Encrypt certificate generation

5. Verify: `curl https://app.ejemplo.com`

---

## Scaling & Performance

### Render (Staging)

To scale:
1. Go to Service → Settings
2. Change Instance Type from "Starter" to higher tier (Pro, Premium)
3. Render automatically restarts with new resources

### Ubuntu (Production)

To increase resource limits:
1. Edit `docker-compose.yml`:
   ```yaml
   api:
     mem_limit: 2048m    # Increase from 1024m
     cpus: 2.0           # Increase from 1.50
   ```

2. Rebuild: `docker compose --env-file /opt/pvp-os/env/.env.server up -d`

Or add more vertical resources to the server itself (upgrade VM).

---

## Checklist: Pre-Production Go-Live

- [ ] All tests passing on `main` branch
- [ ] `.env.server` configured with real values
- [ ] SSH key deployed to GitHub Secrets
- [ ] Database backup tested and working
- [ ] Domain DNS records configured
- [ ] SSL certificate auto-renewal verified
- [ ] API health check responds 200
- [ ] Web app loads without errors
- [ ] Auth flow tested (register, login, logout)
- [ ] Sample tournament created and tested
- [ ] Logs monitored for 48 hours
- [ ] Runbook shared with team
- [ ] Incident contact list prepared

---

## Support & Troubleshooting

### Common Issues

**Port conflicts**:
```bash
# Check what's using port 80/443
sudo lsof -i :80
sudo lsof -i :443
# Kill if needed
sudo kill -9 <PID>
```

**Docker out of space**:
```bash
docker system prune -a
docker volume prune
```

**Database connection timeout**:
```bash
# Check DB service
docker compose ps db
# Logs
docker compose logs db | tail -20
```

### Get Help

- GitHub Issues: Feature requests, bugs
- Email: admin@ejemplo.com (internal team)
- Runbook: This file + SECURITY.md
