# 🧪 TEST CHECKLIST - EcoCheck Tourism Ops

**Test Date:** January 8, 2026  
**Build Version:** Production build with code splitting  
**Environment:** Development (http://localhost:3000 + http://127.0.0.1:8000)

---

## 🎯 CRITICAL USER FLOWS

### ✅ 1. Authentication Flow
- [ ] Login with valid credentials (admin@local.test / ChangeMe123!)
- [ ] Login fails with invalid password
- [ ] Login fails with non-existent email
- [ ] Token stored in localStorage after successful login
- [ ] Auto-redirect to dashboard after login
- [ ] Logout clears token and redirects to login
- [ ] 401 responses trigger automatic logout
- [ ] Session persists on page reload

### ✅ 2. Dashboard (All Roles)
- [ ] Stats load from API correctly
- [ ] Charts render without errors
- [ ] Recent activities display
- [ ] QR scanner button visible for staff/supervisor
- [ ] Manager sees full analytics
- [ ] Supervisor sees operational metrics
- [ ] Staff sees personal task list
- [ ] Loading state shows during data fetch

### ✅ 3. Incidents Management
#### Create Incident
- [ ] Modal opens on "Tạo sự cố" button
- [ ] Area dropdown populated from API
- [ ] Priority selection works (low/medium/high/critical)
- [ ] Title required (min 3 chars)
- [ ] Description sanitized (XSS protection)
- [ ] Success notification after creation
- [ ] New incident appears in list immediately
- [ ] Critical incidents show red alert

#### View & Update Incident
- [ ] Incidents grouped by category
- [ ] Category icons display correctly
- [ ] Expand/collapse categories works
- [ ] Priority stripe shows correct color
- [ ] Status update buttons functional
- [ ] AI analysis button works (if Gemini key configured)
- [ ] Status changes persist to backend

### ✅ 4. Checklists/Runs
#### List View
- [ ] Runs load from API for today's date
- [ ] Filter by area works
- [ ] Filter by status works
- [ ] Create new checklist modal opens
- [ ] Area and template selection required
- [ ] New run created successfully

#### Execution View
- [ ] Run detail loads with correct template structure
- [ ] User role banner displays correctly
- [ ] Progress bar updates as items checked
- [ ] PASS/FAIL buttons toggle status
- [ ] Auto-save entries to backend on change
- [ ] FAIL status enables incident reporting
- [ ] Manual incident reporting form works
- [ ] Submit checklist completes run
- [ ] Read-only mode for completed checklists

### ✅ 5. Signoff Flow
- [ ] Signoff button visible only for verifier role
- [ ] Signoff creates entry via API
- [ ] Run status changes to "reviewed"
- [ ] Success notification displays
- [ ] Signoff timestamp recorded

### ✅ 6. Admin Panel (Manager Only)
#### Users Tab
- [ ] Users list loads from API
- [ ] Create user modal opens
- [ ] Email validation enforces format
- [ ] Password strength validation (8+ chars, uppercase, lowercase, digit)
- [ ] New user appears in list after creation
- [ ] Edit user updates backend
- [ ] Delete user removes from list
- [ ] Cannot delete self
- [ ] Role badge displays correctly

#### Areas Tab
- [ ] Areas list loads
- [ ] Create area modal opens
- [ ] Area name min 2 chars
- [ ] New area saved to backend
- [ ] Delete area confirmation works

#### Templates Tab
- [ ] Templates list loads
- [ ] Create template modal opens
- [ ] Template name required
- [ ] Group title required
- [ ] At least one item required
- [ ] Dynamic item rows add/remove
- [ ] Column label defaults to "Ca A"
- [ ] Template saved successfully

#### Shifts Tab (Manager only)
- [ ] Shifts list displays
- [ ] Create shift form works
- [ ] Time validation
- [ ] Shift assignment to areas

### ✅ 7. Reports Page
- [ ] Status pie chart renders
- [ ] Equipment breakdown chart renders
- [ ] Issue distribution by area displays
- [ ] Export to Excel button works
- [ ] Excel file downloads with correct data

---

## 👥 ROLE-BASED ACCESS CONTROL

### Manager Role
- [ ] Can access all tabs: Dashboard, Checklists, Incidents, Reports, Admin
- [ ] Admin panel shows: Users, Areas, Shifts, Checklists, Templates
- [ ] Can create/edit/delete users
- [ ] Can create/edit/delete areas
- [ ] Can create templates
- [ ] Can assign checklists
- [ ] Can view all reports

### Supervisor Role
- [ ] Can access: Dashboard, Checklists, Incidents, Reports, Admin
- [ ] Admin panel shows only: Shifts, Checklists (limited)
- [ ] Cannot access Users tab
- [ ] Cannot access Areas tab
- [ ] Cannot access Templates tab
- [ ] Can verify/signoff checklists
- [ ] Can create incidents
- [ ] Can view reports

### Staff Role
- [ ] Can access: Dashboard, Checklists, Settings
- [ ] Cannot access Incidents tab
- [ ] Cannot access Reports tab
- [ ] Cannot access Admin tab
- [ ] Can execute assigned checklists
- [ ] Can report incidents from checklist execution
- [ ] Can use QR scanner

---

## 📱 MOBILE RESPONSIVENESS

### Layout & Navigation
- [ ] Max-width container (md: 448px) enforced
- [ ] Bottom navigation always visible
- [ ] Bottom navigation safe area respected (pb-safe)
- [ ] No horizontal scroll on any page
- [ ] Touch targets min 44x44px
- [ ] Modal overlays full screen on mobile

### Forms & Inputs
- [ ] Input fields readable (min 16px font)
- [ ] Dropdowns work on touch devices
- [ ] Modals scrollable with touch
- [ ] Buttons have active:scale animation
- [ ] Text inputs auto-zoom disabled (font-size >= 16px)

### Specific Components
- [ ] Dashboard charts responsive
- [ ] Incident cards stack vertically
- [ ] Checklist execution grid readable
- [ ] Admin tables scrollable horizontally if needed
- [ ] Notification toasts position correctly
- [ ] QR scanner full screen overlay

---

## 🔒 SECURITY VALIDATION

### Input Sanitization
- [ ] HTML tags stripped from user inputs
- [ ] Max length enforced (500 chars general, 255 email)
- [ ] Email normalized to lowercase
- [ ] Password strength validated
- [ ] XSS prevention: no script execution from user input

### Authentication & Authorization
- [ ] Bearer token sent in all API requests
- [ ] 401 responses clear token and redirect
- [ ] 403 responses show permission error
- [ ] Admin routes blocked for non-managers/supervisors
- [ ] API endpoints validate role on backend

### Data Validation
- [ ] Frontend validates before API call
- [ ] Backend validation in Form Requests
- [ ] Validation errors show user-friendly messages
- [ ] No raw database errors exposed to user

---

## ⚡ PERFORMANCE CHECKS

### Initial Load
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Main bundle < 600KB
- [ ] Lazy-loaded chunks load on demand
- [ ] Loading spinner shows during async operations

### Runtime Performance
- [ ] Dashboard re-renders only when data changes (React.memo)
- [ ] API calls debounced for search inputs
- [ ] No memory leaks in long sessions
- [ ] Smooth animations (60fps)
- [ ] No layout shift during data load

### Network
- [ ] API calls complete < 1s (local)
- [ ] Failed requests show error notification
- [ ] Retry logic for timeout errors (12s timeout)
- [ ] Parallel fetches on app init

---

## 🐛 EDGE CASES & ERROR HANDLING

### Network Errors
- [ ] Timeout after 12s shows friendly message
- [ ] Offline state detected (bonus: show banner)
- [ ] Retry button available after error
- [ ] ErrorBoundary catches render errors

### Data Edge Cases
- [ ] Empty states display correctly (no checklists, no incidents, etc.)
- [ ] Loading states for all async operations
- [ ] Pagination handles large datasets
- [ ] Duplicate prevention (e.g., double-click submit)

### User Mistakes
- [ ] Form validation prevents invalid submission
- [ ] Confirmation dialogs for destructive actions
- [ ] Cannot delete own user account
- [ ] Cannot signoff without proper role
- [ ] Clear error messages for validation failures

---

## 🌐 BROWSER COMPATIBILITY

### Primary Browsers (Test on each)
- [ ] Chrome/Edge (Chromium) - Latest
- [ ] Safari (WebKit) - Latest
- [ ] Firefox (Gecko) - Latest

### Features to Verify
- [ ] Lazy loading (dynamic import)
- [ ] LocalStorage
- [ ] Fetch API with AbortController
- [ ] CSS Grid & Flexbox
- [ ] CSS custom properties (--brand-600, etc.)
- [ ] SVG icons rendering

---

## 📊 DATA INTEGRITY

### Backend Sync
- [ ] Entry auto-save persists to database
- [ ] Signoffs recorded with correct user/role/timestamp
- [ ] Run status transitions correctly (draft → active → completed → reviewed)
- [ ] Template groups/items/columns preserved
- [ ] User updates reflect immediately in UI

### State Management
- [ ] App state syncs with backend after mutations
- [ ] Optimistic updates roll back on error
- [ ] Notifications clear after 6s
- [ ] Modal state resets on close

---

## 🎨 UI/UX POLISH

### Visual Consistency
- [ ] Brand colors consistent (--brand-600: #0ea5e9)
- [ ] Border radius consistent (rounded-xl, rounded-2xl, rounded-3xl)
- [ ] Shadow usage consistent
- [ ] Icon sizes appropriate (16px-24px)
- [ ] Font hierarchy clear (text-xs to text-2xl)

### Micro-interactions
- [ ] Buttons have hover states
- [ ] Active scale animation on touch
- [ ] Loading spinners centered
- [ ] Smooth transitions (duration-200, duration-300)
- [ ] Success/error colors (green/red) clear

### Accessibility (Bonus)
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] Semantic HTML structure
- [ ] Keyboard navigation works

---

## ✅ FINAL SMOKE TEST SCRIPT

### Pre-requisites
```bash
# Terminal 1: Backend running
cd backend-app
php artisan migrate:fresh --seed
php artisan serve

# Terminal 2: Frontend running
npm run dev
# or
npm run build && npm run preview
```

### Test Scenario: Complete User Journey

**As Manager:**
1. Login → Verify dashboard loads with stats
2. Go to Admin → Create new user (supervisor)
3. Go to Admin → Create new area "Poolside"
4. Go to Admin → Create new template "Pool Safety"
5. Go to Checklists → Create new run for Poolside
6. Logout

**As Supervisor (new user):**
1. Login with new credentials
2. Go to Checklists → Select the run created by Manager
3. Execute checklist → Mark 2 items PASS, 1 item FAIL
4. Report incident from FAIL item
5. Submit checklist
6. Verify (signoff) the checklist
7. Go to Incidents → Check new incident appears
8. Update incident status to "In Progress"
9. Logout

**As Staff:**
1. Login as staff user
2. Verify cannot access Admin tab
3. Verify cannot access Incidents tab
4. Go to Checklists → View assigned checklists
5. Use QR scanner (mock scan or skip)
6. Logout

**Verify:**
- [ ] All CRUD operations persisted to backend
- [ ] No console errors
- [ ] No network errors
- [ ] UI remains responsive throughout
- [ ] Notifications displayed appropriately

---

## 📝 TESTING NOTES

### Known Issues / Limitations
- Gemini AI requires API key in .env
- QR scanner requires HTTPS or localhost
- Excel export requires user gesture (not auto-download)
- Recharts may have hydration warnings in dev (safe to ignore)

### Performance Metrics (Production Build)
- Main bundle: 598KB (gzip: 181KB)
- Vendor React: 12KB
- Vendor Charts: 366KB
- Vendor Excel: 283KB
- Lazy chunks: 6-31KB each

### Test Coverage
- Unit tests: 3 tests passing (error utils)
- Integration tests: Manual (this checklist)
- E2E tests: Not implemented (future: Playwright/Cypress)

---

## 🎉 SIGN-OFF

**Tested by:** _________________  
**Date:** _________________  
**Environment:** [ ] Development [ ] Staging [ ] Production  
**Status:** [ ] PASSED [ ] FAILED [ ] BLOCKED  

**Notes:**
```
[Add any issues found, edge cases discovered, or improvement suggestions here]
```

---

**Next Steps After Testing:**
1. Document any bugs found in GitHub Issues
2. Fix critical bugs before deployment
3. Update PROJECT_STATUS.md with final state
4. Prepare deployment guide for production
5. Create user training materials (if needed)
