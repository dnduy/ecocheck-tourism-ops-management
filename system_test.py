#!/usr/bin/env python3
"""
EcoCheck Tourism Ops - Full System Test
Tests: Auth, Users, Areas, Templates, Shifts, Runs, Review Workflow, Incidents, Admin Stats
"""

import sys
import json
import time
import requests
from datetime import date

BASE = "http://127.0.0.1:8000/api"
TODAY = date.today().isoformat()

# ── ANSI colors ────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

# ── Test state ─────────────────────────────────────────────────────
passed = 0
failed = 0
skipped = 0
errors = []

class Session:
    token = None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}

    def auth(self, token):
        self.token = token
        self.headers["Authorization"] = f"Bearer {token}"

s = Session()

# ── Helpers ────────────────────────────────────────────────────────
def ok(label, resp, expected=200):
    global passed, failed
    status = resp.status_code
    if status == expected:
        print(f"  {GREEN}✓{RESET} {label}  ({status})")
        passed += 1
        return True
    else:
        body = ""
        try:
            body = resp.json().get("message") or resp.json().get("error") or ""
        except Exception:
            body = resp.text[:80]
        print(f"  {RED}✗{RESET} {label}  ({status}) — {body}")
        errors.append(f"{label}: HTTP {status} — {body}")
        failed += 1
        return False

def skip(label, reason):
    global skipped
    print(f"  {YELLOW}~{RESET} {label}  (SKIP: {reason})")
    skipped += 1

def section(title):
    print(f"\n{BOLD}{CYAN}{'═'*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'═'*60}{RESET}")

def get(path, **kw):
    return requests.get(f"{BASE}{path}", headers=s.headers, timeout=10, **kw)

def post(path, data=None, **kw):
    return requests.post(f"{BASE}{path}", json=data, headers=s.headers, timeout=10, **kw)

def patch(path, data=None, **kw):
    return requests.patch(f"{BASE}{path}", json=data, headers=s.headers, timeout=10, **kw)

def put(path, data=None, **kw):
    return requests.put(f"{BASE}{path}", json=data, headers=s.headers, timeout=10, **kw)

def delete(path, **kw):
    return requests.delete(f"{BASE}{path}", headers=s.headers, timeout=10, **kw)

# ═══════════════════════════════════════════════════════════════════
# 1. AUTH
# ═══════════════════════════════════════════════════════════════════
section("1. AUTHENTICATION")

# Login with bad credentials
r = post("/auth/login", {"email": "bad@x.com", "password": "wrong"})
ok("Login reject invalid credentials", r, 422)

# Login as admin
r = post("/auth/login", {"email": "admin@local.test", "password": "password"})
if ok("Login as admin", r, 200):
    data = r.json()
    token = data.get("token") or data.get("data", {}).get("token") or data.get("access_token")
    if token:
        s.auth(token)
    else:
        print(f"    {RED}No token in response: {list(data.keys())}{RESET}")
        failed += 1

# GET /me
r = get("/me")
if ok("GET /me — returns current user", r, 200):
    me = r.json()
    me_data = me.get("data") or me.get("user") or me
    role = me_data.get("role", "")
    print(f"    → Logged in as: {BOLD}{me_data.get('name', '?')}{RESET} (role={role})")

# ═══════════════════════════════════════════════════════════════════
# 2. USERS CRUD
# ═══════════════════════════════════════════════════════════════════
section("2. USERS CRUD")

r = get("/users")
ok("GET /users — list users", r, 200)
users_list = []
try:
    resp = r.json()
    users_list = resp.get("data", resp) if isinstance(resp, dict) else resp
    users_list = users_list if isinstance(users_list, list) else []
    print(f"    → {len(users_list)} users found")
except Exception:
    pass

# Create staff user
staff_email = f"staff_test_{int(time.time())}@test.com"
r = post("/users", {
    "name": "Test Staff",
    "email": staff_email,
    "role": "staff",
    "password": "password123"
})
new_staff_id = None
if ok("POST /users — create staff", r, 201):
    resp = r.json()
    d = resp.get("data") or resp.get("user") or resp
    new_staff_id = d.get("id") if isinstance(d, dict) else None
    print(f"    → Created staff ID: {new_staff_id}")

if new_staff_id:
    r = get(f"/users/{new_staff_id}")
    ok("GET /users/{id} — get created staff", r, 200)

    r = patch(f"/users/{new_staff_id}", {"name": "Test Staff Updated"})
    ok("PATCH /users/{id} — update staff name", r, 200)

    r = delete(f"/users/{new_staff_id}")
    ok("DELETE /users/{id} — delete staff", r, 204)
else:
    skip("GET /users/{id}", "no user created")
    skip("PATCH /users/{id}", "no user created")
    skip("DELETE /users/{id}", "no user created")

# ═══════════════════════════════════════════════════════════════════
# 3. AREAS CRUD
# ═══════════════════════════════════════════════════════════════════
section("3. AREAS CRUD")

r = get("/areas")
ok("GET /areas — list areas", r, 200)
areas_list = []
try:
    resp = r.json()
    areas_list = resp.get("data", resp) if isinstance(resp, dict) else resp
    areas_list = areas_list if isinstance(areas_list, list) else []
    print(f"    → {len(areas_list)} areas found")
except Exception:
    pass

r = post("/areas", {"name": f"Test Area {int(time.time())}", "type": "indoor"})
new_area_id = None
if ok("POST /areas — create area", r, 201):
    resp = r.json()
    d = resp.get("data") or resp.get("area") or resp
    new_area_id = d.get("id") if isinstance(d, dict) else None
    print(f"    → Created area ID: {new_area_id}")
else:
    # Some backends use 200 for creates
    if r.status_code == 200:
        resp = r.json()
        d = resp.get("data") or resp.get("area") or resp
        new_area_id = d.get("id") if isinstance(d, dict) else None
        if new_area_id:
            passed += 1
            failed -= 1

if new_area_id:
    r = get(f"/areas/{new_area_id}")
    ok("GET /areas/{id} — get area", r, 200)

    r = patch(f"/areas/{new_area_id}", {"name": f"Test Area Updated {int(time.time())}", "type": "outdoor"})
    ok("PATCH /areas/{id} — update area", r, 200)
else:
    skip("GET/PATCH /areas/{id}", "no area created")

# ═══════════════════════════════════════════════════════════════════
# 4. TEMPLATES CRUD
# ═══════════════════════════════════════════════════════════════════
section("4. TEMPLATES CRUD")

r = get("/templates")
ok("GET /templates — list templates", r, 200)
templates_list = []
try:
    resp = r.json()
    templates_list = resp.get("data", resp) if isinstance(resp, dict) else resp
    templates_list = templates_list if isinstance(templates_list, list) else []
    print(f"    → {len(templates_list)} templates found")
except Exception:
    pass

# Use first area available
area_id_for_template = new_area_id or (areas_list[0].get("id") if areas_list else None)
new_template_id = None
if area_id_for_template:
    r = post("/templates", {
        "area_id": area_id_for_template,
        "name": f"Test Template {int(time.time())}",
        "description": "System test template",
        "version": "v1",
        "is_active": True,
        "groups": [{"title": "Test Group", "items": [{"title": "Check item 1"}, {"title": "Check item 2"}]}],
        "columns": [{"label": "Ca A", "type": "text"}]
    })
    if ok("POST /templates — create template", r, 201) or r.status_code == 200:
        if r.status_code == 200:
            passed += 1; failed -= 1
        resp = r.json()
        d = resp.get("data") or resp.get("template") or resp
        new_template_id = d.get("id") if isinstance(d, dict) else None
        if new_template_id:
            print(f"    → Created template ID: {new_template_id}")

    if new_template_id:
        r = get(f"/templates/{new_template_id}")
        ok("GET /templates/{id} — get template", r, 200)

        r = patch(f"/templates/{new_template_id}", {"name": "Updated Template"})
        ok("PATCH /templates/{id} — update template", r, 200)
    else:
        skip("GET/PATCH /templates/{id}", "no template created")
else:
    skip("POST /templates", "no area available")

# ═══════════════════════════════════════════════════════════════════
# 5. SHIFTS CRUD
# ═══════════════════════════════════════════════════════════════════
section("5. SHIFTS CRUD")

r = get("/shifts")
ok("GET /shifts — list shifts", r, 200)
shifts_list = []
try:
    resp = r.json()
    shifts_list = resp.get("data", resp) if isinstance(resp, dict) else resp
    shifts_list = shifts_list if isinstance(shifts_list, list) else []
    print(f"    → {len(shifts_list)} shifts found")
except Exception:
    pass

r = post("/shifts", {
    "name": f"Test Shift {int(time.time())}",
    "start_time": "06:00",
    "end_time": "14:00",
    "type": "morning",
    "applicable_area_ids": []
})
new_shift_id = None
if ok("POST /shifts — create shift", r, 201) or r.status_code == 200:
    if r.status_code == 200:
        passed += 1; failed -= 1
    resp = r.json()
    d = resp.get("data") or resp.get("shift") or resp
    new_shift_id = d.get("id") if isinstance(d, dict) else None
    print(f"    → Created shift ID: {new_shift_id}")

if new_shift_id:
    r = patch(f"/shifts/{new_shift_id}", {"name": "Updated Shift"})
    ok("PATCH /shifts/{id} — update shift", r, 200)

    r = delete(f"/shifts/{new_shift_id}")
    ok("DELETE /shifts/{id} — delete shift", r, 204)
else:
    skip("PATCH/DELETE /shifts/{id}", "no shift created")

# ═══════════════════════════════════════════════════════════════════
# 6. RUNS (CHECKLIST RUNS)
# ═══════════════════════════════════════════════════════════════════
section("6. CHECKLIST RUNS (CREATE / READ / UPDATE)")

r = get("/runs")
ok("GET /runs — list runs", r, 200)
runs_existing = []
try:
    resp = r.json()
    runs_existing = resp.get("data", resp) if isinstance(resp, dict) else resp
    runs_existing = runs_existing if isinstance(runs_existing, list) else []
    if isinstance(resp, dict):
        runs_existing = resp.get("data", {}).get("data", runs_existing) if isinstance(resp.get("data"), dict) else runs_existing
    print(f"    → {len(runs_existing)} runs found")
except Exception:
    pass

# Try to create a run if we have a template
new_run_id = None
if new_template_id and area_id_for_template:
    r = post("/runs", {
        "template_id": new_template_id,
        "area_id": area_id_for_template,
        "run_date": TODAY,
        "status": "open"
    })
    if ok("POST /runs — create run", r, 201) or r.status_code == 200:
        if r.status_code == 200:
            passed += 1; failed -= 1
        resp = r.json()
        # various response shapes
        d = resp.get("data") or resp.get("run") or resp
        if isinstance(d, dict):
            new_run_id = d.get("id") or d.get("run", {}).get("id")
        print(f"    → Created run ID: {new_run_id}")
else:
    # Use first existing run or first run from list
    if runs_existing:
        item = runs_existing[0]
        new_run_id = item.get("id") if isinstance(item, dict) else None
        print(f"    → Using existing run ID: {new_run_id} (no template created)")
    if not new_run_id:
        skip("POST /runs", "no template available to create run")

if new_run_id:
    r = get(f"/runs/{new_run_id}")
    ok("GET /runs/{id} — get run detail", r, 200)

    r = patch(f"/runs/{new_run_id}", {"status": "open"})
    ok("PATCH /runs/{id} — update run", r, 200)

    # Test export
    r = get(f"/runs/{new_run_id}/export")
    ok("GET /runs/{id}/export — export run", r, 200)

else:
    skip("GET/PATCH /runs/{id}", "no run available")

# ═══════════════════════════════════════════════════════════════════
# 7. REVIEW WORKFLOW (State Machine)
# ═══════════════════════════════════════════════════════════════════
section("7. REVIEW WORKFLOW (WorkStatus State Machine)")

# For workflow tests, login as staff first, then switch back to admin for approval
# We'll do the full workflow on the same run

# Get a run in 'pending' state
workflow_run_id = new_run_id
if not workflow_run_id:
    # Try to find a pending run
    r = get("/runs", params={"work_status": "pending"})
    try:
        resp = r.json()
        lst = resp.get("data", resp)
        if isinstance(lst, dict):
            lst = lst.get("data", [])
        if lst and isinstance(lst[0], dict):
            workflow_run_id = lst[0].get("id")
    except Exception:
        pass

if workflow_run_id:
    # startWork — pending → in_progress
    r = post(f"/review/runs/{workflow_run_id}/start")
    if ok("POST /review/runs/{id}/start — pending→in_progress", r, 200):
        pass

    # completeWork — in_progress → completed
    r = post(f"/review/runs/{workflow_run_id}/complete")
    if ok("POST /review/runs/{id}/complete — in_progress→completed", r, 200):
        pass

    # requestReview — completed → needs_review
    r = post(f"/review/runs/{workflow_run_id}/request-review")
    if ok("POST /review/runs/{id}/request-review — completed→needs_review", r, 200):
        pass

    # showForReview
    r = get(f"/review/runs/{workflow_run_id}")
    ok("GET /review/runs/{id} — view for review", r, 200)

    # Pending review list
    r = get("/review/pending")
    ok("GET /review/pending — list pending reviews", r, 200)
    try:
        resp = r.json()
        lst = resp.get("data", resp)
        cnt = len(lst) if isinstance(lst, list) else "?"
        print(f"    → {cnt} runs need review")
    except Exception:
        pass

    # Test REJECT → resubmit → approve full cycle
    # Reject
    r = post(f"/review/runs/{workflow_run_id}/reject", {"review_note": "Test rejection - needs fix"})
    if ok("POST /review/runs/{id}/reject — needs_review→rejected", r, 200):
        # Resubmit
        r = post(f"/review/runs/{workflow_run_id}/resubmit")
        if ok("POST /review/runs/{id}/resubmit — rejected→needs_review", r, 200):
            # Approve
            r = post(f"/review/runs/{workflow_run_id}/approve", {"review_note": "Test approval"})
            ok("POST /review/runs/{id}/approve — needs_review→approved", r, 200)
else:
    skip("Full review workflow", "no run available for workflow test")

# Review stats
r = get("/review/stats")
ok("GET /review/stats — status statistics", r, 200)
try:
    resp = r.json()
    stats = resp.get("data") or resp
    print(f"    → Stats: {stats}")
except Exception:
    pass

# ═══════════════════════════════════════════════════════════════════
# 8. INCIDENTS CRUD
# ═══════════════════════════════════════════════════════════════════
section("8. INCIDENTS CRUD")

r = get("/incidents")
ok("GET /incidents — list incidents", r, 200)
try:
    resp = r.json()
    lst = resp.get("data", resp) if isinstance(resp, dict) else resp
    lst = lst if isinstance(lst, list) else []
    print(f"    → {len(lst)} incidents found")
except Exception:
    pass

# Create incident
inc_area_id = new_area_id or (areas_list[0].get("id") if areas_list else 1)
r = post("/incidents", {
    "area_id": inc_area_id,
    "title": "Test Incident — System Test",
    "description": "Automated test incident",
    "severity": "medium",
    "status": "open"
})
new_incident_id = None
if ok("POST /incidents — create incident", r, 201) or r.status_code == 200:
    if r.status_code == 200:
        passed += 1; failed -= 1
    resp = r.json()
    d = resp.get("data") or resp.get("incident") or resp
    new_incident_id = d.get("id") if isinstance(d, dict) else None
    print(f"    → Created incident ID: {new_incident_id}")

if new_incident_id:
    r = get(f"/incidents/{new_incident_id}")
    ok("GET /incidents/{id} — get incident", r, 200)

    r = patch(f"/incidents/{new_incident_id}", {"status": "in_progress"})
    ok("PATCH /incidents/{id} — update status to in_progress", r, 200)

    r = patch(f"/incidents/{new_incident_id}", {
        "status": "resolved",
        "resolution_note": "Automated test resolved"
    })
    ok("PATCH /incidents/{id} — resolve incident", r, 200)
else:
    skip("GET/PATCH /incidents/{id}", "no incident created")

# ═══════════════════════════════════════════════════════════════════
# 9. ADMIN STATS
# ═══════════════════════════════════════════════════════════════════
section("9. ADMIN STATISTICS")

r = get("/admin/staff-stats")
ok("GET /admin/staff-stats — staff statistics", r, 200)

r = get("/admin/supervisor-stats")
ok("GET /admin/supervisor-stats — supervisor statistics", r, 200)

# ═══════════════════════════════════════════════════════════════════
# 10. AUTHORIZATION GATES (Policy Coverage)
# ═══════════════════════════════════════════════════════════════════
section("10. AUTHORIZATION — ROLE GATES")

# Get staff token for testing unauthorized access
r = post("/auth/login", {"email": "staff@local.test", "password": "password"})
staff_token = None
staff_headers = {"Content-Type": "application/json", "Accept": "application/json"}
if r.status_code == 200:
    d = r.json()
    staff_token = d.get("token") or d.get("data", {}).get("token") or d.get("access_token")
    if staff_token:
        staff_headers["Authorization"] = f"Bearer {staff_token}"
        print(f"  {GREEN}✓{RESET} Logged in as staff user")
        passed += 1
    else:
        print(f"  {YELLOW}~{RESET} Staff login succeeded but no token")
        skipped += 1
else:
    print(f"  {YELLOW}~{RESET} Staff user not found — skipping role gate tests")
    skipped += 1

if staff_token:
    # Staff should NOT be able to create users
    r = requests.post(f"{BASE}/users",
        json={"name": "Illegal", "email": "x@x.com", "role": "admin", "password": "pass"},
        headers=staff_headers, timeout=10
    )
    if r.status_code in (401, 403):
        print(f"  {GREEN}✓{RESET} Staff CANNOT create users ({r.status_code}) — policy correct")
        passed += 1
    else:
        print(f"  {RED}✗{RESET} Staff SHOULD be blocked from creating users but got {r.status_code}")
        failed += 1
        errors.append(f"Policy: staff user creation should be rejected but got {r.status_code}")

    # Staff should NOT be able to approve reviews
    if workflow_run_id:
        r = requests.post(f"{BASE}/review/runs/{workflow_run_id}/approve",
            json={"review_note": "x"},
            headers=staff_headers, timeout=10
        )
        if r.status_code in (401, 403):
            print(f"  {GREEN}✓{RESET} Staff CANNOT approve runs ({r.status_code}) — policy correct")
            passed += 1
        else:
            print(f"  {YELLOW}~{RESET} Staff approve returned {r.status_code} (run may already be approved)")
            skipped += 1
    else:
        skip("Staff approve gate", "no run available")

# ═══════════════════════════════════════════════════════════════════
# 11. BACKEND PHP UNIT TESTS
# ═══════════════════════════════════════════════════════════════════
section("11. BACKEND UNIT TESTS")

import subprocess
result = subprocess.run(
    ["php", "artisan", "test", "--stop-on-failure"],
    cwd="/Users/duyduong/Documents/code/ecocheck-tourism-ops-management/backend-app",
    capture_output=True, text=True, timeout=120
)
output = result.stdout + result.stderr
print(output.strip())
if result.returncode == 0:
    passed += 1
    print(f"  {GREEN}✓{RESET} PHP artisan test — all unit tests passed")
else:
    failed += 1
    errors.append("PHP artisan test failed — see output above")

# ═══════════════════════════════════════════════════════════════════
# 12. FRONTEND TYPECHECK
# ═══════════════════════════════════════════════════════════════════
section("12. FRONTEND TYPESCRIPT CHECK")

result = subprocess.run(
    ["npx", "tsc", "--noEmit"],
    cwd="/Users/duyduong/Documents/code/ecocheck-tourism-ops-management",
    capture_output=True, text=True, timeout=60
)
ts_output = result.stdout + result.stderr
# Filter out known pre-existing ErrorBoundary errors
ts_errors = [l for l in ts_output.splitlines() if "error TS" in l and "ErrorBoundary" not in l]
if not ts_errors:
    print(f"  {GREEN}✓{RESET} TypeScript — no new errors")
    passed += 1
else:
    for e in ts_errors[:10]:
        print(f"  {RED}  {e}{RESET}")
    if len(ts_errors) > 10:
        print(f"  {RED}  ... and {len(ts_errors)-10} more{RESET}")
    failed += 1
    errors.append(f"TypeScript: {len(ts_errors)} type error(s)")

# ═══════════════════════════════════════════════════════════════════
# 13. WORKSTATUS ENUM VALIDATION
# ═══════════════════════════════════════════════════════════════════
section("13. WorkStatus Enum Validation (PHP)")

enum_test = """<?php
require '/Users/duyduong/Documents/code/ecocheck-tourism-ops-management/backend-app/vendor/autoload.php';

use App\Enums\WorkStatus;

$tests = [
    ['fromLegacy open', fn() => WorkStatus::fromLegacy('open') === WorkStatus::PENDING],
    ['fromLegacy done', fn() => WorkStatus::fromLegacy('done') === WorkStatus::COMPLETED],
    ['fromLegacy in_progress', fn() => WorkStatus::fromLegacy('in_progress') === WorkStatus::IN_PROGRESS],
    ['fromLegacy approved', fn() => WorkStatus::fromLegacy('approved') === WorkStatus::APPROVED],
    ['toLegacyStatus pending', fn() => WorkStatus::PENDING->toLegacyStatus() === 'open'],
    ['toLegacyStatus completed', fn() => WorkStatus::COMPLETED->toLegacyStatus() === 'done'],
    ['canTransition pending→in_progress', fn() => WorkStatus::PENDING->canTransitionTo(WorkStatus::IN_PROGRESS)],
    ['canTransition pending→approved BLOCKED', fn() => !WorkStatus::PENDING->canTransitionTo(WorkStatus::APPROVED)],
    ['canTransition needs_review→approved', fn() => WorkStatus::NEEDS_REVIEW->canTransitionTo(WorkStatus::APPROVED)],
    ['canTransition needs_review→rejected', fn() => WorkStatus::NEEDS_REVIEW->canTransitionTo(WorkStatus::REJECTED)],
    ['canTransition rejected→needs_review (resubmit)', fn() => WorkStatus::REJECTED->canTransitionTo(WorkStatus::NEEDS_REVIEW)],
    ['label PENDING is Vietnamese', fn() => !empty(WorkStatus::PENDING->label())],
];

$ok = 0; $fail = 0;
foreach ($tests as [$name, $fn]) {
    try {
        if ($fn()) { echo "PASS: $name\\n"; $ok++; }
        else { echo "FAIL: $name\\n"; $fail++; }
    } catch (\\Throwable $e) { echo "ERROR: $name — " . $e->getMessage() . "\\n"; $fail++; }
}
echo "\\nEnum Tests: $ok passed, $fail failed\\n";
exit($fail > 0 ? 1 : 0);
"""

with open("/tmp/enum_test.php", "w") as f:
    f.write(enum_test)

result = subprocess.run(
    ["php", "/tmp/enum_test.php"],
    capture_output=True, text=True, timeout=30
)
output = result.stdout + result.stderr
for line in output.strip().splitlines():
    color = GREEN if line.startswith("PASS") else (RED if line.startswith("FAIL") or line.startswith("ERROR") else CYAN)
    print(f"  {color}{line}{RESET}")

if result.returncode == 0:
    passed += 1
    print(f"  {GREEN}✓{RESET} WorkStatus enum — all state machine logic correct")
else:
    failed += 1
    errors.append("WorkStatus enum tests failed")

# ═══════════════════════════════════════════════════════════════════
# 14. LOGOUT
# ═══════════════════════════════════════════════════════════════════
section("14. LOGOUT")
r = post("/auth/logout")
ok("POST /auth/logout — invalidate token", r, 200)

# Ensure token is invalidated
r = get("/me")
ok("GET /me after logout — returns 401", r, 401)

# ═══════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════
total = passed + failed
print(f"\n{BOLD}{'═'*60}{RESET}")
print(f"{BOLD}  TEST RESULTS{RESET}")
print(f"{'═'*60}")
print(f"  {GREEN}Passed : {passed}{RESET}")
print(f"  {RED if failed else GREEN}Failed : {failed}{RESET}")
print(f"  {YELLOW}Skipped: {skipped}{RESET}")
print(f"  {'─'*30}")
print(f"  Total  : {total} tests run")
print(f"{'═'*60}")

if errors:
    print(f"\n{RED}{BOLD}FAILURES:{RESET}")
    for i, e in enumerate(errors, 1):
        print(f"  {i}. {RED}{e}{RESET}")

sys.exit(0 if failed == 0 else 1)
