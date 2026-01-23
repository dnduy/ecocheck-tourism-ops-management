# 🧪 Test Guide - API Coverage Fixes

## 📋 Danh Sách Test Cases

### 1️⃣ User CRUD Operations (Issue #11)

#### Test Create User
```bash
curl -X POST http://localhost:8000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "password123",
    "role": "staff"
  }'
```

**Expected:** Status 201, returns user object

#### Test Update User
```bash
curl -X PATCH http://localhost:8000/api/users/3 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "role": "supervisor"
  }'
```

**Expected:** Status 200, returns updated user

#### Test Delete User
```bash
curl -X DELETE http://localhost:8000/api/users/3 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 204, no content

#### UI Test
1. Login as Manager
2. Go to Admin → USERS tab
3. Click "Thêm người dùng"
4. Fill form and submit
5. Edit user info
6. Delete user
7. **Verify:** No 405 errors in console

---

### 2️⃣ Incident Management (Issue #12)

#### Test Get Single Incident
```bash
curl -X GET http://localhost:8000/api/incidents/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, incident details with area, run, assignedTo relations

#### Test Delete Incident
```bash
curl -X DELETE http://localhost:8000/api/incidents/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 204

#### UI Test
1. Go to Incidents page
2. Click on incident row to view details
3. Click delete button
4. **Verify:** Incident removed from list, no errors

---

### 3️⃣ Area Management (Issue #13)

#### Test Get Single Area
```bash
curl -X GET http://localhost:8000/api/areas/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, area details

#### UI Test
1. Go to Admin → AREAS tab
2. Click on area row
3. **Verify:** Area details displayed correctly

---

### 4️⃣ Run Management (Issue #14)

#### Test Delete Run (với cascade)
```bash
curl -X DELETE http://localhost:8000/api/runs/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 204

**Verify Cascade:**
```sql
-- Should be empty after delete
SELECT * FROM entries WHERE run_id = 1;
SELECT * FROM signoffs WHERE run_id = 1;
```

#### UI Test
1. Go to Checklists page
2. Click delete icon on checklist run
3. **Verify:** Run deleted, no orphan entries/signoffs in DB

---

### 5️⃣ Review Workflow (Issue #15)

#### Test Get Pending Reviews
```bash
curl -X GET http://localhost:8000/api/review/pending \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, list of runs with status='needs_review'

#### Test Start Work
```bash
curl -X POST http://localhost:8000/api/review/runs/1/start \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, run status → 'in_progress', work_started_at set

#### Test Complete Work
```bash
curl -X POST http://localhost:8000/api/review/runs/1/complete \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, run status → 'completed', work_completed_at set

#### Test Request Review
```bash
curl -X POST http://localhost:8000/api/review/runs/1/request-review \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, run status → 'needs_review', review_requested_at set

#### Test Approve
```bash
curl -X POST http://localhost:8000/api/review/runs/1/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"review_note": "Looks good!"}'
```

**Expected:** Status 200, run status → 'approved', signoff created

#### Test Reject
```bash
curl -X POST http://localhost:8000/api/review/runs/1/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"review_note": "Needs revision"}'
```

**Expected:** Status 200, run status → 'rejected'

#### Test Resubmit
```bash
curl -X POST http://localhost:8000/api/review/runs/1/resubmit \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, run status → 'needs_review' again

#### Test Get Stats
```bash
curl -X GET http://localhost:8000/api/review/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Status 200, stats object

#### UI Test
1. Login as Staff → Start checklist → Complete → Request Review
2. Login as Supervisor → View pending reviews
3. Approve or Reject
4. If rejected, login as Staff → Resubmit
5. **Verify:** All status transitions work, no 404 errors

---

### 6️⃣ Entry Management (Issue #16)

#### Test Entry Upsert via /entries
```bash
curl -X PUT http://localhost:8000/api/entries \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "run_id": 1,
    "item_id": 1,
    "column_id": 1,
    "value": "ok",
    "note": "Test note"
  }'
```

**Expected:** Status 200, entry created or updated

#### UI Test
1. Go to Checklist Execution
2. Check items in grid
3. Add notes
4. **Verify:** Auto-save works, no /cells errors in console

---

## 🔍 Comprehensive Test Script

Tạo file `test_api_coverage.sh`:

```bash
#!/bin/bash

API_BASE="http://localhost:8000/api"
TOKEN="YOUR_TOKEN_HERE"

echo "🧪 Testing API Coverage Fixes..."

# Test 1: User CRUD
echo "1️⃣ Testing User CRUD..."
curl -s -X POST $API_BASE/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123","role":"staff"}' \
  | jq .

# Test 2: Incident Show/Delete
echo "2️⃣ Testing Incident Show..."
curl -s -X GET $API_BASE/incidents/1 \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test 3: Area Show
echo "3️⃣ Testing Area Show..."
curl -s -X GET $API_BASE/areas/1 \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test 4: Run Delete
echo "4️⃣ Testing Run Delete..."
curl -s -X DELETE $API_BASE/runs/999 \
  -H "Authorization: Bearer $TOKEN" -w "\nStatus: %{http_code}\n"

# Test 5: Review Routes
echo "5️⃣ Testing Review Pending..."
curl -s -X GET $API_BASE/review/pending \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "5️⃣ Testing Review Stats..."
curl -s -X GET $API_BASE/review/stats \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test 6: Entry Upsert
echo "6️⃣ Testing Entry Upsert..."
curl -s -X PUT $API_BASE/entries \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"run_id":1,"item_id":1,"column_id":1,"value":"ok"}' \
  | jq .

echo "✅ All tests completed!"
```

**Chạy:**
```bash
chmod +x test_api_coverage.sh
./test_api_coverage.sh
```

---

## 📊 Expected Results Summary

| Test | Endpoint | Expected Status | Expected Behavior |
|------|----------|----------------|-------------------|
| User Create | POST /users | 201 | User created |
| User Update | PATCH /users/{id} | 200 | User updated |
| User Delete | DELETE /users/{id} | 204 | User deleted |
| Incident Show | GET /incidents/{id} | 200 | With relations |
| Incident Delete | DELETE /incidents/{id} | 204 | Incident removed |
| Area Show | GET /areas/{id} | 200 | Area details |
| Run Delete | DELETE /runs/{id} | 204 | + cascade entries/signoffs |
| Review Pending | GET /review/pending | 200 | List of runs |
| Review Stats | GET /review/stats | 200 | Stats object |
| Review Start | POST /review/runs/{id}/start | 200 | Status → in_progress |
| Review Complete | POST /review/runs/{id}/complete | 200 | Status → completed |
| Review Request | POST /review/runs/{id}/request-review | 200 | Status → needs_review |
| Review Approve | POST /review/runs/{id}/approve | 200 | Status → approved |
| Review Reject | POST /review/runs/{id}/reject | 200 | Status → rejected |
| Review Resubmit | POST /review/runs/{id}/resubmit | 200 | Status → needs_review |
| Entry Upsert | PUT /entries | 200 | Entry created/updated |

---

## ✅ Checklist Sau Khi Test

- [ ] Không có lỗi 404 Not Found
- [ ] Không có lỗi 405 Method Not Allowed
- [ ] Không có lỗi 500 Internal Server Error
- [ ] User CRUD hoạt động trong Admin panel
- [ ] Incident show/delete hoạt động
- [ ] Area show hoạt động
- [ ] Run delete cascade entries/signoffs
- [ ] Review workflow đầy đủ 9 operations
- [ ] Entry auto-save không có lỗi console
- [ ] Browser console sạch (no errors)

---

## 🐛 Troubleshooting

### Lỗi 401 Unauthorized
```bash
# Get new token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@test.com","password":"password"}'
```

### Lỗi 404 Not Found
```bash
# Check routes registered
php artisan route:list | grep <endpoint>
```

### Lỗi 500 Internal Server Error
```bash
# Check Laravel logs
tail -f backend-app/storage/logs/laravel.log
```

### Clear Cache
```bash
cd backend-app
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

---

**Last Updated:** 2026-01-07  
**Related:** API_COVERAGE_AUDIT_REPORT.md
