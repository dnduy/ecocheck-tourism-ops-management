# 📋 PHÂN TÍCH LOGIC GIAO VIỆC VÀ CHECKLIST HẰNG NGÀY

**Ngày kiểm tra**: 12/01/2026  
**Phiên bản**: v1.0

---

## 🎯 YÊU CẦU CỦA USER

✅ 1. Kiểm tra logic giao việc cho nhân viên  
✅ 2. Checklist cần ghi rõ ngày để dễ giám sát  
✅ 3. Người dùng cần biết mỗi người làm 1-3 checklist  
✅ 4. Chưa hiển thị công việc theo ngày của mỗi người  
✅ 5. Cần hiểu rõ phương án xử lý

---

## 🔍 PHÂN TÍCH HIỆN TẠI

### 1. FLOW GIAO VIỆC (Assignment)

#### **Backend** - [RunController.php](backend-app/app/Http/Controllers/Api/RunController.php)

```php
// POST /api/runs - Tạo run (công việc)
{
    "checklist_template_id": 7,        // Template: "Bếp Chính"
    "area_id": 11,                      // Area: "Khách sạn"
    "assigned_to": 5,                   // Gán cho staff ID 5
    "verified_by": 2,                   // Duyệt bởi supervisor ID 2
    "scheduled_for": "2026-01-12"      // 📅 Ngày thực hiện
}

// PUT /api/runs/{id} - Cập nhật gán việc
{
    "assigned_to": 5,     // Thay đổi staff
    "verified_by": 2      // Thay đổi supervisor
}
```

#### **Frontend** - [Admin.tsx](pages/Admin.tsx)

```tsx
// Tab "Gán việc" (ASSIGN_WORK)
1️⃣ Chọn Template
2️⃣ Chọn Area  
3️⃣ Chọn Staff (Người thực hiện)
4️⃣ Chọn Supervisor (Người kiểm tra)
5️⃣ Chọn Ngày thực hiện
→ Click "Gán việc"

// Hoặc quick assign trên Checklists tab
// Click item → Dropdown để chọn staff/supervisor
```

**UI Component** (Admin.tsx #1020):
```tsx
{/* THỰC HIỆN */}
<select value={checklistData.assignedTo}>
  <option>-- Chọn --</option>
  {users.map(u => <option value={u.id}>{u.name}</option>)}
</select>

{/* KIỂM TRA */}
<select value={checklistData.verifiedBy}>
  <option>-- Chọn --</option>
  {users.map(u => <option value={u.id}>{u.name}</option>)}
</select>
```

#### **Luồng Logic**:

```
Admin/Supervisor gọi API
    ↓
POST /api/runs {
    checklist_template_id,
    area_id,
    assigned_to (staff ID),
    verified_by (supervisor ID),
    scheduled_for (ngày)
}
    ↓
Backend tạo Run record
    ↓
Run.assigned_to = ID nhân viên
Run.scheduled_for = "2026-01-12"
    ↓
Staff login → Xem "Việc của tôi"
    ↓
Frontend filter: 
    checklists.filter(c => c.assignedTo === currentUser.id)
    ↓
Hiển thị checklist cho ngày kia
```

---

### 2. HIỂN THỊ CÔNG VIỆC THEO NGÀY

#### **Frontend** - [Checklists.tsx](pages/Checklists.tsx)

**Tabs filter**:
```tsx
const filter = 'MINE' | 'TO_VERIFY' | 'COMPLETED' | 'ALL'

// 📍 "Việc của tôi" (MINE)
- Hiển thị: runs được gán cho currentUser
- Ignore date filter: show tất cả ngày
- Line 53: return String(c.assignedTo) === String(currentUser.id)

// 📍 "Cần duyệt" (TO_VERIFY)
- Hiển thị: runs chờ duyệt (status = COMPLETED)
- Ignore date filter: show tất cả ngày
- Line 56: return c.status === ChecklistStatus.COMPLETED
```

**Date Picker** (Checklists.tsx #95):
```tsx
{/* Date Picker - Hidden when viewing "My Work" or "To Verify" */}
{filter !== 'MINE' && filter !== 'TO_VERIFY' && (
  <input type="date" value={selectedDate} onChange={...} />
)}

// ❌ VẤNĐỀ: 
// - Khi Staff xem "Việc của tôi" → ĐÃ ẩn date picker
// - Nhưng vẫn hiển thị TẤT CẢ ngày trộn lẫn
```

**Filtering Logic** (Checklists.tsx #47-66):
```tsx
const filteredData = checklists.filter(c => {
    // 1. Date Filter
    if (filter !== 'MINE' && filter !== 'TO_VERIFY') {
        const checklistDate = c.date?.split('T')[0];
        if (checklistDate !== selectedDate) return false;
    }
    
    // 2. Tab Filter
    if (filter === 'MINE') return String(c.assignedTo) === String(currentUser.id);
    if (filter === 'TO_VERIFY') return c.status === ChecklistStatus.COMPLETED;
    
    return true;
});
```

**Sorting** (Checklists.tsx #69-82):
```tsx
sortBy = 'DATE' | 'STATUS' | 'AREA'

// Sort by DATE (default)
return new Date(b.date).getTime() - new Date(a.date).getTime();
```

**Display Format** (Checklists.tsx #120+):
```tsx
<div className="...">
  <div className="area">Khách sạn</div>
  <div className="template">Bếp Chính</div>
  <div className="date">{checklist.date}</div>  {/* Shows date */}
  <div className="assigned_to">Nguyễn Văn A</div>
  <div className="status">{checklist.status}</div>
</div>
```

---

## ⚠️ VẤNĐỀ PHÁT HIỆN

### 1. 🔴 CRITICAL: Date header không rõ ràng

**Vấn đề**: 
- Hiển thị date ở mỗi item nhưng rất nhỏ, không nổi bật
- Người dùng khó nhận thấy checklist của ngày nào

**Ví dụ hiện tại**:
```
📋 Bếp Chính | Khách sạn
👤 Gán cho: Nguyễn Văn A
🔍 Kiểm tra: Vũ Văn Hải
⏰ 2026-01-12          ← ✅ Có ngày nhưng NHỎ
🟡 Chưa làm
```

**Cải thiện**: Cần date header rõ ràng ở trên

### 2. 🟡 MEDIUM: Không hiển thị "Mỗi người bao nhiêu checklist"

**Vấn đề**:
- Staff không biết "Hôm nay tôi cần làm mấy checklist"
- Không có counter "1/3" hoặc "Còn 2 việc"

**Cải thiện**: Thêm badge hiển thị số lượng

### 3. 🟡 MEDIUM: "Việc của tôi" tab vẫn trộn nhiều ngày

**Vấn đề**:
- Staff mở "Việc của tôi" → Thấy tất cả checklists được gán
- Không clear được công việc hôm nay là bao nhiêu

**UI Hiện tại**:
```
Tab: [Tất cả] [Việc của tôi] [Cần duyệt] [Lịch sử]
              ↑ Click vào
                ↓
        Hiển thị 10 checklists:
        - 5 cái ngày 01/12
        - 3 cái ngày 01/11
        - 2 cái ngày 01/10
        
        ❌ Không có section header chia theo ngày
```

### 4. 🟡 MEDIUM: Không có "Daily Summary"

**Vấn đề**:
- Không biết "Bao nhiêu việc chưa làm, bao nhiêu đã làm hôm nay"
- Không có progress indicator

**Ví dụ**: 
```
❌ Chưa làm: 2/3
🔄 Đang làm: 1/3
✅ Hoàn thành: 0/3
👀 Chờ duyệt: 0/3
```

### 5. 🟡 MEDIUM: Backend query không optimize

**Vấn đề**:
- RunController.index() lấy tất cả runs
- Frontend filter client-side
- Nếu có 1000+ runs → chậm

---

## ✅ PHẦN LÀM TỐT

### ✅ 1. Backend assignment logic đúng
```php
$run->update([
    'assigned_to' => $staffId,
    'verified_by' => $supervisorId,
    'scheduled_for' => $date
]);
```

### ✅ 2. Role-based filtering OK
```php
if ($user->role === 'staff') {
    $query->where('assigned_to', $user->id);  // ✅ Chỉ xem việc của mình
}
```

### ✅ 3. Frontend filter by assigned_to OK
```tsx
if (filter === 'MINE') 
    return String(c.assignedTo) === String(currentUser.id);  // ✅ Đúng
```

### ✅ 4. Date field stored correctly
```
Run.scheduled_for = "2026-01-12"  // ✅ Lưu rõ ràng
```

---

## 🎯 KHUYẾN NGHỊ CẢI THIỆN

### 🔵 Priority 1: Add Date Header (HIGH)

**File**: [Checklists.tsx](pages/Checklists.tsx)

```tsx
// Hiện tại
{sortedData.map(checklist => (
  <ChecklistCard key={checklist.id} checklist={checklist} />
))}

// 🎯 Cải thiện
{groupBy(sortedData, 'date').map((date, items) => (
  <div key={date}>
    {/* Date Header */}
    <div className="bg-brand-50 p-3 rounded-lg sticky top-0">
      <div className="font-bold text-sm text-gray-900">
        📅 {formatDate(date)}
        <span className="ml-2 text-xs text-gray-500">
          ({items.length} checklist)
        </span>
      </div>
      {/* Status Summary */}
      <div className="flex gap-4 mt-2 text-xs">
        <span className="text-red-600">❌ {count(items, s => pending)} chưa làm</span>
        <span className="text-blue-600">🔄 {count(items, s => in_progress)} đang làm</span>
        <span className="text-green-600">✅ {count(items, s => completed)} hoàn thành</span>
        <span className="text-purple-600">👀 {count(items, s => needs_review)} chờ duyệt</span>
      </div>
    </div>
    
    {/* Checklists for this date */}
    {items.map(checklist => (
      <ChecklistCard key={checklist.id} checklist={checklist} />
    ))}
  </div>
))}
```

### 🔵 Priority 2: Add Counter Badge (HIGH)

**File**: [Checklists.tsx](pages/Checklists.tsx)

```tsx
// Tab header
<div className="flex gap-2">
  <button 
    className={filter === 'MINE' ? 'active' : ''}
    onClick={() => setFilter('MINE')}
  >
    Việc của tôi
    <span className="badge">{countMineToday}</span>  {/* ← NEW */}
  </button>
  
  <button 
    className={filter === 'TO_VERIFY' ? 'active' : ''}
    onClick={() => setFilter('TO_VERIFY')}
  >
    Cần duyệt
    <span className="badge">{countToVerify}</span>  {/* ← NEW */}
  </button>
</div>
```

### 🔵 Priority 3: Add Daily Stats (HIGH)

**File**: [Checklists.tsx](pages/Checklists.tsx)

```tsx
// For STAFF viewing "Việc của tôi", show today only with stats
if (filter === 'MINE') {
  const today = localISODate();
  const todayChecklists = checklists.filter(
    c => String(c.assignedTo) === String(currentUser.id) && 
         c.date?.split('T')[0] === today
  );
  
  return (
    <>
      {/* Today Stats Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-2xl">
        <h2 className="font-bold text-lg mb-3">📅 Công việc hôm nay</h2>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="bg-white p-2 rounded text-center">
            <div className="text-2xl font-bold text-gray-400">
              {todayChecklists.length}
            </div>
            <div className="text-xs text-gray-500">Tổng số</div>
          </div>
          
          <div className="bg-red-50 p-2 rounded text-center">
            <div className="text-2xl font-bold text-red-600">
              {todayChecklists.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-xs text-red-500">Chưa làm</div>
          </div>
          
          <div className="bg-blue-50 p-2 rounded text-center">
            <div className="text-2xl font-bold text-blue-600">
              {todayChecklists.filter(c => c.status === 'in_progress').length}
            </div>
            <div className="text-xs text-blue-500">Đang làm</div>
          </div>
          
          <div className="bg-green-50 p-2 rounded text-center">
            <div className="text-2xl font-bold text-green-600">
              {todayChecklists.filter(c => c.status === 'completed').length}
            </div>
            <div className="text-xs text-green-500">Hoàn thành</div>
          </div>
        </div>
      </div>
      
      {/* Checklists */}
      {todayChecklists.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Hôm nay bạn không có công việc</p>
        </div>
      ) : (
        todayChecklists.map(c => <ChecklistCard key={c.id} {...} />)
      )}
    </>
  );
}
```

### 🔵 Priority 4: Backend Query Optimization (MEDIUM)

**File**: [RunController.php](backend-app/app/Http/Controllers/Api/RunController.php)

```php
// Hiện tại
$query->orderByDesc('created_at')->paginate($perPage);

// 🎯 Cải thiện: Add scheduled_for filter
if ($request->date) {
    $query->whereDate('scheduled_for', $request->date);
}

// 🎯 Cải thiện: Add ordering by scheduled_for
$query->orderByDesc('scheduled_for')
      ->orderByDesc('created_at')
      ->paginate($perPage);
```

---

## 📊 SO SÁNH: HIỆN TẠI vs CẢI THIỆN

### Hiển thị Checklist hôm nay (Staff view)

**❌ HIỆN TẠI**:
```
Tab: [Tất cả] [Việc của tôi] [Cần duyệt] [Lịch sử]
              ↑

Checklists (không order, trộn ngày):
1. Bếp Chính | Khách sạn | 2026-01-12 | Chưa làm
2. Quầy Bar | Nhà hàng | 2026-01-11 | Hoàn thành
3. Bếp Quê | Nhà hàng | 2026-01-12 | Đang làm
4. WC | Bảo trì | 2026-01-10 | Chưa làm
5. Nhà hàng | Nhà hàng | 2026-01-12 | Chưa làm

👁️ User phải tự scroll tìm việc hôm nay
```

**✅ CẢI THIỆN**:
```
📅 Công việc hôm nay (12/01/2026)
┌─────────────────────┐
│ 3      1       2      0   │
│ Tổng  Chưa làm Đang làm Xong
└─────────────────────┘

📅 12/01/2026 - 3 checklist
✅ #1 Bếp Chính | Khách sạn | ❌ Chưa làm | [Bắt đầu]
🔄 #2 Bếp Quê | Nhà hàng | 🔄 Đang làm | [Tiếp tục]
✅ #3 Quầy Bar | Nhà hàng | ✅ Hoàn thành | [Duyệt]

─────────────────────────────

📅 11/01/2026 - 1 checklist
✅ #4 WC | Bảo trì | ✅ Hoàn thành | [Chi tiết]

👁️ Rõ ràng, organized, dễ track progress
```

---

## 🎯 TÓCHIỂU

### Logic hiện tại:
✅ Giao việc: Assignment đúng (assigned_to, verified_by, scheduled_for)
✅ Filtering: Backend role-based OK
✅ Storage: Ngày lưu đúng trong database

### Vấn đề:
❌ UI không hiển thị rõ ngày
❌ Không group theo ngày
❌ Không có daily summary
❌ Không show số lượng checklist mỗi ngày

### Giải pháp:
1. 🔵 Add sticky date header (ngay hôm nay focus)
2. 🔵 Group checklists by date
3. 🔵 Show stats: "3 checklist hôm nay, 1 chưa làm"
4. 🟢 Backend: Optimize query với date filter
5. 🟢 Add toast: "Bạn có 3 checklist cho hôm nay"

---

## 📝 ACTION ITEMS

**Frontend** [Checklists.tsx](pages/Checklists.tsx):
- [ ] Add groupBy(date) function
- [ ] Add sticky date header with count
- [ ] Add daily stats card for "Việc của tôi"
- [ ] Show today checklists first
- [ ] Add counter badges to tabs

**Backend** [RunController.php](backend-app/app/Http/Controllers/Api/RunController.php):
- [ ] Optimize query: orderByDesc('scheduled_for')
- [ ] Add date filter support

**Database**:
- ✅ Already correct: scheduled_for field exists

---

**Created**: 12/01/2026  
**Status**: ✅ Phân tích hoàn thành, sẵn sàng implement
