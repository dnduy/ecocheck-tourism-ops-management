#!/bin/bash
# Script kiểm tra chức năng cho từng role trong hệ thống

API="http://127.0.0.1:8000/api"
DATE="2026-01-10"

echo "========================================"
echo "KIỂM TRA HỆ THỐNG ECOCHECK"
echo "========================================"
echo ""

# Function to login and get token
login() {
    local email=$1
    local password=$2
    local response=$(curl -s "$API/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null
}

# Function to test API endpoint
test_endpoint() {
    local token=$1
    local endpoint=$2
    local method=${3:-GET}
    local data=${4:-}
    
    if [ "$method" = "GET" ]; then
        curl -s "$API$endpoint" -H "Authorization: Bearer $token" -H "Content-Type: application/json"
    else
        curl -s -X "$method" "$API$endpoint" -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "$data"
    fi
}

echo "========================================="
echo "1. KIỂM TRA ROLE: STAFF (Nhân viên)"
echo "========================================="
STAFF_EMAIL="hotel.staff1@local.test"
STAFF_TOKEN=$(login "$STAFF_EMAIL" "password")

if [ -z "$STAFF_TOKEN" ]; then
    echo "❌ STAFF LOGIN FAILED"
else
    echo "✅ Staff Login OK - Token: ${STAFF_TOKEN:0:20}..."
    
    # Test xem runs của staff
    echo ""
    echo "--- Kiểm tra danh sách nhiệm vụ (runs) ---"
    RUNS=$(test_endpoint "$STAFF_TOKEN" "/runs?date=$DATE")
    RUN_COUNT=$(echo "$RUNS" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null)
    echo "  Số runs ngày $DATE: $RUN_COUNT"
    
    if [ "$RUN_COUNT" != "0" ]; then
        FIRST_RUN_ID=$(echo "$RUNS" | python3 -c "import sys, json; d=json.load(sys.stdin)['data']; print(d[0]['id'] if d else '')" 2>/dev/null)
        FIRST_RUN_STATUS=$(echo "$RUNS" | python3 -c "import sys, json; d=json.load(sys.stdin)['data']; print(d[0]['status'] if d else '')" 2>/dev/null)
        echo "  Run đầu tiên: ID=$FIRST_RUN_ID, Status=$FIRST_RUN_STATUS"
        
        # Test xem chi tiết run
        echo ""
        echo "--- Kiểm tra chi tiết run $FIRST_RUN_ID ---"
        RUN_DETAIL=$(test_endpoint "$STAFF_TOKEN" "/runs/$FIRST_RUN_ID")
        TEMPLATE_NAME=$(echo "$RUN_DETAIL" | python3 -c "import sys, json; d=json.load(sys.stdin).get('data', {}); print(d.get('template', {}).get('name', 'NONE'))" 2>/dev/null)
        GROUPS_COUNT=$(echo "$RUN_DETAIL" | python3 -c "import sys, json; d=json.load(sys.stdin).get('data', {}); print(len(d.get('template', {}).get('groups', [])))" 2>/dev/null)
        ITEMS_COUNT=$(echo "$RUN_DETAIL" | python3 -c "import sys, json; d=json.load(sys.stdin).get('data', {}); groups=d.get('template', {}).get('groups', []); items=sum(len(g.get('items', [])) for g in groups); print(items)" 2>/dev/null)
        echo "  Template: $TEMPLATE_NAME"
        echo "  Groups: $GROUPS_COUNT"
        echo "  Items: $ITEMS_COUNT"
        
        if [ "$ITEMS_COUNT" = "0" ]; then
            echo "  ❌ KHÔNG CÓ ITEMS - CẦN FIX!"
        else
            echo "  ✅ Items OK"
        fi
    fi
    
    # Test xem incidents
    echo ""
    echo "--- Kiểm tra incidents ---"
    INCIDENTS=$(test_endpoint "$STAFF_TOKEN" "/incidents")
    INC_COUNT=$(echo "$INCIDENTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null)
    echo "  Số incidents: $INC_COUNT"
fi

echo ""
echo "========================================="
echo "2. KIỂM TRA ROLE: SUPERVISOR (Giám sát)"
echo "========================================="
SUPERVISOR_EMAIL="hotel.manager@local.test"
SUPERVISOR_TOKEN=$(login "$SUPERVISOR_EMAIL" "password")

if [ -z "$SUPERVISOR_TOKEN" ]; then
    echo "❌ SUPERVISOR LOGIN FAILED"
else
    echo "✅ Supervisor Login OK"
    
    # Test xem tất cả runs
    echo ""
    echo "--- Kiểm tra danh sách runs (supervisor view) ---"
    RUNS=$(test_endpoint "$SUPERVISOR_TOKEN" "/runs?date=$DATE")
    RUN_COUNT=$(echo "$RUNS" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null)
    echo "  Số runs: $RUN_COUNT"
    
    # Test xem users
    echo ""
    echo "--- Kiểm tra danh sách users ---"
    USERS=$(test_endpoint "$SUPERVISOR_TOKEN" "/users")
    USER_COUNT=$(echo "$USERS" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null)
    echo "  Số users: $USER_COUNT"
    
    # Test xem areas
    echo ""
    echo "--- Kiểm tra danh sách areas ---"
    AREAS=$(test_endpoint "$SUPERVISOR_TOKEN" "/areas")
    AREA_COUNT=$(echo "$AREAS" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null)
    echo "  Số areas: $AREA_COUNT"
fi

echo ""
echo "========================================="
echo "3. KIỂM TRA ROLE: MANAGER (Quản lý)"
echo "========================================="
MANAGER_EMAIL="admin@local.test"
MANAGER_TOKEN=$(login "$MANAGER_EMAIL" "password")

if [ -z "$MANAGER_TOKEN" ]; then
    echo "❌ MANAGER LOGIN FAILED"
else
    echo "✅ Manager Login OK"
    
    # Test xem templates
    echo ""
    echo "--- Kiểm tra templates ---"
    TEMPLATES=$(test_endpoint "$MANAGER_TOKEN" "/templates")
    TEMPLATE_COUNT=$(echo "$TEMPLATES" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null)
    echo "  Số templates: $TEMPLATE_COUNT"
    
    # Test xem tất cả runs
    echo ""
    echo "--- Kiểm tra tất cả runs ---"
    RUNS=$(test_endpoint "$MANAGER_TOKEN" "/runs?date=$DATE")
    RUN_COUNT=$(echo "$RUNS" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null)
    echo "  Số runs: $RUN_COUNT"
    
    # Test incidents stats
    echo ""
    echo "--- Kiểm tra incidents (manager view) ---"
    INCIDENTS=$(test_endpoint "$MANAGER_TOKEN" "/incidents")
    INC_COUNT=$(echo "$INCIDENTS" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('data', [])))" 2>/dev/null)
    echo "  Số incidents: $INC_COUNT"
fi

echo ""
echo "========================================="
echo "TÓM TẮT KIỂM TRA"
echo "========================================="
echo "Hoàn thành kiểm tra 3 roles chính:"
echo "- Staff: Xem runs, thực hiện checklist"
echo "- Supervisor: Xem runs, duyệt checklist, quản lý incidents"
echo "- Manager: Xem toàn bộ, quản lý templates"
echo ""
echo "Kiểm tra logs bên trên để xác định lỗi cần fix!"
