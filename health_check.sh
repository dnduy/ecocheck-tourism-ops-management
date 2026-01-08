#!/bin/bash
# System Health Check Script - EcoCheck Tourism Ops
# Run this to verify all systems are operational

set -e

echo "🔍 EcoCheck System Health Check"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Function to check
check() {
  local description=$1
  local command=$2
  
  echo -n "Checking: $description... "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
  fi
}

# ============================================================================
# 1. BACKEND SERVER CHECK
# ============================================================================
echo "📡 Backend Server Status"
echo "---"

check "Backend running on :8000" "curl -s http://127.0.0.1:8000/api/auth/me | grep -q '.' || true"
check "Backend responds within 5s" "timeout 5 curl -s http://127.0.0.1:8000/health | grep -q '.' || true"

echo ""

# ============================================================================
# 2. FRONTEND SERVER CHECK
# ============================================================================
echo "🖥️  Frontend Server Status"
echo "---"

check "Frontend running on :3000" "curl -s http://localhost:3000 | grep -q 'html' || true"
check "Frontend responds within 5s" "timeout 5 curl -s http://localhost:3000 | grep -q '.' || true"

echo ""

# ============================================================================
# 3. DATABASE CHECK
# ============================================================================
echo "🗄️  Database Status"
echo "---"

DB_PATH="backend-app/database/database.sqlite"
check "SQLite database exists" "test -f '$DB_PATH'"
check "Database has 14+ tables" "sqlite3 '$DB_PATH' '.tables' | grep -o ' ' | wc -l | awk '{if (\$1 >= 14) exit 0; else exit 1}' || true"
check "Users table has records" "sqlite3 '$DB_PATH' 'SELECT COUNT(*) FROM users' | awk '{if (\$1 > 0) exit 0; else exit 1}' || true"
check "Areas table exists" "sqlite3 '$DB_PATH' 'SELECT COUNT(*) FROM areas' | grep -q '.' || true"
check "Templates table exists" "sqlite3 '$DB_PATH' 'SELECT COUNT(*) FROM checklist_templates' | grep -q '.' || true"

echo ""

# ============================================================================
# 4. API ENDPOINTS CHECK
# ============================================================================
echo "🔗 API Endpoints Status"
echo "---"

TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@local.test",
    "password": "ChangeMe123!"
  }' | grep -o '"token":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  check "GET /api/auth/me" "curl -s -H 'Authorization: Bearer $TOKEN' http://127.0.0.1:8000/api/auth/me | grep -q 'id' || true"
  check "GET /api/users" "curl -s -H 'Authorization: Bearer $TOKEN' http://127.0.0.1:8000/api/users | grep -q 'email' || true"
  check "GET /api/areas" "curl -s -H 'Authorization: Bearer $TOKEN' http://127.0.0.1:8000/api/areas | grep -q '.id' || true"
  check "GET /api/templates" "curl -s -H 'Authorization: Bearer $TOKEN' http://127.0.0.1:8000/api/templates | grep -q '.' || true"
else
  echo -e "${RED}❌ FAIL - Could not obtain auth token${NC}"
  ((FAILED++))
fi

echo ""

# ============================================================================
# 5. FRONTEND FILES CHECK
# ============================================================================
echo "📁 Frontend Files Status"
echo "---"

check "App.tsx exists" "test -f 'App.tsx'"
check "package.json exists" "test -f 'package.json'"
check "Services directory" "test -d 'services'"
check "Pages directory" "test -d 'pages'"
check "authService exists" "test -f 'services/authService.ts'"
check "userService exists" "test -f 'services/userService.ts'"

echo ""

# ============================================================================
# 6. BACKEND FILES CHECK
# ============================================================================
echo "🔧 Backend Files Status"
echo "---"

check "Backend app directory" "test -d 'backend-app'"
check "Laravel config exists" "test -f 'backend-app/config/app.php' || test -f 'backend-app/config/database.php'"
check "Migrations directory" "test -d 'backend-app/database/migrations'"
check "Models exist" "test -f 'backend-app/app/Models/User.php' || ls backend-app/app/Models/*.php | grep -q 'User'"

echo ""

# ============================================================================
# 7. BUILD & DEPENDENCIES CHECK
# ============================================================================
echo "📦 Dependencies Status"
echo "---"

check "node_modules exists" "test -d 'node_modules'"
check "React installed" "test -d 'node_modules/react'"
check "TypeScript installed" "test -d 'node_modules/typescript'"
check "Vite installed" "test -d 'node_modules/vite'"

echo ""

# ============================================================================
# 8. DOCUMENTATION CHECK
# ============================================================================
echo "📚 Documentation Status"
echo "---"

check "TEST_CHECKLIST.md exists" "test -f 'TEST_CHECKLIST.md'"
check "DEPLOYMENT_GUIDE.md exists" "test -f 'DEPLOYMENT_GUIDE.md'"
check "SYSTEM_AUDIT.md exists" "test -f 'SYSTEM_AUDIT.md'"
check "COMPREHENSIVE_AUDIT.md exists" "test -f 'COMPREHENSIVE_AUDIT.md'"
check "INTEGRATION_TEST_REPORT.md exists" "test -f 'INTEGRATION_TEST_REPORT.md'"

echo ""

# ============================================================================
# 9. GIT STATUS CHECK
# ============================================================================
echo "🔀 Git Status"
echo "---"

check "Git repository" "git rev-parse --git-dir | grep -q '.git' || true"
check "Recent commits" "git log --oneline | head -1 | grep -q '.' || true"

echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "📊 Test Summary"
echo "=============="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed! System is healthy.${NC}"
  exit 0
else
  echo -e "${RED}❌ Some checks failed. Review logs above.${NC}"
  exit 1
fi
