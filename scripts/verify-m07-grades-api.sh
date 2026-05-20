#!/usr/bin/env bash
# M07 grades API smoke tests (docs/m07-grades-api-tests.md).
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
BASE="${API_URL}/api/v1"
DEV_PASSWORD="${DEV_PASSWORD:-Teacher@12345}"
SUPER_ADMIN_EMAIL="${SUPER_ADMIN_EMAIL:-sefinaalnejah@gmail.com}"
SUPER_ADMIN_PASSWORD="${SUPER_ADMIN_PASSWORD:-Admin@12345}"

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

assert_code() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  local body_file="${4:-}"
  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL: ${label} expected HTTP ${expected}, got ${actual}"
    [[ -n "$body_file" && -f "$body_file" ]] && cat "$body_file"
    exit 1
  fi
  echo "   ${label} -> ${actual} OK"
}

echo "== M07 grades API verify =="

ADMIN_JSON=$(login "$SUPER_ADMIN_EMAIL" "$SUPER_ADMIN_PASSWORD")
ADMIN_TOKEN=$(json_get "$ADMIN_JSON" "d['data']['accessToken']")

TEACHER_JSON=$(login "ustaz06@sefinet.dev")
TEACHER_TOKEN=$(json_get "$TEACHER_JSON" "d['data']['accessToken']")
MEDRESA_ID=$(json_get "$TEACHER_JSON" "d['data']['user']['medresaRoles'][0]['medresaId']")

echo "1) List exam types"
ET_JSON=$(curl -sf "${BASE}/exam-types" -H "Authorization: Bearer ${ADMIN_TOKEN}")
EXAM_TYPE_ID=$(json_get "$ET_JSON" "d['data']['items'][0]['id']")
echo "   examTypeId=${EXAM_TYPE_ID}"

echo "2) Negative: invalid weight sum on POST exam type"
BAD_WEIGHT_CODE=$(curl -s -o /tmp/m07_bad_weight.json -w "%{http_code}" -X POST "${BASE}/exam-types" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":{"en":"Verify Bad Weight"},"maxScore":100,"weight":50,"status":"ACTIVE"}')
assert_code "POST exam-types (weight breaks 100% rule)" "400" "$BAD_WEIGHT_CODE" /tmp/m07_bad_weight.json

echo "3) Teacher my-courses"
COURSES_JSON=$(curl -sf "${BASE}/grades/my-courses" -H "Authorization: Bearer ${TEACHER_TOKEN}")
MC_ID=$(json_get "$COURSES_JSON" "d['data']['items'][0]['medresaCourseId']")
echo "   medresaCourseId=${MC_ID}"

echo "4) Grade roster"
ROSTER_JSON=$(curl -sf "${BASE}/grades/roster?medresaCourseId=${MC_ID}&examTypeId=${EXAM_TYPE_ID}" \
  -H "Authorization: Bearer ${TEACHER_TOKEN}")
STUDENT_ID=$(json_get "$ROSTER_JSON" "d['data']['items'][0]['studentId']")
echo "   studentId=${STUDENT_ID}"

echo "5) Negative: score above max_score on batch"
OVER_CODE=$(curl -s -o /tmp/m07_over.json -w "%{http_code}" -X POST "${BASE}/grades/batch" \
  -H "Authorization: Bearer ${TEACHER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"medresaCourseId":"%s","examTypeId":"%s","grades":[{"studentId":"%s","numericScore":9999}]}' \
    "$MC_ID" "$EXAM_TYPE_ID" "$STUDENT_ID")")
assert_code "POST /grades/batch (score > max)" "400" "$OVER_CODE" /tmp/m07_over.json

echo "6) Negative: teacher roster on unassigned course"
FAKE_MC="00000000-0000-4000-8000-000000000099"
UNASSIGNED_CODE=$(curl -s -o /tmp/m07_unassigned.json -w "%{http_code}" \
  "${BASE}/grades/roster?medresaCourseId=${FAKE_MC}&examTypeId=${EXAM_TYPE_ID}" \
  -H "Authorization: Bearer ${TEACHER_TOKEN}")
assert_code "GET /grades/roster (unassigned)" "403" "$UNASSIGNED_CODE" /tmp/m07_unassigned.json

echo "7) Batch submit grade (may 409 if already exists)"
BATCH_CODE=$(curl -s -o /tmp/m07_batch.json -w "%{http_code}" -X POST "${BASE}/grades/batch" \
  -H "Authorization: Bearer ${TEACHER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"medresaCourseId":"%s","examTypeId":"%s","grades":[{"studentId":"%s","numericScore":88}]}' \
    "$MC_ID" "$EXAM_TYPE_ID" "$STUDENT_ID")")
echo "   POST /grades/batch -> ${BATCH_CODE}"
if [[ "$BATCH_CODE" != "201" && "$BATCH_CODE" != "409" ]]; then
  cat /tmp/m07_batch.json
  exit 1
fi

if [[ "$BATCH_CODE" == "201" ]]; then
  GRADE_ID=$(json_get "$(cat /tmp/m07_batch.json)" "d['data']['created'][0]['id']")
  echo "8) Edit request"
  ER_CODE=$(curl -s -o /tmp/m07_edit.json -w "%{http_code}" -X POST "${BASE}/grades/${GRADE_ID}/edit-requests" \
    -H "Authorization: Bearer ${TEACHER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"requestedScore":90,"reason":"Data entry error"}')
  assert_code "POST edit-request" "201" "$ER_CODE" /tmp/m07_edit.json
  REQ_ID=$(json_get "$(cat /tmp/m07_edit.json)" "d['data']['id']")

  AMIR_JSON=$(login "admin01@sefinet.dev")
  AMIR_TOKEN=$(json_get "$AMIR_JSON" "d['data']['accessToken']")
  echo "9) Approve edit"
  AP_CODE=$(curl -s -o /tmp/m07_ap.json -w "%{http_code}" -X PATCH "${BASE}/grade-edit-requests/${REQ_ID}/approve" \
    -H "Authorization: Bearer ${AMIR_TOKEN}")
  assert_code "PATCH approve" "200" "$AP_CODE" /tmp/m07_ap.json

  echo "10) Negative: reject without rejectionReason"
  ER2_CODE=$(curl -s -o /tmp/m07_edit2.json -w "%{http_code}" -X POST "${BASE}/grades/${GRADE_ID}/edit-requests" \
    -H "Authorization: Bearer ${TEACHER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"requestedScore":91,"reason":"Second request for reject test"}')
  if [[ "$ER2_CODE" == "201" ]]; then
    REQ2_ID=$(json_get "$(cat /tmp/m07_edit2.json)" "d['data']['id']")
    REJ_CODE=$(curl -s -o /tmp/m07_rej.json -w "%{http_code}" -X PATCH "${BASE}/grade-edit-requests/${REQ2_ID}/reject" \
      -H "Authorization: Bearer ${AMIR_TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{}')
    assert_code "PATCH reject (missing reason)" "422" "$REJ_CODE" /tmp/m07_rej.json
  else
    echo "   Skipped reject-without-reason (second edit request -> ${ER2_CODE})"
  fi
else
  echo "8–10) Skipped edit flow (grade already exists)"
fi

echo "11) Amir grade-edit-requests for other medresa -> 403"
AMIR_JSON=$(login "admin01@sefinet.dev")
AMIR_TOKEN=$(json_get "$AMIR_JSON" "d['data']['accessToken']")
OTHER_JSON=$(login "admin02@sefinet.dev")
OTHER_MEDRESA=$(json_get "$OTHER_JSON" "d['data']['user']['medresaRoles'][0]['medresaId']")
CROSS_CODE=$(curl -s -o /tmp/m07_cross.json -w "%{http_code}" \
  "${BASE}/grade-edit-requests?status=PENDING&medresaId=${OTHER_MEDRESA}" \
  -H "Authorization: Bearer ${AMIR_TOKEN}")
assert_code "GET grade-edit-requests (other medresa)" "403" "$CROSS_CODE" /tmp/m07_cross.json

echo "12) Student results"
curl -sf "${BASE}/students/${STUDENT_ID}/results" -H "Authorization: Bearer ${TEACHER_TOKEN}" >/dev/null
echo "   GET student results OK"

echo "13) Course results"
curl -sf "${BASE}/medresa-courses/${MC_ID}/results" -H "Authorization: Bearer ${TEACHER_TOKEN}" >/dev/null
echo "   GET course results OK"

echo "14) Medresa overview (includes assignedTeacher)"
OVERVIEW_JSON=$(curl -sf "${BASE}/medresas/${MEDRESA_ID}/results/overview" -H "Authorization: Bearer ${AMIR_TOKEN}")
python3 -c "import json,sys; d=json.loads(sys.argv[1]); c=d['data']['courses']; assert len(c)==0 or 'assignedTeacher' in c[0]" "$OVERVIEW_JSON"
echo "   GET medresa overview OK"

echo "15) Network overview"
curl -sf "${BASE}/results/network-overview" -H "Authorization: Bearer ${ADMIN_TOKEN}" >/dev/null
echo "   GET network overview OK"

echo ""
echo "M07 grades API verify passed."
