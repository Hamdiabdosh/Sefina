#!/usr/bin/env bash
# Verify dev seed: medresas, students per medresa, teacher roster.
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
BASE="${API_URL}/api/v1"
DEV_PASSWORD="${DEV_PASSWORD:-Teacher@12345}"
STUDENTS_PER_MEDRESA="${STUDENTS_PER_MEDRESA:-20}"

json_get() {
  local json="$1"
  local expr="$2"
  python3 -c "import json,sys; d=json.loads(sys.argv[1]); print($expr)" "$json"
}

login() {
  local identifier="$1"
  local password="$2"
  local body
  body=$(printf '{"identifier":"%s","password":"%s"}' "$identifier" "$password")
  curl -sf -X POST "${BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d "$body"
}

echo "=== Dev seed verification ==="
echo "API: ${API_URL}"
echo ""

echo "1. Health check"
curl -sf "${API_URL}/health" | grep -q '"status":"ok"' || {
  echo "ERROR: API not healthy. Run: make dev-up && docker exec sefinet-backend-dev npm run db:seed:dev"
  exit 1
}
echo "   OK"

echo "2. Super Admin login"
super_json=$(login "sefinaalnejah@gmail.com" "${SUPER_ADMIN_PASSWORD:-Admin@12345}")
super_token=$(json_get "$super_json" "d['data']['accessToken']")
echo "   OK"

echo "3. List dev medresas"
medresas_json=$(curl -sf "${BASE}/medresas" -H "Authorization: Bearer ${super_token}")
medresa_count=$(json_get "$medresas_json" "len([m for m in d['data'] if m['name'].startswith('Dev Medresa')])")
if [[ "$medresa_count" -lt 5 ]]; then
  echo "ERROR: expected at least 5 Dev Medresa rows, got ${medresa_count}"
  echo "Run: docker exec sefinet-backend-dev npm run db:seed:dev"
  exit 1
fi
echo "   Found ${medresa_count} dev medresa(s)"

echo "4. Students per medresa (>= ${STUDENTS_PER_MEDRESA})"
while IFS= read -r medresa_id; do
  [[ -z "$medresa_id" ]] && continue
  list_json=$(curl -sf "${BASE}/medresas/${medresa_id}/students?page=1&limit=100" \
    -H "Authorization: Bearer ${super_token}")
  total=$(json_get "$list_json" "d['data']['pagination']['total']")
  if [[ "$total" -lt "$STUDENTS_PER_MEDRESA" ]]; then
    echo "ERROR: medresa ${medresa_id} has ${total} students (need >= ${STUDENTS_PER_MEDRESA})"
    exit 1
  fi
done < <(json_get "$medresas_json" "'\\n'.join(m['id'] for m in d['data'] if m['name'].startswith('Dev Medresa'))")
echo "   OK (${medresa_count} medresas)"

echo "5. Medresa admin login (admin01)"
admin_json=$(login "admin01@sefinet.dev" "$DEV_PASSWORD")
admin_token=$(json_get "$admin_json" "d['data']['accessToken']")
admin_medresa=$(json_get "$admin_json" "d['data']['user']['medresaRoles'][0]['medresaId']")
admin_students=$(curl -sf "${BASE}/medresas/${admin_medresa}/students?page=1&limit=5" \
  -H "Authorization: Bearer ${admin_token}")
admin_total=$(json_get "$admin_students" "d['data']['pagination']['total']")
if [[ "$admin_total" -lt 1 ]]; then
  echo "ERROR: admin01 cannot list students for their medresa"
  exit 1
fi
echo "   OK (admin01 sees ${admin_total}+ students)"

echo "6. Teacher roster (ustaz06)"
teacher_json=$(login "ustaz06@sefinet.dev" "$DEV_PASSWORD")
teacher_token=$(json_get "$teacher_json" "d['data']['accessToken']")
roster_json=$(curl -sf "${BASE}/teacher/students?page=1&limit=100" \
  -H "Authorization: Bearer ${teacher_token}")
roster_total=$(json_get "$roster_json" "len(d['data']['items'])")
if [[ "$roster_total" -lt 1 ]]; then
  echo "ERROR: ustaz06 teacher roster is empty (expected students in assigned courses)"
  exit 1
fi
echo "   OK (ustaz06 roster: ${roster_total} students)"

echo ""
echo "Dev seed verification passed."
