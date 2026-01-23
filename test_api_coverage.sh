#!/bin/bash

# 🧪 API Coverage Test Script
# Tests all fixed endpoints from comprehensive audit

API_BASE="http://localhost:8000/api"
TOKEN=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 API Coverage Test Script"
echo "=========================="
echo ""

# Check if token is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Token required${NC}"
    echo "Usage: ./test_api_coverage.sh YOUR_TOKEN"
    echo ""
    echo "To get token:"
    echo "curl -X POST $API_BASE/auth/login \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"email\":\"manager@test.com\",\"password\":\"password\"}'"
    exit 1
fi

TOKEN=$1

echo "Using API Base: $API_BASE"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -n "Testing: $description... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_BASE$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Accept: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_BASE$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -d "$data")
    fi
    
    status=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($status)"
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status)"
        echo "Response: $body"
    fi
}

# ============================================
# 1️⃣ User CRUD Tests (Issue #11)
# ============================================
echo "1️⃣ Testing User CRUD (Issue #11)"
echo "================================"

test_endpoint "GET" "/users" "" "200" "GET /users (list)"
test_endpoint "POST" "/users" '{"name":"Test User API","email":"testapi'$(date +%s)'@test.com","password":"password123","role":"staff"}' "201" "POST /users (create)"
test_endpoint "GET" "/users/1" "" "200" "GET /users/{id} (show)"

echo ""

# ============================================
# 2️⃣ Incident Tests (Issue #12)
# ============================================
echo "2️⃣ Testing Incident CRUD (Issue #12)"
echo "===================================="

test_endpoint "GET" "/incidents" "" "200" "GET /incidents (list)"
test_endpoint "GET" "/incidents/1" "" "200" "GET /incidents/{id} (show)"

echo ""

# ============================================
# 3️⃣ Area Tests (Issue #13)
# ============================================
echo "3️⃣ Testing Area CRUD (Issue #13)"
echo "================================"

test_endpoint "GET" "/areas" "" "200" "GET /areas (list)"
test_endpoint "GET" "/areas/1" "" "200" "GET /areas/{id} (show)"

echo ""

# ============================================
# 4️⃣ Run Tests (Issue #14)
# ============================================
echo "4️⃣ Testing Run CRUD (Issue #14)"
echo "==============================="

test_endpoint "GET" "/runs" "" "200" "GET /runs (list)"
test_endpoint "GET" "/runs/1" "" "200" "GET /runs/{id} (show)"

echo ""

# ============================================
# 5️⃣ Review Workflow Tests (Issue #15)
# ============================================
echo "5️⃣ Testing Review Workflow (Issue #15)"
echo "======================================"

test_endpoint "GET" "/review/pending" "" "200" "GET /review/pending"
test_endpoint "GET" "/review/stats" "" "200" "GET /review/stats"

echo ""

# ============================================
# 6️⃣ Entry Tests (Issue #16)
# ============================================
echo "6️⃣ Testing Entry Operations (Issue #16)"
echo "======================================="

# This will likely fail if run doesn't exist, but tests the route exists
test_endpoint "PUT" "/entries" '{"run_id":999,"item_id":1,"column_id":1,"value":"ok"}' "422" "PUT /entries (upsert) - expects 422 or 200"

echo ""

# ============================================
# 7️⃣ Other Services Verification
# ============================================
echo "7️⃣ Testing Other Services"
echo "========================="

test_endpoint "GET" "/templates" "" "200" "GET /templates"
test_endpoint "PUT" "/signoffs" '{"run_id":999,"session_id":1}' "422" "PUT /signoffs - expects 422 or 200"
test_endpoint "GET" "/admin/staff-stats" "" "200" "GET /admin/staff-stats"
test_endpoint "GET" "/admin/supervisor-stats" "" "200" "GET /admin/supervisor-stats"

echo ""

# ============================================
# Summary
# ============================================
echo "=========================================="
echo "✅ Test Complete!"
echo "=========================================="
echo ""
echo "Manual verification needed:"
echo "1. Login to UI and test User CRUD in Admin panel"
echo "2. Test Incident show/delete"
echo "3. Test Review workflow with real data"
echo "4. Check browser console for errors"
echo ""
echo "Related docs:"
echo "- API_COVERAGE_AUDIT_REPORT.md"
echo "- TEST_API_COVERAGE.md"
echo "- COMPREHENSIVE_AUDIT_COMPLETE.md"
