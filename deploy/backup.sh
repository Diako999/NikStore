#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# NikStore — MongoDB Backup Script
# نصب cron: crontab -e → 0 3 * * * bash /var/www/nikstore/deploy/backup.sh
# هر شب ساعت ۳ صبح اجرا می‌شود
# ─────────────────────────────────────────────────────────────────────────────

BACKUP_DIR="/var/backups/nikstore-mongo"
DB_NAME="nikstore"
KEEP_DAYS=7
DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_PATH="$BACKUP_DIR/$DATE"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."
mongodump --db "$DB_NAME" --out "$BACKUP_PATH" --quiet

if [ $? -eq 0 ]; then
    tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "$DATE"
    rm -rf "$BACKUP_PATH"
    echo "[$(date)] Backup saved: $BACKUP_PATH.tar.gz"

    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$KEEP_DAYS -delete
    echo "[$(date)] Old backups cleaned (kept last $KEEP_DAYS days)"
else
    echo "[$(date)] ERROR: Backup failed!"
    exit 1
fi

echo "[$(date)] Done. Disk usage: $(du -sh $BACKUP_DIR | cut -f1)"
