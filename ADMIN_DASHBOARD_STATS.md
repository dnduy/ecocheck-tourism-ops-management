# 📊 ADMIN DASHBOARD - NHÂN VIÊN & GIÁM SÁT THỐNG KÊ

> **Tính năng mới:** Thêm 2 tabs mới vào Admin Dashboard để xem thống kê nhân viên và giám sát

---

## ✨ Tính Năng Đã Thêm

### 1️⃣ Tab "Thống kê NS" (Staff Statistics)

**Hiển thị:**
- ✅ Danh sách tất cả nhân viên (staff, maintenance)
- ✅ **Thống kê công việc cho mỗi nhân viên:**
  - Chưa làm (pending)
  - Đang làm (in_progress)
  - Đã làm (completed)
  - Chờ duyệt (needs_review)
  - Duyệt OK (approved)
  - Bị từ chối (rejected)
- ✅ Phần trăm hoàn thành công việc
- ✅ Lọc theo khu vực (area)
- ✅ Xem chi tiết công việc (click mở rộng)

**Dữ liệu hiển thị:**
```
- Tên nhân viên + Email
- Khu vực làm việc
- Tổng công việc
- Hoạt động cuối cùng
```

### 2️⃣ Tab "Thống kê GS" (Supervisor Statistics)

**Hiển thị:**
- ✅ Danh sách tất cả giám sát/quản lý
- ✅ **Thống kê công việc chờ duyệt:**
  - Số công việc chờ duyệt
  - Số công việc đã duyệt
  - Số công việc bị từ chối
  - Tổng công việc xử lý
- ✅ **Chi tiết công việc chờ duyệt:**
  - Tên nhân viên nộp
  - Khu vực
  - Mẫu checklist
  - Số ngày chờ duyệt (⚠️ Cảnh báo nếu > 2 ngày)
- ✅ Tỷ lệ phê duyệt (%)

---

## 🛠️ Thực Hiện Chi Tiết

### Backend - API Endpoints (3 endpoints mới)

**File:** `backend-app/app/Http/Controllers/Api/StatsController.php`

1. **GET `/api/admin/staff-stats`** - Lấy thống kê nhân viên
   ```json
   {
     "data": [
       {
         "id": 10,
         "name": "Tên nhân viên",
         "email": "email@test.com",
         "role": "staff",
         "area": "Hotel",
         "stats": {
           "pending": 19,
           "in_progress": 0,
           "completed": 0,
           "needs_review": 0,
           "approved": 0,
           "rejected": 0,
           "total": 19
         },
         "last_activity": "2026-01-11T01:25:01.000000Z"
       }
     ]
   }
   ```

2. **GET `/api/admin/supervisor-stats`** - Lấy thống kê giám sát
   ```json
   {
     "data": [
       {
         "id": 2,
         "name": "Tên giám sát",
         "email": "supervisor@test.com",
         "area": "Tất cả",
         "stats": {
           "pending_review": 0,
           "approved": 0,
           "rejected": 0,
           "total_handled": 0
         },
         "pending_details": [
           {
             "id": 1,
             "staff_name": "Nhân viên",
             "area": "Hotel",
             "template": "Template name",
             "requested_at": "2026-01-11T...",
             "days_pending": 2
           }
         ]
       }
     ]
   }
   ```

3. **GET `/api/admin/staff/{staffId}/detail`** - Chi tiết công việc 1 nhân viên
   ```json
   {
     "user": {
       "id": 6,
       "name": "Tên nhân viên",
       "email": "staff@test.com",
       "role": "staff"
     },
     "runs": [
       {
         "id": 1,
         "template": "Template name",
         "area": "Hotel",
         "work_status": "pending",
         "status": "active",
         "created_at": "...",
         "updated_at": "...",
         "completed_at": null,
         "review_requested_at": null,
         "review_note": null,
         "reviewed_at": null
       }
     ]
   }
   ```

### Frontend - Components (2 components mới)

**1. AdminStaffStats.tsx** (160 lines)
- Hiển thị danh sách nhân viên với thống kê
- Mở rộng chi tiết công việc
- Lọc theo khu vực
- Hiển thị progress bar cho từng status

**2. AdminSupervisorStats.tsx** (140 lines)
- Hiển thị danh sách giám sát
- Mở rộng xem công việc chờ duyệt
- Cảnh báo công việc quá hạn (> 2 ngày)
- Hiển thị performance metrics

### Frontend - Service Layer

**File:** `services/statsService.ts` (45 lines)
- `getStaffStats()` - Gọi API lấy thống kê nhân viên
- `getSupervisorStats()` - Gọi API lấy thống kê giám sát
- `getStaffDetail(staffId)` - Gọi API lấy chi tiết 1 nhân viên

### Admin.tsx - Thêm Tabs

```typescript
{
  id: 'STAFF_STATS',    // Manager & Supervisor
  label: 'Thống kê NS',
  icon: BarChart3
},
{
  id: 'SUPERVISOR_STATS',  // Manager only
  label: 'Thống kê GS',
  icon: TrendingUp
}
```

---

## 📊 Dữ Liệu Mẫu

### Staff Statistics Example:
```
Danh sách nhân viên (8 nhân viên):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Bùi Văn Tùng (restaurant.staff2@local.test)
   ├─ Tổng: 19 công việc
   ├─ Chưa làm: 19 | Đã làm: 0 | Chờ duyệt: 0
   ├─ Phần trăm hoàn thành: 0%
   └─ Hoạt động cuối: 10/01/2026

2. Ngô Thị Linh (restaurant.staff1@local.test)
   ├─ Tổng: 17 công việc
   ├─ Chưa làm: 17 | Đã làm: 0 | Chờ duyệt: 0
   └─ ...
```

### Supervisor Statistics Example:
```
Danh sách giám sát (3 giám sát):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Nguyễn Văn Tour (tour.manager@local.test)
   ├─ Chờ duyệt: 0 | Duyệt OK: 0 | Bị từ: 0
   ├─ Tỷ lệ phê duyệt: 0%
   └─ Không có công việc chờ duyệt

2. Phạm Thị Lan (hotel.manager@local.test)
   ├─ Chờ duyệt: 0 | Duyệt OK: 0 | Bị từ: 0
   └─ ...
```

---

## 🎯 Quyền Truy Cập

| Role | Staff Stats | Supervisor Stats |
|------|-------------|------------------|
| **Manager** | ✅ Có | ✅ Có |
| **Supervisor** | ✅ Có | ❌ Không |
| **Staff** | ❌ Không | ❌ Không |

---

## 📱 UI/UX

### Staff Tab
- Grid hiển thị **6 stat boxes** (Pending, In Progress, Completed, Needs Review, Approved, Rejected)
- Completion percentage: **"X% Hoàn thành"** (tính từ completed + approved)
- Click vào row để expand chi tiết
- Progress bar cho từng status
- Filter by area

### Supervisor Tab
- **4 stat boxes** (Pending Review, Approved, Rejected, Total Handled)
- Approval rate: **"X% Tỷ lệ phê duyệt"**
- Click để expand danh sách công việc chờ duyệt
- ⚠️ **Cảnh báo:** Công việc quá 2 ngày chờ duyệt (màu đỏ)
- Performance metrics khi expand

---

## 🚀 Cách Sử Dụng

### Trong Admin Panel:
1. **Đăng nhập** với tài khoản Manager
2. **Click vào tab** "Thống kê NS" hoặc "Thống kê GS"
3. **Xem thống kê** tất cả nhân viên/giám sát
4. **Lọc theo khu vực** (ở tab Staff Stats)
5. **Click mở rộng** để xem chi tiết công việc

### Ví dụ Query:
```bash
# Lấy thống kê nhân viên
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/admin/staff-stats

# Lấy thống kê giám sát
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/admin/supervisor-stats

# Lấy chi tiết 1 nhân viên
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/admin/staff/6/detail
```

---

## ✅ Kiểm Chứng

- ✅ Backend API: 3 endpoints hoạt động (tested)
- ✅ Frontend Components: 2 components created
- ✅ Service Layer: statsService.ts created
- ✅ Admin tabs: 2 tabs added (STAFF_STATS, SUPERVISOR_STATS)
- ✅ Build: npm run build ✅ (no errors)
- ✅ Backend: Running on http://127.0.0.1:8000
- ✅ Database: work_status, review_requested_at columns verified

---

## 📝 Files Created/Modified

```
✅ Created:
   - backend-app/app/Http/Controllers/Api/StatsController.php (165 lines)
   - services/statsService.ts (45 lines)
   - components/AdminStaffStats.tsx (160 lines)
   - components/AdminSupervisorStats.tsx (140 lines)

✅ Modified:
   - backend-app/routes/api.php (added 3 routes)
   - pages/Admin.tsx (imports + tabs)
   - services/statsService.ts (imported in Admin)
```

---

## 🎯 Kế Tiếp (Optional)

1. **Email notifications** khi công việc chờ duyệt quá 2 ngày
2. **Export to Excel** thống kê nhân viên/giám sát
3. **Date range filter** cho thống kê (e.g., ngày 10-20/01)
4. **Performance charts** - biểu đồ số công việc theo ngày
5. **Bulk actions** - gán công việc hàng loạt cho nhân viên

---

**Status:** ✅ **HOÀN THÀNH VÀ SẴN DÙNG**

Bây giờ Manager có thể:
1. 👀 Xem danh sách tất cả nhân viên với thống kê công việc
2. 📊 Xem thống kê công việc của từng giám sát
3. ⚠️ Phát hiện công việc chờ duyệt quá hạn
4. 🔍 Xem chi tiết công việc từng nhân viên
