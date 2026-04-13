#!/bin/bash
# SOMOS Database Local Backup Script
# Usage: ./scripts/backup-db.sh
# Requires: DB_PASSWORD in .env.local or PGPASSWORD env var

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="somos-db-backup-${TIMESTAMP}.sql"
PG_DUMP="/usr/local/opt/postgresql@17/bin/pg_dump"

# Connection details
DB_HOST="aws-1-ap-south-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.barcrmxjgisydxjtnolv"

# Load password
if [ -z "$PGPASSWORD" ]; then
  if [ -f .env.local ] && grep -q "DB_PASSWORD" .env.local; then
    export PGPASSWORD=$(grep "DB_PASSWORD" .env.local | cut -d'=' -f2)
  else
    echo "❌ PGPASSWORD or DB_PASSWORD not set."
    echo "Add DB_PASSWORD=yourpassword to .env.local or export PGPASSWORD"
    exit 1
  fi
fi

# Check pg_dump version
if [ ! -f "$PG_DUMP" ]; then
  echo "❌ PostgreSQL 17 client not found. Install with: brew install postgresql@17"
  exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup: ${BACKUP_FILE}"
"$PG_DUMP" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" > "${BACKUP_DIR}/${BACKUP_FILE}"

echo "🗜️  Compressing..."
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)
echo "✅ Backup saved: ${BACKUP_DIR}/${BACKUP_FILE}.gz (${SIZE})"

# Cleanup backups older than 30 days
find "$BACKUP_DIR" -name "somos-db-backup-*.sql.gz" -mtime +30 -delete 2>/dev/null
echo "🗑️  Cleaned up backups older than 30 days"
