#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Storein — Health Check
# نصب cron: crontab -e → */5 * * * * bash /var/www/storein/deploy/healthcheck.sh
# هر ۵ دقیقه یک بار بررسی می‌کند
# ─────────────────────────────────────────────────────────────────────────────

LOG="/var/log/storein-health.log"
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

check_service "nik-backend"    "http://localhost:3001/api/v1/health"
check_service "nik-storefront" "http://localhost:3000/"
check_service "nik-admin"      "http://localhost:4001/"

if ! mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "$TIMESTAMP ⚠️  MongoDB DOWN → restarting..." >> "$LOG"
    systemctl restart mongod
fi

if ! redis-cli ping > /dev/null 2>&1; then
    echo "$TIMESTAMP ⚠️  Redis DOWN → restarting..." >> "$LOG"
    systemctl restart redis-server
fi
