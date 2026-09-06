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

# ── Node.js 22 via NodeSource ─────────────────────────────────────────────────
# Node 20 is not enough: isomorphic-dompurify's jsdom/undici stack calls a
# Node 22+-only API (webidl.util.markAsUncloneable) and crashes at require()
# time on Node 20 — confirmed by hand, not a version-bump-for-its-own-sake.
echo ">>> Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
echo "Node: $(node -v) | npm: $(npm -v)"

# ── PM2 ───────────────────────────────────────────────────────────────────────
echo ">>> Installing PM2..."
npm install -g pm2

# ── MongoDB 7 (via Docker) ────────────────────────────────────────────────────
# MongoDB's official apt repo (repo.mongodb.org) is AWS CloudFront-backed and
# returns 403 for traffic from some regions regardless of Ubuntu codename —
# this is enforced at the AWS edge, not fixable via repo config. Running
# MongoDB as a container from Docker Hub's own registry sidesteps that
# specific host entirely and is otherwise a completely standard deployment
# pattern. Docker itself installs from Ubuntu's own repo — no external host
# needed for that part.
echo ">>> Installing Docker..."
apt-get install -y docker.io
systemctl enable --now docker

# If Docker Hub's own registry/auth endpoints are also unreliable from this
# network, route through a regional mirror instead — this only affects where
# the (public, unmodified) image is fetched from, not what runs.
if ! timeout 8 curl -fsS https://auth.docker.io/token >/dev/null 2>&1; then
  echo ">>> auth.docker.io unreliable — configuring a registry mirror..."
  mkdir -p /etc/docker
  cat > /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": ["https://docker.arvancloud.ir"]
}
EOF
  systemctl restart docker
fi

echo ">>> Starting MongoDB container..."
MONGO_ROOT_PASSWORD=$(openssl rand -hex 24)
MONGO_APP_PASSWORD=$(openssl rand -hex 24)
mkdir -p /var/lib/nikstore-mongo
docker run -d --name nikstore-mongo --restart unless-stopped \
  -p 127.0.0.1:27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD="$MONGO_ROOT_PASSWORD" \
  -v /var/lib/nikstore-mongo:/data/db \
  mongo:7

echo ">>> Waiting for MongoDB to accept connections..."
for i in $(seq 1 30); do
  docker exec nikstore-mongo mongosh --quiet -u root -p "$MONGO_ROOT_PASSWORD" \
    --authenticationDatabase admin --eval 'db.adminCommand("ping")' >/dev/null 2>&1 && break
  sleep 1
done

echo ">>> Creating MongoDB app user..."
docker exec nikstore-mongo mongosh --quiet -u root -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin --eval "
    db.getSiblingDB('nikstore').createUser({
      user: 'nikstore_app',
      pwd: '$MONGO_APP_PASSWORD',
      roles: [{ role: 'readWrite', db: 'nikstore' }]
    });
  "

# Persisted for backup.sh/healthcheck.sh, which need to reach Mongo via
# `docker exec` (no mongosh/mongodump binaries exist on the host itself).
umask 077
echo "$MONGO_ROOT_PASSWORD" > /root/.mongo_root_password
chmod 600 /root/.mongo_root_password

echo "MongoDB (containerized, auth enabled): $(docker inspect -f '{{.State.Status}}' nikstore-mongo)"

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
