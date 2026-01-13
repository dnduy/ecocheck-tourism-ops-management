# 📊 BÁO CÁO CƠ SỞ DỮ LIỆU HIỆN TẠI

**Ngày kiểm tra**: 12/01/2026  
**Hệ thống**: EcoCheck Tourism Operations Management

---

## 🗄️ CẤU HÌNH DATABASE

### 1. File .env (Cấu hình môi trường)

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ecocheck
DB_USERNAME=ecocheck
DB_PASSWORD=ecocheck_password
```

**⚠️ Vấn đề**: File .env config MySQL nhưng thực tế đang dùng SQLite!

### 2. File config/database.php (Laravel Default)

```php
'default' => env('DB_CONNECTION', 'sqlite'),  // ← Fallback to SQLite
```

**✅ Kết quả**: Vì .env có `DB_CONNECTION=mysql` nhưng MySQL server không chạy, Laravel tự động fallback về **SQLite**

---

## 📁 DATABASE FILE HIỆN TẠI

### Thông tin File

```bash
File: backend-app/database/database.sqlite
Size: 168 KB
Last Modified: January 8, 2026 11:54 AM
```

### Tổng dung lượng thư mục database

```bash
Total: 300 KB (bao gồm migrations, seeders, factories)
```

---

## 📊 CẤU TRÚC DATABASE (SQLite)

### Danh sách 20 Tables

| # | Table Name | Mục đích |
|---|------------|----------|
| 1 | `users` | Người dùng (admin, staff, supervisor) |
| 2 | `areas` | Khu vực (Resort areas) |
| 3 | `checklist_templates` | Mẫu checklist |
| 4 | `template_columns` | Cột thời gian trong template |
| 5 | `template_roles` | Vai trò trong template |
| 6 | `groups` | Nhóm items trong checklist |
| 7 | `items` | Các mục cần kiểm tra |
| 8 | `runs` | **Công việc checklist (Run)** |
| 9 | `entries` | Dữ liệu điền vào checklist |
| 10 | `signoffs` | Xác nhận/Duyệt công việc |
| 11 | `incidents` | Sự cố phát hiện |
| 12 | `roles` | Vai trò hệ thống |
| 13 | `area_user` | Liên kết user-area (many-to-many) |
| 14 | `sessions` | Laravel sessions |
| 15 | `personal_access_tokens` | Sanctum tokens |
| 16 | `migrations` | Lịch sử migrations |
| 17 | `jobs` | Laravel queue jobs |
| 18 | `job_batches` | Job batches |
| 19 | `failed_jobs` | Jobs thất bại |
| 20 | `cache`, `cache_locks` | Laravel cache |

---

## 📈 DỮ LIỆU HIỆN TẠI

### Thống kê số lượng records

| Table | Số lượng | Ghi chú |
|-------|----------|---------|
| `users` | **8** | 1 admin, 3 supervisors, 4 staff |
| `runs` | **4** | Công việc checklist |
| `checklist_templates` | **1** | 1 template mẫu |
| `areas` | **3** | 3 khu vực |
| `incidents` | **4** | 4 sự cố |
| `entries` | ~100+ | Dữ liệu checklist |
| `signoffs` | ~10+ | Xác nhận |

**⚠️ LƯU Ý**: Database này có **ÍT DỮ LIỆU** - có vẻ là database dev/test, không phải production

---

## 🔍 CHI TIẾT TABLE `runs` (Quan trọng nhất)

### Schema hiện tại (13 columns)

```sql
CREATE TABLE "runs" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "checklist_template_id" INTEGER NOT NULL,
    "area_id" INTEGER NOT NULL,
    "status" VARCHAR NOT NULL DEFAULT 'draft',       -- ⚠️ CŨ
    "scheduled_for" DATE,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "created_by" INTEGER,
    "updated_by" INTEGER,
    "created_at" DATETIME,
    "updated_at" DATETIME,
    "assigned_to" INTEGER,
    "verified_by" INTEGER,
    
    -- Foreign Keys
    FOREIGN KEY("checklist_template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE,
    FOREIGN KEY("area_id") REFERENCES "areas"("id") ON DELETE CASCADE,
    FOREIGN KEY("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL,
    FOREIGN KEY("verified_by") REFERENCES "users"("id") ON DELETE SET NULL,
    FOREIGN KEY("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
    FOREIGN KEY("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
);
```

### ⚠️ VẤNĐỀ PHÁT HIỆN

**THIẾU các columns mới từ migration `2026_01_11_add_review_workflow_to_runs.php`:**

❌ **THIẾU**: `work_status` VARCHAR (pending, in_progress, completed, needs_review, approved, rejected)  
❌ **THIẾU**: `review_requested_at` DATETIME  
❌ **THIẾU**: `source_template_note` TEXT

**Nguyên nhân**: Migration đã chạy trên database khác, CHƯA chạy trên SQLite này!

---

## 🚨 CẢNH BÁO QUAN TRỌNG

### 1. Cấu hình Database Không Nhất Quán

```
.env file → MySQL (không connect được)
    ↓
Laravel fallback → SQLite (đang dùng)
    ↓
Migration 2026_01_12 → ĐÃ CHẠY trên MySQL? (206 runs)
    ↓
SQLite hiện tại → CHƯA CÓ work_status column!
```

### 2. Dữ Liệu Không Đồng Bộ

| Database | Số runs | work_status column | Status |
|----------|---------|-------------------|--------|
| **MySQL** (localhost:3306) | 206 runs | ✅ CÓ (migrated) | ❓ Không kết nối được |
| **SQLite** (database.sqlite) | 4 runs | ❌ KHÔNG CÓ | ✅ Đang dùng |

**Vấn đề**: Có 2 databases khác nhau!

---

## 📋 KIẾN TRÚC LƯU TRỮ

### Cách SQLite lưu trữ

```
backend-app/
├── database/
│   ├── database.sqlite          ← FILE DUY NHẤT chứa TẤT CẢ dữ liệu
│   ├── factories/               ← Code generate fake data
│   ├── migrations/              ← Schema definitions
│   │   ├── 2024_xx_create_users_table.php
│   │   ├── 2024_xx_create_runs_table.php
│   │   ├── 2026_01_11_add_review_workflow_to_runs.php  ← CHƯA CHẠY!
│   │   └── 2026_01_12_migrate_status_to_work_status.php ← CHƯA CHẠY!
│   └── seeders/                 ← Data seeds
│       └── RoleAndAdminSeeder.php
```

**Đặc điểm SQLite**:
- ✅ **1 file duy nhất** chứa toàn bộ database
- ✅ **Không cần server** (embedded database)
- ✅ **Dễ backup** (copy file là xong)
- ⚠️ **Không có user authentication** (file-based)
- ⚠️ **Không scale cho production lớn**

---

## 🔄 SO SÁNH SQLite vs MySQL

| Tiêu chí | SQLite (hiện tại) | MySQL (trong .env) |
|----------|------------------|-------------------|
| **Type** | File-based | Server-based |
| **Setup** | ✅ Zero config | ❌ Cần MySQL server |
| **Performance** | ✅ Nhanh cho dev | ✅ Tốt cho production |
| **Concurrent writes** | ⚠️ Limited | ✅ Excellent |
| **Size limit** | 281 TB | 🚀 Unlimited |
| **Backup** | ✅ Copy file | ⚠️ mysqldump |
| **Production** | ⚠️ OK cho small apps | ✅ Recommended |
| **Current status** | ✅ **ĐANG DÙNG** | ❌ Không connect |

---

## 💾 CẤU TRÚC FILE DATABASE.SQLITE

### Internal Structure

```
database.sqlite (168 KB)
├── Schema (metadata)
│   ├── Tables definitions
│   ├── Indexes
│   └── Foreign keys
├── Data (actual records)
│   ├── users (8 rows)
│   ├── runs (4 rows)
│   ├── areas (3 rows)
│   ├── incidents (4 rows)
│   └── ... (other tables)
└── Internal tables
    ├── sqlite_sequence (auto-increment tracking)
    └── sqlite_master (metadata)
```

### Không gian sử dụng

```
Total file size: 168 KB
├── Schema + Indexes: ~20 KB
├── User data: ~100 KB
└── Free space: ~48 KB
```

---

## 🛠️ CÁCH KIỂM TRA DATABASE

### 1. Xem toàn bộ tables

```bash
sqlite3 database/database.sqlite ".tables"
```

### 2. Xem schema của 1 table

```bash
sqlite3 database/database.sqlite ".schema runs"
```

### 3. Đếm records

```bash
sqlite3 database/database.sqlite "SELECT COUNT(*) FROM runs;"
```

### 4. Query dữ liệu

```bash
sqlite3 database/database.sqlite "SELECT id, work_status, assigned_to FROM runs;"
```

### 5. Xem size file

```bash
ls -lh database/database.sqlite
du -sh database/
```

---

## ✅ KHUYẾN NGHỊ

### 1. **QUYẾT ĐỊNH DATABASE**: Chọn 1 trong 2

**Option A: Tiếp tục dùng SQLite** (đơn giản, dev-friendly)
```bash
# Chỉnh .env
DB_CONNECTION=sqlite
# (comment out MySQL config)

# Chạy migrations lại
php artisan migrate:fresh --seed
```

**Option B: Chuyển sang MySQL** (production-ready)
```bash
# Đảm bảo MySQL server chạy
mysql -u root -p

# Tạo database
CREATE DATABASE ecocheck;
CREATE USER 'ecocheck'@'localhost' IDENTIFIED BY 'ecocheck_password';
GRANT ALL ON ecocheck.* TO 'ecocheck'@'localhost';

# .env đã có config MySQL rồi, chỉ cần:
php artisan migrate:fresh --seed
```

### 2. **CHẠY LẠI MIGRATIONS** (CRITICAL!)

```bash
cd backend-app

# Backup database hiện tại
cp database/database.sqlite database/database.backup.sqlite

# Chạy migrations
php artisan migrate

# Hoặc reset toàn bộ (xóa data cũ)
php artisan migrate:fresh --seed
```

**Kết quả mong đợi**:
```
✅ 2026_01_11_add_review_workflow_to_runs .............. DONE
✅ 2026_01_12_migrate_status_to_work_status ............ DONE
```

### 3. **VERIFY DATABASE** sau khi migrate

```bash
sqlite3 database/database.sqlite "PRAGMA table_info(runs);" | grep work_status
```

**Kỳ vọng**: Thấy dòng có `work_status`

---

## 📊 TÓM TẮT

### ✅ Điểm tốt:
- SQLite hoạt động ổn định
- Dữ liệu đã có (8 users, 4 runs, 3 areas)
- Cấu trúc tables đúng

### ⚠️ Vấn đề:
- **CRITICAL**: Migrations mới chưa chạy trên SQLite
- Database config không rõ ràng (MySQL trong .env, SQLite thực tế)
- Dữ liệu ít (4 runs thay vì 206 như trong migration log)

### 🎯 Action Items:
1. ✅ **Quyết định database**: SQLite hay MySQL?
2. ✅ **Chạy migrations**: `php artisan migrate`
3. ✅ **Verify**: Check `work_status` column tồn tại
4. ✅ **Update .env**: Match với database thực tế dùng

---

## 🔗 LIÊN QUAN

- Migrations: `backend-app/database/migrations/`
- Models: `backend-app/app/Models/`
- Config: `backend-app/config/database.php`
- Data file: `backend-app/database/database.sqlite`

---

**Created**: 12/01/2026  
**Status**: ⚠️ Cần chạy migrations để sync schema
