# HƯỚNG DẪN KIỂM TRA CÔNG VIỆC THEO ROLE - ECOCHECK

## 📋 TÓM TẮT FIXES ĐÃ THỰC HIỆN

### 1. ✅ Fix Backend Model (ChecklistTemplate)
- **File:** `backend-app/app/Models/ChecklistTemplate.php`
- **Fix:** Thêm foreign key vào relationship `groups()`
- **Kết quả:** API trả về template.groups[].items[] đầy đủ

### 2. ✅ Fix Backend API (RunController) - QUAN TRỌNG
- **File:** `backend-app/app/Http/Controllers/Api/RunController.php`
- **Fix:** Thêm role-based filtering:
  - **STAFF:** Chỉ thấy runs được gán cho họ (`assigned_to = user_id`)
  - **SUPERVISOR:** Thấy runs họ duyệt + runs được gán cho họ
  - **MANAGER:** Thấy tất cả runs
- **Kết quả:** Mỗi role chỉ thấy công việc phù hợp

### 3. ✅ Fix Frontend (App.tsx)
- Fixed notification duplicate keys
- Fixed date handling
- Maps API data correctly to Checklist objects

### 4. ✅ Update All User Passwords
- Tất cả 13 users có password = `"password"`
- Dễ test tất cả roles

---

## 🚀 QUICK START - HƯỚNG DẪN NHANH

### Terminal 1: Khởi động Backend
```bash
cd /Users/duyduong/Documents/code/ecocheck-tourism-ops-management/backend-app
php artisan serve --host=127.0.0.1 --port=8000

# Output sẽ hiển thị:
# INFO  Server running on [http://127.0.0.1:8000].
```

**⚠️ GIỮ TERMINAL NÀY MỞ - ĐỬY LÀ BACKEND SERVER**

### Terminal 2: Khởi động Frontend
```bash
cd /Users/duyduong/Documents/code/ecocheck-tourism-ops-management
npm run dev

# Output sẽ hiển thị:
# VITE v6.4.1  ready in XXX ms
# ➜  Local:   http://localhost:3001/
```

### Browser: Mở http://localhost:3001

---

## 🔍 KIỂM TRA CÔNG VIỆC TỪNG ROLE

### 🔵 TEST ROLE: STAFF (Nhân viên)

**Đăng nhập:**
- Email: `hotel.staff1@local.test`
- Password: `password`

**Các bước kiểm tra:**

1. **Vào tab "Nhiệm vụ"**
   - Phải thấy 2 checklist được gán cho ngày 2026-01-10
   - Status: `in_progress` (Run 72) và `pending` (Run 73)

2. **Filter "Việc của tôi"**
   - Mặc định đã chọn
   - Hiển thị 2 runs

3. **Click vào Run 72 (in_progress)**
   - **Phải thấy:** Danh sách 48 items từ template "Checklist Bếp Chính"
   - **Mỗi item có:** Checkbox, text, phần ghi chú

4. **Thực hiện hành động:**
   - ✅ Tick 2-3 items là OK (checkbox trở thành xanh)
   - ❌ Tick 1 item là FAIL (checkbox trở thành đỏ)
   - Khi tick FAIL → Nhập mô tả sự cố → Click "Báo cáo sự cố"
   - Thanh Progress tăng khi tick items
   - Tick hết các items còn lại
   - **Button "Hoàn thành báo cáo"** xuất hiện → Click nó

5. **Kiểm tra kết quả:**
   - Checklist chuyển sang status `completed`
   - Có thể thấy incident được tạo

**✅ EXPECTED:**
```
✓ Thấy 2 checklists trong "Việc của tôi"
✓ Click vào checklist thấy 48 items
✓ Có thể tick OK/FAIL
✓ Báo cáo sự cố khi FAIL
✓ Hoàn thành checklist
✓ Chuyển sang completed status
```

---

### 🟢 TEST ROLE: SUPERVISOR (Giám sát)

**Đăng nhập:**
- Email: `hotel.manager@local.test`
- Password: `password`

**Các bước kiểm tra:**

1. **Vào tab "Nhiệm vụ"**
   - Chọn filter **"Cần duyệt"**
   - Phải thấy các checklist với status `completed` hoặc `in_progress`

2. **Click vào checklist `completed`** (từ staff vừa làm)
   - Xem chi tiết tất cả items đã được staff tick
   - Thấy phần ghi chú sự cố nếu staff báo cáo FAIL

3. **Button "Xác nhận & Ký duyệt"**
   - Click nó
   - **Kết quả:** Checklist chuyển sang status `reviewed`
   - Signoff record được tạo

4. **Vào tab "Sự cố"**
   - Thấy incidents được báo cáo
   - Có thể click để xem chi tiết, cập nhật status

**✅ EXPECTED:**
```
✓ Thấy checklists cần duyệt
✓ Xem chi tiết items đã hoàn thành
✓ Click "Xác nhận & Ký duyệt"
✓ Checklist chuyển sang reviewed
✓ Thấy incidents trong tab "Sự cố"
```

---

### 🟣 TEST ROLE: MANAGER (Quản lý)

**Đăng nhập:**
- Email: `admin@local.test`
- Password: `password`

**Các bước kiểm tra:**

1. **Vào tab "Dashboard"**
   - Thấy thống kê tổng quan:
     - Total checklists
     - Completion rate
     - Incidents statistics
   - Biểu đồ hoạt động

2. **Vào tab "Nhiệm vụ"**
   - Filter "Tất cả" 
   - Thấy 7 runs ngày 2026-01-10 (không bị filter)
   - Khác với staff chỉ thấy 2

3. **Vào tab "Admin" (nếu có)**
   - Quản lý templates
   - Quản lý users
   - Quản lý areas

**✅ EXPECTED:**
```
✓ Xem được dashboard
✓ Thấy tất cả 7 checklists (không filter)
✓ Thấy dashboard statistics
✓ Có quyền quản lý
```

---

## 🧪 TEST BẰNG TERMINAL (Optional)

### Test Staff chỉ thấy 2 runs:
```bash
# Login
TOKEN=$(curl -s "http://127.0.0.1:8000/api/auth/login" \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"hotel.staff1@local.test","password":"password"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

# Get runs
curl -s "http://127.0.0.1:8000/api/runs?date=2026-01-10" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Runs: {len(d.get(\"data\",[])) }')"

# Expected output: Runs: 2
```

### Test Supervisor thấy runs duyệt:
```bash
# Login
TOKEN=$(curl -s "http://127.0.0.1:8000/api/auth/login" \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"hotel.manager@local.test","password":"password"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

# Get runs
curl -s "http://127.0.0.1:8000/api/runs?date=2026-01-10" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Runs: {len(d.get(\"data\",[])) }')"

# Expected output: Runs: > 0 (runs they verify or assigned)
```

### Test Manager thấy tất cả 7 runs:
```bash
# Login
TOKEN=$(curl -s "http://127.0.0.1:8000/api/auth/login" \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@local.test","password":"password"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

# Get runs
curl -s "http://127.0.0.1:8000/api/runs?date=2026-01-10" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Runs: {len(d.get(\"data\",[])) }')"

# Expected output: Runs: 7
```

---

## 📊 DATABASE DATA

### Checklists (Runs) cho 2026-01-10
```
Staff: hotel.staff1@local.test (ID=6)
  - Run 72: Checklist Bếp Chính (48 items) - Status: in_progress
  - Run 73: Checklist Quầy Bar (26 items) - Status: pending

Supervisor: hotel.manager@local.test (ID=2)
  - Các runs verify/assigned

Manager: admin@local.test (ID=1)
  - Tất cả 7 runs
```

### User Credentials
```
| Role       | Email                      | Password |
|------------|----------------------------|----------|
| STAFF      | hotel.staff1@local.test    | password |
| STAFF      | hotel.staff2@local.test    | password |
| SUPERVISOR | hotel.manager@local.test   | password |
| MANAGER    | admin@local.test           | password |
| MAINTENANCE| maintenance.manager@local  | password |
```

---

## 🛠️ TROUBLESHOOTING

### ❌ Không thấy "Việc của tôi"
- Xem console: F12 → Console
- Kiểm tra xem có error loading runs không
- Thử reload page

### ❌ Thấy 7 runs khi là staff
- Backend chưa được update
- Xem RunController có filter không
- Restart backend: `php artisan serve`

### ❌ Không thấy items trong checklist
- Xem network tab: API response có data không
- Kiểm tra template.groups[].items có dữ liệu không

### ❌ 401 Unauthorized
- Clear localStorage: F12 → Application → Clear
- Đăng nhập lại

### ❌ Backend lỗi
- Xem terminal backend có thông báo error không
- Kiểm tra syntax code: `php artisan tinker`
- Restart: `php artisan serve --host=127.0.0.1 --port=8000`

---

## ✅ HOÀN THÀNH KHI

- [ ] Staff thấy 2 runs "Việc của tôi"
- [ ] Staff thấy 48 items trong checklist
- [ ] Staff có thể tick OK/FAIL
- [ ] Staff có thể báo cáo sự cố
- [ ] Staff có thể hoàn thành checklist
- [ ] Supervisor thấy "Cần duyệt"
- [ ] Supervisor có thể ký duyệt
- [ ] Manager thấy tất cả 7 runs
- [ ] Manager thấy dashboard

---

## 📝 GHI CHÚ CÔNG VIỆC ĐÃ LÀM

```php
// backend-app/app/Http/Controllers/Api/RunController.php
// Thêm role-based filtering:
if ($user && $user->role === 'staff') {
    $query->where('assigned_to', $user->id);
} elseif ($user && $user->role === 'supervisor') {
    $query->where(function($q) use ($user) {
        $q->where('verified_by', $user->id)
          ->orWhere('assigned_to', $user->id);
    });
}
// Manager: không filter, thấy tất cả
```

---

**Bản cập nhật:** January 10, 2026  
**Version:** 2.0 - Role-based visibility fix
