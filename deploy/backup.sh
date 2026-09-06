#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# NikStore — MongoDB + Uploads Backup Script
# نصب cron: crontab -e → 0 3 * * * bash /var/www/nikstore/deploy/backup.sh
# هر شب ساعت ۳ صبح اجرا می‌شود
#
# NOTE: this writes to local disk only (/var/backups) — a disk failure takes
# both the live data and the backups with it. Sync BACKUP_DIR to off-box
# storage (object storage, a second host, etc.) for real disaster recovery.
# ─────────────────────────────────────────────────────────────────────────────

APP_DIR="/var/www/nikstore"
BACKUP_DIR="/var/backups/nikstore-mongo"
UPLOADS_BACKUP_DIR="/var/backups/nikstore-uploads"
UPLOADS_DIR="$APP_DIR/nikstore/uploads"
DB_NAME="nikstore"
KEEP_DAYS=7
DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_PATH="$BACKUP_DIR/$DATE"

mkdir -p "$BACKUP_DIR" "$UPLOADS_BACKUP_DIR"

echo "[$(date)] Starting MongoDB backup..."
# Mongo runs in the nikstore-mongo container (see deploy/setup.sh) — no
# mongodump binary exists on the host, so dump inside the container and
# copy the result out.
MONGO_ROOT_PASSWORD=$(cat /root/.mongo_root_password 2>/dev/null)
docker exec nikstore-mongo mongodump \
  -u root -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin \
  --db "$DB_NAME" --out "/tmp/$DATE" --quiet

if [ $? -eq 0 ]; then
    docker cp "nikstore-mongo:/tmp/$DATE" "$BACKUP_PATH"
    docker exec nikstore-mongo rm -rf "/tmp/$DATE"
    tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "$DATE"
    rm -rf "$BACKUP_PATH"
    echo "[$(date)] Mongo backup saved: $BACKUP_PATH.tar.gz"

    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$KEEP_DAYS -delete
else
    echo "[$(date)] ERROR: Mongo backup failed!"
    exit 1
fi

echo "[$(date)] Starting uploads backup..."
if [ -d "$UPLOADS_DIR" ]; then
    UPLOADS_TAR="$UPLOADS_BACKUP_DIR/$DATE.tar.gz"
    tar -czf "$UPLOADS_TAR" -C "$APP_DIR/nikstore" uploads
    echo "[$(date)] Uploads backup saved: $UPLOADS_TAR"
    find "$UPLOADS_BACKUP_DIR" -name "*.tar.gz" -mtime +$KEEP_DAYS -delete
else
    echo "[$(date)] WARNING: $UPLOADS_DIR not found, skipping uploads backup"
fi

echo "[$(date)] Old backups cleaned (kept last $KEEP_DAYS days)"
echo "[$(date)] Done. Disk usage:"
du -sh "$BACKUP_DIR" "$UPLOADS_BACKUP_DIR"
