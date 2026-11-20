#!/bin/bash
# Installed by deploy/setup-native.sh as /usr/local/sbin/nikstore-backup (cron 03:00).
# Use this instead of deploy/backup.sh when MongoDB runs natively (backup.sh needs the Docker container).
# NikStore nightly backup (native MongoDB). Keeps 7 days on local disk.
# NOTE: same-disk backups don't survive a disk failure — copy /var/backups/nikstore off the server too.
set -u
. /root/.nikstore-secrets
DIR=/var/backups/nikstore; DATE=$(date +%F_%H-%M); KEEP_DAYS=7
mkdir -p "$DIR"; chmod 700 "$DIR"
echo "[$(date)] mongo dump..."
if mongodump --uri="mongodb://root:${MONGO_ROOT_PASSWORD}@127.0.0.1:27017/?authSource=admin" --db nikstore \
     --archive="$DIR/mongo-$DATE.archive.gz" --gzip --quiet; then
  echo "[$(date)] saved $DIR/mongo-$DATE.archive.gz ($(du -h "$DIR/mongo-$DATE.archive.gz" | cut -f1))"
else
  echo "[$(date)] ERROR: mongodump failed"; rm -f "$DIR/mongo-$DATE.archive.gz"; exit 1
fi
if [ -d /var/www/nikstore/nikstore/uploads ]; then
  tar -czf "$DIR/uploads-$DATE.tar.gz" -C /var/www/nikstore/nikstore uploads
  echo "[$(date)] saved $DIR/uploads-$DATE.tar.gz ($(du -h "$DIR/uploads-$DATE.tar.gz" | cut -f1))"
fi
find "$DIR" -type f \( -name 'mongo-*' -o -name 'uploads-*' \) -mtime +$KEEP_DAYS -delete
echo "[$(date)] done; disk used by backups: $(du -sh "$DIR" | cut -f1)"
