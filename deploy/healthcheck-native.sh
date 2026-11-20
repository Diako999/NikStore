#!/bin/bash
# Installed by deploy/setup-native.sh as /usr/local/sbin/nikstore-health (cron every 5 min).
# Use this instead of deploy/healthcheck.sh when MongoDB runs natively (healthcheck.sh uses `docker exec`).
# Every 5 min: restart a service that stopped answering. Log: /var/log/nikstore-health.log
. /root/.nikstore-secrets
LOG=/var/log/nikstore-health.log; TS="[$(date '+%F %H:%M')]"
check() { # name url [expected-prefix]
  local code; code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$2")
  if [ "$code" != "200" ]; then echo "$TS $1 DOWN (HTTP $code) -> restarting" >> "$LOG"; pm2 restart "$1" >> "$LOG" 2>&1; fi
}
check nikstore-backend http://127.0.0.1:3001/api/v1/health
check nikstore-nuxt    http://127.0.0.1:3000/
check nikstore-admin   http://127.0.0.1:4001/
mongosh --quiet --eval 'db.adminCommand("ping").ok' >/dev/null 2>&1 || { echo "$TS MongoDB DOWN -> restarting" >> "$LOG"; systemctl restart mongod; }
REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli ping 2>/dev/null | grep -q PONG || { echo "$TS Redis DOWN -> restarting" >> "$LOG"; systemctl restart redis-server; }
