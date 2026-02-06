# OPERATIONS RUNBOOK - EcoCheck Tourism Ops

## Tong quan he thong
- Frontend (Vite): `http://localhost:3001` khi dev
- Backend API (Laravel): `http://127.0.0.1:8000`
- CSDL: SQLite (dev), MySQL/PostgreSQL (prod)
- Auth: Sanctum + token bearer

## Checklist hang ngay
1. Kiem tra backend phan hoi:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000
```
2. Kiem tra API login (bao dam auth hoat dong):
```bash
curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.test","password":"ChangeMe123!"}'
```
3. Kiem tra frontend:
```bash
curl -I http://localhost:3001
```

## Khoi dong va khoi phuc dich vu
### Development
```bash
cd backend-app
php artisan serve --host=127.0.0.1 --port=8000
```
```bash
npm run dev
```

### Production (tham khao)
```bash
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
```

## Log quan trong
- Laravel: `backend-app/storage/logs/laravel.log`
- Nginx access: `/var/log/nginx/access.log`
- Nginx error: `/var/log/nginx/error.log`

## Backup va phuc hoi
### MySQL
```bash
mysqldump -u <user> -p <db_name> > backup.sql
```
### PostgreSQL
```bash
pg_dump -U <user> -d <db_name> > backup.sql
```
### SQLite (dev)
```bash
cp backend-app/database/database.sqlite backup.sqlite
```

## Kiem tra du lieu checklist
```sql
-- Dem run theo trang thai workflow
select work_status, count(*) from checklist_runs group by work_status;

-- Tim run treo o needs_review
select id, area_id, run_date from checklist_runs where work_status = 'needs_review';
```

## Smoke test nhanh
```bash
RUN_SMOKE_TESTS=true API_BASE_URL=http://127.0.0.1:8000/api npm run test:smoke
```

## Su co thuong gap va xu ly nhanh
1. 401 Unauthorized
- Kiem tra token, kiem tra login lai, kiem tra CORS va Sanctum config.
2. 422 Validation error
- Kiem tra payload (area_id, template_id, run_date).
3. Run khong vao tab "Can duyet"
- Kiem tra `work_status` va mapping tren frontend.
4. Run grouping sai ngay
- Kiem tra `run_date` tra ve tu API va mapping `run.date` tren UI.

## Bien moi truong quan trong
### Backend
- `APP_ENV`, `APP_DEBUG`, `APP_URL`
- `DB_CONNECTION`, `DB_DATABASE`, `DB_HOST`, `DB_PORT`
- `SANCTUM_STATEFUL_DOMAINS`
- `CORS_ALLOWED_ORIGINS`

### Frontend
- `VITE_API_URL`
