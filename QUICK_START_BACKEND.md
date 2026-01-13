# 🚀 Quick Start Guide - EcoCheck Backend Laravel 12

## Prerequisites

- PHP 8.2 or higher
- Composer
- MySQL 8.0 or higher
- Node.js 18+ and npm
- Git

## Step-by-Step Setup

### 1️⃣ Backend Setup (Laravel 12)

```bash
# Navigate to backend directory
cd backend-app

# Install PHP dependencies
composer install

# Configure environment
cp .env.example .env

# IMPORTANT: Edit .env file with your database credentials
nano .env  # or use your preferred editor
```

**Required .env changes:**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ecocheck
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

APP_URL=http://localhost:8000
```

```bash
# Generate application key
php artisan key:generate

# Create database (if not exists)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ecocheck CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
php artisan migrate

# Seed default users
php artisan db:seed

# Import checklist templates from JSON
php artisan templates:import --path="../checklist_structure_analysis.json"

# Start Laravel development server
php artisan serve --host=127.0.0.1 --port=8000
```

**Backend is now running at:** `http://127.0.0.1:8000`

---

### 2️⃣ Frontend Setup (React + Vite)

Open a **new terminal window** and run:

```bash
# From project root
cd /path/to/ecocheck-tourism-ops-management

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

**Frontend is now running at:** `http://localhost:3001`

---

### 3️⃣ Test the API

**Test Login:**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@local.test",
    "password": "ChangeMe123!"
  }'
```

You should receive a response with a token:
```json
{
  "token": "1|xxxxxxxxxxxxxxxxxxxxx",
  "user": {
    "id": 1,
    "name": "System Administrator",
    "email": "admin@local.test",
    "role": "manager"
  }
}
```

**Test with the token:**
```bash
# Replace YOUR_TOKEN with the token from login response
curl http://127.0.0.1:8000/api/areas \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔑 Default Test Accounts

| Role | Email | Password |
|------|-------|----------|
| **Manager** | admin@local.test | ChangeMe123! |
| **Supervisor** | supervisor@local.test | password123 |
| **Staff** | staff@local.test | password123 |
| **Maintenance** | maintenance@local.test | password123 |

---

## 📋 Verify Installation

### Check Backend

1. **API Routes:**
   ```bash
   cd backend-app
   php artisan route:list --path=api
   ```

2. **Database Tables:**
   ```bash
   php artisan migrate:status
   ```

3. **Test Artisan Commands:**
   ```bash
   php artisan templates:import --help
   ```

### Check Frontend

1. **Open browser:** http://localhost:3001
2. **Login with:** admin@local.test / ChangeMe123!
3. **Verify:**
   - No Gemini/AI references in console
   - Incidents page loads without errors
   - All icons display correctly

---

## 🐛 Troubleshooting

### Backend Issues

**Database connection error:**
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'ecocheck';"

# Check .env credentials match your MySQL setup
```

**Migration errors:**
```bash
# Fresh start (WARNING: deletes all data)
php artisan migrate:fresh --seed

# Or rollback and migrate again
php artisan migrate:rollback
php artisan migrate
```

**Permission errors:**
```bash
# Fix storage permissions (Mac/Linux)
chmod -R 775 storage bootstrap/cache
chown -R $USER:www-data storage bootstrap/cache

# Windows
# No need, just ensure you're running as admin
```

### Frontend Issues

**Port already in use:**
```bash
# Change port in vite.config.ts (line 9)
server: {
  port: 3002,  // Change this number
  host: '0.0.0.0',
},
```

**Module not found errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📁 Project Structure

```
ecocheck-tourism-ops-management/
├── backend-app/                    # Laravel 12 Backend
│   ├── app/
│   │   └── Domains/               # Domain-driven structure
│   │       ├── Checklist/         # Checklist domain
│   │       ├── User/              # User & Auth
│   │       └── Incident/          # Incident management
│   ├── database/
│   │   ├── migrations/            # 13 migration files
│   │   └── seeders/               # Default users
│   ├── routes/
│   │   └── api.php                # All API routes
│   └── .env                       # Configuration
├── pages/                         # React components
├── services/                      # Frontend services
├── package.json                   # Frontend dependencies (NO Gemini!)
└── checklist_structure_analysis.json  # Template data

```

---

## 🎯 Next Steps

1. **Import your actual checklist data:**
   ```bash
   php artisan templates:import --path="path/to/your/data.json"
   ```

2. **Create test data:**
   - Login as manager
   - Create areas via API or frontend
   - Create checklist runs
   - Test workflows

3. **Customize as needed:**
   - Add more seeder data
   - Adjust validation rules
   - Add custom API endpoints
   - Enhance authorization logic

---

## 📚 Documentation

- Full implementation details: `LARAVEL_BACKEND_IMPLEMENTATION.md`
- API endpoints reference: See above document
- Database schema: See migrations in `backend-app/database/migrations/`

---

## ✅ Success Criteria

- [ ] Backend server running on port 8000
- [ ] Frontend running on port 3001
- [ ] Login successful with test accounts
- [ ] API returns valid JSON responses
- [ ] Database migrations completed
- [ ] Template import working
- [ ] No Gemini/AI errors in console
- [ ] All 18 API routes registered

---

## 🆘 Need Help?

1. Check Laravel logs: `backend-app/storage/logs/laravel.log`
2. Check browser console for frontend errors
3. Verify all environment variables in `.env`
4. Ensure MySQL is running and accessible
5. Confirm PHP version: `php -v` (should be 8.2+)

---

**Ready to use! 🎉**

The system is now fully functional with:
- ✅ Laravel 12 REST API
- ✅ Sanctum authentication
- ✅ Domain-driven architecture
- ✅ Excel-based grid checklist support
- ✅ Incident management (NO AI)
- ✅ User role management
- ✅ Template import system
- ✅ Frontend without Gemini dependencies
