#!/bin/bash
# EcoCheck System Health Check
# Quick validation of API, database, and services

set -e

BACKEND_URL="http://127.0.0.1:8000"
FRONTEND_URL="http://localhost:3001"
DB_USER="ecocheck"
DB_PASS="ecocheck_password"
DB_NAME="ecocheck"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "════════════════════════════════════════════════"
echo "   EcoCheck System Health Check"
echo "════════════════════════════════════════════════"
echo ""

# Check if services are running
echo "🔍 Checking Services..."
echo ""

# Backend
if curl -s "$BACKEND_URL/api/auth/login" -o /dev/null -w "%{http_code}" | grep -q "405\|422\|200"; then
    echo -e "  ${GREEN}✓${NC} Backend API (port 8000) - Running"
    BACKEND_OK=1
else
    echo -e "  ${RED}✗${NC} Backend API (port 8000) - Not responding"
    BACKEND_OK=0
fi

# Frontend
if curl -s "$FRONTEND_URL" -o /dev/null -w "%{http_code}" | grep -q "200"; then
    echo -e "  ${GREEN}✓${NC} Frontend Dev Server (port 3001) - Running"
    FRONTEND_OK=1
else
    echo -e "  ${YELLOW}⚠${NC} Frontend Dev Server (port 3001) - Not running"
    FRONTEND_OK=0
fi

# MySQL
if mysql -u "$DB_USER" -p"$DB_PASS" -h 127.0.0.1 -e "USE $DB_NAME; SELECT 1;" &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} MySQL Database - Connected"
    DB_OK=1
else
    echo -e "  ${RED}✗${NC} MySQL Database - Cannot connect"
    DB_OK=0
fi

echo ""

if [ $BACKEND_OK -eq 1 ]; then
    echo "🔐 Testing Authentication..."
    
    # Try login
    LOGIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@local.test","password":"ChangeMe123!"}' 2>/dev/null)
    
    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        echo -e "  ${GREEN}✓${NC} Login endpoint working"
        TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")
        
        if [ -n "$TOKEN" ]; then
            echo -e "  ${GREEN}✓${NC} Token acquired: ${TOKEN:0:20}..."
            
            # Test API endpoints
            echo ""
            echo "🔌 Testing API Endpoints..."
            
            ENDPOINTS=("areas" "templates" "runs" "incidents" "users")
            for ep in "${ENDPOINTS[@]}"; do
                STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/$ep" \
                    -H "Authorization: Bearer $TOKEN")
                
                if [ "$STATUS" = "200" ]; then
                    echo -e "  ${GREEN}✓${NC} GET /api/$ep - OK"
                else
                    echo -e "  ${RED}✗${NC} GET /api/$ep - Failed ($STATUS)"
                fi
            done
        fi
    else
        echo -e "  ${RED}✗${NC} Login endpoint failed"
    fi
    
    echo ""
fi

if [ $DB_OK -eq 1 ]; then
    echo "💾 Database Statistics..."
    
    # Get record counts
    COUNTS=$(mysql -u "$DB_USER" -p"$DB_PASS" -h 127.0.0.1 -D "$DB_NAME" -N -e \
        "SELECT 
            (SELECT COUNT(*) FROM areas) as areas,
            (SELECT COUNT(*) FROM checklist_templates) as templates,
            (SELECT COUNT(*) FROM runs) as runs,
            (SELECT COUNT(*) FROM incidents) as incidents,
            (SELECT COUNT(*) FROM users) as users,
            (SELECT COUNT(*) FROM entries) as entries;" 2>/dev/null)
    
    if [ -n "$COUNTS" ]; then
        echo "$COUNTS" | while read areas templates runs incidents users entries; do
            echo "  📊 Areas: $areas"
            echo "  📊 Templates: $templates"
            echo "  📊 Runs: $runs"
            echo "  📊 Incidents: $incidents"
            echo "  📊 Users: $users"
            echo "  📊 Entries: $entries"
        done
    else
        echo -e "  ${YELLOW}⚠${NC} Could not retrieve database statistics"
    fi
    
    echo ""
fi

# Summary
echo "════════════════════════════════════════════════"
if [ $BACKEND_OK -eq 1 ] && [ $DB_OK -eq 1 ]; then
    echo -e "  ${GREEN}✓ SYSTEM STATUS: HEALTHY${NC}"
elif [ $BACKEND_OK -eq 1 ] || [ $DB_OK -eq 1 ]; then
    echo -e "  ${YELLOW}⚠ SYSTEM STATUS: PARTIAL${NC}"
else
    echo -e "  ${RED}✗ SYSTEM STATUS: DOWN${NC}"
fi
echo "════════════════════════════════════════════════"
echo ""

# Exit code based on health
if [ $BACKEND_OK -eq 1 ] && [ $DB_OK -eq 1 ]; then
    exit 0
else
    exit 1
fi
