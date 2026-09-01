# نیک (Nik) — فروشگاه اینترنتی نیک

## معماری
- **Backend**: NestJS 11 · Port 3001
- **Storefront**: Nuxt 3 SSR · Port 3000
- **Admin**: Vue 3 + Express · Port 4001
- **DB**: MongoDB 7
- **Cache**: Redis

## Deploy روی VPS

```bash
# اولین بار
git clone https://github.com/Diako999/NikStore.git /var/www/nikstore
cd /var/www/nikstore
bash deploy/setup.sh

# ایجاد .env files
cp deploy/backend.env.example nikstore/.env
cp deploy/nuxt.env.example nikstore-nuxt/.env
nano nikstore/.env        # مقادیر واقعی را بزن

# اولین deploy
bash deploy/deploy.sh --first-run
```

## بعد از خرید دامنه
```bash
apt install certbot python3-certbot-nginx
cp deploy/nginx-domain.conf /etc/nginx/sites-available/nikstore
sed -i 's/nikstore.ir/YOUR_DOMAIN/g' /etc/nginx/sites-available/nikstore
nginx -t && systemctl reload nginx
certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

## دستورات مفید
```bash
pm2 list                    # وضعیت سرویس‌ها
pm2 logs nikstore-backend   # لاگ backend
pm2 restart all             # ریستارت همه
bash deploy/deploy.sh       # بروزرسانی
bash deploy/backup.sh       # بکاپ دستی
```
