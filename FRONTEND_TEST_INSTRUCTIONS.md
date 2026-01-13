# Frontend Testing Instructions

## System Status
- ✅ Backend API: Running on http://127.0.0.1:8000
- ✅ Frontend: Running on http://localhost:3002
- ✅ Database: Connected with demo data (210 runs, 7 templates, 282 items)
- ✅ Authentication: Sanctum configured
- ✅ Role-Based Filtering: Implemented and tested

## Test Accounts

### Staff Account
```
Email: hotel.staff1@local.test
Password: password
Expected: See 4 jobs assigned to this staff
```

### Supervisor Account
```
Email: hotel.manager@local.test  
Password: password
Expected: See 1 job to verify (Run ID=72)
```

### Manager Account
```
Email: admin@local.test
Password: password
Expected: See all 7 jobs
```

---

## Testing Workflow

### Step 1: Open Frontend
Open http://localhost:3002 in your browser

### Step 2: Login with Staff Account
1. Click "Đăng nhập bằng Email"
2. Enter email: `hotel.staff1@local.test`
3. Enter password: `password`
4. Click "Đăng nhập"

### Step 3: Verify Jobs Appear
After login, you should see the **Jobs/Checklists** tab with **4 jobs**:
1. Checklist Bếp Chính (Kitchen)
2. Checklist Quầy Bar (Bar)
3. Checklist Vệ Sinh WC (Restroom)
4. Checklist Nhà 2 Tầng Bên Đình (2-Story House)

### Step 4: Verify Data Structure
Each job should show:
- ✅ Checklist name (template)
- ✅ Area name
- ✅ Status (pending/in_progress/completed)
- ✅ Date (2026-01-10)
- ✅ Number of items to check

### Step 5: Test Other Roles
1. Logout
2. Login with supervisor account → Should see 1 job
3. Logout  
4. Login with manager account → Should see 7 jobs

---

## Troubleshooting

### If you see no jobs:
1. Check browser DevTools (F12) → Network tab
   - Should see API call to: `/api/runs?date=2026-01-10`
   - Should return status 200 with JSON data
   
2. Check browser Console (F12) → Console tab
   - Should see: `Loaded runs: 4 runs with items: [...]`
   - If error shown, note the error message

### If login fails:
1. Verify backend is running:
   ```bash
   ps aux | grep "php artisan serve"
   ```

2. Try manual API test:
   ```bash
   curl -X POST "http://127.0.0.1:8000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"hotel.staff1@local.test","password":"password"}'
   ```

3. If manual test works but frontend fails:
   - Check API_BASE in [services/api.ts](services/api.ts) - should be `http://localhost:8000/api`
   - Check localStorage for `api_token` (F12 → Application → LocalStorage)

### If runs show but items are empty:
- This is a mapping issue in `mapRunToChecklist()` function in [App.tsx](App.tsx#L220)
- Check browser console for errors during mapping
- Verify template data includes `groups[].items[]` array

---

## API Responses Reference

### Login Success
```json
{
  "token": "48|sINPJ2puYspf7dWdJ...",
  "user": {
    "id": 6,
    "name": "Hoàng Văn Dũng",
    "email": "hotel.staff1@local.test",
    "role": "staff"
  }
}
```

### Staff Runs Response
```json
{
  "data": [
    {
      "id": 72,
      "area_id": 11,
      "status": "in_progress",
      "assigned_to": 6,
      "template": {
        "id": 7,
        "name": "Checklist Bếp Chính",
        "groups": [
          {
            "id": 1,
            "title": "Công việc kiểm tra bếp",
            "items": [...]
          }
        ]
      },
      "entries": [...]
    }
  ],
  "total": 4,
  "per_page": 50
}
```

---

## Next Steps After Verification

Once data appears correctly in UI:

1. **Test Checklist Execution**
   - Click on a checklist
   - Verify items display
   - Test checking/unchecking items
   - Test saving progress

2. **Test Role Permissions**
   - Staff can only execute assigned checklists
   - Supervisor can verify staff work
   - Manager can view all and assign work

3. **Test Data Persistence**
   - Update checklist status
   - Reload page
   - Verify changes persisted to database

4. **Test Incident Reporting**
   - While executing checklist
   - Can create incident
   - Incident appears in Incidents tab

---

## Key Code Locations

| Component | File | Purpose |
|-----------|------|---------|
| Main app logic | [App.tsx](App.tsx) | Loads runs for 2026-01-10 |
| Login page | [pages/Login.tsx](pages/Login.tsx) | Handles authentication |
| API client | [services/api.ts](services/api.ts) | Makes HTTP calls with Bearer token |
| Run mapping | [App.tsx#L220](App.tsx#L220) | Converts API runs to UI format |
| Backend filtering | [backend-app/app/Http/Controllers/Api/RunController.php](backend-app/app/Http/Controllers/Api/RunController.php) | Role-based run filtering |

---

## Recent Fixes Applied

1. ✅ **Fixed hardcoded date** - Changed from requesting "today" to "2026-01-10" (demo date)
2. ✅ **Role-based filtering** - RunController filters runs by user role
3. ✅ **Sanctum configuration** - Allow localhost:3001/3002 to authenticate
4. ✅ **ChecklistTemplate relationship** - Fixed foreign key for groups relationship

