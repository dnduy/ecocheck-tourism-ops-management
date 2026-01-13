# 📋 Hướng Dẫn Quy Trình Duyệt & Quản Lý Trạng Thái Công Việc

## 1️⃣ Tổng Quan Workflow

Hệ thống duyệt checklist tuân theo quy trình **rõ ràng và logic** với 6 trạng thái:

```
┌─────────┐   ┌──────────┐   ┌─────────┐   ┌──────────┐   ┌──────────┐
│ Chưa làm│───│Đang làm  │───│Đã làm   │───│Chờ duyệt │───│Đã xác nhận
│⏳Pending│   │🔄In Prog │   │✅Compl. │   │👀Need Review  │✅Approved│
└─────────┘   └──────────┘   └─────────┘   └──────────┘   └──────────┘
                                                              ↓
                                                         ❌ Bị từ chối ─→ Gửi lại
                                                            Rejected
```

## 2️⃣ Chi Tiết Các Trạng Thái

| Trạng thái | Icon | Ý Nghĩa | Người | Hành động |
|-----------|------|--------|-------|----------|
| **Chưa làm** | ⏳ | Checklist được tạo nhưng chưa bắt đầu | Nhân viên | Bắt đầu làm |
| **Đang làm** | 🔄 | Nhân viên đang thực hiện các hạng mục | Nhân viên | Hoàn thành |
| **Đã làm** | ✅ | Nhân viên hoàn thành nhập liệu tất cả hạng mục | Nhân viên | Yêu cầu duyệt |
| **Chờ duyệt** | 👀 | Chờ quản lý/giám sát duyệt & xác nhận | Quản lý | Phê duyệt hoặc Từ chối |
| **Đã xác nhận** | ✅✅ | Được quản lý xác nhận, hoàn toàn hợp lệ | (Hoàn thành) | Không có |
| **Bị từ chối** | ❌ | Quản lý yêu cầu sửa lại vì lỗi/thiếu sót | Nhân viên | Gửi lại để duyệt |

## 3️⃣ Quy Trình Từng Bước

### 🎯 Cho Nhân Viên (Staff)

```
1. Nhân viên nhận checklist (trạng thái: ⏳ Chưa làm)
   ↓
2. Nhân viên bấm "Bắt đầu làm" → 🔄 Đang làm
   ↓
3. Nhân viên điền tất cả hạng mục (PASS/FAIL)
   ↓
4. Nhân viên bấm "Hoàn thành" → ✅ Đã làm
   ↓
5. Nhân viên bấm "Yêu cầu duyệt" → 👀 Chờ duyệt
   ↓
6. CHỜ QUẢN LÝ DUYỆT
   ├─ Nếu được duyệt: ✅✅ Đã xác nhận (Hoàn tất!)
   └─ Nếu bị từ chối: ❌ Bị từ chối → Sửa lại → Gửi lại
```

### 👔 Cho Quản Lý/Giám Sát (Supervisor/Manager)

```
1. Quản lý truy cập "Quản lý Duyệt Checklist"
   ↓
2. Xem danh sách checklist: 👀 Chờ duyệt
   ↓
3. Bấm vào checklist, xem chi tiết:
   - Khu vực: [Tên khu vực]
   - Người làm: [Tên nhân viên]
   - Thời gian yêu cầu: [Ngày giờ]
   - Ghi chú: [Ghi chú từ nhân viên nếu có]
   ↓
4. CÓ 2 LỰA CHỌN:
   ├─ A. Phê duyệt ✅
   │    └─ Nhập ghi chú xác nhận (tùy chọn)
   │    └─ Bấm "Phê duyệt" → ✅✅ Đã xác nhận
   │    └─ Hệ thống lưu: người duyệt, thời gian, ghi chú
   │
   └─ B. Từ chối ❌
        └─ Nhập lý do từ chối (BẮT BUỘC)
        └─ Bấm "Từ chối" → ❌ Bị từ chối
        └─ Nhân viên sẽ thấy lý do từ chối → Chỉnh sửa → Gửi lại
```

## 4️⃣ Các Tính Năng Quan Trọng

### 📊 Dashboard Quản Lý

Trang "Quản lý Duyệt Checklist" hiển thị:
- **Thống kê tổng quát**: Số lượng theo từng trạng thái
- **Danh sách chờ duyệt**: Các checklist cần xử lý ngay
- **Nút hành động**: Phê duyệt/Từ chối trực tiếp

### 📌 Ghi Chú Nguồn Template

Khi tạo checklist từ template, hệ thống tự ghi chú:
```
📌 Copy từ [Template Name] ngày [Date]
```
→ Giúp track được checklist này dùng template nào, từ ngày nào

### 🔄 Quản Lý Trùng Lặp

- ✅ Đã xoá 2 templates test trùng lặp
- ✅ Còn lại 8 templates chính, mỗi cái dùng cho một khu vực cụ thể
- ✅ Nếu cần copy template cho ngày khác, hệ thống sẽ tự ghi chú rõ

## 5️⃣ Hành Động Nhanh

### Cho Nhân Viên

| Bước | Status Hiện Tại | Nút Bấm | Kết Quả |
|------|-----------------|---------|---------|
| 1 | ⏳ Chưa làm | "Bắt đầu làm" | → 🔄 Đang làm |
| 2 | 🔄 Đang làm | "Hoàn thành" | → ✅ Đã làm |
| 3 | ✅ Đã làm | "Yêu cầu duyệt" | → 👀 Chờ duyệt |
| 4 | ❌ Bị từ chối | "Gửi lại" | → 👀 Chờ duyệt |

### Cho Quản Lý

| Trạng Thái | Nút 1 | Nút 2 |
|-----------|-------|-------|
| 👀 Chờ duyệt | "✅ Phê duyệt" | "❌ Từ chối" |

## 6️⃣ Lưu Ý Quan Trọng

### ✅ Nên Làm

- ✔️ Duyệt checklist trong ngày để không bị delay
- ✔️ Ghi chú rõ ràng nếu từ chối (để nhân viên biết sửa chỗ nào)
- ✔️ Ghi chú xác nhận khi phê duyệt (để có record)
- ✔️ Kiểm tra ghi chú "Copy từ template ngày nào" để hiểu context

### ❌ Không Nên Làm

- ❌ Xoá/chỉnh sửa checklist sau khi đã xác nhận (cần audit trail)
- ❌ Từ chối mà không ghi rõ lý do
- ❌ Để checklist ở "Chờ duyệt" quá lâu
- ❌ Tạo multiple templates có tên tương tự

## 7️⃣ Thống Kê & Báo Cáo

### Lấy Thống Kê Status

```
GET /api/review/stats

Phản hồi:
{
  "pending": 5,           // Chưa làm
  "in_progress": 3,       // Đang làm
  "completed": 8,         // Đã làm
  "needs_review": 4,      // Chờ duyệt
  "approved": 120,        // Đã xác nhận
  "rejected": 2           // Bị từ chối
}
```

### Dashboard Trực Quan

- 📊 Cột 1: Chưa làm (⏳)
- 📊 Cột 2: Đang làm (🔄)
- 📊 Cột 3: Đã làm (✅)
- 📊 Cột 4: Chờ duyệt (👀) ← **Cần chú ý**
- 📊 Cột 5: Đã xác nhận (✅✅)
- 📊 Cột 6: Bị từ chối (❌)

## 8️⃣ API Endpoints (Cho Developer)

```
# Lấy danh sách chờ duyệt
GET /api/review/pending

# Xem chi tiết checklist (review view)
GET /api/review/runs/{runId}

# Nhân viên bắt đầu
POST /api/review/runs/{runId}/start

# Nhân viên hoàn thành
POST /api/review/runs/{runId}/complete

# Nhân viên yêu cầu duyệt
POST /api/review/runs/{runId}/request-review

# Quản lý phê duyệt
POST /api/review/runs/{runId}/approve
Body: { "review_note": "Xác nhận tốt" }

# Quản lý từ chối
POST /api/review/runs/{runId}/reject
Body: { "review_note": "Cần sửa lại item #5" }

# Nhân viên gửi lại
POST /api/review/runs/{runId}/resubmit

# Lấy thống kê
GET /api/review/stats
```

## 9️⃣ Câu Hỏi Thường Gặp

**Q: Nếu bị từ chối, nhân viên có thể sửa lại được không?**
A: Có! Status sẽ chuyển sang ❌ Bị từ chối. Nhân viên bấm "Gửi lại" để quay lại 👀 Chờ duyệt.

**Q: Có thể track ai duyệt, khi nào, ghi chú gì không?**
A: Có! Hệ thống lưu tất cả trong bảng `signoffs`:
- `user_id`: Người duyệt
- `reviewed_at`: Thời gian duyệt
- `review_note`: Ghi chú
- `review_status`: approved/rejected

**Q: Nếu quên nhập "Ghi chú lý do từ chối", có thể bỏ qua được không?**
A: Không! Hệ thống bắt buộc phải nhập lý do từ chối (để biết sửa chỗ nào).

**Q: Status trùng lặp ngoài "pending/completed" được không?**
A: Không! Mỗi workflow cần đi qua từng trạng thái tuần tự.

**Q: Có thể "gỡ" trạng thái đã xác nhận (approved) được không?**
A: Hiện tại chưa. Nếu cần, phải tạo checklist mới.

---

## 🎓 Kết Luận

Quy trình mới giúp:
- ✅ **Rõ ràng**: Mỗi trạng thái có ý nghĩa cụ thể
- ✅ **Trực tiếp**: Nhân viên biết bước tiếp theo cần làm gì
- ✅ **Kiểm soát**: Quản lý dễ dàng duyệt & từ chối
- ✅ **Audit trail**: Lưu giữ ai duyệt, lúc nào, ghi chú gì
- ✅ **Tránh lặp**: Loại bỏ templates trùng lặp, ghi chú rõ nguồn

📞 **Hỗ trợ**: Liên hệ admin nếu có thắc mắc!
