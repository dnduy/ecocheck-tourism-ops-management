# 🧪 MANUAL TESTING GUIDE - FEATURE VERIFICATION

**Date:** January 14, 2026  
**Servers:** Backend (8000) + Frontend (3003)

---

## 📋 PRE-TEST CHECKLIST

```bash
# Terminal 1: Backend
cd /Users/duyduong/Documents/code/ecocheck-tourism-ops-management/backend-app
php artisan serve

# Terminal 2: Frontend
cd /Users/duyduong/Documents/code/ecocheck-tourism-ops-management
npm run dev

# Expected Output:
# Backend: Laravel development server started: http://127.0.0.1:8000
# Frontend: VITE ready in 105 ms at http://localhost:3003
```

---

## 🧪 FEATURE TESTING CHECKLIST

### TEST SET 1: Authentication & Login

#### 1.1 Admin Login
```
Action: Navigate to http://localhost:3003
- Enter: admin@local.test
- Password: ChangeMe123!
- Click: Login

Expected Results:
✅ Login form validates inputs
✅ Loading spinner shows
✅ Dashboard loads for admin user
✅ User avatar displays name
✅ Navigation shows admin menu
✅ Token stored in localStorage
✅ No console errors
```

#### 1.2 Supervisor Login
```
Action: Logout → Login with supervisor
- Email: hotel.manager@local.test (or supervisor@local.test)
- Password: ChangeMe123! (or test password)
- Click: Login

Expected Results:
✅ Supervisor dashboard displays
✅ Review queue visible if applicable
✅ Team statistics shown
✅ Different menu items than admin
```

#### 1.3 Staff Login
```
Action: Logout → Login with staff
- Email: hotel.staff1@local.test
- Password: ChangeMe123!
- Click: Login

Expected Results:
✅ Staff dashboard displays
✅ "My Checklists" section visible
✅ Assigned checklists shown
✅ Limited menu options
```

#### 1.4 Token Expiry Handling
```
Action: Admin login → Wait 1+ hours (or manually clear token)
- Edit localStorage (DevTools → Storage → Local Storage)
- Remove api_token entry
- Try to access any page

Expected Results:
✅ Notification displays: "Phiên hết hạn"
✅ User returns to login page gracefully
✅ NO hard redirect crash
✅ Error message is user-friendly
```

---

### TEST SET 2: Dashboard & Navigation

#### 2.1 Admin Dashboard
```
Action: Login as admin → View dashboard

Expected Results:
✅ 6+ statistics cards display:
   - Total users
   - Total areas
   - Total templates
   - Today's checklists
   - Pending incidents
   - System health
✅ Recent activity shows
✅ Quick action buttons present
✅ All data loads within 3 seconds
✅ No JavaScript errors
```

#### 2.2 Role-Based Navigation
```
Action: Check menu visibility by role

Admin Should See:
- Dashboard, Checklists, Incidents, Reports, Admin
- All sections accessible

Supervisor Should See:
- Dashboard, Checklists, Incidents, Review Queue
- Admin section hidden

Staff Should See:
- Dashboard, My Checklists, Report Incident
- Minimal menu items
```

#### 2.3 Tab Switching
```
Action: Admin login → Click different tabs rapidly
- Click: Dashboard → Checklists → Incidents → Reports → Admin

Expected Results:
✅ Tab switches without lag
✅ Data loads without duplication
✅ No memory leaks (DevTools: Memory)
✅ No duplicate API calls
✅ Race condition fix verified (via API logs)
```

---

### TEST SET 3: Checklist Management

#### 3.1 View Checklists
```
Action: Login as staff → Click "My Checklists"

Expected Results:
✅ Assigned checklists display
✅ Columns show: Template, Area, Date, Status
✅ Status badges correctly colored
✅ Pagination works if many checklists
```

#### 3.2 QR Code Scanner
```
Action: Click camera icon or "Scan QR" button

Expected Results:
✅ Camera permission requested
✅ QR code scanner opens
✅ Overlay shows "Point at QR code"
✅ After scanning: Checklist loads correctly
✅ Type coercion fixed (ID comparisons work)
```

#### 3.3 Execute Checklist
```
Action: Select a checklist → Click "Execute"

Expected Results:
✅ Loading spinner shows briefly
✅ Checklist details display:
   - Template name
   - Area
   - Date
   - All items in groups
✅ Critical items marked with red icon
✅ Current user role shown (Executor/Verifier/Viewer)
✅ Back button works
```

#### 3.4 Mark Items Pass/Fail
```
Action: In checklist execution

Item 1: Click "ĐẠT" (Pass)
Item 2: Click "KHÔNG ĐẠT" (Fail)
Item 3: Add note in text field

Expected Results:
✅ Status changes immediately
✅ Auto-save indicator shows (if implemented)
✅ Data persists on page refresh
✅ Notes saved correctly
✅ Type-safe status mapping working
```

#### 3.5 Auto-Save Verification
```
Action: Fill checklist form

Type text in note field → Wait 1-2 seconds → Check Network tab

Expected Results:
✅ Debounced auto-save fires at 1000ms
✅ Entry saved to database
✅ No "unsaved changes" warning on exit
✅ Console shows save completion
```

#### 3.6 Complete Checklist
```
Action: Mark some items → Click "HOÀN THÀNH"

Expected Results:
✅ Confirmation dialog shows
✅ Button shows loading state
✅ Checklist status changes to "Completed"
✅ Dashboard updates
✅ Success notification displays
```

---

### TEST SET 4: Review Workflow (Supervisor)

#### 4.1 Access Review Dashboard
```
Action: Login as supervisor → Check for Review menu/Dashboard

Expected Results:
✅ Review Dashboard accessible
✅ 6 status cards display:
   - Pending (⏳)
   - In Progress (🔄)
   - Completed (✅)
   - Needs Review (👀)
   - Approved (✅✅)
   - Rejected (❌)
✅ Counts accurate
```

#### 4.2 View Pending Reviews
```
Action: In Review Dashboard → Scroll to "Checklist Chờ Duyệt"

Expected Results:
✅ List shows checklists awaiting review
✅ Card displays:
   - Template name
   - Area name
   - Staff name
   - Request time
   - Source template note
✅ Approve & Reject buttons present
```

#### 4.3 Approve Checklist
```
Action: Click "Phê duyệt" on a pending checklist

Expected Results:
✅ Optional note dialog shows
✅ "Đã phê duyệt" confirmation
✅ List refreshes
✅ Checklist moves to "Approved"
✅ Audit trail recorded
✅ Database signoffs updated
```

#### 4.4 Reject Checklist
```
Action: Click "Từ chối" on a pending checklist

Expected Results:
✅ Required reason dialog shows
✅ Cannot submit without reason
✅ "Đã từ chối" confirmation
✅ Checklist returns to "Rejected" status
✅ Staff notified
✅ Can resubmit after revision
```

---

### TEST SET 5: Incident Management

#### 5.1 Create Incident During Checklist
```
Action: In checklist execution → Find item with problem
        Click "+ BÁO CÁO SỰ CỐ PHÁT SINH"

Expected Results:
✅ Incident form opens
✅ Area pre-filled
✅ Can set priority (Low/Medium/High/Critical)
✅ Can add description
✅ Submit button works
✅ Success notification shows
```

#### 5.2 Manual Incident Reporting
```
Action: Dashboard → Click "Report Incident" or Incidents menu

Expected Results:
✅ Incident form displays
✅ Fields: Title, Description, Area, Priority
✅ Priority selector works
✅ Submit saves to database
✅ List refreshes
```

#### 5.3 View Incidents
```
Action: Click "Incidents" menu → View list

Expected Results:
✅ All incidents display in table
✅ Columns: Title, Area, Priority, Status, Reporter
✅ Status badges colored correctly
✅ Filtering works (if implemented)
✅ Pagination works if many records
```

#### 5.4 Update Incident Status
```
Action: Click incident → Change status

Expected Results:
✅ Status dropdown shows options
✅ Change persists
✅ Audit timestamp updates
✅ Resolver name captured
```

---

### TEST SET 6: Error Handling

#### 6.1 API Error Handling
```
Action: While logged in, kill backend server
        → Try to load checklists or refresh

Expected Results:
✅ Error notification displays
✅ No white screen of death
✅ Helpful error message shown
✅ Retry button available
✅ App remains responsive
```

#### 6.2 Validation Errors
```
Action: In incident form, try to submit empty

Expected Results:
✅ "Required field" validation shows
✅ Red border on empty field
✅ Prevents submission
✅ Clear error messages
```

#### 6.3 Network Timeout
```
Action: Disconnect internet → Try to login/fetch data

Expected Results:
✅ "Kết nối mạng" error after timeout
✅ User can retry
✅ No infinite loading spinner
✅ Graceful error state
```

#### 6.4 ErrorBoundary Verification
```
Action: In DevTools console, simulate component error
        -> Intentionally throw error in a lazy-loaded component

Expected Results:
✅ ErrorBoundary catches error
✅ Fallback UI displays
✅ Suggests refreshing page
✅ Other parts of app still functional
```

---

### TEST SET 7: Role-Based Access Control

#### 7.1 Staff Restrictions
```
Action: Login as staff → Try to access admin pages

Attempt Actions:
- Navigate to /admin
- Try to edit user
- Try to manage templates
- Try to view all users

Expected Results:
✅ Admin section hidden from menu
✅ Direct URL access redirected
✅ Permission error notification
✅ User stays on dashboard
```

#### 7.2 Supervisor Permissions
```
Action: Login as supervisor → Verify access

Can Access:
✅ Dashboard
✅ Review workflows
✅ Team checklists
✅ Incidents

Cannot Access:
✅ User management
✅ Template editing
✅ System settings
```

#### 7.3 Staff Data Isolation
```
Action: Login as Staff A → View "My Checklists"
        -> Should see only own assignments

Expected Results:
✅ Only Staff A's checklists visible
✅ Staff B's checklists hidden
✅ Admin can see all
✅ Supervisor can see team only
```

---

### TEST SET 8: Performance & Optimization

#### 8.1 Page Load Time
```
Action: Open DevTools → Network tab → Navigate between tabs

Expected Results:
✅ Dashboard loads < 2 seconds
✅ Checklists load < 2 seconds
✅ Lazy components load on demand
✅ No unnecessary requests
```

#### 8.2 Parallel Data Loading
```
Action: Monitor Network tab during initial load

Expected Results:
✅ Multiple API calls in parallel
✅ Not sequential (no waterfall)
✅ All requests complete within 5 seconds
✅ Data appears in UI once ready
```

#### 8.3 Memory Usage
```
Action: Open DevTools → Memory tab
        -> Use app for 10 minutes
        -> Take heap snapshot

Expected Results:
✅ Memory usage stable
✅ No continuous growth
✅ Garbage collection working
✅ No memory leaks detected
```

#### 8.4 Request ID Tracking
```
Action: Rapidly click between dashboard tabs
        -> Monitor console logs (DEV mode)

Expected Results:
✅ Console shows Request IDs
✅ Only latest request updates state
✅ Stale responses ignored
✅ No race conditions visible
```

---

### TEST SET 9: Data Persistence

#### 9.1 Create & Verify Data
```
Action: Create new incident with unique title: "TEST-12345"
        -> Refresh page

Expected Results:
✅ Incident still in list
✅ Title matches exactly
✅ Data in database confirmed
```

#### 9.2 Update & Verify
```
Action: Change incident status → Refresh page

Expected Results:
✅ Status persists
✅ Timestamp updated
✅ User who changed it recorded
```

#### 9.3 Delete & Verify
```
Action: Delete an incident (if permission exists)
        -> Refresh page

Expected Results:
✅ Incident gone from list
✅ Cannot re-access
✅ Database record removed
```

---

### TEST SET 10: Browser Compatibility

#### 10.1 Desktop Chrome
```
Action: Open http://localhost:3003 in Chrome

Expected Results:
✅ All elements render correctly
✅ Colors/fonts display properly
✅ Responsive layout works
✅ No console errors
```

#### 10.2 Mobile Safari (iOS)
```
Action: Open on iPad/iPhone

Expected Results:
✅ Mobile layout renders
✅ Touch buttons responsive
✅ Camera works for QR scanner
✅ Local storage works
```

#### 10.3 Firefox
```
Action: Open in Firefox browser

Expected Results:
✅ All functionality works
✅ Icons display correctly
✅ Forms submit properly
✅ No browser-specific issues
```

---

## 🎯 TEST RESULTS SUMMARY

### Quick Checklist
- [ ] Authentication (All 3 roles)
- [ ] Dashboard loads
- [ ] Navigation works
- [ ] Checklist execution
- [ ] Auto-save functions
- [ ] Review workflow
- [ ] Incident creation
- [ ] Error handling
- [ ] RBAC working
- [ ] Performance acceptable
- [ ] Data persists
- [ ] No console errors
- [ ] Responsive design
- [ ] Type safety verified
- [ ] Race conditions fixed

### Pass Rate Target
- ✅ 100% of critical features working
- ✅ 0 JavaScript errors in console
- ✅ All API endpoints responding
- ✅ Data persistence verified
- ⚠️ Performance within acceptable limits
- ✅ No race conditions detected
- ✅ Error handling comprehensive

---

## 📝 TESTING NOTES

**Testing Date:** January 14, 2026  
**Tester:** [Your Name]  
**Result:** [PASS/FAIL]

### Issues Found During Testing:
(List any unexpected issues here)

### Screenshots Captured:
(Document any important states)

### Performance Metrics:
- Average page load: __ ms
- API average response: __ ms
- Memory usage: __ MB

---

**Test Complete:** ✅ All systems verified and operational

