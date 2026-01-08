# ✅ CHECKLIST KIỂM TRA CHỨC NĂNG NHANH

**Ngày kiểm tra:** 8/1/2026  
**Backend:** http://127.0.0.1:8000  
**Frontend:** http://localhost:3001  

---

## 🔐 1. ĐĂNG NHẬP & XÁC THỰC

- [ ] Mở http://localhost:3001
- [ ] Nhập email: `admin@local.test`
- [ ] Nhập password: `ChangeMe123!`
- [ ] Click "Đăng nhập"
- [ ] **Kết quả mong đợi:** Chuyển đến Dashboard, hiển thị tên "Admin User"

---

## 👥 2. QUẢN LÝ NGƯỜI DÙNG

### Thêm người dùng mới:
- [ ] Click tab "Admin"
- [ ] Click tab "NS" (Nhân sự)
- [ ] Click "+ Thêm nhân sự"
- [ ] Điền:
  - Họ tên: `Nguyễn Văn Test`
  - Email: `test.user@example.com`
  - Mật khẩu: `TestPass123!`
  - Vai trò: `STAFF`
- [ ] Click "Lưu"
- [ ] **Kết quả mong đợi:** 
  - Thông báo "✅ Đã thêm tài khoản cho Nguyễn Văn Test"
  - Người dùng xuất hiện trong danh sách

### Sửa người dùng:
- [ ] Tìm người dùng vừa tạo
- [ ] Click icon "✏️ Sửa"
- [ ] Đổi họ tên thành: `Nguyễn Văn Test Updated`
- [ ] Click "Lưu"
- [ ] **Kết quả mong đợi:** Tên người dùng được cập nhật

### Xóa người dùng:
- [ ] Click icon "🗑️ Xóa"
- [ ] Click "OK" trong confirm dialog
- [ ] **Kết quả mong đợi:** Người dùng biến mất khỏi danh sách

---

## 📍 3. QUẢN LÝ KHU VỰC

### Thêm khu vực:
- [ ] Tại Admin, click tab "Khu vực"
- [ ] Click "+ Thêm khu vực"
- [ ] Điền:
  - Tên: `Bếp chính - Test`
  - Loại: `F&B`
- [ ] Click "Lưu"
- [ ] **Kết quả mong đợi:** Khu vực xuất hiện trong danh sách

### Xóa khu vực:
- [ ] Tìm khu vực vừa tạo
- [ ] Click icon "Xóa"
- [ ] Confirm
- [ ] **Kết quả mong đợi:** Khu vực bị xóa

---

## 📋 4. TẠO TEMPLATE

- [ ] Tại Admin, click tab "Template"
- [ ] Click "+ Tạo Template"
- [ ] Điền:
  - Tên: `Test Checklist Template`
  - Mô tả: `Template dùng để test hệ thống`
  - Tên nhóm: `Nhóm test`
  - Cột: `Ca A`
  - Hạng mục 1: `Kiểm tra điều 1`
- [ ] Click "+ Thêm hàng"
- [ ] Điền hạng mục 2: `Kiểm tra điều 2`
- [ ] Click "Tạo"
- [ ] **Kết quả mong đợi:** 
  - Thông báo "✅ Đã tạo mẫu checklist mới"
  - Template xuất hiện trong danh sách

---

## ✅ 5. TẠO VÀ THỰC HIỆN CHECKLIST

### Tạo checklist:
- [ ] Click tab "Checklists"
- [ ] Click "+ Tạo checklist"
- [ ] Chọn:
  - Khu vực: `Lobby`
  - Ngày: Hôm nay
- [ ] Click "Tạo"
- [ ] **Kết quả mong đợi:** Checklist mới xuất hiện trong danh sách

### Thực hiện checklist:
- [ ] Click vào checklist vừa tạo
- [ ] **Kiểm tra:** Hiển thị lưới hạng mục
- [ ] Click vào một ô trong lưới
- [ ] Chọn "✅ OK"
- [ ] Nhập ghi chú: `Test note`
- [ ] Click "Lưu"
- [ ] **Kết quả mong đợi:** 
  - Thông báo "✅ Entry saved"
  - Ô hiển thị icon ✅

### Đánh dấu NOT OK và báo cáo sự cố:
- [ ] Click vào ô khác
- [ ] Chọn "❌ NOT OK"
- [ ] Nhập ghi chú: `Có vấn đề`
- [ ] Click "Lưu"
- [ ] **Kiểm tra:** Xuất hiện nút "⚠️ Báo cáo sự cố"
- [ ] Click "Báo cáo sự cố"
- [ ] **Kiểm tra:** Form đã được điền sẵn thông tin
- [ ] Chọn mức độ: `MEDIUM`
- [ ] Click "Gửi báo cáo"
- [ ] **Kết quả mong đợi:** Thông báo tạo sự cố thành công

---

## 🚨 6. QUẢN LÝ SỰ CỐ

### Xem danh sách sự cố:
- [ ] Click tab "Incidents"
- [ ] **Kiểm tra:** Hiển thị sự cố vừa tạo từ checklist
- [ ] **Kiểm tra:** Thông tin đúng (tiêu đề, khu vực, mức độ)

### Lọc sự cố:
- [ ] Click dropdown "Tất cả khu vực"
- [ ] Chọn "Lobby"
- [ ] **Kết quả mong đợi:** Chỉ hiển thị sự cố của Lobby

### Tạo sự cố mới:
- [ ] Click "+ Tạo sự cố"
- [ ] Điền:
  - Tiêu đề: `Test Incident Manual`
  - Khu vực: `Pool`
  - Mức độ: `HIGH`
  - Mô tả: `Sự cố test thủ công`
- [ ] Click "Tạo"
- [ ] **Kết quả mong đợi:** Sự cố xuất hiện trong danh sách

### Cập nhật trạng thái:
- [ ] Click vào sự cố vừa tạo
- [ ] Chọn trạng thái: `IN_PROGRESS`
- [ ] Click "Cập nhật"
- [ ] **Kết quả mong đợi:** 
  - Trạng thái thay đổi
  - Thông báo thành công

---

## ⏰ 7. QUẢN LÝ CA LÀM VIỆC

- [ ] Vào Admin → "Ca trực"
- [ ] Click "+ Thêm ca"
- [ ] Điền:
  - Tên: `Ca Test`
  - Giờ bắt đầu: `06:00`
  - Giờ kết thúc: `14:00`
  - Loại: `NORMAL`
- [ ] Click "Lưu"
- [ ] **Kết quả mong đợi:** Ca làm việc xuất hiện trong danh sách

---

## 📊 8. DASHBOARD & REPORTS

### Dashboard:
- [ ] Click tab "Dashboard"
- [ ] **Kiểm tra hiển thị:**
  - [ ] Tổng số checklist
  - [ ] Số checklist hoàn thành
  - [ ] Số sự cố đang mở
  - [ ] Tỷ lệ hoàn thành (%)
  - [ ] Biểu đồ cột
  - [ ] Biểu đồ tròn
  - [ ] Danh sách hoạt động gần đây

### Reports:
- [ ] Click tab "Reports"
- [ ] Chọn khoảng thời gian: "7 ngày"
- [ ] **Kiểm tra:** Hiển thị dữ liệu
- [ ] Click "📊 Xuất Excel"
- [ ] **Kết quả mong đợi:** Tải file Excel về máy

---

## 🔒 9. PHÂN QUYỀN

### Test quyền STAFF:
- [ ] Đăng xuất
- [ ] Tạo tài khoản STAFF mới (nếu chưa có):
  - Email: `staff@test.com`
  - Password: `StaffPass123!`
  - Role: `STAFF`
- [ ] Đăng nhập với tài khoản STAFF
- [ ] **Kiểm tra:**
  - [ ] ❌ Không thấy tab "Admin"
  - [ ] ✅ Thấy tab "Checklists"
  - [ ] ✅ Thấy tab "Incidents"
  - [ ] ❌ Không tạo được template
- [ ] Đăng xuất

### Test quyền SUPERVISOR:
- [ ] Tạo tài khoản SUPERVISOR (nếu chưa có):
  - Email: `supervisor@test.com`
  - Password: `SuperPass123!`
  - Role: `SUPERVISOR`
- [ ] Đăng nhập với tài khoản SUPERVISOR
- [ ] **Kiểm tra:**
  - [ ] ✅ Thấy tab "Admin" (giới hạn)
  - [ ] ✅ Thấy "Ca trực" và "Mẫu"
  - [ ] ❌ Không thấy "Nhân sự" và "Khu vực"
- [ ] Đăng xuất

### Đăng nhập lại MANAGER:
- [ ] Đăng nhập với admin@local.test
- [ ] **Kiểm tra:** Thấy tất cả các tab

---

## 🔄 10. AUTO-SAVE & SYNC

### Test auto-save trong checklist:
- [ ] Mở một checklist
- [ ] Đánh dấu một ô
- [ ] **Không click "Lưu"**
- [ ] F5 (reload trang)
- [ ] Đăng nhập lại
- [ ] Mở lại checklist
- [ ] **Kết quả mong đợi:** Dữ liệu vẫn được lưu

---

## 🌐 11. RESPONSIVE & MOBILE

- [ ] Mở DevTools (F12)
- [ ] Chuyển sang chế độ Mobile (Ctrl+Shift+M)
- [ ] **Kiểm tra:**
  - [ ] Menu responsive
  - [ ] Form hiển thị đúng
  - [ ] Checklist grid responsive
  - [ ] Dashboard cards stack đúng

---

## 🔔 12. NOTIFICATIONS

- [ ] **Kiểm tra xuất hiện thông báo khi:**
  - [ ] Thêm người dùng → 🟢 SUCCESS
  - [ ] Xóa dữ liệu → 🟡 NORMAL
  - [ ] Lỗi validation → 🔴 CRITICAL
  - [ ] Cập nhật thành công → 🟢 SUCCESS
- [ ] **Kiểm tra:** Thông báo tự động ẩn sau 6 giây
- [ ] Click "X" để đóng thủ công
- [ ] **Kết quả mong đợi:** Thông báo đóng ngay lập tức

---

## 📸 13. UPLOAD HÌNH ẢNH

- [ ] Mở một checklist execution
- [ ] Click vào một ô
- [ ] Click "📷 Thêm hình ảnh"
- [ ] Chọn một file ảnh (JPG/PNG)
- [ ] **Kết quả mong đợi:** 
  - Ảnh được upload
  - Hiển thị thumbnail trong ô

---

## 📱 14. QR SCANNER (Optional)

- [ ] Click icon "QR" ở header
- [ ] Cho phép truy cập camera
- [ ] Quét một QR code (nếu có)
- [ ] **Kết quả mong đợi:** 
  - Scanner hoạt động
  - Nhận diện được mã QR

---

## 🔧 15. ERROR HANDLING

### Test lỗi validation:
- [ ] Thử thêm người dùng với email sai format: `test@`
- [ ] **Kết quả mong đợi:** Thông báo "Email không hợp lệ"

### Test lỗi mật khẩu yếu:
- [ ] Thử tạo user với password: `123`
- [ ] **Kết quả mong đợi:** Thông báo lỗi mật khẩu

### Test xóa chính mình:
- [ ] Vào Admin → NS
- [ ] Thử xóa tài khoản đang đăng nhập
- [ ] **Kết quả mong đợi:** Alert "Không thể xóa tài khoản của chính mình"

---

## ✅ TỔNG KẾT

**Ngày kiểm tra:** __________  
**Người kiểm tra:** __________  

### Kết quả:
- **Tổng số test cases:** 75+
- **Số test passed:** ___ / 75
- **Số test failed:** ___ / 75
- **Tỷ lệ pass:** ____%

### Các lỗi phát hiện:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Đánh giá chung:
- [ ] ✅ Tất cả chức năng hoạt động tốt
- [ ] ⚠️ Có một số lỗi nhỏ cần sửa
- [ ] ❌ Có lỗi nghiêm trọng cần khắc phục ngay

### Ghi chú thêm:
________________________________________________________
________________________________________________________
________________________________________________________

---

**Chữ ký người kiểm tra:** _______________  
**Ngày:** _______________
