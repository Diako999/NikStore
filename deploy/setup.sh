#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# NikStore — VPS Initial Setup (Ubuntu 22.04 / 24.04)
# Run once as root: bash setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "══════════════════════════════════════════"
echo " NikStore VPS Setup"
echo "══════════════════════════════════════════"

# ── System update ─────────────────────────────────────────────────────────────
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git build-essential nginx ufw

# ── Node.js 20 via NodeSource ─────────────────────────────────────────────────
echo ">>> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
echo "Node: $(node -v) | npm: $(npm -v)"

# ── PM2 ───────────────────────────────────────────────────────────────────────
echo ">>> Installing PM2..."
npm install -g pm2

# ── MongoDB 7 ─────────────────────────────────────────────────────────────────
echo ">>> Installing MongoDB 7..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc \
  | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
. /etc/os-release
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu ${UBUNTU_CODENAME}/mongodb-org/7.0 multiverse" \
  | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update -qq
apt-get install -y mongodb-org
systemctl start mongod
systemctl enable mongod
echo "MongoDB: $(systemctl is-active mongod)"

# ── Redis ─────────────────────────────────────────────────────────────────────
echo ">>> Installing Redis..."
apt-get install -y redis-server
systemctl start redis-server
systemctl enable redis-server
echo "Redis: $(systemctl is-active redis-server)"

# ── Firewall ──────────────────────────────────────────────────────────────────
echo ">>> Configuring UFW..."
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── Directories ───────────────────────────────────────────────────────────────
mkdir -p /var/www/nikstore
mkdir -p /var/log/pm2

echo ""
echo "══════════════════════════════════════════"
echo " Setup complete! Next steps:"
echo "══════════════════════════════════════════"
echo "1. git clone https://github.com/Diako999/NikStore.git /var/www/nikstore"
echo "2. Create .env files from deploy/*.env.example"
echo "3. bash /var/www/nikstore/deploy/deploy.sh --first-run"
