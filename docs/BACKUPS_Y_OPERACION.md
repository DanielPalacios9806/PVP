# Backups y Operacion

## Alcance
Esta guia cubre backups de PostgreSQL, restauracion, reinicios y verificacion operativa basica.

## Scripts incluidos
- `infra/scripts/backup-postgres.sh`
- `infra/scripts/restore-postgres.sh`

## Backup manual
```bash
cp .env.server.example .env.server
chmod +x infra/scripts/backup-postgres.sh
ENV_FILE=.env.server ./infra/scripts/backup-postgres.sh
```

El backup se guarda por defecto en:
```text
backups/postgres/
```

## Restore manual
```bash
chmod +x infra/scripts/restore-postgres.sh
ENV_FILE=.env.server ./infra/scripts/restore-postgres.sh backups/postgres/postgres-YYYYMMDD-HHMMSS.sql.gz
```

## Retencion
La retencion la controla:
- `DB_BACKUP_RETENTION_DAYS`

Valor inicial recomendado:
- `7`

## Cron diario recomendado en Ubuntu
Ejemplo para el usuario `deploy`:
```bash
0 3 * * * ENV_FILE=/opt/arena-os/env/.env.server /opt/arena-os/app/infra/scripts/backup-postgres.sh >> /opt/arena-os/logs/backup.log 2>&1
```

## Operacion diaria minima
- Revisar `docker compose ps`
- Revisar `docker compose logs --tail=100 api`
- Revisar `docker compose logs --tail=100 web`
- Revisar `docker compose logs --tail=100 proxy`
- Confirmar espacio libre en disco
- Confirmar fecha del ultimo backup

## Reinicio de servicios
```bash
docker compose --env-file /opt/arena-os/env/.env.server restart api web proxy
```

## Reinicio completo del stack
```bash
docker compose --env-file /opt/arena-os/env/.env.server down
docker compose --env-file /opt/arena-os/env/.env.server up -d
```

## Checklist rapido de recovery
1. Confirmar que `db` esta healthy
2. Correr `migrate` si hubo cambios de schema
3. Validar `GET /api/health`
4. Validar carga del frontend
5. Revisar login del admin semilla
6. Confirmar persistencia de datos clave

## Recomendaciones futuras
- replicar backups a almacenamiento externo
- agregar monitoreo y alertas
- separar staging y produccion con bases independientes
- evaluar Supabase para staging o futuras migraciones gestionadas
