#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# NikStore — server setup with MongoDB installed NATIVELY (no Docker)
# Ubuntu 24.04, run once as root on a fresh VPS:   bash deploy/setup-native.sh
#
# This is the sequence that was run by hand on 2026-11-20 for nikstoree.ir (2 GB RAM / 1 vCPU,
# Tehran) and is now automated. Each step is idempotent, but the script as a whole has NOT
# been run end to end as a single piece — read the output of each step.
#
# deploy/setup.sh remains the Docker-based variant. Use this one when repo.mongodb.org is
# reachable (it was, from this network) — it saves ~100 MB of RAM and one moving part.
#
# What it does NOT do (needs DNS / secrets / a human):
#   - clone the app, write the .env files, build, start PM2   -> see "After this script" below
#   - issue the TLS certificate and install nginx config      -> header of deploy/nginx-domain.conf
#   - create the first admin                                  -> npm run seed:admin -- <phone> <password>
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a
[ "$(id -u)" = 0 ] || { echo "run as root"; exit 1; }

SECRETS=/root/.nikstore-secrets        # root-only; read by backup/health scripts and when writing .env
SWAP_SIZE=${SWAP_SIZE:-2G}
MONGO_CACHE_GB=${MONGO_CACHE_GB:-0.35} # WiredTiger cache cap — sized for a 2 GB box
REDIS_MAXMEM=${REDIS_MAXMEM:-150mb}
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ">>> [1/8] packages"
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git build-essential ca-certificates gnupg ufw fail2ban nginx \
  redis-server certbot python3-certbot-nginx rsync unattended-upgrades

echo ">>> [2/8] swap ($SWAP_SIZE) — needed to build the Nuxt app on 2 GB"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l "$SWAP_SIZE" /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
echo 'vm.swappiness=10' > /etc/sysctl.d/99-nikstore.conf
sysctl -q -p /etc/sysctl.d/99-nikstore.conf

echo ">>> [3/8] firewall: only SSH, HTTP, HTTPS (apps/DB/Redis stay on localhost)"
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable

echo ">>> [4/8] SSH: key-only login (refuses to proceed if root has no authorized key)"
if [ -s /root/.ssh/authorized_keys ]; then
  cat > /etc/ssh/sshd_config.d/00-nikstore-hardening.conf <<'EOF'
# first match wins: this file sorts before 50-cloud-init.conf
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
MaxAuthTries 4
EOF
  sshd -t && systemctl reload ssh
  echo "    password login disabled — verify a NEW key session works before closing this one"
else
  echo "    SKIPPED: /root/.ssh/authorized_keys is empty — add your public key first, then re-run"
fi

echo ">>> [5/8] secrets file ($SECRETS)"
umask 077
[ -f "$SECRETS" ] || cat > "$SECRETS" <<EOF
MONGO_ROOT_PASSWORD=$(openssl rand -hex 24)
MONGO_APP_PASSWORD=$(openssl rand -hex 24)
REDIS_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 48)
JWT_REFRESH_SECRET=$(openssl rand -hex 48)
EOF
# shellcheck disable=SC1090
. "$SECRETS"

echo ">>> [6/8] Node.js 22 (NodeSource) + PM2"
# NodeSource apt repo configured directly (signed packages) instead of `curl ... | bash`, so
# nothing downloaded is executed unverified. Same result as NodeSource's own setup_22.x script.
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --yes --dearmor -o /usr/share/keyrings/nodesource.gpg
chmod 644 /usr/share/keyrings/nodesource.gpg   # apt reads it as the unprivileged _apt user
cat > /etc/apt/sources.list.d/nodesource.sources <<'EOF'
Types: deb
URIs: https://deb.nodesource.com/node_22.x
Suites: nodistro
Components: main
Architectures: amd64
Signed-By: /usr/share/keyrings/nodesource.gpg
EOF
printf 'Package: nodejs\nPin: origin deb.nodesource.com\nPin-Priority: 600\n' > /etc/apt/preferences.d/nodejs
apt-get update -qq
apt-get install -y -qq nodejs
npm install -g pm2 >/dev/null 2>&1
echo "    node $(node -v), npm $(npm -v), pm2 $(pm2 -v)"

echo ">>> [7/8] MongoDB 8.0 (official apt repo) with authentication"
# Key comes from pgp.mongodb.com (www.mongodb.org/static/pgp/... only redirects).
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | gpg --yes -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
# apt reads the key as the unprivileged `_apt` user: under this script's umask 077 the file would be
# root-only and apt reports a misleading "NO_PUBKEY" for a key that is actually present.
chmod 644 /usr/share/keyrings/mongodb-server-8.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" \
  > /etc/apt/sources.list.d/mongodb-org-8.0.list
apt-get update -qq
apt-get install -y -qq mongodb-org
if ! grep -q cacheSizeGB /etc/mongod.conf; then
  python3 - "$MONGO_CACHE_GB" <<'PY'
import sys
p='/etc/mongod.conf'; s=open(p).read()
s=s.replace("storage:\n  dbPath: /var/lib/mongodb\n","storage:\n  dbPath: /var/lib/mongodb\n  wiredTiger:\n    engineConfig:\n      cacheSizeGB: "+sys.argv[1]+"\n")
open(p,'w').write(s)
PY
fi
systemctl enable --now mongod >/dev/null 2>&1
for _ in $(seq 1 30); do mongosh --quiet --eval 'db.adminCommand("ping").ok' 2>/dev/null | grep -q 1 && break; sleep 1; done
mongosh --quiet --eval "
  const admin = db.getSiblingDB('admin');
  if (!admin.getUser('root')) admin.createUser({ user: 'root', pwd: '$MONGO_ROOT_PASSWORD', roles: [{ role: 'root', db: 'admin' }] });
  const app = db.getSiblingDB('nikstore');
  if (!app.getUser('nikstore_app')) app.createUser({ user: 'nikstore_app', pwd: '$MONGO_APP_PASSWORD', roles: [{ role: 'readWrite', db: 'nikstore' }] });"
grep -q '^security:' /etc/mongod.conf || printf '\nsecurity:\n  authorization: enabled\n' >> /etc/mongod.conf
systemctl restart mongod

echo ">>> [8/8] Redis (password, localhost only, memory cap) + maintenance scripts"
python3 - "$REDIS_PASSWORD" "$REDIS_MAXMEM" <<'PY'
import re, sys
pw, mem = sys.argv[1], sys.argv[2]
p='/etc/redis/redis.conf'; s=open(p).read()
def setkv(s,k,v):
    if re.search(r'(?m)^'+k+r'\s', s): return re.sub(r'(?m)^'+k+r'\s.*$', k+' '+v, s, count=1)
    return s+'\n'+k+' '+v+'\n'
for k,v in [('requirepass',pw),('maxmemory',mem),('maxmemory-policy','volatile-lru'),('bind','127.0.0.1 -::1')]:
    s=setkv(s,k,v)
open(p,'w').write(s)
PY
systemctl restart redis-server

install -m 750 "$HERE/backup-native.sh"      /usr/local/sbin/nikstore-backup
install -m 750 "$HERE/healthcheck-native.sh" /usr/local/sbin/nikstore-health
# written with printf: a `crontab -l | grep -v` pipeline under `set -e` aborts before the new lines
printf '%s\n' 'MAILTO=""' \
  '0 3 * * * /usr/local/sbin/nikstore-backup >> /var/log/nikstore-backup.log 2>&1' \
  '*/5 * * * * /usr/local/sbin/nikstore-health' | crontab -
mkdir -p /var/www/nikstore /var/log/pm2

cat <<'EOF'

══════════════════════════════════════════════
 Server base is ready. After this script:
══════════════════════════════════════════════
 1. Get the code onto the server (git clone, or a `git bundle` — see deploy/README or deploy.sh) into /var/www/nikstore
 2. Write nikstore/.env and nikstore-nuxt/.env from deploy/*.env.example, using the values in /root/.nikstore-secrets
    (MONGODB_URI=mongodb://nikstore_app:<MONGO_APP_PASSWORD>@127.0.0.1:27017/nikstore?authSource=nikstore, REDIS_PASSWORD, JWT_*)
 3. In each app:  npm ci && npm run build   (nikstore, nikstore-nuxt, nikstore-admin) — one at a time on 2 GB
 4. cd nikstore && npm run seed:categories && npm run seed:pages
 5. pm2 start deploy/ecosystem.config.js && pm2 startup systemd -u root --hp /root && pm2 save
 6. TLS + nginx: header of deploy/nginx-domain.conf
 7. npm run seed:admin -- <phone> <password>   (run in YOUR terminal, not through a chat)
EOF
