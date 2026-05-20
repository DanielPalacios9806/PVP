#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.server}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/postgres}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No se encontro el archivo de entorno: $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

set -a
source "$ENV_FILE"
set +a

RETENTION_DAYS="${DB_BACKUP_RETENTION_DAYS:-7}"
STAMP="$(date +"%Y%m%d-%H%M%S")"
OUTPUT_FILE="$BACKUP_DIR/postgres-$STAMP.sql.gz"

docker compose --env-file "$ENV_FILE" exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$OUTPUT_FILE"

find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Backup creado en $OUTPUT_FILE"
