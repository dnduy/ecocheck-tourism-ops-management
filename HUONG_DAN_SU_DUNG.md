# 📖 HƯỚNG DẪN SỬ DỤNG HỆ THỐNG ECOCHECK

**Ngày cập nhật:** 8 Tháng 1, 2026  
**Phiên bản:** 1.0  
**URL Ứng dụng:** http://localhost:3001 (Development)

---

## 🔐 ĐĂNG NHẬP HỆ THỐNG

### Tài khoản mặc định:
- **Email:** admin@local.test  
- **Mật khẩu:** ChangeMe123!  
- **Vai trò:** Manager (Quản lý)

---

## 👥 QUẢN LÝ NGƯỜI DÙNG

### ✅ Thêm người dùng mới

1. **Đăng nhập với tài khoản Manager**
2. Vào tab **"Admin"** ở menu điều hướng
3. Chọn tab **"NS"** (Nhân sự)
4. Click nút **"+ Thêm nhân sự"**
5. Điền thông tin:
   - **Họ tên:** Tối thiểu 2 ký tự
   - **Email:** Định dạng email hợp lệ (vd: user@example.com)
   - **Mật khẩu:** 
     - Tối thiểu 8 ký tự
     - Có ít nhất 1 chữ hoa
     - Có ít nhất 1 chữ thường
     - Có ít nhất 1 số
   - **Vai trò:** Chọn từ dropdown
     - `MANAGER` - Quản lý (toàn quyền)
     - `SUPERVISOR` - Giám sát viên (quản lý ca, mẫu)
     - `STAFF` - Nhân viên (thực hiện checklist)
6. Click **"Lưu"**

### ✏️ Sửa thông tin người dùng

1. Tại tab **"NS"**, tìm người dùng cần sửa
2. Click icon **"Sửa"** (biểu tượng bút)
3. Cập nhật thông tin cần thiết
4. Click **"Lưu"**

**Lưu ý:** 
- Nếu để trống mật khẩu khi sửa, mật khẩu cũ sẽ được giữ nguyên
- Không thể sửa email thành email đã tồn tại

### 🗑️ Xóa người dùng

1. Tại tab **"NS"**, tìm người dùng cần xóa
2. Click icon **"Xóa"** (biểu tượng thùng rác)
3. Xác nhận xóa trong hộp thoại

**Lưu ý:**
- Không thể xóa tài khoản của chính mình
- Hành động xóa là **vĩnh viễn** và không thể hoàn tác

---

## 📍 QUẢN LÝ KHU VỰC

### ✅ Thêm khu vực mới

1. Vào tab **"Admin"** → **"Khu vực"**
2. Click **"+ Thêm khu vực"**
3. Điền thông tin:
   - **Tên khu vực:** Tối thiểu 2 ký tự (vd: "Nhà hàng tầng 1")
   - **Loại:** Chọn từ dropdown
     - `F&B` - Ẩm thực
     - `HOUSEKEEPING` - Buồng phòng
     - `FACILITIES` - Tiện ích
     - `GROUNDS` - Khuôn viên
     - `OTHER` - Khác
4. Click **"Lưu"**

### 🗑️ Xóa khu vực

1. Tại danh sách khu vực, click icon **"Xóa"**
2. Xác nhận xóa

**Cảnh báo:** Không thể xóa khu vực đang có checklist hoặc incident liên kết

---

## 📋 TẠO MẪU CHECKLIST (TEMPLATE)

### ✅ Tạo template mới

1. Vào **"Admin"** → **"Template"**
2. Click **"+ Tạo Template"**
3. Điền thông tin:
   - **Tên mẫu:** Tên mô tả (vd: "Kiểm tra vệ sinh bếp")
   - **Mô tả:** Mô tả chi tiết (tùy chọn)
   - **Tên nhóm:** Tên nhóm hạng mục (vd: "Khu vực bếp")
   - **Cột:** Tên cột đánh giá (vd: "Ca sáng", "Ca tối")
   - **Hạng mục:** Danh sách các hạng mục cần kiểm tra
     - Click **"+ Thêm hàng"** để thêm hạng mục
     - Click **"−"** để xóa hạng mục
     - Điền tên hạng mục (vd: "Sàn nhà sạch sẽ")
4. Click **"Tạo"**

### Cấu trúc template:

```
Template: Kiểm tra vệ sinh bếp
├─ Nhóm: Khu vực bếp
│  ├─ Hạng mục 1: Sàn nhà sạch sẽ
│  ├─ Hạng mục 2: Bàn làm việc ngăn nắp
│  └─ Hạng mục 3: Thiết bị được lau chùi
└─ Cột: Ca sáng | Ca tối
```

**Lưu ý:**
- Mỗi template cần ít nhất **1 nhóm** và **1 hạng mục**
- Template sau khi tạo có thể dùng để tạo checklist thực thi
- Template sẽ xuất hiện trong danh sách khi tạo checklist mới

---

## ✅ TẠO VÀ THỰC THI CHECKLIST

### 📝 Tạo checklist mới

1. Vào tab **"Checklists"**
2. Click **"+ Tạo checklist"**
3. Chọn thông tin:
   - **Khu vực:** Chọn khu vực thực hiện
   - **Ngày:** Chọn ngày thực hiện
4. Click **"Tạo"**

**Hệ thống tự động:**
- Chọn template phù hợp với khu vực
- Tạo checklist với trạng thái `DRAFT`
- Thêm vào danh sách checklist

### 🔍 Thực hiện checklist

1. Tại danh sách **Checklists**, click vào checklist cần thực hiện
2. Giao diện hiển thị **lưới hạng mục**:
   - Cột dọc: Danh sách hạng mục
   - Cột ngang: Các ca làm việc / thời điểm
3. **Đánh giá từng hạng mục:**
   - Click vào ô cần đánh giá
   - Chọn kết quả:
     - ✅ **OK** - Đạt yêu cầu
     - ❌ **NOT OK** - Không đạt
   - Nhập **Ghi chú** nếu cần (tùy chọn)
   - Upload **Hình ảnh** nếu cần (tùy chọn)
4. Dữ liệu **tự động lưu** sau mỗi thay đổi

### 📸 Upload hình ảnh

- Click vào ô đánh giá
- Click nút **"📷 Thêm hình ảnh"**
- Chọn file từ máy tính
- Hình ảnh sẽ được hiển thị trong ô

### ⚠️ Báo cáo sự cố từ checklist

Khi phát hiện hạng mục **NOT OK**:

1. Đánh dấu hạng mục là **NOT OK**
2. Click nút **"⚠️ Báo cáo sự cố"** xuất hiện
3. Form báo cáo tự động điền:
   - **Tiêu đề:** Tên hạng mục
   - **Khu vực:** Khu vực của checklist
   - **Mức độ:** Chọn mức độ nghiêm trọng
     - `CRITICAL` - Nghiêm trọng
     - `HIGH` - Cao
     - `MEDIUM` - Trung bình
     - `LOW` - Thấp
   - **Mô tả:** Mô tả chi tiết sự cố
4. Click **"Gửi báo cáo"**

### ✍️ Ký duyệt (Signoff)

**Cho nhân viên thực hiện:**
1. Hoàn thành tất cả hạng mục
2. Click nút **"✅ Hoàn thành"** ở cuối trang
3. Trạng thái chuyển sang `ACTIVE`

**Cho giám sát viên:**
1. Mở checklist đã hoàn thành
2. Kiểm tra lại tất cả hạng mục
3. Click nút **"👁️ Xác nhận giám sát"**
4. Trạng thái chuyển sang `COMPLETED`

**Cho quản lý:**
1. Mở checklist đã xác nhận
2. Kiểm tra cuối cùng
3. Click nút **"✅ Phê duyệt"**
4. Trạng thái chuyển sang `REVIEWED`

---

## 🚨 QUẢN LÝ SỰ CỐ (INCIDENTS)

### ✅ Tạo sự cố mới

1. Vào tab **"Incidents"**
2. Click **"+ Tạo sự cố"**
3. Điền thông tin:
   - **Tiêu đề:** Tóm tắt sự cố
   - **Khu vực:** Chọn khu vực xảy ra sự cố
   - **Mức độ:** Chọn mức độ nghiêm trọng
   - **Mô tả:** Mô tả chi tiết
4. Click **"Tạo"**

### 📊 Lọc và xem sự cố

**Lọc theo khu vực:**
- Chọn khu vực từ dropdown **"Tất cả khu vực"**
- Danh sách tự động cập nhật

**Lọc theo mức độ:**
- Click tab mức độ: **Tất cả / Nghiêm trọng / Cao / Trung bình / Thấp**

**Xem theo danh mục:**
- Sự cố được nhóm theo mức độ
- Mỗi thẻ hiển thị:
  - 🔴 Mức độ (màu sắc tương ứng)
  - 📍 Khu vực
  - 👤 Người báo cáo
  - 🕒 Thời gian
  - 📝 Trạng thái

### ✏️ Cập nhật trạng thái

1. Click vào sự cố cần cập nhật
2. Chọn trạng thái mới:
   - `OPEN` - Mở (mới tạo)
   - `IN_PROGRESS` - Đang xử lý
   - `RESOLVED` - Đã giải quyết
   - `CLOSED` - Đã đóng
3. Click **"Cập nhật"**

---

## ⏰ QUẢN LÝ CA LÀM VIỆC (SHIFTS)

### ✅ Thêm ca làm việc

1. Vào **"Admin"** → **"Ca trực"**
2. Click **"+ Thêm ca"**
3. Điền thông tin:
   - **Tên ca:** Vd "Ca sáng", "Ca tối"
   - **Giờ bắt đầu:** Vd 08:00
   - **Giờ kết thúc:** Vd 16:00
   - **Loại ca:** 
     - `NORMAL` - Thường
     - `OVERTIME` - Tăng ca
   - **Áp dụng cho khu vực:** Chọn các khu vực (hoặc để trống = tất cả)
4. Click **"Lưu"**

### 🗑️ Xóa ca làm việc

1. Click icon **"Xóa"** tại ca cần xóa
2. Xác nhận xóa

---

## 📊 XEM BÁO CÁO VÀ THỐNG KÊ

### Dashboard (Bảng điều khiển)

Hiển thị tổng quan hệ thống:
- **Tổng checklist:** Số lượng checklist đã tạo
- **Checklist hoàn thành:** Số lượng đã hoàn thành
- **Sự cố đang mở:** Số sự cố chưa giải quyết
- **Tỷ lệ hoàn thành:** Phần trăm checklist đã hoàn thành

**Biểu đồ:**
- Biểu đồ cột: Số lượng checklist theo ngày
- Biểu đồ tròn: Phân bố trạng thái checklist

### Reports (Báo cáo)

1. Vào tab **"Reports"**
2. Chọn **khoảng thời gian:**
   - 7 ngày
   - 30 ngày
   - Tùy chỉnh (chọn ngày bắt đầu & kết thúc)
3. Chọn **loại báo cáo:**
   - Theo khu vực
   - Theo nhân sự
   - Theo thời gian
4. Click **"📊 Xuất Excel"** để tải báo cáo

**Báo cáo bao gồm:**
- Danh sách checklist trong khoảng thời gian
- Tỷ lệ hoàn thành theo khu vực
- Thống kê sự cố theo mức độ
- Hiệu suất nhân viên

---

## 🔒 PHÂN QUYỀN TRUY CẬP

### MANAGER (Quản lý)
**Toàn quyền trên hệ thống:**
- ✅ Xem Dashboard & Reports
- ✅ Quản lý người dùng (thêm/sửa/xóa)
- ✅ Quản lý khu vực (thêm/sửa/xóa)
- ✅ Tạo template
- ✅ Quản lý ca làm việc
- ✅ Tạo và thực hiện checklist
- ✅ Phê duyệt cuối cùng (Signoff)
- ✅ Quản lý sự cố
- ✅ Xuất báo cáo

### SUPERVISOR (Giám sát viên)
**Quản lý vận hành:**
- ✅ Xem Dashboard
- ✅ Quản lý ca làm việc
- ✅ Tạo checklist từ template
- ✅ Thực hiện checklist
- ✅ Xác nhận giám sát (Signoff)
- ✅ Tạo và xem sự cố
- ❌ Không quản lý người dùng
- ❌ Không tạo template
- ❌ Không xuất báo cáo

### STAFF (Nhân viên)
**Thực hiện công việc:**
- ✅ Xem checklist được gán
- ✅ Thực hiện checklist
- ✅ Hoàn thành checklist (Signoff)
- ✅ Báo cáo sự cố
- ❌ Không tạo checklist
- ❌ Không quản lý hệ thống
- ❌ Không xem báo cáo

---

## 📱 QUÉT MÃ QR

### Sử dụng QR Scanner

1. Click icon **"QR"** ở góc trên cùng
2. Cho phép truy cập camera
3. Quét mã QR của khu vực / checklist
4. Hệ thống tự động:
   - Nhận diện checklist
   - Chuyển đến trang thực hiện
   - Load dữ liệu của checklist

**Công dụng:**
- Nhanh chóng mở checklist tại hiện trường
- Không cần tìm kiếm thủ công
- Giảm thời gian và sai sót

---

## 🔔 THÔNG BÁO

### Các loại thông báo:

**🔴 CRITICAL (Nghiêm trọng):**
- Lỗi hệ thống
- Lỗi xác thực
- Dữ liệu không hợp lệ

**🟡 NORMAL (Thường):**
- Cập nhật dữ liệu
- Xóa dữ liệu
- Thông tin chung

**🟢 SUCCESS (Thành công):**
- Tạo mới thành công
- Cập nhật thành công
- Hoàn thành công việc

**Quản lý thông báo:**
- Thông báo tự động hiện ở góc trên bên phải
- Tự động ẩn sau 6 giây
- Click **"X"** để đóng thủ công

---

## 🔧 XỬ LÝ LỖI THƯỜNG GẶP

### 1. Không đăng nhập được

**Nguyên nhân:**
- Email/mật khẩu sai
- Backend không chạy
- Token hết hạn

**Giải pháp:**
- Kiểm tra lại email và mật khẩu
- Liên hệ admin để reset mật khẩu
- Xóa cache trình duyệt và thử lại

### 2. Không load được dữ liệu

**Nguyên nhân:**
- Mất kết nối backend
- Token hết hạn
- Lỗi mạng

**Giải pháp:**
- F5 để tải lại trang
- Đăng xuất và đăng nhập lại
- Kiểm tra kết nối internet

### 3. Không lưu được dữ liệu

**Nguyên nhân:**
- Dữ liệu không hợp lệ
- Thiếu quyền truy cập
- Lỗi database

**Giải pháp:**
- Kiểm tra lại thông tin nhập vào
- Đảm bảo có quyền thực hiện thao tác
- Thông báo cho admin

### 4. Upload ảnh thất bại

**Nguyên nhân:**
- File quá lớn (>5MB)
- Định dạng không hỗ trợ
- Lỗi mạng

**Giải pháp:**
- Nén ảnh nhỏ hơn 5MB
- Chỉ dùng định dạng: JPG, PNG, WEBP
- Kiểm tra kết nối mạng

---

## 💡 MẸO SỬ DỤNG

### Tăng hiệu suất làm việc:

1. **Sử dụng QR Scanner:** Nhanh chóng truy cập checklist tại hiện trường
2. **Auto-save:** Dữ liệu tự động lưu, không lo mất dữ liệu
3. **Lọc dữ liệu:** Dùng bộ lọc để tìm nhanh checklist/sự cố
4. **Báo cáo nhanh:** Từ hạng mục NOT OK, click ngay "Báo cáo sự cố"
5. **Upload hình ảnh:** Chụp ảnh bằng điện thoại để lưu bằng chứng

### Phím tắt hữu ích:

- **Ctrl + S:** Lưu thay đổi (nếu có form đang mở)
- **Esc:** Đóng modal/popup
- **F5:** Tải lại dữ liệu
- **Ctrl + F:** Tìm kiếm trong trang

---

## 📞 HỖ TRỢ & LIÊN HỆ

### Cần hỗ trợ kỹ thuật?

**Email:** support@ecocheck.local  
**Hotline:** 1900-XXXX  
**Giờ làm việc:** 8:00 - 17:00 (Thứ 2 - Thứ 6)

### Báo lỗi hệ thống:

1. Chụp ảnh màn hình lỗi
2. Ghi lại các bước dẫn đến lỗi
3. Gửi email đến support kèm thông tin:
   - Tài khoản đang sử dụng
   - Thời gian xảy ra lỗi
   - Trình duyệt đang dùng
   - Mô tả chi tiết

### Đề xuất tính năng mới:

Gửi email với tiêu đề **"[ĐỀ XUẤT]"** kèm mô tả chi tiết tính năng mong muốn.

---

## 📚 TÀI LIỆU THAM KHẢO

- **TEST_CHECKLIST.md:** Hướng dẫn kiểm thử chi tiết
- **DEPLOYMENT_GUIDE.md:** Hướng dẫn triển khai hệ thống
- **FINAL_VERIFICATION_REPORT.md:** Báo cáo xác thực hệ thống
- **API Documentation:** Xem file `backend-app/routes/api.php`

---

**Chúc bạn sử dụng hệ thống hiệu quả! 🎉**
