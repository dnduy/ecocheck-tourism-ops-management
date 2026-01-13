# 📋 HƯỚNG DẪN: BỘ CHECKLIST HẰNG NGÀY CỐ ĐỊNH

## ✅ Những gì đã được tạo

### 1. **Artisan Command**
```bash
php artisan checklists:create-daily
```
- Tạo daily checklists cho ngày được chỉ định
- Tham số:
  - `--date=2026-01-12` (mặc định: hôm nay)
  - `--days=7` (mặc định: 1 ngày)

**Ví dụ:**
```bash
# Tạo checklists cho hôm nay
php artisan checklists:create-daily

# Tạo checklists cho 7 ngày từ 2026-01-12
php artisan checklists:create-daily --date=2026-01-12 --days=7
```

### 2. **Seeder**
```bash
php artisan db:seed --class=DailyChecklistsSeeder
```
- Tạo checklists cho hôm nay
- Chỉ tạo nếu chưa tồn tại

### 3. **API Endpoints**

#### Tạo Daily Checklists
```
POST /api/checklists/create-daily
Content-Type: application/json
Authorization: Bearer {token}

{
  "date": "2026-01-12",  // tùy chọn, mặc định: hôm nay
  "days": 7              // tùy chọn, mặc định: 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "21 checklists created",
  "created": [
    {
      "id": 1096,
      "template": "Checklist Quầy Bar",
      "area_id": 12,
      "date": "2026-01-12"
    }
  ],
  "skipped": [],
  "total": 21
}
```

#### Lấy Checklists Theo Ngày
```
GET /api/checklists/date/2026-01-12
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "date": "2026-01-12",
  "count": 11,
  "checklists": [
    {
      "id": 1096,
      "template_id": 8,
      "area_name": "Nhà hàng",
      "status": "pending",
      "assigned_to": 1
    }
  ]
}
```

#### Xóa Checklists Theo Ngày
```
DELETE /api/checklists/date/2026-01-12
Authorization: Bearer {token}
```

---

## 📊 Bộ Checklist Cố Định Hằng Ngày

Mỗi ngày, hệ thống tự động tạo **7 checklists**:

| ID | Tên Checklist | Khu Vực | Số Items |
|----|---------------|---------|----------|
| 7 | Checklist Bếp Chính | Khách sạn | 48 |
| 8 | Checklist Quầy Bar | Nhà hàng | 26 |
| 9 | Checklist Vệ Sinh WC | Bảo trì | 12 |
| 10 | Checklist Nhà 2 Tầng | Bảo trì | 42 |
| 11 | Checklist Bếp Quê | Nhà hàng | 81 |
| 12 | Checklist Nhà Hàng | Nhà hàng | 51 |
| 13 | Checklist Cây Xanh | Bảo trì | 22 |

**Tổng:** ~282 hạng mục/ngày

---

## 🔄 Quy Trình Sử Dụng

```
1. HỆ THỐNG
   ↓
2. Mỗi ngày 00:01, chạy:
   php artisan checklists:create-daily
   ↓
3. Tạo 7 checklists (trạng thái: pending)
   ↓
4. MANAGER/SUPERVISOR
   Vào Admin → Gán việc
   ↓
5. STAFF
   Nhận việc & Thực hiện checklist
   ↓
6. Hoàn thành → Duyệt & Ký kết
```

---

## 🚀 Thiết Lập Tự Động (Optional)

Để chạy command tự động mỗi ngày, thêm vào **crontab**:

```bash
# Chạy mỗi ngày lúc 00:01
1 0 * * * cd /path/to/ecocheck && php artisan checklists:create-daily >> /dev/null 2>&1
```

**Hoặc sử dụng Laravel Scheduler:**
- File: `app/Console/Kernel.php`
- Thêm vào `schedule()` method:
```php
$schedule->command('checklists:create-daily')
    ->daily()
    ->at('00:01');
```

---

## 💾 Database Schema

**Bảng `runs` được tạo với:**
- `checklist_template_id` → Template ID (7-13)
- `area_id` → Khu vực (11, 12, 13)
- `scheduled_for` → Ngày thực hiện
- `status` → pending (chờ làm)
- `assigned_to` → User ID

---

## ✨ Lợi Ích

✅ **Tự động** - Không cần tạo thủ công mỗi ngày  
✅ **Đồng nhất** - Luôn cùng các checklists  
✅ **Linh hoạt** - API để tạo trước/sau  
✅ **Lịch sử** - Dữ liệu lưu trữ mỗi ngày  
✅ **So sánh** - Nhìn thấy xu hướng theo thời gian
