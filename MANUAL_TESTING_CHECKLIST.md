# ✅ Manual Testing Checklist - API Coverage Fixes

**Date:** January 14, 2026  
**Status:** Ready for Testing  
**Backend:** http://localhost:8000  
**Frontend:** http://localhost:5173

---

## 🎯 Testing Objectives

Test all 6 fixed issues to ensure:
- ✅ No 404 (Not Found) errors
- ✅ No 405 (Method Not Allowed) errors
- ✅ No 500 (Internal Server Error)
- ✅ UI operations complete successfully
- ✅ Browser console is clean

---

## 📝 Pre-Test Setup

### 1. Verify Servers Running
```bash
# Backend (Terminal 1)
cd backend-app
php artisan serve
# Should see: Laravel development server started on http://127.0.0.1:8000

# Frontend (Terminal 2)
npm run dev
# Should see: Local: http://localhost:5173
```

### 2. Open Browser
- Open http://localhost:5173
- Open Developer Tools (F12 or Cmd+Opt+I)
- Keep Console tab open to monitor for errors

### 3. Login
- Email: `admin@local.test`
- Password: `admin`
- Should redirect to Dashboard

---

## 🧪 Test Cases

### ✅ Issue #11: User CRUD Operations

**Location:** Admin → USERS tab

#### Test 1.1: Create User
1. Click **"Thêm người dùng"** button
2. Fill form:
   - Name: `Test Staff User`
   - Email: `teststaff@example.com`
   - Password: `password123`
   - Role: `Staff`
3. Click **Save**
4. **Expected:** 
   - ✅ User appears in list
   - ✅ Success message shown
   - ✅ No 405 errors in console

**Console Check:**
```
POST http://localhost:8000/api/users
Status: 201 Created
```

#### Test 1.2: Update User
1. Find the newly created user in list
2. Click **Edit** icon (pencil)
3. Change Name to: `Updated Staff User`
4. Click **Save**
5. **Expected:**
   - ✅ Name updated in list
   - ✅ No 405 errors in console

**Console Check:**
```
PATCH http://localhost:8000/api/users/[id]
Status: 200 OK
```

#### Test 1.3: Delete User
1. Find the test user
2. Click **Delete** icon (trash)
3. Confirm deletion
4. **Expected:**
   - ✅ User removed from list
   - ✅ No errors in console

**Console Check:**
```
DELETE http://localhost:8000/api/users/[id]
Status: 204 No Content
```

---

### ✅ Issue #12: Incident Show & Delete

**Location:** Incidents page

#### Test 2.1: View Incident Details
1. Go to **Incidents** page
2. Click on any incident row
3. **Expected:**
   - ✅ Detail modal/view opens
   - ✅ Shows incident info (area, run, assigned user)
   - ✅ No 404 errors in console

**Console Check:**
```
GET http://localhost:8000/api/incidents/[id]
Status: 200 OK
```

#### Test 2.2: Delete Incident
1. Open incident details OR click delete icon directly
2. Click **Delete** button
3. Confirm deletion
4. **Expected:**
   - ✅ Incident removed from list
   - ✅ No errors

**Console Check:**
```
DELETE http://localhost:8000/api/incidents/[id]
Status: 204 No Content
```

---

### ✅ Issue #13: Area Show

**Location:** Admin → AREAS tab

#### Test 3.1: View Area Details
1. Go to Admin → **AREAS** tab
2. Click on any area row
3. **Expected:**
   - ✅ Area details displayed (name, description, etc.)
   - ✅ No 404 errors

**Console Check:**
```
GET http://localhost:8000/api/areas/[id]
Status: 200 OK
```

---

### ✅ Issue #14: Run Delete with Cascade

**Location:** Checklists page

#### Test 4.1: Delete Checklist Run
1. Go to **Checklists** page
2. Find a checklist run with entries/signoffs (if possible)
3. Click **Delete** icon
4. Confirm deletion
5. **Expected:**
   - ✅ Run removed from list
   - ✅ Related entries/signoffs also deleted (cascade)
   - ✅ No orphan records in database

**Console Check:**
```
DELETE http://localhost:8000/api/runs/[id]
Status: 204 No Content
```

**Database Verification (Optional):**
```bash
cd backend-app
php artisan tinker --execute="
  \$runId = 1; // Replace with deleted run ID
  echo 'Entries: ' . Entry::where('run_id', \$runId)->count() . PHP_EOL;
  echo 'Signoffs: ' . Signoff::where('run_id', \$runId)->count() . PHP_EOL;
"
# Expected: Both should be 0
```

---

### ✅ Issue #15: Review Workflow (9 Operations)

**Location:** Review page / Checklist Execution

This requires a complete workflow test:

#### Test 5.1: Staff - Start Work
1. Login as **Staff** user
2. Go to Checklists
3. Create or open a checklist
4. Click **"Bắt đầu làm việc"**
5. **Expected:**
   - ✅ Status changes to "In Progress"
   - ✅ Work started timestamp recorded

**Console Check:**
```
POST http://localhost:8000/api/review/runs/[id]/start
Status: 200 OK
```

#### Test 5.2: Staff - Complete Work
1. Fill in some checklist items
2. Click **"Hoàn thành"**
3. **Expected:**
   - ✅ Status changes to "Completed"
   - ✅ Work completed timestamp recorded

**Console Check:**
```
POST http://localhost:8000/api/review/runs/[id]/complete
Status: 200 OK
```

#### Test 5.3: Staff - Request Review
1. Click **"Yêu cầu duyệt"**
2. **Expected:**
   - ✅ Status changes to "Needs Review"
   - ✅ Review requested timestamp set

**Console Check:**
```
POST http://localhost:8000/api/review/runs/[id]/request-review
Status: 200 OK
```

#### Test 5.4: Supervisor - View Pending Reviews
1. Logout and login as **Supervisor**
2. Go to Review page
3. **Expected:**
   - ✅ See list of pending reviews
   - ✅ Can see the checklist submitted by staff

**Console Check:**
```
GET http://localhost:8000/api/review/pending
Status: 200 OK
```

#### Test 5.5: Supervisor - View Review Details
1. Click on pending review
2. **Expected:**
   - ✅ See full checklist details
   - ✅ All entries visible

**Console Check:**
```
GET http://localhost:8000/api/review/runs/[id]
Status: 200 OK
```

#### Test 5.6: Supervisor - Approve
1. Click **"Duyệt"** button
2. Add optional review note
3. Submit
4. **Expected:**
   - ✅ Status changes to "Approved"
   - ✅ Signoff record created
   - ✅ Removed from pending list

**Console Check:**
```
POST http://localhost:8000/api/review/runs/[id]/approve
Status: 200 OK
```

#### Test 5.7: Supervisor - Reject (Alternative)
1. Open another pending review
2. Click **"Từ chối"** button
3. Enter required review note
4. Submit
5. **Expected:**
   - ✅ Status changes to "Rejected"
   - ✅ Review note saved
   - ✅ Staff can see rejection reason

**Console Check:**
```
POST http://localhost:8000/api/review/runs/[id]/reject
Status: 200 OK
```

#### Test 5.8: Staff - Resubmit
1. Login as Staff
2. View rejected checklist
3. Click **"Gửi lại"**
4. **Expected:**
   - ✅ Status changes back to "Needs Review"
   - ✅ Appears in supervisor's pending list again

**Console Check:**
```
POST http://localhost:8000/api/review/runs/[id]/resubmit
Status: 200 OK
```

#### Test 5.9: Review Stats
1. View dashboard or review page
2. **Expected:**
   - ✅ Stats show correct counts
   - ✅ Pending, approved, rejected numbers accurate

**Console Check:**
```
GET http://localhost:8000/api/review/stats
Status: 200 OK
```

---

### ✅ Issue #16: Entry Auto-Save

**Location:** Checklist Execution page

#### Test 6.1: Entry Upsert
1. Open a checklist for execution
2. Check some items (OK/Not OK/N/A)
3. Add notes
4. Wait for auto-save (usually 2-3 seconds)
5. **Expected:**
   - ✅ Entries saved automatically
   - ✅ No 404 errors about /entries or /cells
   - ✅ Success indicator shown (if implemented)

**Console Check:**
```
PUT http://localhost:8000/api/entries
Status: 200 OK
```

#### Test 6.2: Verify Persistence
1. Save entries
2. Refresh page
3. Reopen same checklist
4. **Expected:**
   - ✅ All checked items still checked
   - ✅ Notes preserved
   - ✅ Data persisted correctly

---

## 🔍 Console Monitoring

### Expected Console Output (Clean)
```
✓ GET /api/users → 200 OK
✓ POST /api/users → 201 Created
✓ PATCH /api/users/3 → 200 OK
✓ DELETE /api/users/3 → 204 No Content
✓ GET /api/incidents/1 → 200 OK
✓ DELETE /api/incidents/1 → 204 No Content
✓ GET /api/areas/1 → 200 OK
✓ DELETE /api/runs/1 → 204 No Content
✓ GET /api/review/pending → 200 OK
✓ POST /api/review/runs/1/approve → 200 OK
✓ PUT /api/entries → 200 OK
```

### ❌ Red Flags (Should NOT Appear)
```
❌ 404 Not Found
❌ 405 Method Not Allowed
❌ 500 Internal Server Error
❌ CORS errors
❌ Unauthenticated (401) - unless session expired
❌ Unauthorized (403) - unless testing permissions
```

---

## 📊 Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| User Create | [ ] Pass / [ ] Fail | |
| User Update | [ ] Pass / [ ] Fail | |
| User Delete | [ ] Pass / [ ] Fail | |
| Incident Show | [ ] Pass / [ ] Fail | |
| Incident Delete | [ ] Pass / [ ] Fail | |
| Area Show | [ ] Pass / [ ] Fail | |
| Run Delete | [ ] Pass / [ ] Fail | |
| Review Start | [ ] Pass / [ ] Fail | |
| Review Complete | [ ] Pass / [ ] Fail | |
| Review Request | [ ] Pass / [ ] Fail | |
| Review Pending | [ ] Pass / [ ] Fail | |
| Review Show | [ ] Pass / [ ] Fail | |
| Review Approve | [ ] Pass / [ ] Fail | |
| Review Reject | [ ] Pass / [ ] Fail | |
| Review Resubmit | [ ] Pass / [ ] Fail | |
| Review Stats | [ ] Pass / [ ] Fail | |
| Entry Auto-Save | [ ] Pass / [ ] Fail | |

---

## 🐛 If Tests Fail

### 404 Not Found
1. Check route is registered: `php artisan route:list | grep [endpoint]`
2. Clear route cache: `php artisan route:clear`
3. Verify controller method exists

### 405 Method Not Allowed
1. Check HTTP method (GET/POST/PATCH/DELETE)
2. Verify method exists in controller
3. Check route definition matches

### 500 Internal Server Error
1. Check Laravel logs: `tail -f backend-app/storage/logs/laravel.log`
2. Look for PHP errors, missing imports
3. Verify database connection

### Authentication Issues
1. Token expired - re-login
2. Check SANCTUM_STATEFUL_DOMAINS in .env
3. Verify CORS configuration

---

## ✅ Post-Test Actions

After completing all tests:

1. **Document Failures** (if any)
   - Screenshot errors
   - Copy console errors
   - Note exact steps to reproduce

2. **Clear Test Data**
   - Delete test users created
   - Clean up test incidents
   - Reset to clean state

3. **Update Status**
   - Mark all passing tests
   - Report issues found
   - Create tickets for bugs

---

## 📚 Related Documentation

- [API_COVERAGE_AUDIT_REPORT.md](API_COVERAGE_AUDIT_REPORT.md) - Technical details
- [TEST_API_COVERAGE.md](TEST_API_COVERAGE.md) - cURL test commands
- [COMPREHENSIVE_AUDIT_COMPLETE.md](COMPREHENSIVE_AUDIT_COMPLETE.md) - Full audit report
- [API_FIXES_QUICK_REFERENCE.md](API_FIXES_QUICK_REFERENCE.md) - Quick reference

---

**Testing Completed By:** ___________________  
**Date:** ___________________  
**Overall Status:** [ ] Pass / [ ] Fail  
**Notes:**
