#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# NikStore — Health Check
# نصب cron: crontab -e → */5 * * * * bash /var/www/nikstore/deploy/healthcheck.sh
# هر ۵ دقیقه یک بار بررسی می‌کند
# ─────────────────────────────────────────────────────────────────────────────

LOG="/var/log/nikstore-health.log"
TIMESTAMP="[$(date '+%Y-%m-%d %H:%M')]"

check_service() {
    local name=$1
    local url=$2
    local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")

    if [ "$status" != "200" ]; then
        echo "$TIMESTAMP ⚠️  $name DOWN (HTTP $status) → restarting..." >> "$LOG"
        pm2 restart "$name" >> "$LOG" 2>&1
    fi
}

check_service "nikstore-backend"  "http://localhost:3001/api/v1/health"
check_service "nikstore-nuxt"     "http://localhost:3000"
check_service "nikstore-admin"    "http://localhost:4001"

if ! docker exec nikstore-mongo mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "$TIMESTAMP ⚠️  MongoDB DOWN → restarting..." >> "$LOG"
    docker restart nikstore-mongo
fi

if ! redis-cli ping > /dev/null 2>&1; then
    echo "$TIMESTAMP ⚠️  Redis DOWN → restarting..." >> "$LOG"
    systemctl restart redis-server
fi
