# ✅ FIX: Checklist không hiển thị items

## 🐛 Vấn đề ban đầu:
- Staff không thấy được checklist
- Không xem được nội dung trong mỗi checklist  
- Mẫu checklist không có nội dung (items trống)

## 🔍 Nguyên nhân:

### 1. **Backend API không trả về đầy đủ dữ liệu**
   - `RunController@index` chỉ load `with(['area', 'template'])`
   - Không load `template.groups.items` → Items không được trả về

### 2. **Frontend mapping sai**
   - Map `it.content` nhưng database dùng `it.title`
   - Không flatten items từ các groups
   - Status mapping không chính xác

## ✅ Đã sửa:

### Backend (`backend-app/app/Http/Controllers/Api/RunController.php`):

```php
public function index(Request $request): JsonResponse
{
    $runs = Run::with([
            'area', 
            'template.groups.items',      // ← Added
            'template.columns',            // ← Added
            'entries',                     // ← Added
            'assignedUser',                // ← Added
            'verifiedUser'                 // ← Added
        ])
        ->when($request->area_id, fn($q) => $q->where('area_id', $request->area_id))
        ->when($request->status, fn($q) => $q->where('status', $request->status))
        ->when($request->date, fn($q) => $q->whereDate('scheduled_for', $request->date))  // ← Added
        ->orderByDesc('created_at')
        ->paginate(50);  // ← Increased from 20

    return response()->json($runs);
}
```

### Backend Model (`backend-app/app/Models/Run.php`):

```php
// Renamed methods to match usage
public function assignedUser(): BelongsTo  // was: assignee
{
    return $this->belongsTo(User::class, 'assigned_to');
}

public function verifiedUser(): BelongsTo  // was: verifier
{
    return $this->belongsTo(User::class, 'verified_by');
}
```

### Frontend (`App.tsx`):

```typescript
const mapRunToChecklist = (runData: any, areaList: Area[]): Checklist => {
    // ... 
    
    // ✅ Flatten all items from all groups
    const allItems: any[] = [];
    if (runData.template?.groups) {
      for (const group of runData.template.groups) {
        if (group.items) {
          allItems.push(...group.items);
        }
      }
    }
    
    // ✅ Map items with correct field name
    const items = allItems.map((it: any) => {
      const entry = entries.find((e: any) => e.item_id === it.id);
      let status: any;
      if (entry?.value === 'ok') status = 'PASS';
      else if (entry?.value === 'not_ok') status = 'FAIL';
      
      return {
        id: String(it.id),
        text: it.title || it.content || 'Item',  // ← Fixed: was only it.content
        isCritical: !!it.is_critical,
        status,
        note: entry?.note,
        photoUrl: entry?.photo_url
      };
    });

    // ✅ Map status correctly
    let mappedStatus = ChecklistStatus.PENDING;
    if (runData.status === 'in_progress') mappedStatus = ChecklistStatus.IN_PROGRESS;
    else if (runData.status === 'completed') mappedStatus = ChecklistStatus.COMPLETED;
    else if (runData.status === 'reviewed') mappedStatus = ChecklistStatus.REVIEWED;

    return {
      id: String(runData.id),
      templateName: runData.template?.name || 'Checklist',
      area,
      shift: 'Ca A',
      date: runData.scheduled_for || new Date().toISOString().split('T')[0],  // ← Fixed
      status: mappedStatus,
      items,  // ← Now has data!
      assignedTo: runData.assigned_to ? String(runData.assigned_to) : '',
      verifiedBy: runData.verified_by ? String(runData.verified_by) : undefined,
      completedAt: runData.completed_at,
      verifiedAt: runData.verified_at
    };
};
```

## 🧪 Cách test:

### 1. Start servers:

```bash
# Terminal 1: Backend
cd backend-app
php artisan serve
# Should run on http://127.0.0.1:8000

# Terminal 2: Frontend  
npm run dev
# Should run on http://localhost:3001
```

### 2. Test database có items:

```sql
-- Kiểm tra runs hôm nay
SELECT COUNT(*) FROM runs WHERE DATE(scheduled_for) = CURDATE();
-- Expected: 7 runs

-- Kiểm tra 1 run có items không
SELECT 
    t.name,
    COUNT(DISTINCT g.id) as groups,
    COUNT(i.id) as items
FROM runs r
JOIN checklist_templates t ON r.checklist_template_id = t.id
LEFT JOIN `groups` g ON t.id = g.checklist_template_id
LEFT JOIN items i ON g.id = i.group_id
WHERE r.id = 72  -- Replace with actual run ID
GROUP BY t.name;
-- Expected: Checklist Bếp Chính, 1 group, 48 items
```

### 3. Test API trả về items:

```bash
curl -s "http://localhost:8000/api/runs?date=2026-01-10" | python3 -m json.tool | grep -A 3 "title"
# Should see item titles
```

### 4. Test Frontend:

1. Mở trình duyệt: `http://localhost:3001`
2. Đăng nhập với:
   - Email: `hotel.staff1@local.test` (hoặc bất kỳ staff nào)
   - Password: `password`
3. Vào tab "Nhiệm vụ" (Checklists)
4. Click vào một checklist **in_progress**
5. **Phải thấy:** Danh sách items với checkbox, text description

## 📊 Dữ liệu mẫu hôm nay (2026-01-10):

```
Run ID | Template              | Area       | Status      | Items
-------|----------------------|------------|-------------|-------
72     | Bếp Chính            | Khách sạn  | in_progress | 48
73     | Quầy Bar             | Khách sạn  | pending     | 26
74     | Vệ Sinh WC           | Bảo trì    | in_progress | 12
75     | Nhà 2 Tầng           | Bảo trì    | in_progress | 42
76     | Bếp Quê              | Nhà hàng   | pending     | 81
77     | Nhà Hàng             | Nhà hàng   | in_progress | 51
78     | Cây Xanh             | Bảo trì    | pending     | 22
```

## 🎯 Kết quả mong đợi:

✅ Staff đăng nhập thấy được danh sách checklist  
✅ Click vào checklist thấy đầy đủ items (48, 26, 12, etc.)  
✅ Mỗi item có text description rõ ràng  
✅ Items có thể tick ✓ hoặc ✗  
✅ Items pending chưa có value, in_progress có một số checked  

## 🐞 Debug tips:

### Nếu vẫn không thấy items:

1. **Check console browser:** F12 → Console, xem có error không
2. **Check Network tab:** 
   - Request GET `/api/runs?date=2026-01-10` 
   - Response phải có `template.groups[].items[]`
3. **Check console.log trong App.tsx:**
   - Tìm: `"Loaded runs:"` 
   - Phải show `items: 48`, `items: 26`, etc.

### Nếu API trả về empty items:

```bash
# Check database relationships
SELECT 
  t.id, t.name,
  COUNT(g.id) as groups,
  COUNT(i.id) as items
FROM checklist_templates t
LEFT JOIN `groups` g ON t.id = g.checklist_template_id  
LEFT JOIN items i ON g.id = i.group_id
WHERE t.id >= 7
GROUP BY t.id, t.name;
```

## 📝 Summary:

**Files changed:**
1. `backend-app/app/Http/Controllers/Api/RunController.php` - Load đầy đủ relationships
2. `backend-app/app/Models/Run.php` - Rename methods
3. `App.tsx` - Fix mapping items từ groups, fix field names

**Key fixes:**
- Backend: Add `template.groups.items` to eager loading
- Frontend: Flatten items from groups, use `it.title` instead of `it.content`
- Frontend: Fix status mapping (`in_progress`, `completed`, `reviewed`)

**Result:** Checklist bây giờ hiển thị đầy đủ 48, 26, 12... items cho mỗi template! 🎉
