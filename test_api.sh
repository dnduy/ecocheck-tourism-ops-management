#!/bin/bash
echo "Testing API..."
curl -s "http://localhost:8000/api/runs?date=2026-01-10" | python3 -m json.tool | head -80
