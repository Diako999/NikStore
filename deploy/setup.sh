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

# ── MongoDB auth ──────────────────────────────────────────────────────────────
# Both DBs bind to 127.0.0.1 and are firewalled off by ufw below, but auth is
# added anyway as defense-in-depth against a local misconfiguration or a future
# process on the box.
echo ">>> Creating MongoDB app user..."
MONGO_APP_PASSWORD=$(openssl rand -hex 24)
mongosh --quiet --eval "
  db = db.getSiblingDB('nikstore');
  if (!db.getUser('nikstore_app')) {
    db.createUser({
      user: 'nikstore_app',
      pwd: '$MONGO_APP_PASSWORD',
      roles: [{ role: 'readWrite', db: 'nikstore' }]
    });
  }
"
if ! grep -q "^security:" /etc/mongod.conf; then
  printf "\nsecurity:\n  authorization: enabled\n" >> /etc/mongod.conf
fi
systemctl restart mongod
echo "MongoDB (auth enabled): $(systemctl is-active mongod)"

# ── Redis ─────────────────────────────────────────────────────────────────────
echo ">>> Installing Redis..."
apt-get install -y redis-server
REDIS_APP_PASSWORD=$(openssl rand -hex 24)
if ! grep -q "^requirepass" /etc/redis/redis.conf; then
  echo "requirepass $REDIS_APP_PASSWORD" >> /etc/redis/redis.conf
fi
systemctl start redis-server
systemctl enable redis-server
systemctl restart redis-server
echo "Redis (auth enabled): $(systemctl is-active redis-server)"

# ── Firewall ──────────────────────────────────────────────────────────────────
echo ">>> Configuring UFW..."
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 4000/tcp
ufw --force enable

# ── Directories ───────────────────────────────────────────────────────────────
mkdir -p /var/www/nikstore
mkdir -p /var/log/pm2

echo ""
echo "══════════════════════════════════════════"
echo " Database credentials — save these now, shown only once:"
echo "══════════════════════════════════════════"
echo " MONGODB_URI=mongodb://nikstore_app:${MONGO_APP_PASSWORD}@localhost:27017/nikstore?authSource=nikstore"
echo " REDIS_PASSWORD=${REDIS_APP_PASSWORD}"
echo ""
echo "══════════════════════════════════════════"
echo " Setup complete! Next steps:"
echo "══════════════════════════════════════════"
echo "1. git clone https://github.com/Diako999/NikStore.git /var/www/nikstore"
echo "2. Create .env files from deploy/*.env.example, pasting in the credentials above"
echo "3. bash /var/www/nikstore/deploy/deploy.sh --first-run"
