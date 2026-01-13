# BÁO CÁO KIỂM TRA HỆ THỐNG ECOCHECK

## ❌ VẤN ĐỀ PHÁT HIỆN

### 1. Backend API không trả về template.groups.items
- **Nguyên nhân:** Model `ChecklistTemplate` thiếu foreign key trong relationship `groups()`
- **Fix:** Đã sửa `ChecklistTemplate.php` để specify foreign key `checklist_template_id`

### 2. Tất cả users không có password hợp lệ
- **Fix:** Đã update password cho 13 users = `"password"`

### 3. Server process không ổn định
- Terminal background processes bị terminate

## ✅ ĐÃ FIX

### File: `backend-app/app/Models/ChecklistTemplate.php`
```php
public function groups(): HasMany
{
    return $this->hasMany(Group::class, 'checklist_template_id'); // ✅ Added foreign key
}
```

### File: `App.tsx`
```typescript
const addNotification = (title: string, message: string, type: 'CRITICAL' | 'NORMAL' | 'SUCCESS' = 'NORMAL') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // ✅ Fixed duplicate keys
    // ...
}
```

### File: `backend-app/routes/web.php`
```php
Route::get('/login', function () {
    return response()->json(['message' => 'Please use /api/auth/login for API authentication'], 401);
})->name('login'); // ✅ Added login route for Sanctum
```

### File: `backend-app/config/sanctum.php`
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3001,localhost:5173,127.0.0.1,127.0.0.1:3001,127.0.0.1:5173')), // ✅ Added :3001
```

## 📝 HƯỚNG DẪN KIỂM TRA

### Bước 1: Khởi động Backend
```bash
cd /Users/duyduong/Documents/code/ecocheck-tourism-ops-management/backend-app
php artisan serve --host=127.0.0.1 --port=8000
```

**GIỮ TERMINAL NÀY MỞ** - Đây là server backend

### Bước 2: Khởi động Frontend (Terminal mới)
```bash
cd /Users/duyduong/Documents/code/ecocheck-tourism-ops-management
npm run dev
```

Truy cập: http://localhost:3001

### Bước 3: Đăng nhập với các roles

#### 🔵 STAFF (Nhân viên thực hiện)
- **Email:** `hotel.staff1@local.test`
- **Password:** `password`
- **Chức năng:**
  - Xem danh sách nhiệm vụ được giao
  - Thực hiện checklist (tick OK/FAIL)
  - Báo cáo sự cố
  - Gửi báo cáo hoàn thành

#### 🟢 SUPERVISOR (Giám sát)
- **Email:** `hotel.manager@local.test`
- **Password:** `password`
- **Chức năng:**
  - Xem tất cả nhiệm vụ trong bộ phận
  - Duyệt báo cáo đã hoàn thành
  - Ký xác nhận (signoff)
  - Quản lý sự cố

#### 🟣 MANAGER (Quản lý cấp cao)
- **Email:** `admin@local.test`
- **Password:** `password`
- **Chức năng:**
  - Xem dashboard tổng quan
  - Quản lý templates
  - Xem báo cáo toàn hệ thống
  - Gán nhiệm vụ

## 🧪 KIỂM TRA CHỨC NĂNG CHO TỪNG ROLE

### Test cho STAFF
1. Đăng nhập với `hotel.staff1@local.test`
2. Vào tab **"Nhiệm vụ"**
3. Chọn filter **"Việc của tôi"**
4. Click vào checklist có status **"in_progress"** hoặc **"pending"**
5. **Kiểm tra:**
   - ✅ Thấy danh sách items với checkbox
   - ✅ Có thể tick OK/FAIL cho từng item
   - ✅ Thanh tiến độ (progress bar) tăng khi tick
   - ✅ Button "Báo cáo sự cố" hiện khi tick FAIL
   - ✅ Button "Hoàn thành" hiện khi tick hết items
6. **Thực hiện hành động:**
   - Tick 1-2 items là OK
   - Tick 1 item là FAIL → Nhập mô tả sự cố → Báo cáo
   - Tick hết các items còn lại
   - Click "Hoàn thành báo cáo"

### Test cho SUPERVISOR
1. Đăng nhập với `hotel.manager@local.test`
2. Vào tab **"Nhiệm vụ"**
3. Chọn filter **"Cần duyệt"**
4. **Kiểm tra:**
   - ✅ Thấy các checklist đã hoàn thành (status: completed)
   - ✅ Click vào checklist để xem chi tiết
   - ✅ Thấy tất cả items đã được tick bởi staff
   - ✅ Button "Xác nhận & Ký duyệt" hiện ở dưới cùng
5. **Thực hiện hành động:**
   - Click "Xác nhận & Ký duyệt"
   - Checklist chuyển sang status "reviewed"
6. Vào tab **"Sự cố"**
   - ✅ Thấy danh sách incidents
   - ✅ Click vào incident để xem/xử lý

### Test cho MANAGER
1. Đăng nhập với `admin@local.test`
2. Vào tab **"Dashboard"**
3. **Kiểm tra:**
   - ✅ Thấy thống kê tổng quan (runs, incidents, areas)
   - ✅ Biểu đồ hoạt động
   - ✅ Danh sách incidents quan trọng
4. Vào tab **"Admin"**
5. **Kiểm tra:**
   - ✅ Quản lý templates
   - ✅ Quản lý users
   - ✅ Quản lý areas

## 🛠️ NẾU CÒN LỖI

### Lỗi: Không thấy items trong checklist
**Kiểm tra backend console:**
```bash
# Trong terminal chạy backend, xem logs
```

**Test API trực tiếp:**
```bash
# Login
curl "http://127.0.0.1:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"hotel.staff1@local.test","password":"password"}'

# Lấy token từ response, thay vào <TOKEN> dưới đây
curl "http://127.0.0.1:8000/api/runs/72" \
  -H "Authorization: Bearer <TOKEN>"

# Phải thấy: data.template.groups[].items[]
```

### Lỗi: 401 Unauthorized
- Clear localStorage trong browser (F12 → Application → Local Storage → Clear)
- Đăng nhập lại

### Lỗi: Không kết nối được backend
```bash
# Kiểm tra backend có chạy không
lsof -ti:8000

# Nếu không có, khởi động lại:
cd backend-app
php artisan serve --host=127.0.0.1 --port=8000
```

## 📊 DATABASE TEST DATA

### Users (13 users)
- 1 manager: admin@local.test
- 3 supervisors: tour.manager, hotel.manager, restaurant.manager
- 6 staff: hotel.staff1, hotel.staff2, tour.staff1/2, restaurant.staff1/2
- 3 maintenance: maintenance.manager, maintenance.staff1/2

### Runs (210 runs for 30 days)
- Date range: 2026-01-01 to 2026-01-30
- Status distribution: pending, in_progress, completed, reviewed
- 7 runs mỗi ngày (7 templates khác nhau)

### Templates (7 templates)
1. Checklist Bếp Chính (48 items)
2. Checklist Quầy Bar (26 items)
3. Checklist WC & Toilet (12 items)
4. Checklist Tour Activities (42 items)
5. Checklist Tiếp Tân (81 items)
6. Checklist Phòng Khách (51 items)
7. Checklist Nhà Hàng Chính (22 items)

### Incidents (111 incidents)
- Severity: low, medium, high, critical
- Status: open, in_progress, resolved
- Liên kết với failed checklist items

## 🎯 LUỒNG HOẠT ĐỘNG CHUẨN

```
1. MANAGER tạo template checklist
   ↓
2. MANAGER hoặc SUPERVISOR gán nhiệm vụ (assign run) cho STAFF
   ↓
3. STAFF login → Xem "Việc của tôi" → Thực hiện checklist
   ↓
4. STAFF tick từng item (OK/FAIL)
   - Nếu FAIL → Báo cáo sự cố (incident)
   ↓
5. STAFF hoàn thành → Click "Hoàn thành báo cáo"
   ↓
6. SUPERVISOR login → Xem "Cần duyệt"
   ↓
7. SUPERVISOR kiểm tra → Click "Xác nhận & Ký duyệt"
   ↓
8. Checklist chuyển sang "Lịch sử" (reviewed)
   ↓
9. MANAGER xem Dashboard → Thống kê toàn bộ
```

## 🚀 QUICK START

```bash
# Terminal 1: Backend
cd backend-app
php artisan serve --host=127.0.0.1 --port=8000

# Terminal 2: Frontend
npm run dev

# Browser
http://localhost:3001

# Login với:
# - Staff: hotel.staff1@local.test / password
# - Supervisor: hotel.manager@local.test / password
# - Manager: admin@local.test / password
```

## ✅ CHECKLIST HOÀN THÀNH

- [x] Fix model relationships (ChecklistTemplate → groups)
- [x] Update all user passwords
- [x] Add login route for Sanctum
- [x] Fix notification duplicate keys
- [x] Add localhost:3001 to Sanctum stateful domains
- [x] Create comprehensive test script
- [x] Document all fixes and testing procedures

## 📌 GHI CHÚ

- Mọi user đều có password là `"password"` để dễ test
- Data demo đã được tạo sẵn cho 30 ngày (Jan 1-30, 2026)
- Hệ thống sử dụng Laravel Sanctum cho authentication
- Frontend sử dụng localStorage để lưu token

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** January 10, 2026  
**Version:** 1.0
