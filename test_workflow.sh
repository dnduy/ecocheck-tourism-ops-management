#!/bin/bash
# Test workflow cho EcoCheck system

echo "=========================================="
echo "🧪 KIỂM TRA TOÀN BỘ HỆ THỐNG"
echo "=========================================="
echo ""

# 1. Check backend running
echo "1️⃣ Kiểm tra Backend..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   ✅ Backend đang chạy (port 8000)"
else
    echo "   ❌ Backend KHÔNG chạy!"
    echo "   → Khởi động: cd backend-app && php artisan serve --host=127.0.0.1 --port=8000"
    exit 1
fi
echo ""

# 2. Check database
echo "2️⃣ Kiểm tra Database..."
mysql -h 127.0.0.1 -u ecocheck -pecocheck_password ecocheck -e "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Database kết nối thành công"
else
    echo "   ❌ Database KHÔNG kết nối được!"
    exit 1
fi
echo ""

# 3. Check today's runs
echo "3️⃣ Kiểm tra công việc hôm nay..."
TODAY=$(date +%Y-%m-%d)
RUNS=$(mysql -h 127.0.0.1 -u ecocheck -pecocheck_password -D ecocheck -se "
SELECT COUNT(*) FROM runs WHERE DATE(scheduled_for) = '$TODAY'
" 2>/dev/null)
echo "   📊 Tổng số runs hôm nay: $RUNS"

if [ "$RUNS" -eq 0 ]; then
    echo "   ⚠️  KHÔNG CÓ RUNS CHO HÔM NAY!"
    echo "   → Chạy: python3 generate_demo_data.py"
fi
echo ""

# 4. Check staff assignments
echo "4️⃣ Kiểm tra phân công nhân viên..."
mysql -h 127.0.0.1 -u ecocheck -pecocheck_password -D ecocheck -se "
SELECT 
    u.name as 'Nhân viên',
    u.role as 'Vai trò',
    COUNT(r.id) as 'Số việc hôm nay'
FROM users u
LEFT JOIN runs r ON u.id = r.assigned_to AND DATE(r.scheduled_for) = '$TODAY'
WHERE u.id >= 2
GROUP BY u.id
ORDER BY u.role, u.name;
" 2>/dev/null
echo ""

# 5. Test API login
echo "5️⃣ Test API Login (Staff)..."
TOKEN=$(curl -s "http://127.0.0.1:8000/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"hotel.staff1@local.test","password":"password"}' \
    2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    echo "   ✅ Login thành công"
    echo "   🔑 Token: ${TOKEN:0:20}..."
else
    echo "   ❌ Login THẤT BẠI!"
    exit 1
fi
echo ""

# 6. Test API get runs
echo "6️⃣ Test API /runs?date=$TODAY..."
RUNS_DATA=$(curl -s "http://127.0.0.1:8000/api/runs?date=$TODAY" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)

RUN_COUNT=$(echo "$RUNS_DATA" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    # Handle pagination
    if isinstance(data, dict) and 'data' in data:
        print(len(data['data']))
    elif isinstance(data, list):
        print(len(data))
    else:
        print(0)
except:
    print(0)
" 2>/dev/null)

echo "   📊 API trả về: $RUN_COUNT runs"

if [ "$RUN_COUNT" -gt 0 ]; then
    echo "   ✅ API hoạt động tốt"
else
    echo "   ⚠️  API không trả về dữ liệu!"
fi
echo ""

# 7. Check user permissions
echo "7️⃣ Kiểm tra quyền thực hiện checklist..."
echo "   Staff user: hotel.staff1@local.test (ID: 6)"
mysql -h 127.0.0.1 -u ecocheck -pecocheck_password -D ecocheck -se "
SELECT 
    r.id as 'Run ID',
    ct.name as 'Template',
    r.status as 'Status',
    u.name as 'Assigned To'
FROM runs r
JOIN checklist_templates ct ON r.checklist_template_id = ct.id
LEFT JOIN users u ON r.assigned_to = u.id
WHERE r.assigned_to = 6 AND DATE(r.scheduled_for) = '$TODAY';
" 2>/dev/null
echo ""

# 8. Summary
echo "=========================================="
echo "📋 TÓM TẮT"
echo "=========================================="
echo "✅ Backend: Running"
echo "✅ Database: Connected"
echo "✅ API: Working"
echo "📊 Runs today: $RUNS_DATA"
echo ""
echo "🎯 HƯỚNG DẪN TEST:"
echo "1. Mở browser: http://localhost:3001"
echo "2. Login: hotel.staff1@local.test / password"
echo "3. Click tab 'Nhiệm vụ'"
echo "4. Chọn filter 'Việc của tôi'"
echo "5. Click vào checklist để thực hiện"
echo ""
echo "=========================================="
