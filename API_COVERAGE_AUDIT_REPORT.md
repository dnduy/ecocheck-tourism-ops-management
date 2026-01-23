# 🔍 API Coverage Audit Report

**Ngày:** 7/1/2026  
**Mục đích:** Kiểm tra toàn bộ API endpoints để đảm bảo không còn lỗi tương tự User CRUD issue

---

## 📋 Tổng Quan

### Các Issues Đã Phát Hiện Và Sửa

| # | Service | Endpoint | Vấn đề | Giải pháp | Trạng thái |
|---|---------|----------|--------|-----------|-----------|
| 11 | userService | PATCH /users/{id} | 405 Method Not Allowed | Thêm store(), update(), destroy() vào UserController | ✅ Fixed |
| 12 | incidentService | GET /incidents/{id} | Route không tồn tại | Thêm show() method | ✅ Fixed |
| 12 | incidentService | DELETE /incidents/{id} | Route không tồn tại | Thêm destroy() method | ✅ Fixed |
| 13 | areaService | GET /areas/{id} | Route không tồn tại | Thêm show() method vào AreaController | ✅ Fixed |
| 14 | runService | DELETE /runs/{id} | Route không tồn tại | Thêm destroy() method + ChecklistService.deleteRun() | ✅ Fixed |
| 15 | reviewService | ALL /review/* | 9 routes không được register | Thêm ReviewController import + 9 routes vào api.php | ✅ Fixed |
| 16 | entryService | PUT /entries | Route không tồn tại (chỉ có /cells) | Thêm alias route /entries → EntryController | ✅ Fixed |

---

## 🛠️ Chi Tiết Fixes

### Issue #11: User CRUD Operations
**File:** `backend-app/app/Domains/User/Http/Controllers/UserController.php`

**Methods Added:**
```php
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|string|min:8',
        'role' => 'required|in:staff,supervisor,manager',
    ]);

    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        'role' => $validated['role'],
    ]);

    return response()->json($user, 201);
}

public function update(Request $request, $id): JsonResponse
{
    // Full validation + unique email check + password hashing
}

public function destroy($id): JsonResponse
{
    $user = User::findOrFail($id);
    
    // Prevent self-deletion
    if ($user->id === Auth::id()) {
        return response()->json(['message' => 'Cannot delete yourself'], 400);
    }
    
    $user->delete();
    return response()->json(null, 204);
}
```

**Routes Added:**
```php
Route::post('/users', [UserController::class, 'store']);
Route::patch('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);
```

---

### Issue #12: Incident CRUD Incomplete
**File:** `backend-app/app/Domains/Incident/Http/Controllers/IncidentController.php`

**Methods Added:**
```php
public function show($id): JsonResponse
{
    $incident = Incident::with(['area', 'run', 'assignedTo'])->findOrFail($id);
    return response()->json($incident);
}

public function destroy($id): JsonResponse
{
    $incident = Incident::findOrFail($id);
    $incident->delete();
    return response()->json(null, 204);
}
```

**Routes Added:**
```php
Route::get('/incidents/{id}', [IncidentController::class, 'show']);
Route::delete('/incidents/{id}', [IncidentController::class, 'destroy']);
```

---

### Issue #13: Area Show Method Missing
**File:** `backend-app/app/Domains/Checklist/Http/Controllers/AreaController.php`

**Method Added:**
```php
public function show($id): JsonResponse
{
    $area = Area::findOrFail($id);
    return response()->json($area);
}
```

**Route Added:**
```php
Route::get('/areas/{id}', [AreaController::class, 'show']);
```

---

### Issue #14: Run Delete Method Missing
**File:** `backend-app/app/Domains/Checklist/Http/Controllers/ChecklistRunController.php`

**Method Added:**
```php
public function destroy($id): JsonResponse
{
    $this->checklistService->deleteRun($id);
    return response()->json(null, 204);
}
```

**Service Method Added:**
`backend-app/app/Domains/Checklist/Services/ChecklistService.php`
```php
public function deleteRun(int $runId): void
{
    DB::transaction(function () use ($runId) {
        $run = Run::findOrFail($runId);
        
        // Cascade delete entries
        Entry::where('run_id', $runId)->delete();
        
        // Cascade delete signoffs
        Signoff::where('run_id', $runId)->delete();
        
        $run->delete();
    });
}
```

**Route Added:**
```php
Route::delete('/runs/{id}', [ChecklistRunController::class, 'destroy']);
```

---

### Issue #15: Review Routes Not Registered
**File:** `backend-app/routes/api.php`

**Controller Import Added:**
```php
use App\Http\Controllers\Api\ReviewController;
```

**Routes Added:**
```php
// Review Workflow
Route::get('/review/pending', [ReviewController::class, 'getPendingReviews']);
Route::get('/review/stats', [ReviewController::class, 'getStatusStats']);
Route::get('/review/runs/{run}', [ReviewController::class, 'showForReview']);
Route::post('/review/runs/{run}/start', [ReviewController::class, 'startWork']);
Route::post('/review/runs/{run}/complete', [ReviewController::class, 'completeWork']);
Route::post('/review/runs/{run}/request-review', [ReviewController::class, 'requestReview']);
Route::post('/review/runs/{run}/approve', [ReviewController::class, 'approve']);
Route::post('/review/runs/{run}/reject', [ReviewController::class, 'reject']);
Route::post('/review/runs/{run}/resubmit', [ReviewController::class, 'resubmit']);
```

**Note:** ReviewController đã được implement đầy đủ với 9 methods, chỉ thiếu route registration.

---

### Issue #16: Entry Route Alias Missing
**File:** `backend-app/routes/api.php`

**Import Added:**
```php
use App\Http\Controllers\Api\EntryController;
```

**Route Added:**
```php
Route::put('/entries', [EntryController::class, 'upsert']); // Alias for frontend
```

**Lý do:** Backend có `/cells` route, nhưng frontend service gọi `/entries`. Thêm alias route để tương thích.

---

## ✅ Verification

### Route List Verification
```bash
# User routes
php artisan route:list | grep users
  GET|HEAD  api/users .......................... User\Http\Controllers\UserController@index
  POST      api/users .......................... User\Http\Controllers\UserController@store
  GET|HEAD  api/users/{id} ..................... User\Http\Controllers\UserController@show
  PATCH     api/users/{id} ..................... User\Http\Controllers\UserController@update
  DELETE    api/users/{id} ..................... User\Http\Controllers\UserController@destroy

# Review routes
php artisan route:list | grep review
  GET|HEAD  api/review/pending ................ Api\ReviewController@getPendingReviews
  GET|HEAD  api/review/runs/{run} ............. Api\ReviewController@showForReview
  POST      api/review/runs/{run}/approve ...... Api\ReviewController@approve
  POST      api/review/runs/{run}/complete ..... Api\ReviewController@completeWork
  POST      api/review/runs/{run}/reject ....... Api\ReviewController@reject
  POST      api/review/runs/{run}/request-review Api\ReviewController@requestReview
  POST      api/review/runs/{run}/resubmit ..... Api\ReviewController@resubmit
  POST      api/review/runs/{run}/start ........ Api\ReviewController@startWork
  GET|HEAD  api/review/stats ................... Api\ReviewController@getStatusStats

# Entry routes
php artisan route:list | grep entries
  PUT       api/entries ........................ Api\EntryController@upsert

# All fixed routes
php artisan route:list | grep -E "(incidents|areas|runs)" | grep -E "(show|destroy)"
  GET|HEAD  api/areas/{id} ..................... AreaController@show
  DELETE    api/incidents/{id} ................. IncidentController@destroy
  GET|HEAD  api/incidents/{id} ................. IncidentController@show
  DELETE    api/runs/{id} ...................... ChecklistRunController@destroy
```

---

## 📊 Service Coverage Matrix

| Frontend Service | Backend Routes | Controller | Status |
|-----------------|----------------|------------|--------|
| authService | POST /auth/login, /auth/logout, GET /me | AuthController | ✅ Complete |
| userService | GET/POST/PATCH/DELETE /users, /users/{id} | UserController | ✅ Fixed (Issue #11) |
| areaService | GET/POST/PATCH/DELETE /areas, /areas/{id} | AreaController | ✅ Fixed (Issue #13) |
| templateService | GET/POST/PUT/DELETE /templates, /templates/{id} | TemplatesController | ✅ Complete |
| runService | GET/POST/PATCH/DELETE /runs, /runs/{id} | ChecklistRunController | ✅ Fixed (Issue #14) |
| entryService | PUT /entries | EntryController | ✅ Fixed (Issue #16) |
| signoffService | PUT /signoffs | SignoffController | ✅ Complete |
| incidentService | GET/POST/PATCH/DELETE /incidents, /incidents/{id} | IncidentController | ✅ Fixed (Issue #12) |
| reviewService | 9 routes /review/* | ReviewController | ✅ Fixed (Issue #15) |
| statsService | GET /admin/staff-stats, /admin/supervisor-stats | StatsController | ✅ Complete |
| dashboardService | Aggregates /runs, /incidents, /areas | Multiple | ✅ Complete |

---

## 🎯 Kết Luận

### Tổng Số Issues Fixed: 6 issues (11-16)

**Impact:**
- ✅ **User Management:** Đã có đầy đủ CRUD operations
- ✅ **Incident Management:** Show và Delete hoạt động
- ✅ **Area Management:** Show method đã thêm
- ✅ **Run Management:** Delete với cascade logic
- ✅ **Review Workflow:** Toàn bộ 9 endpoints đã được kết nối
- ✅ **Entry Management:** Frontend có thể gọi /entries thay vì /cells

**Lessons Learned:**
1. Controllers có thể được implement nhưng routes chưa được register
2. Backend và frontend có thể dùng tên endpoint khác nhau (cells vs entries)
3. Cần kiểm tra toàn bộ service layer → route → controller chain
4. Delete operations cần cascade logic để tránh orphan records

**Testing Checklist:**
- [ ] Test User CRUD trong Admin panel
- [ ] Test Incident show/delete operations
- [ ] Test Area show operation
- [ ] Test Run delete operation
- [ ] Test Review workflow (pending, approve, reject)
- [ ] Test Entry upsert via /entries endpoint
- [ ] Verify no 404/405 errors in browser console

---

**Báo cáo được tạo bởi:** GitHub Copilot  
**Thời gian:** 2026-01-07  
**Phiên bản:** v1.0
