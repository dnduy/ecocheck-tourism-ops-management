# 🚀 HƯỚNG DẪN TÍCH HỢP LARAVEL API VỚI REACT FRONTEND

## 📋 BƯỚC-BƯỚC THỰC HIỆN

### **BƯỚC 1: Chuẩn BỊ Backend Laravel**

```bash
# 1.1 Tạo project Laravel mới
composer create-project laravel/laravel ecocheck-api
cd ecocheck-api

# 1.2 Cài đặt Sanctum
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# 1.3 Copy tất cả files từ phần "Laravel API Implementation" vào project này:
# - app/Http/Controllers/Api/*.php
# - app/Http/Requests/*.php
# - app/Models/*.php
# - app/Console/Commands/ImportTemplatesCommand.php
# - database/migrations/*.php
# - database/seeders/RoleAndAdminSeeder.php
# - routes/api.php
# - config/sanctum.php

# 1.4 Configure .env
cp .env.example .env
php artisan key:generate

# Chỉnh sửa .env:
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ecocheck
DB_USERNAME=root
DB_PASSWORD=yourpassword

# CORS config cho frontend:
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
SESSION_DOMAIN=localhost

# 1.5 Chạy migrations & seeders
php artisan migrate
php artisan db:seed --class=RoleAndAdminSeeder

# 1.6 Khởi động server
php artisan serve
# API sẽ chạy tại: http://localhost:8000/api
```

---

### **BƯỚC 2: Cập Nhật Frontend React**

```bash
# 2.1 Copy tất cả service files vào dự án React:
# - services/api.ts
# - services/authService.ts
# - services/areaService.ts
# - services/templateService.ts
# - services/runService.ts
# - services/entryService.ts
# - services/signoffService.ts
# - services/incidentService.ts

# 2.2 Cập nhật environment config
cp .env.example .env.local

# Chỉnh sửa .env.local:
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="EcoCheck - Ops Management"

# 2.3 Cập nhật types.ts (role enum phải match Laravel)
# Role values: 'staff' | 'supervisor' | 'maintenance' | 'manager' (lowercase)

# 2.4 Thay thế App.tsx với App_NEW.tsx
mv App.tsx App_OLD.tsx
mv App_NEW.tsx App.tsx

# 2.5 Cập nhật Login.tsx 
# (Đã cập nhật ở trên, sử dụng authService thay vì localStorage)

# 2.6 Chạy dev server
npm run dev
# Frontend sẽ chạy tại: http://localhost:5173
```

---

### **BƯỚC 3: Kiểm Tra Kết Nối**

#### **3.1 Đăng Nhập Thử**
```
Email: admin@local.test
Password: ChangeMe123!
Role: manager
```

#### **3.2 Test API với cURL**

```bash
# Lấy token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.test","password":"ChangeMe123!"}' \
  | jq -r '.token')

# Lấy thông tin user hiện tại
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/me

# Lấy danh sách areas
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/areas

# Tạo area mới
curl -X POST http://localhost:8000/api/areas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bếp Trung Tâm","type":"F&B","description":"Khu bếp chính"}'
```

---

### **BƯỚC 4: Tích Hợp Chi Tiết Từng Page**

#### **4.1 Dashboard (Dashboard.tsx)**

Cần cập nhật để gọi API thay vì dùng mock data:

```typescript
// OLD: 
const myChecklists = checklists.filter(c => c.assignedTo === user.id);

// NEW:
useEffect(() => {
  const fetchRuns = async () => {
    try {
      const data = await runService.list({
        assigned_to: user.id,
        date: new Date().toISOString().split('T')[0]
      });
      setMyRuns(data.data || []);
    } catch (error) {
      console.error('Error fetching runs:', error);
    }
  };
  fetchRuns();
}, [user.id]);
```

#### **4.2 ChecklistExecution (ChecklistExecution.tsx)**

Cần cập nhật để:
- Load run detail từ API
- Update entries với entryService.upsert()
- Submit run status

```typescript
// Load run on mount
useEffect(() => {
  const loadRun = async () => {
    try {
      const detail = await runService.get(parseInt(checklistId));
      setRun(detail);
      setEntries(detail.entries);
    } catch (error) {
      console.error('Error loading run:', error);
    }
  };
  loadRun();
}, [checklistId]);

// Update cell entry
const handleUpdateCell = async (itemId: number, columnId: number, value: string) => {
  try {
    await entryService.upsert({
      run_id: run.run.id,
      item_id: itemId,
      column_id: columnId,
      value
    });
    addNotification('Cập nhật', 'Ô kiểm tra đã được lưu', 'SUCCESS');
  } catch (error) {
    addNotification('Lỗi', error.message, 'CRITICAL');
  }
};
```

#### **4.3 Incidents (Incidents.tsx)**

Đã tích hợp trong App.tsx:
- `incidentService.list()` - lấy danh sách
- `incidentService.create()` - tạo sự cố mới
- `incidentService.update()` - cập nhật trạng thái

#### **4.4 Admin (Admin.tsx)**

Cần cập nhật để gọi API:
- `areaService.create/update/delete()` - quản lý khu vực
- Thêm `templateService.createTemplate()` cho template management
- `userService` (cần tạo thêm) cho user management

#### **4.5 Reports (Reports.tsx)**

Có thể thêm API endpoint `/api/reports/summary` để lấy dữ liệu thống kê.

---

### **BƯỚC 5: CORS & Security Setup**

#### **5.1 Backend - Enable CORS (Laravel)**

File: `config/cors.php` (tạo nếu chưa có)

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

Cài CORS middleware:
```bash
composer require fruitcake/laravel-cors
php artisan vendor:publish --tag="cors"
```

Thêm vào `app/Http/Kernel.php`:
```php
protected $middleware = [
    // ...
    \Fruitcake\Cors\HandleCors::class,
];
```

#### **5.2 Frontend - CORS Header**

Đã thêm vào `api.ts`:
```typescript
const headers: HeadersInit = {
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
};
```

---

### **BƯỚC 6: Import Templates (Optional)**

Nếu có file JSON export từ Excel:

```bash
# Đặt file vào /mnt/data/checklist_templates_from_excel.json

# Chạy artisan command
php artisan templates:import --path="/mnt/data/checklist_templates_from_excel.json"

# Check kết quả
php artisan tinker
>>> App\Models\Area::count()
>>> App\Models\ChecklistTemplate::count()
>>> App\Models\Item::count()
```

---

## 🔑 KEY API ENDPOINTS MAPPING

| Feature | Old (localStorage) | New (API) |
|---------|------------------|-----------|
| Login | `handleLogin()` → localStorage | `authService.login()` → API + Sanctum token |
| Logout | `handleLogout()` → clear localStorage | `authService.logout()` → revoke token |
| Get Areas | `db.getAreas()` | `areaService.getAll()` |
| Create Area | `db.createArea()` | `areaService.create()` |
| Get Runs | State filter | `runService.list(filters)` |
| Create Run | In-memory | `runService.create(areaId, date)` |
| Get Run Detail | State access | `runService.get(runId)` |
| Update Entry | State mutation | `entryService.upsert(data)` |
| Signoff | In-memory | `signoffService.create(data)` |
| Get Incidents | State filter | `incidentService.list(filters)` |
| Create Incident | In-memory | `incidentService.create(data)` |
| Update Incident | State mutation | `incidentService.update(id, data)` |

---

## ⚙️ CONFIGURATION CHECKLIST

- [x] Laravel API server running on `http://localhost:8000`
- [x] Frontend dev server running on `http://localhost:5173`
- [x] `.env.local` configured with `VITE_API_URL=http://localhost:8000/api`
- [x] Database seeded with admin user
- [x] CORS enabled on backend
- [x] Sanctum tokens working
- [x] All service files in `services/` folder
- [x] `types.ts` updated with lowercase role enums
- [x] Login page using `authService`
- [x] App.tsx using new API calls

---

## 🧪 TROUBLESHOOTING

### **CORS Error**
```
Access to XMLHttpRequest at 'http://localhost:8000/api/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Fix:**
1. Ensure `config/cors.php` has `http://localhost:5173` in `allowed_origins`
2. Middleware order in `Kernel.php`
3. Clear config cache: `php artisan config:clear`

### **401 Unauthorized**
```
Response: {message: "Unauthorized - please login again"}
```

**Fix:**
1. Check token in localStorage: `localStorage.getItem('api_token')`
2. Verify token in `Authorization: Bearer {token}` header
3. Run seeders again: `php artisan db:seed --class=RoleAndAdminSeeder`

### **Validation Error**
```
{errors: {email: ["The email field is required"]}}
```

**Fix:**
1. Check form request validation rules in `app/Http/Requests/`
2. Ensure all required fields are sent
3. Match field names exactly (snake_case for API)

---

## 📱 TESTING THE INTEGRATION

### **Manual Test Workflow**

1. **Start Backend**
   ```bash
   cd ecocheck-api
   php artisan serve
   ```

2. **Start Frontend**
   ```bash
   cd ecocheck-tourism-ops-management
   npm run dev
   ```

3. **Login**
   - Email: `admin@local.test`
   - Password: `ChangeMe123!`

4. **Test Area Creation** (Admin Tab)
   - Create new area
   - Verify appears in backend DB: `php artisan tinker` → `Area::all()`

5. **Test Run Creation** (Checklists Tab)
   - Select area
   - Create run for today
   - Verify in API response

6. **Test Entry Update** (Execution Tab)
   - Update a checklist cell
   - Check DB: entries table updated

7. **Test Incident Creation** (Incidents Tab)
   - Create new incident
   - Verify in incidents list
   - Update status

---

## 🎯 NEXT STEPS

- [ ] Update all page components to use API services
- [ ] Add userService for user management (Admin tab)
- [ ] Add template management API integration
- [ ] Add photo upload to entries
- [ ] Implement offline mode with service workers
- [ ] Add real-time updates with WebSockets (optional)
- [ ] Setup production deployment

---

## 📞 SUPPORT

Nếu gặp vấn đề:

1. Kiểm tra console frontend (DevTools F12)
2. Kiểm tra server logs:
   ```bash
   php artisan serve --verbose
   ```
3. Verify API response:
   ```bash
   curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/areas
   ```
4. Check database:
   ```bash
   php artisan tinker
   >>> DB::select('SELECT * FROM areas')
   ```

---

**Chúc mừng! Bạn đã tích hợp thành công Laravel API với React frontend! 🎉**
