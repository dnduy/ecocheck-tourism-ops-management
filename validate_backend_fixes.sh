#!/bin/bash

# Configuration
API_URL="http://127.0.0.1:8000/api"
EMAIL="admin@local.test"
PASSWORD="ChangeMe123!"

echo "🔹 Testing Backend Fixes..."

# 1. Login
echo "1. Logging in..."
LOGIN_RESP=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESP | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Logged in. Token captured."

# 2. Test /entries alias
echo "2. Testing /entries alias (PUT)..."
# We need valid run_id/item_id/column_id. For a quick test, we'll try to hit it and see if we get validation error (422) instead of 404.
ENTRY_RESP=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API_URL/entries" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{}")

if [ "$ENTRY_RESP" == "422" ]; then
  echo "✅ /entries alias exists (Got 422 Validation Error as expected for empty body)"
elif [ "$ENTRY_RESP" == "404" ]; then
  echo "❌ /entries alias MISSING (Got 404)"
else
  echo "⚠️ /entries returned $ENTRY_RESP"
fi

# 3. Create & Delete Run (Transaction Test)
echo "3. Testing Run Deletion (Transaction)..."
# Create
RUN_ID=$(curl -s -X POST "$API_URL/runs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"area_id": 1, "date": "2030-01-01"}' | grep -o '"id":[^,]*' | cut -d':' -f2 | tr -d '}')

if [ -z "$RUN_ID" ]; then
  echo "⚠️ Could not create run to test deletion."
else
  echo "   Created Run ID: $RUN_ID"
  # Delete
  DEL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/runs/$RUN_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if [ "$DEL_CODE" == "204" ]; then
    echo "✅ Run deleted successfully (204)"
  else
    echo "❌ Run deletion failed (Code: $DEL_CODE)"
  fi
fi

# 4. Create & Delete Incident
echo "4. Testing Incident Deletion..."
INCIDENT_ID=$(curl -s -X POST "$API_URL/incidents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"area_id":1, "title":"Test Incident", "description":"Test", "severity":"low", "status":"open", "assigned_to":1}' | grep -o '"id":[^,]*' | head -1 | cut -d':' -f2)

if [ -z "$INCIDENT_ID" ]; then
  echo "⚠️ Could not create incident."
else
  echo "   Created Incident ID: $INCIDENT_ID"
  # Delete
  DEL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/incidents/$INCIDENT_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  if [ "$DEL_CODE" == "204" ]; then
    echo "✅ Incident deleted successfully (204)"
  else
    echo "❌ Incident deletion failed (Code: $DEL_CODE)"
  fi
fi

echo "🔹 Verification Complete."
