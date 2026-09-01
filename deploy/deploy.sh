#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# NikStore — Deploy / Update Script
# Usage:
#   bash deploy.sh              → pull latest + rebuild + reload PM2
#   bash deploy.sh --first-run  → also registers PM2 startup on first deploy
# ─────────────────────────────────────────────────────────────────────────────
set -e

APP_DIR="/var/www/nikstore"
FIRST_RUN=false
[[ "$1" == "--first-run" ]] && FIRST_RUN=true

echo "══════════════════════════════════════════"
echo " NikStore Deploy  $(date '+%Y-%m-%d %H:%M')"
echo "══════════════════════════════════════════"

cd "$APP_DIR"
echo ">>> Pulling latest code..."
git pull origin master

echo ">>> Building backend..."
cd "$APP_DIR/nikstore"
npm ci --prefer-offline
npm run build

echo ">>> Building Nuxt..."
cd "$APP_DIR/nikstore-nuxt"
npm ci --prefer-offline
npm run build

echo ">>> Building admin..."
cd "$APP_DIR/nikstore-admin"
npm ci --prefer-offline
npm run build

cd "$APP_DIR"
if $FIRST_RUN; then
  echo ">>> Starting PM2 (first run)..."
  pm2 start deploy/ecosystem.config.js
  pm2 save
  pm2 startup systemd -u root --hp /root | tail -1 | bash

  echo ">>> Setting up cron jobs..."
  (crontab -l 2>/dev/null; echo "0 3 * * * bash $APP_DIR/deploy/backup.sh >> /var/log/nikstore-backup.log 2>&1") | crontab -
  (crontab -l 2>/dev/null; echo "*/5 * * * * bash $APP_DIR/deploy/healthcheck.sh") | crontab -
  bash "$APP_DIR/deploy/setup-logrotate.sh"
  echo "Cron jobs configured ✓"
else
  echo ">>> Reloading PM2..."
  pm2 reload deploy/ecosystem.config.js --update-env
fi

echo ""
echo "══════════════════════════════════════════"
echo " Deploy complete!"
VPS_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo " Frontend : http://$VPS_IP"
echo " Admin    : http://$VPS_IP:4000"
echo " API      : http://$VPS_IP/api/v1"
echo "══════════════════════════════════════════"
pm2 list
