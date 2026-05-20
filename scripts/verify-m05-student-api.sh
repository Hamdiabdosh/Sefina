#!/usr/bin/env bash
# Automates docs/m05-student-api-tests.md against a seeded dev stack.
# Prerequisites: ./scripts/setup-dev.sh (or make dev-up) — includes db:seed:dev.
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
BASE="${API_URL}/api/v1"
DEV_PASSWORD="${DEV_PASSWORD:-Teacher@12345}"
ADMIN02_EMAIL="${ADMIN02_EMAIL:-admin02@sefinet.dev}"

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

expect_http() {
  local got="$1"
  local allow="$2"
  local label="$3"
  if [[ ! "$allow" =~ (^|,)${got}(,|$) ]]; then
    echo "ERROR [$label]: expected HTTP in {$allow}, got ${got}"
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
    echo "$json" | python3 -m json.tool 2>/dev/null || echo "$json"
    exit 1
  fi
}

echo "=== M05 Student API verification ==="
echo "API: ${API_URL}"

echo ""
echo "0. Health"
curl -sf "${API_URL}/health" | grep -q '"status":"ok"' || {
  echo "ERROR: backend not healthy. Run: make dev-up"
  exit 1
}
echo "   OK"

echo ""
echo "Logins (4 accounts — avoids auth rate-limit; no Super Admin required)"

admin01_json=$(login "admin01@sefinet.dev" "$DEV_PASSWORD")
admin_token=$(json_get "$admin01_json" "d['data']['accessToken']")

admin_medresa=$(python3 -c "
import json, sys
roles = json.load(sys.stdin)['data']['user'].get('medresaRoles') or []
admin = next((r for r in roles if r.get('role') == 'ADMIN'), None)
assert admin and admin.get('medresaId'), 'admin01 missing ADMIN medresaRoles'
print(admin['medresaId'])
" <<<"$admin01_json")

admin02_json=$(login "${ADMIN02_EMAIL}" "$DEV_PASSWORD")
admin02_token=$(json_get "$admin02_json" "d['data']['accessToken']")
m_jugol=$(python3 -c "
import json, sys
roles = json.load(sys.stdin)['data']['user'].get('medresaRoles') or []
admin = next((r for r in roles if r.get('role') == 'ADMIN'), None)
assert admin and admin.get('medresaId'), 'admin02 missing ADMIN medresaRoles'
print(admin['medresaId'])
" <<<"$admin02_json")

teacher06_json=$(login "ustaz06@sefinet.dev" "$DEV_PASSWORD")
teacher06_token=$(json_get "$teacher06_json" "d['data']['accessToken']")

teacher07_json=$(login "ustaz07@sefinet.dev" "$DEV_PASSWORD")
teacher07_token=$(json_get "$teacher07_json" "d['data']['accessToken']")

if [[ "${admin_medresa}" == "${m_jugol}" ]]; then
  echo "ERROR: admin01 and admin02 resolve to same medresa (expected Aw Bare vs Jugol). Check seed/dev emails."
  exit 1
fi

echo "   admin01 medresa=${admin_medresa}  admin02 Jugol=${m_jugol}"

PROBE_PHONE=$(python3 -c "import random; print('+2519%08d' % random.randint(0, 99999999))")
TEMP_PDF="$(mktemp /tmp/sefinet-invalid-photo-XXXX.pdf)"
trap 'rm -f "$TEMP_PDF"' EXIT
echo "%PDF-invalid-for-test" >"$TEMP_PDF"

echo ""
echo "2. POST student with invalid photo (expect 400 INVALID_PHOTO)"

bad_photo=$(curl -sS -w "\n%{http_code}" -X POST \
  "${BASE}/medresas/${admin_medresa}/students" \
  -H "Authorization: Bearer ${admin_token}" \
  -F "fullName=invalid photo probe" \
  -F "dateOfBirth=2011-01-15T00:00:00.000Z" \
  -F "gender=MALE" \
  -F "address=Probe" \
  -F "guardianName=Guardian Probe" \
  -F "guardianPhone=${PROBE_PHONE}" \
  -F "photo=@${TEMP_PDF};type=application/pdf")
http_bad=$(echo "$bad_photo" | tail -n1)
body_bad=$(echo "$bad_photo" | sed '$d')
expect_http "$http_bad" "400" "invalid photo POST"
expect_body_code "$body_bad" "INVALID_PHOTO" "invalid photo POST"
echo "   OK ($http_bad)"

GUARD_PHONE=$(python3 -c "import random; print('+2519%08d' % random.randint(0, 99999999))")
STUDENT_NAME="M05 API Verify $(date +%s)"

echo ""
echo "1. Enroll student (POST medresa students)"

create_out=$(curl -sS -w "\n%{http_code}" -X POST \
  "${BASE}/medresas/${admin_medresa}/students" \
  -H "Authorization: Bearer ${admin_token}" \
  -F "fullName=${STUDENT_NAME}" \
  -F "dateOfBirth=2012-05-01T00:00:00.000Z" \
  -F "gender=FEMALE" \
  -F "address=Aw Bare verification" \
  -F "guardianName=Verify Guardian" \
  -F "guardianPhone=${GUARD_PHONE}")
create_http=$(echo "$create_out" | tail -n1)
create_body=$(echo "$create_out" | sed '$d')
expect_http "$create_http" "201" "create student"
stud_id=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d['data']['id'])" "$create_body")
python3 -c "
import json, sys
d = json.loads(sys.argv[1])['data']
assert 'enrolledAt' in d and d['enrolledAt']
" "$create_body" || {
  echo "ERROR: create student response missing enrolledAt"
  exit 1
}
echo "   OK (${stud_id})"

echo ""
echo "3. List students + pagination"

list_json=$(curl -sf "${BASE}/medresas/${admin_medresa}/students?page=1&limit=5" \
  -H "Authorization: Bearer ${admin_token}")
total=$(json_get "$list_json" "d['data']['pagination']['total']")
if [[ "${total:-0}" -lt 1 ]]; then
  echo "ERROR: list pagination total missing"
  exit 1
fi
echo "   OK total>=1"

echo ""
echo "4. Cross-medresa list (admin02 token on Aw Bare → 403)"

cross=$(curl -sS -w "\n%{http_code}" "${BASE}/medresas/${admin_medresa}/students?page=1&limit=5" \
  -H "Authorization: Bearer ${admin02_token}")
cross_http=$(echo "$cross" | tail -n1)
expect_http "$cross_http" "403" "cross-medresa list"
echo "   OK"

echo ""
echo "5b. Ensure a medresa course without teacher (Islamic Studies — create if missing)"

courses_json=$(curl -sf "${BASE}/medresas/${admin_medresa}/courses" \
  -H "Authorization: Bearer ${admin_token}")
mc_no_teacher=$(echo "$courses_json" | python3 -c "
import json, sys

items = json.load(sys.stdin)['data']['items']
for x in items:
    if x.get('assignedTeacher') is None:
        print(x['medresaCourseId'])
        raise SystemExit(0)
print('')
")

if [[ -z "$mc_no_teacher" ]]; then
  avail=$(curl -sf "${BASE}/medresas/${admin_medresa}/courses/available" \
    -H "Authorization: Bearer ${admin_token}")
  ISLAMIC_MASTER_ID=$(echo "$avail" | python3 -c "
import json, sys

for c in json.load(sys.stdin)['data']['items']:
    name = c.get('name') or {}
    en = (name.get('en') or '') if isinstance(name, dict) else str(name)
    if 'Islamic Studies' in en:
        print(c['id'])
        raise SystemExit(0)
print('')
")
  if [[ -z "$ISLAMIC_MASTER_ID" ]]; then
    echo "ERROR: no unassigned medresa course found and Islamic Studies is not in /courses/available."
    exit 1
  fi
  curl -sf -X POST "${BASE}/medresas/${admin_medresa}/courses" \
    -H "Authorization: Bearer ${admin_token}" \
    -H "Content-Type: application/json" \
    -d "{\"courseId\":\"${ISLAMIC_MASTER_ID}\"}" >/dev/null
  courses_json=$(curl -sf "${BASE}/medresas/${admin_medresa}/courses" \
    -H "Authorization: Bearer ${admin_token}")
  mc_no_teacher=$(echo "$courses_json" | python3 -c "
import json, sys

items = json.load(sys.stdin)['data']['items']
for x in items:
    if x.get('assignedTeacher') is None:
        print(x['medresaCourseId'])
        raise SystemExit(0)
print('')
")
fi

if [[ -z "$mc_no_teacher" ]]; then
  echo "ERROR: no medresa_course without assigned teacher on Aw Bare"
  exit 1
fi

echo ""
echo "6. Assign student to course without teacher (expect COURSE_NO_TEACHER)"

noc=$(curl -sS -w "\n%{http_code}" -X POST "${BASE}/students/${stud_id}/courses" \
  -H "Authorization: Bearer ${admin_token}" \
  -H "Content-Type: application/json" \
  -d "{\"medresaCourseId\":\"${mc_no_teacher}\"}")
noc_http=$(echo "$noc" | tail -n1)
noc_body=$(echo "$noc" | sed '$d')
expect_http "$noc_http" "400" "course no teacher"
expect_body_code "$noc_body" "COURSE_NO_TEACHER" "course no teacher"
echo "   OK"

mc_quran=$(echo "$courses_json" | python3 -c "
import json, sys

items = json.load(sys.stdin)['data']['items']
for x in items:
    name = x.get('name') or {}
    en = (name.get('en') or '') if isinstance(name, dict) else ''
    if 'Quran' in en and x.get('assignedTeacher'):
        print(x['medresaCourseId'])
        raise SystemExit(0)
print('')
")
if [[ -z "$mc_quran" ]]; then
  echo "ERROR: Quran medresa_course with teacher not found"
  exit 1
fi

courses_jugol=$(curl -sf "${BASE}/medresas/${m_jugol}/courses" \
  -H "Authorization: Bearer ${admin02_token}")
mc_foreign=$(echo "$courses_jugol" | python3 -c "
import json, sys

items = json.load(sys.stdin)['data']['items']
for x in items:
    name = x.get('name') or {}
    en = (name.get('en') or '') if isinstance(name, dict) else ''
    if 'Quran' in en and x.get('assignedTeacher'):
        print(x['medresaCourseId'])
        raise SystemExit(0)
print('')
")

echo ""
echo "5. Assign student with assigned teacher → 201"

assign=$(curl -sS -w "\n%{http_code}" -X POST "${BASE}/students/${stud_id}/courses" \
  -H "Authorization: Bearer ${admin_token}" \
  -H "Content-Type: application/json" \
  -d "{\"medresaCourseId\":\"${mc_quran}\"}")
assign_http=$(echo "$assign" | tail -n1)
assign_body=$(echo "$assign" | sed '$d')
expect_http "$assign_http" "201" "assign with teacher"

sc_id=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d['data']['studentCourseId'])" "$assign_body")
echo "   OK (${sc_id})"

echo ""
echo "7. Wrong medresa course (expect 404 MEDRESA_COURSE_NOT_FOUND)"

wrong=$(curl -sS -w "\n%{http_code}" -X POST "${BASE}/students/${stud_id}/courses" \
  -H "Authorization: Bearer ${admin_token}" \
  -H "Content-Type: application/json" \
  -d "{\"medresaCourseId\":\"${mc_foreign}\"}")
wrong_http=$(echo "$wrong" | tail -n1)
wrong_body=$(echo "$wrong" | sed '$d')
expect_http "$wrong_http" "404" "wrong medresa course"
expect_body_code "$wrong_body" "MEDRESA_COURSE_NOT_FOUND" "wrong medresa course"
echo "   OK"

echo ""
echo "9. Teacher detail OK — ustaz06"

t6=$(curl -sS -w "\n%{http_code}" "${BASE}/students/${stud_id}" \
  -H "Authorization: Bearer ${teacher06_token}")
t6_http=$(echo "$t6" | tail -n1)
expect_http "$t6_http" "200" "teacher06 detail"
echo "   OK"

echo ""
echo "10. Teacher foreign student — ustaz07 (403)"

t7=$(curl -sS -w "\n%{http_code}" "${BASE}/students/${stud_id}" \
  -H "Authorization: Bearer ${teacher07_token}")
t7_http=$(echo "$t7" | tail -n1)
expect_http "$t7_http" "403" "teacher07 foreign detail"
echo "   OK"

echo ""
echo "11. Remove enrollment (soft delete)"

rem=$(curl -sS -w "\n%{http_code}" -X DELETE \
  "${BASE}/students/${stud_id}/courses/${sc_id}" \
  -H "Authorization: Bearer ${admin_token}")
rem_http=$(echo "$rem" | tail -n1)
expect_http "$rem_http" "200" "remove enrollment"
echo "   OK"

echo ""
echo "8. Transfer student to Jugol → 200 + transferHistory"

xfer=$(curl -sS -w "\n%{http_code}" -X POST "${BASE}/students/${stud_id}/transfer" \
  -H "Authorization: Bearer ${admin_token}" \
  -H "Content-Type: application/json" \
  -d "{\"toMedresaId\":\"${m_jugol}\",\"transferDate\":\"2024-11-01T00:00:00.000Z\",\"reason\":\"M05 verify transfer\"}")
xfer_http=$(echo "$xfer" | tail -n1)
xfer_body=$(echo "$xfer" | sed '$d')
expect_http "$xfer_http" "200" "transfer"
th_len=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(len(d['data'].get('transferHistory') or []))" "$xfer_body")
if [[ "${th_len:-0}" -lt 1 ]]; then
  echo "ERROR: transfer response missing transferHistory"
  exit 1
fi
echo "   OK"

echo ""
echo "12. Transfer destinations"

dest_json=$(curl -sf "${BASE}/students/transfer-destinations?excludeMedresaId=${m_jugol}" \
  -H "Authorization: Bearer ${admin02_token}")
count_dest=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(len(d['data']['items']))" "$dest_json")
if [[ "${count_dest:-0}" -lt 1 ]]; then
  echo "ERROR: transfer-destinations empty"
  exit 1
fi
echo "   OK (${count_dest} destinations excluding Jugol)"

echo ""
echo "13. Cleanup — transfer verification student back to Aw Bare (Jugol admin)"

xfer_back=$(curl -sS -w "\n%{http_code}" -X POST "${BASE}/students/${stud_id}/transfer" \
  -H "Authorization: Bearer ${admin02_token}" \
  -H "Content-Type: application/json" \
  -d "{\"toMedresaId\":\"${admin_medresa}\",\"transferDate\":\"2024-11-02T00:00:00.000Z\",\"reason\":\"M05 verify cleanup\"}")
xfer_back_http=$(echo "$xfer_back" | tail -n1)
expect_http "$xfer_back_http" "200" "transfer back cleanup"
echo "   OK"

echo ""
echo "=== M05 Student API verification passed ==="
