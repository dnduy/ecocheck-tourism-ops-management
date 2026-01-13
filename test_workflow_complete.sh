#!/bin/bash

# Script kiểm tra toàn bộ workflow
# Test: pending → in_progress → completed → needs_review → approved/rejected

echo "🚀 KIỂM TRA WORKFLOW HỆ THỐNG"
echo "=============================="
echo ""

# Configuration
BASE_URL="http://localhost:8000/api"
ADMIN_EMAIL="admin@local.test"
ADMIN_PASS="password"
STAFF_EMAIL="user1767839568@test.local"
STAFF_PASS="password"
SUPERVISOR_EMAIL="supervisor@test.local"
SUPERVISOR_PASS="password"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
function test_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

function test_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

function test_fail() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Step 1: Login as Admin
test_step "Step 1: Login as Admin"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
ADMIN_ID=$(echo $ADMIN_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -1)

if [ -z "$ADMIN_TOKEN" ]; then
    test_fail "Cannot login as admin"
fi
test_success "Admin logged in (ID: $ADMIN_ID)"

# Step 2: Get first staff user
test_step "Step 2: Get Staff User"
STAFF_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$STAFF_EMAIL\",\"password\":\"$STAFF_PASS\"}")

STAFF_TOKEN=$(echo $STAFF_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
STAFF_ID=$(echo $STAFF_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -1)

if [ -z "$STAFF_TOKEN" ]; then
    test_fail "Cannot login as staff"
fi
test_success "Staff logged in (ID: $STAFF_ID)"

# Step 3: Get supervisor
test_step "Step 3: Get Supervisor User"
SUPERVISOR_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$SUPERVISOR_EMAIL\",\"password\":\"$SUPERVISOR_PASS\"}")

SUPERVISOR_TOKEN=$(echo $SUPERVISOR_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
SUPERVISOR_ID=$(echo $SUPERVISOR_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -1)

if [ -z "$SUPERVISOR_TOKEN" ]; then
    test_fail "Cannot login as supervisor"
fi
test_success "Supervisor logged in (ID: $SUPERVISOR_ID)"

# Step 4: Create a test run as Admin
test_step "Step 4: Create Test Run"
CREATE_RUN=$(curl -s -X POST "$BASE_URL/runs" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"checklist_template_id\": 1,
        \"area_id\": 1,
        \"assigned_to\": $STAFF_ID,
        \"verified_by\": $SUPERVISOR_ID,
        \"scheduled_for\": \"$(date +%Y-%m-%d)\"
    }")

RUN_ID=$(echo $CREATE_RUN | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -1)
WORK_STATUS=$(echo $CREATE_RUN | grep -o '"work_status":"[^"]*' | cut -d'"' -f4)

if [ -z "$RUN_ID" ]; then
    test_fail "Cannot create run"
fi
test_success "Run created (ID: $RUN_ID, Status: $WORK_STATUS)"

# Verify initial status is 'pending'
if [ "$WORK_STATUS" != "pending" ]; then
    test_fail "Initial status should be 'pending', got: $WORK_STATUS"
fi
test_success "Initial status is 'pending' ✓"

# Step 5: Staff starts work
test_step "Step 5: Staff Starts Work (pending → in_progress)"
START_WORK=$(curl -s -X POST "$BASE_URL/review/runs/$RUN_ID/start" \
    -H "Authorization: Bearer $STAFF_TOKEN" \
    -H "Content-Type: application/json")

NEW_STATUS=$(echo $START_WORK | grep -o '"work_status":"[^"]*' | cut -d'"' -f4)
if [ "$NEW_STATUS" != "in_progress" ]; then
    test_fail "Status should be 'in_progress', got: $NEW_STATUS"
fi
test_success "Work started: pending → in_progress ✓"

# Step 6: Staff completes work
test_step "Step 6: Staff Completes Work (in_progress → completed)"
COMPLETE_WORK=$(curl -s -X POST "$BASE_URL/review/runs/$RUN_ID/complete" \
    -H "Authorization: Bearer $STAFF_TOKEN" \
    -H "Content-Type: application/json")

NEW_STATUS=$(echo $COMPLETE_WORK | grep -o '"work_status":"[^"]*' | cut -d'"' -f4)
if [ "$NEW_STATUS" != "completed" ]; then
    test_fail "Status should be 'completed', got: $NEW_STATUS"
fi
test_success "Work completed: in_progress → completed ✓"

# Step 7: Staff requests review
test_step "Step 7: Staff Requests Review (completed → needs_review)"
REQUEST_REVIEW=$(curl -s -X POST "$BASE_URL/review/runs/$RUN_ID/request-review" \
    -H "Authorization: Bearer $STAFF_TOKEN" \
    -H "Content-Type: application/json")

NEW_STATUS=$(echo $REQUEST_REVIEW | grep -o '"work_status":"[^"]*' | cut -d'"' -f4)
if [ "$NEW_STATUS" != "needs_review" ]; then
    test_fail "Status should be 'needs_review', got: $NEW_STATUS"
fi
test_success "Review requested: completed → needs_review ✓"

# Step 8a: Supervisor approves
test_step "Step 8a: Supervisor Approves (needs_review → approved)"
APPROVE=$(curl -s -X POST "$BASE_URL/review/runs/$RUN_ID/approve" \
    -H "Authorization: Bearer $SUPERVISOR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"review_note":"Looks good!"}')

NEW_STATUS=$(echo $APPROVE | grep -o '"work_status":"[^"]*' | cut -d'"' -f4)
if [ "$NEW_STATUS" != "approved" ]; then
    test_fail "Status should be 'approved', got: $NEW_STATUS"
fi
test_success "Approved: needs_review → approved ✓"

# Step 9: Create another run to test rejection flow
test_step "Step 9: Create Second Run for Rejection Test"
CREATE_RUN2=$(curl -s -X POST "$BASE_URL/runs" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"checklist_template_id\": 1,
        \"area_id\": 1,
        \"assigned_to\": $STAFF_ID,
        \"verified_by\": $SUPERVISOR_ID,
        \"scheduled_for\": \"$(date +%Y-%m-%d)\"
    }")

RUN_ID2=$(echo $CREATE_RUN2 | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -1)

if [ -z "$RUN_ID2" ]; then
    test_fail "Cannot create second run"
fi
test_success "Second run created (ID: $RUN_ID2)"

# Fast-forward to needs_review state
curl -s -X POST "$BASE_URL/review/runs/$RUN_ID2/start" \
    -H "Authorization: Bearer $STAFF_TOKEN" > /dev/null
curl -s -X POST "$BASE_URL/review/runs/$RUN_ID2/complete" \
    -H "Authorization: Bearer $STAFF_TOKEN" > /dev/null
curl -s -X POST "$BASE_URL/review/runs/$RUN_ID2/request-review" \
    -H "Authorization: Bearer $STAFF_TOKEN" > /dev/null

# Step 10: Supervisor rejects
test_step "Step 10: Supervisor Rejects (needs_review → rejected)"
REJECT=$(curl -s -X POST "$BASE_URL/review/runs/$RUN_ID2/reject" \
    -H "Authorization: Bearer $SUPERVISOR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"review_note":"Please fix item #3"}')

NEW_STATUS=$(echo $REJECT | grep -o '"work_status":"[^"]*' | cut -d'"' -f4)
if [ "$NEW_STATUS" != "rejected" ]; then
    test_fail "Status should be 'rejected', got: $NEW_STATUS"
fi
test_success "Rejected: needs_review → rejected ✓"

# Step 11: Staff resubmits
test_step "Step 11: Staff Resubmits (rejected → needs_review)"
RESUBMIT=$(curl -s -X POST "$BASE_URL/review/runs/$RUN_ID2/resubmit" \
    -H "Authorization: Bearer $STAFF_TOKEN" \
    -H "Content-Type: application/json")

NEW_STATUS=$(echo $RESUBMIT | grep -o '"work_status":"[^"]*' | cut -d'"' -f4)
if [ "$NEW_STATUS" != "needs_review" ]; then
    test_fail "Status should be 'needs_review', got: $NEW_STATUS"
fi
test_success "Resubmitted: rejected → needs_review ✓"

echo ""
echo "=============================="
echo -e "${GREEN}🎉 TẤT CẢ TESTS ĐỀU PASS!${NC}"
echo "=============================="
echo ""
echo "Workflow tested:"
echo "  1. ⏳ pending → 🔄 in_progress → ✅ completed → 👀 needs_review → ✅ approved"
echo "  2. 👀 needs_review → ❌ rejected → 👀 needs_review"
echo ""
echo "Run IDs created: $RUN_ID, $RUN_ID2"
echo ""
