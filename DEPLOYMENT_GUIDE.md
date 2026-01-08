# 🚀 DEPLOYMENT GUIDE - EcoCheck Tourism Ops

## 📋 PRE-DEPLOYMENT CHECKLIST

### Backend Preparation
- [ ] Laravel environment configured for production
- [ ] Database migrations tested
- [ ] Seeder data prepared (or production data migrated)
- [ ] API routes tested with Postman/curl
- [ ] CORS origins restricted to production domain
- [ ] Sanctum configuration updated for production
- [ ] .env.production configured
- [ ] Database backups scheduled
- [ ] Error logging configured (Sentry, Papertrail, etc.)

### Frontend Preparation
- [ ] Environment variables set (VITE_API_URL)
- [ ] Production build tested locally
- [ ] Bundle size optimized (< 600KB main chunk)
- [ ] Performance metrics validated
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility tested
- [ ] Error boundary tested
- [ ] Assets optimized (images, fonts)

---

## 🏗️ BACKEND DEPLOYMENT (Laravel)

### Option 1: Traditional VPS/Server

#### Requirements
- PHP 8.2+
- Composer
- MySQL/PostgreSQL (or SQLite for small deployments)
- Web server (Nginx/Apache)
- SSL certificate (Let's Encrypt)

#### Steps

1. **Clone & Install**
```bash
cd /var/www
git clone <repository-url> ecocheck
cd ecocheck/backend-app

composer install --no-dev --optimize-autoloader
```

2. **Configure Environment**
```bash
cp .env.example .env
nano .env
```

**.env Production Settings:**
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ecocheck_prod
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password

SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
SESSION_DOMAIN=.yourdomain.com

CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

3. **Initialize Application**
```bash
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=RoleAndAdminSeeder
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

4. **Set Permissions**
```bash
chown -R www-data:www-data /var/www/ecocheck
chmod -R 755 /var/www/ecocheck
chmod -R 775 storage bootstrap/cache
```

5. **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    root /var/www/ecocheck/backend-app/public;
    index index.php;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

6. **Restart Services**
```bash
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
```

### Option 2: Laravel Forge (Recommended)

1. Connect Forge to your server
2. Create new site: `api.yourdomain.com`
3. Deploy repository (auto-deployment on push)
4. Set environment variables in Forge panel
5. Run migrations via Forge console
6. Enable SSL (Forge handles Let's Encrypt)

### Option 3: Laravel Vapor (Serverless)

1. Install Vapor CLI: `composer require laravel/vapor-cli`
2. Configure `vapor.yml`
3. Deploy: `vapor deploy production`

---

## 🌐 FRONTEND DEPLOYMENT (React + Vite)

### Option 1: Vercel (Recommended for Frontend)

#### Steps

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Configure Environment**
Create `.env.production`:
```env
VITE_API_URL=https://api.yourdomain.com/api
GEMINI_API_KEY=your_key_if_needed
```

3. **Deploy**
```bash
vercel --prod
```

4. **Custom Domain**
- Add domain in Vercel dashboard
- Configure DNS:
  - Type: CNAME
  - Name: www (or @)
  - Value: cname.vercel-dns.com

**vercel.json** (if needed):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### Option 2: Netlify

1. **Build Settings**
```
Build command: npm run build
Publish directory: dist
```

2. **Environment Variables**
- Add `VITE_API_URL` in Netlify dashboard

3. **Redirects** (`public/_redirects`):
```
/*    /index.html   200
```

### Option 3: Traditional Server (Nginx)

1. **Build Locally**
```bash
npm run build
```

2. **Upload dist/ to Server**
```bash
scp -r dist/* user@server:/var/www/ecocheck-frontend/
```

3. **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/ecocheck-frontend;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🔐 SECURITY HARDENING

### Backend
```bash
# .env production
APP_DEBUG=false
LOG_LEVEL=error

# Restrict CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Enable rate limiting (already in routes/api.php)
# Consider adding fail2ban for repeated auth failures
```

### Frontend
- Enable HTTPS only (HSTS)
- Set CSP headers
- Disable source maps in production
- Use environment-specific API URLs
- Rotate API keys regularly

### Database
- Use strong passwords
- Restrict database access to backend server only
- Enable automated backups (daily)
- Use read replicas for scaling

---

## 📊 MONITORING & MAINTENANCE

### Health Checks
```bash
# Backend health endpoint
curl https://api.yourdomain.com/health

# Frontend health
curl -I https://yourdomain.com
```

### Logs
```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### Monitoring Tools (Recommended)
- **Uptime:** UptimeRobot, Pingdom
- **Performance:** New Relic, DataDog
- **Errors:** Sentry (Laravel + React)
- **Analytics:** Google Analytics, Plausible

---

## 🔄 CI/CD PIPELINE (Optional)

### GitHub Actions Example

**.github/workflows/deploy.yml**
```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/ecocheck/backend-app
            git pull
            composer install --no-dev
            php artisan migrate --force
            php artisan config:cache
            php artisan route:cache

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install & Build
        run: |
          npm ci
          npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🧪 POST-DEPLOYMENT VALIDATION

Run through [TEST_CHECKLIST.md](TEST_CHECKLIST.md) on production:

- [ ] Login works with production credentials
- [ ] API calls reach correct backend
- [ ] CORS allows frontend domain
- [ ] Data persists correctly
- [ ] Mobile responsive on real devices
- [ ] SSL certificate valid
- [ ] Performance metrics acceptable (Lighthouse > 90)
- [ ] Error monitoring active (Sentry receiving errors)

---

## 📞 TROUBLESHOOTING

### "Mixed Content" Error
- Ensure both frontend and backend use HTTPS
- Check `VITE_API_URL` uses https://

### CORS Error
- Verify `CORS_ALLOWED_ORIGINS` in backend .env
- Check `SANCTUM_STATEFUL_DOMAINS`
- Restart backend after .env changes

### 401 Unauthorized
- Clear localStorage and re-login
- Check token expiration (default: 60 minutes)
- Verify Sanctum middleware active

### Blank Page After Deploy
- Check browser console for errors
- Verify `VITE_API_URL` set correctly
- Check Nginx try_files directive for SPA routing

---

## 🎉 LAUNCH CHECKLIST

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] DNS configured correctly
- [ ] SSL certificates active
- [ ] Database seeded with initial data
- [ ] Admin account credentials shared securely
- [ ] Monitoring tools configured
- [ ] Backup system active
- [ ] Error tracking enabled
- [ ] Performance baseline recorded
- [ ] User documentation prepared
- [ ] Support contact established

---

**Deployment completed!** 🚀

For questions or issues, refer to PROJECT_STATUS.md or consult the development team.
