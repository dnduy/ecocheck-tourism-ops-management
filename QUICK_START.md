# ⚡ QUICK START - TÍC HỢP LARAVEL API + REACT

## 📦 BACKEND SETUP (5 phút)

### **1. Tạo Laravel Project**
```bash
composer create-project laravel/laravel ecocheck-api
cd ecocheck-api
```

### **2. Cài Sanctum Authentication**
```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
composer require fruitcake/laravel-cors
php artisan vendor:publish --tag="cors"
```

### **3. Copy Files từ Delivery**
Copy tất cả code từ **Part 1-11** (migrations, models, controllers, requests, routes):

```
✅ database/migrations/*.php (14 files)
✅ app/Models/*.php (12 files)
✅ app/Http/Controllers/Api/*.php (7 files)
✅ app/Http/Requests/*.php (10 files)
✅ app/Console/Commands/ImportTemplatesCommand.php
✅ database/seeders/RoleAndAdminSeeder.php
✅ routes/api.php
✅ config/sanctum.php (create new)
```

### **4. Configure .env**
```bash
cp .env.example .env
php artisan key:generate

# Edit .env:
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ecocheck
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DOMAIN=localhost
```

### **5. Setup Database & Seed**
```bash
php artisan migrate
php artisan db:seed --class=RoleAndAdminSeeder
```

### **6. Start Server**
```bash
php artisan serve
```
✅ **Backend running at: `http://localhost:8000/api`**

---

## 🎨 FRONTEND SETUP (3 phút)

### **1. Copy Service Files**
Copy tất cả files từ `services/`:
```
✅ services/api.ts
✅ services/authService.ts
✅ services/areaService.ts
✅ services/templateService.ts
✅ services/runService.ts
✅ services/entryService.ts
✅ services/signoffService.ts
✅ services/incidentService.ts
✅ services/userService.ts
```

### **2. Update Environment**
**File: `.env.local`**
```bash
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="EcoCheck - Ops Management"
```

### **3. Update Key Files**
- ✅ **types.ts** - Update role enums to lowercase: `'staff'`, `'manager'`, etc.
- ✅ **Login.tsx** - Use `authService.login()`
- ✅ **App.tsx** - Replace with `App_NEW.tsx`

### **4. Start Dev Server**
```bash
npm run dev
```
✅ **Frontend running at: `http://localhost:5173`**

---

## 🔐 TEST LOGIN

**Default Admin Account:**
```
Email: admin@local.test
Password: ChangeMe123!
Role: Manager
```

Try logging in at `http://localhost:5173`

---

## ✅ VERIFY INTEGRATION

### **Option 1: Browser Test**
1. Open `http://localhost:5173` in browser
2. Login with admin account
3. Check Console (F12) for any errors
4. Go to Admin tab → Create Area → Should see success notification

### **Option 2: API Test with cURL**
```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.test","password":"ChangeMe123!"}' | jq -r '.token')

# Test endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/areas

# Should return: []
```

---

## 📊 DATABASE STRUCTURE

After migration, you'll have these tables:

```
users ────────────────┐
                      ├──→ area_user
areas ────────────────┤
  └─→ checklist_templates
      ├─→ sessions ──→ template_columns ──→ roles
      ├─→ groups
      ├─→ items
      └─→ runs
          ├─→ entries
          ├─→ signoffs
          └─→ incidents
```

---

## 🚨 COMMON ISSUES & FIXES

### **Issue: "Unauthorized" on login**
```
❌ Response: {message: "Unauthorized"}
```

**Fix:**
1. Check admin user exists:
   ```bash
   php artisan tinker
   >>> User::where('email', 'admin@local.test')->first()
   ```
2. Re-seed if missing:
   ```bash
   php artisan migrate:fresh
   php artisan db:seed --class=RoleAndAdminSeeder
   ```

### **Issue: CORS error**
```
❌ Access-Control-Allow-Origin header missing
```

**Fix:**
1. Verify `config/cors.php` exists
2. Check `allowed_origins` includes `http://localhost:5173`
3. Clear cache:
   ```bash
   php artisan config:clear
   ```

### **Issue: "Module not found" in Frontend**
```
❌ Cannot find module './services/api'
```

**Fix:**
- Copy all 9 service files into `services/` folder
- Verify file paths: `services/api.ts`, `services/authService.ts`, etc.

---

## 📝 WHAT'S DIFFERENT FROM OLD APP?

| Feature | Old | New |
|---------|-----|-----|
| Authentication | localStorage only | Sanctum JWT tokens |
| Database | Browser localStorage | MySQL |
| Data Sync | In-memory state | Server source of truth |
| Offline Mode | Works offline | Requires internet |
| Multi-user | Single-user only | Multi-user support |
| Scalability | ~100 checklists max | Unlimited |

---

## 🎯 NEXT: Update Pages (Optional)

The main App.tsx is updated, but you can also optimize individual pages:

### **ChecklistExecution.tsx** - Load runs from API
```typescript
const runDetail = await runService.get(checklistId);
```

### **Incidents.tsx** - Already integrated!
```typescript
const list = await incidentService.list();
```

### **Admin.tsx** - User management via API
```typescript
const users = await userService.getAll();
```

---

## 💡 USEFUL COMMANDS

```bash
# Reset database
php artisan migrate:fresh --seed

# View all routes
php artisan route:list

# Check Laravel logs
tail -f storage/logs/laravel.log

# Inspect database
php artisan tinker
>>> User::all()
>>> Area::all()
>>> Incident::all()

# Test mail (if added later)
php artisan tinker
>>> Mail::to('user@example.com')->send(new TestMail());
```

---

## 🚀 YOU'RE DONE!

Both systems are now connected:

- ✅ React frontend talks to Laravel API
- ✅ Authentication with Sanctum tokens
- ✅ Data persisted in MySQL
- ✅ Ready for production setup

**Next steps:**
1. Update remaining page components
2. Add photo upload handling
3. Deploy to production
4. Add real-time notifications (WebSockets)

---

**Questions? Check INTEGRATION_GUIDE.md for detailed instructions** 📚
