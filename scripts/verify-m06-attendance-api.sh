#!/usr/bin/env bash
# M06 attendance API smoke tests (docs/m06-attendance-api-tests.md).
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
BASE="${API_URL}/api/v1"
DEV_PASSWORD="${DEV_PASSWORD:-Teacher@12345}"
SUPER_ADMIN_EMAIL="${SUPER_ADMIN_EMAIL:-sefinaalnejah@gmail.com}"
SUPER_ADMIN_PASSWORD="${SUPER_ADMIN_PASSWORD:-Admin@12345}"

today_et() {
  python3 - <<'PY'
from datetime import datetime
from zoneinfo import ZoneInfo
print(datetime.now(ZoneInfo("Africa/Addis_Ababa")).strftime("%Y-%m-%d"))
PY
}

tomorrow_et() {
  python3 - <<'PY'
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
d = datetime.now(ZoneInfo("Africa/Addis_Ababa")).date() + timedelta(days=1)
print(d.isoformat())
PY
}

json_get() {
  local json="$1"
  local expr="$2"
  python3 -c "import json,sys; d=json.loads(sys.argv[1]); print($expr)" "$json" ""
}

login() {
  local identifier="$1"
  local pass="${2:-$DEV_PASSWORD}"
  curl -sf -X POST "${BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d "$(printf '{"identifier":"%s","password":"%s"}' "$identifier" "$pass")"
}

expect_http() {
  local got="$1"
  local allow="$2"
  local label="$3"
  if [[ ! "$allow" =~ (^|,)${got}(,|$) ]]; then
    echo "ERROR [$label]: expected HTTP {$allow}, got ${got}"
    exit 1
  fi
}

expect_body_code() {
  local json="$1"
  local want="$2"
  local label="$3"
  local got
  got=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('error',{}).get('code',''))" "$json")
  if [[ "$got" != "$want" ]]; then
    echo "ERROR [$label]: expected error.code=${want}, got ${got}"
    echo "$json"
    exit 1
  fi
}

DAY=$(today_et)

echo "=== M06 Attendance API verification ==="
echo "API: ${API_URL} · ET date=${DAY}"

curl -sf "${API_URL}/health" | grep -q '"status":"ok"' || {
  echo "ERROR: backend not healthy. Run: make dev-up"
  exit 1
}

echo ""
echo "1. ustaz06 + Quran course on assigned medresa"

u6=$(login "ustaz06@sefinet.dev")
t6=$(json_get "$u6" "d['data']['accessToken']")
medresa_id=$(python3 - <<'PY'
import json, sys
roles = json.load(sys.stdin)["data"]["user"].get("medresaRoles") or []
row = next((r for r in roles if r.get("role") == "TEACHER"), None)
assert row and row.get("medresaId"), "missing TEACHER medresaRoles"
print(row["medresaId"])
PY
<<<"$u6")

tid=$(curl -sf "${BASE}/teachers/me" -H "Authorization: Bearer ${t6}" |
  python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")

courses_json=$(curl -sf "${BASE}/medresas/${medresa_id}/courses?status=ACTIVE&teacherId=${tid}" \
  -H "Authorization: Bearer ${t6}")

MC_ID=$(MC_JSON="$courses_json" python3 - <<'PY'
import json, os
items = json.loads(os.environ["MC_JSON"])["data"]["items"]
for c in items:
    name = c.get("name") or {}
    en = name.get("en") if isinstance(name, dict) else ""
    if "Quran Recitation" in str(en):
        print(c["medresaCourseId"])
        break
else:
    raise SystemExit("no Quran course")
PY
)

students_json=$(curl -sf "${BASE}/teacher/students" -H "Authorization: Bearer ${t6}")
student_id=$(STU_JSON="$students_json" MC_ID="$MC_ID" python3 - <<'PY'
import json, os
items = json.loads(os.environ["STU_JSON"])["data"]["items"]
mc = os.environ["MC_ID"]
for row in items:
    for ec in row.get("enrolledCourses") or []:
        if ec.get("medresaCourseId") == mc:
            print(row["id"])
            raise SystemExit(0)
raise SystemExit("no enrolled student")
PY
)

echo "   medresa=$medresa_id course=$MC_ID student=${student_id:0:8}…"

today_json=$(curl -sf "${BASE}/attendance/sessions/today-session?medresaCourseId=${MC_ID}" \
  -H "Authorization: Bearer ${t6}")
had=$(python3 -c "import json,sys; print('1' if json.load(sys.stdin)['data']['session'] else '0')" <<<"$today_json")

if [[ "$had" == "0" ]]; then
  echo ""
  echo "2. POST create + duplicate 409"
  body=$(python3 - <<PY
import json
print(json.dumps({
  "medresaCourseId": "$MC_ID",
  "date": "$DAY",
  "records": [{"studentId": "$student_id", "status": "PRESENT", "note": "verify-m06"}],
}))
PY
  )
  code=$(curl -s -o /tmp/m06-create.json -w "%{http_code}" -X POST "${BASE}/attendance/sessions" \
    -H "Authorization: Bearer ${t6}" -H "Content-Type: application/json" -d "$body")
  expect_http "$code" "201" "POST session"
  sid=$(python3 -c "import json; print(json.load(open('/tmp/m06-create.json'))['data']['id'])")

  code=$(curl -s -o /tmp/m06-dup.json -w "%{http_code}" -X POST "${BASE}/attendance/sessions" \
    -H "Authorization: Bearer ${t6}" -H "Content-Type: application/json" -d "$body")
  expect_http "$code" "409" "duplicate POST"
else
  echo ""
  echo "2. Session exists — skip POST/duplicate"
  sid=$(python3 -c "import json,sys; print(json.load(sys.stdin)['data']['session']['id'])" <<<"$today_json")
fi

echo ""
echo "3. PATCH session"
patch_body=$(python3 - <<PY
import json
print(json.dumps({"records": [{"studentId": "$student_id", "status": "LATE", "note": "patched"}]}))
PY
)
code=$(curl -s -o /tmp/m06-patch.json -w "%{http_code}" -X PATCH "${BASE}/attendance/sessions/${sid}" \
  -H "Authorization: Bearer ${t6}" -H "Content-Type: application/json" -d "$patch_body")
expect_http "$code" "200" "PATCH"

echo ""
echo "4. Teacher forbidden on medresa overview"
a1tok=$(json_get "$(login "admin01@sefinet.dev")" "d['data']['accessToken']")
code=$(curl -s -o /tmp/m06-ov403.json -w "%{http_code}" \
  "${BASE}/medresas/${medresa_id}/attendance/overview?date=${DAY}" \
  -H "Authorization: Bearer ${t6}")
expect_http "$code" "403" "overview as teacher"

echo ""
echo "5. Future date"
tm=$(tomorrow_et)
fut_body=$(python3 - <<PY
import json
print(json.dumps({"medresaCourseId": "$MC_ID", "date": "$tm", "records": []}))
PY
)
code=$(curl -s -o /tmp/m06-fut.json -w "%{http_code}" -X POST "${BASE}/attendance/sessions" \
  -H "Authorization: Bearer ${t6}" -H "Content-Type: application/json" -d "$fut_body")
expect_http "$code" "400" "future"
expect_body_code "$(cat /tmp/m06-fut.json)" "ATTENDANCE_FUTURE_DATE" "future code"

echo ""
echo "6. GET student attendance"
curl -sf "${BASE}/attendance/students/${student_id}" \
  -H "Authorization: Bearer ${t6}" | python3 -c "import json,sys; d=json.load(sys.stdin); assert d['success']"

echo ""
echo "7. Admin medresa overview"
curl -sf "${BASE}/medresas/${medresa_id}/attendance/overview?date=${DAY}" \
  -H "Authorization: Bearer ${a1tok}" | grep -q '"success":true'

echo ""
echo "8. Super Admin network overview"
sa=$(login "$SUPER_ADMIN_EMAIL" "$SUPER_ADMIN_PASSWORD")
st=$(json_get "$sa" "d['data']['accessToken']")
curl -sf "${BASE}/attendance/network-overview?from=${DAY}&to=${DAY}" \
  -H "Authorization: Bearer ${st}" | grep -q '"success":true'

echo ""
echo "=== M06 verification passed ==="
