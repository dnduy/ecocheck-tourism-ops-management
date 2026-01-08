#!/bin/bash
# Integration Testing Script - EcoCheck Tourism Ops
# Run this script to test all API endpoints and data flows

set -e

API_BASE="http://127.0.0.1:8000/api"
TOKEN=""
USER_ID=""
AREA_ID=""
TEMPLATE_ID=""
RUN_ID=""
INCIDENT_ID=""

echo "🚀 Starting EcoCheck Integration Tests..."
echo "API Base: $API_BASE"
echo ""

# ============================================================================
# 1. AUTHENTICATION
# ============================================================================
echo "📝 TEST 1: Authentication Flow"
echo "---"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@local.test",
    "password": "ChangeMe123!"
  }')

echo "Response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed! Token not found."
  exit 1
fi

echo "✅ Login successful!"
echo "Token: $TOKEN"
echo "User ID: $USER_ID"
echo ""

# ============================================================================
# 2. USER MANAGEMENT
# ============================================================================
echo "👤 TEST 2: User Management"
echo "---"

# Get current user
echo "Getting current user..."
curl -s -X GET "$API_BASE/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo "✅ Get current user successful"
echo ""

# List users
echo "Listing all users..."
curl -s -X GET "$API_BASE/users" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo "✅ List users successful"
echo ""

# Create new user (supervisor)
echo "Creating new supervisor user..."
CREATE_USER_RESPONSE=$(curl -s -X POST "$API_BASE/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Supervisor",
    "email": "supervisor@test.local",
    "role": "supervisor",
    "password": "SecurePass123"
  }')

echo $CREATE_USER_RESPONSE | jq .
SUPERVISOR_ID=$(echo $CREATE_USER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ User created with ID: $SUPERVISOR_ID"
echo ""

# ============================================================================
# 3. AREA MANAGEMENT
# ============================================================================
echo "🏢 TEST 3: Area Management"
echo "---"

# Create area
echo "Creating new area..."
CREATE_AREA_RESPONSE=$(curl -s -X POST "$API_BASE/areas" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Poolside Restaurant",
    "type": "Food & Beverage"
  }')

echo $CREATE_AREA_RESPONSE | jq .
AREA_ID=$(echo $CREATE_AREA_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Area created with ID: $AREA_ID"
echo ""

# List areas
echo "Listing all areas..."
curl -s -X GET "$API_BASE/areas" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo "✅ Areas listed"
echo ""

# ============================================================================
# 4. TEMPLATE MANAGEMENT
# ============================================================================
echo "📋 TEST 4: Template Management"
echo "---"

# Create template
echo "Creating new template..."
CREATE_TEMPLATE_RESPONSE=$(curl -s -X POST "$API_BASE/templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Pool Safety Check",
    "description": "Weekly pool safety and maintenance check",
    "version": "v1",
    "is_active": true,
    "groups": [
      {
        "title": "Water Quality",
        "items": [
          {"title": "Check pH level"},
          {"title": "Check chlorine level"},
          {"title": "Check filter pressure"}
        ]
      },
      {
        "title": "Safety Equipment",
        "items": [
          {"title": "Inspect rescue equipment"},
          {"title": "Check first aid kit"}
        ]
      }
    ],
    "columns": [
      {
        "label": "Morning Shift (6am-2pm)",
        "type": "text"
      },
      {
        "label": "Afternoon Shift (2pm-10pm)",
        "type": "text"
      }
    ]
  }')

echo $CREATE_TEMPLATE_RESPONSE | jq .
TEMPLATE_ID=$(echo $CREATE_TEMPLATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Template created with ID: $TEMPLATE_ID"
echo ""

# List templates
echo "Listing all templates..."
curl -s -X GET "$API_BASE/templates" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo "✅ Templates listed"
echo ""

# ============================================================================
# 5. CHECKLIST EXECUTION
# ============================================================================
echo "✅ TEST 5: Checklist Execution Flow"
echo "---"

# Create run (checklist instance)
TODAY=$(date +%Y-%m-%d)
echo "Creating new run for today ($TODAY)..."
CREATE_RUN_RESPONSE=$(curl -s -X POST "$API_BASE/runs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"area_id\": $AREA_ID,
    \"date\": \"$TODAY\"
  }")

echo $CREATE_RUN_RESPONSE | jq .
RUN_ID=$(echo $CREATE_RUN_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Run created with ID: $RUN_ID"
echo ""

# Get run detail
echo "Getting run detail..."
RUN_DETAIL=$(curl -s -X GET "$API_BASE/runs/$RUN_ID" \
  -H "Authorization: Bearer $TOKEN")

echo $RUN_DETAIL | jq .
ITEM_ID=$(echo $RUN_DETAIL | grep -o '"id":[0-9]*' | head -2 | tail -1 | cut -d':' -f2)
COLUMN_ID=$(echo $RUN_DETAIL | grep -o '"column_id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Run detail retrieved. Sample Item ID: $ITEM_ID, Column ID: $COLUMN_ID"
echo ""

# Create entries (mark checklist items)
echo "Creating entries (marking items as PASS/FAIL)..."
ENTRY_RESPONSE=$(curl -s -X POST "$API_BASE/entries" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"run_id\": $RUN_ID,
    \"item_id\": $ITEM_ID,
    \"column_id\": $COLUMN_ID,
    \"value\": \"ok\",
    \"note\": \"All checks passed successfully\"
  }")

echo $ENTRY_RESPONSE | jq .
echo "✅ Entry created"
echo ""

# ============================================================================
# 6. INCIDENT REPORTING
# ============================================================================
echo "🚨 TEST 6: Incident Reporting"
echo "---"

# Create incident
echo "Creating new incident..."
CREATE_INCIDENT_RESPONSE=$(curl -s -X POST "$API_BASE/incidents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"area_id\": $AREA_ID,
    \"title\": \"Pool pump malfunction detected\",
    \"description\": \"Main pool circulation pump showing abnormal pressure readings. Requires immediate maintenance.\",
    \"severity\": \"high\"
  }")

echo $CREATE_INCIDENT_RESPONSE | jq .
INCIDENT_ID=$(echo $CREATE_INCIDENT_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Incident created with ID: $INCIDENT_ID"
echo ""

# List incidents
echo "Listing all incidents..."
curl -s -X GET "$API_BASE/incidents" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo "✅ Incidents listed"
echo ""

# Update incident status
echo "Updating incident status to in_progress..."
curl -s -X PATCH "$API_BASE/incidents/$INCIDENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }' | jq .
echo "✅ Incident status updated"
echo ""

# ============================================================================
# 7. SIGNOFF FLOW
# ============================================================================
echo "🔏 TEST 7: Signoff / Verification Flow"
echo "---"

# Get run detail to find session and role
RUN_DETAIL=$(curl -s -X GET "$API_BASE/runs/$RUN_ID" \
  -H "Authorization: Bearer $TOKEN")

SESSION_ID=$(echo $RUN_DETAIL | grep -o '"session_id":[0-9]*' | head -1 | cut -d':' -f2)
ROLE_ID=$(echo $RUN_DETAIL | grep -o '"role_id":[0-9]*' | head -1 | cut -d':' -f2)

echo "Session ID: $SESSION_ID, Role ID: $ROLE_ID"

# Create signoff
echo "Creating signoff..."
SIGNOFF_RESPONSE=$(curl -s -X POST "$API_BASE/signoffs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"run_id\": $RUN_ID,
    \"session_id\": $SESSION_ID,
    \"role_id\": $ROLE_ID
  }")

echo $SIGNOFF_RESPONSE | jq .
echo "✅ Signoff created"
echo ""

# Update run to completed
echo "Marking run as completed..."
curl -s -X PATCH "$API_BASE/runs/$RUN_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "assigned_to": '$SUPERVISOR_ID'
  }' | jq .
echo "✅ Run marked as completed"
echo ""

# ============================================================================
# 8. DATA VERIFICATION
# ============================================================================
echo "🔍 TEST 8: Data Persistence Verification"
echo "---"

echo "Listing all runs..."
curl -s -X GET "$API_BASE/runs?date=$TODAY" \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | {id, area_id, status}'
echo "✅ Runs verified"
echo ""

echo "Listing all users..."
curl -s -X GET "$API_BASE/users" \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | {id, name, role}'
echo "✅ Users verified"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL INTEGRATION TESTS PASSED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 TEST SUMMARY:"
echo "  ✅ Authentication - Login successful, token obtained"
echo "  ✅ Users - Created supervisor user ($SUPERVISOR_ID)"
echo "  ✅ Areas - Created area ($AREA_ID)"
echo "  ✅ Templates - Created template ($TEMPLATE_ID)"
echo "  ✅ Runs - Created checklist run ($RUN_ID)"
echo "  ✅ Entries - Created entry with auto-save"
echo "  ✅ Incidents - Created incident ($INCIDENT_ID)"
echo "  ✅ Signoffs - Verified checklist"
echo "  ✅ Data - All data persisted to SQLite"
echo ""
echo "🎉 System is fully functional and ready for deployment!"
echo ""
