#!/usr/bin/env bash
# M10 reports & dashboard API smoke tests (docs/m10-reports-api-tests.md).
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

read -r ET_MONTH ET_YEAR <<< "$(python3 <<'PY'
def start_day_of_ethiopian(year):
    new_year_day = year // 100 - year // 400 - 4
    return new_year_day + 1 if (year - 1) % 4 == 3 else new_year_day

def to_ethiopian(year, month, day):
    gregorian_months = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    ethiopian_months = [0, 30, 30, 30, 30, 30, 30, 30, 30, 30, 5, 30, 30, 30, 30]
    if (year % 4 == 0 and year % 100 != 0) or year % 400 == 0:
        gregorian_months[2] = 29
    ethiopian_year = year - 8
    if ethiopian_year % 4 == 3:
        ethiopian_months[10] = 6
    new_year_day = start_day_of_ethiopian(ethiopian_year)
    until = sum(gregorian_months[1:month]) + day
    tahissas = 26 if ethiopian_year % 4 == 0 else 25
    if year < 1582:
        ethiopian_months[1] = 0
        ethiopian_months[2] = tahissas
    elif until <= 277 and year == 1582:
        ethiopian_months[1] = 0
        ethiopian_months[2] = tahissas
    else:
        tahissas = new_year_day - 3
        ethiopian_months[1] = tahissas
    m = 1
    ethiopian_date = 1
    for m in range(1, len(ethiopian_months)):
        em = ethiopian_months[m]
        if until <= em:
            ethiopian_date = until + (30 - tahissas) if m == 1 or em == 0 else until
            break
        until -= em
    if m > 10:
        ethiopian_year += 1
    order = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4]
    return order[m], ethiopian_year, ethiopian_date

from datetime import datetime
try:
    from zoneinfo import ZoneInfo
    now = datetime.now(ZoneInfo("Africa/Addis_Ababa"))
except Exception:
    now = datetime.utcnow()
emo, ey, _ = to_ethiopian(now.year, now.month, now.day)
print(emo, ey)
PY
)"

RANGE="fromMonth=${ET_MONTH}&fromYear=${ET_YEAR}&toMonth=${ET_MONTH}&toYear=${ET_YEAR}"

echo "== M10 reports API verify =="

ADMIN_JSON=$(login "$SUPER_ADMIN_EMAIL" "$SUPER_ADMIN_PASSWORD")
ADMIN_TOKEN=$(json_get "$ADMIN_JSON" "d['data']['accessToken']")

TEACHER_JSON=$(login "ustaz06@sefinet.dev")
TEACHER_TOKEN=$(json_get "$TEACHER_JSON" "d['data']['accessToken']")

AMIR_JSON=$(login "admin01@sefinet.dev")
AMIR_TOKEN=$(json_get "$AMIR_JSON" "d['data']['accessToken']")
MEDRESA_ID=$(json_get "$AMIR_JSON" "d['data']['user']['medresaRoles'][0]['medresaId']")

OTHER_JSON=$(login "admin02@sefinet.dev")
OTHER_MEDRESA=$(json_get "$OTHER_JSON" "d['data']['user']['medresaRoles'][0]['medresaId']")

echo "1) Teacher dashboard"
T_DASH=$(curl -s -o /tmp/m10_t_dash.json -w "%{http_code}" \
  "${BASE}/dashboard/teacher" -H "Authorization: Bearer ${TEACHER_TOKEN}")
assert_code "GET dashboard/teacher" "200" "$T_DASH" /tmp/m10_t_dash.json

echo "2) Amir medresa dashboard"
A_DASH=$(curl -s -o /tmp/m10_a_dash.json -w "%{http_code}" \
  "${BASE}/dashboard/medresa?medresaId=${MEDRESA_ID}" -H "Authorization: Bearer ${AMIR_TOKEN}")
assert_code "GET dashboard/medresa" "200" "$A_DASH" /tmp/m10_a_dash.json

echo "3) Super Admin dashboard"
SA_DASH=$(curl -s -o /tmp/m10_sa_dash.json -w "%{http_code}" \
  "${BASE}/dashboard/super-admin" -H "Authorization: Bearer ${ADMIN_TOKEN}")
assert_code "GET dashboard/super-admin" "200" "$SA_DASH" /tmp/m10_sa_dash.json

echo "4) Teacher blocked from salary report"
T_SAL=$(curl -s -o /tmp/m10_t_sal.json -w "%{http_code}" \
  "${BASE}/reports/salary?${RANGE}" -H "Authorization: Bearer ${TEACHER_TOKEN}")
assert_code "GET reports/salary (teacher)" "403" "$T_SAL" /tmp/m10_t_sal.json

echo "5) Amir blocked from salary report"
A_SAL=$(curl -s -o /tmp/m10_a_sal.json -w "%{http_code}" \
  "${BASE}/reports/salary?${RANGE}" -H "Authorization: Bearer ${AMIR_TOKEN}")
assert_code "GET reports/salary (amir)" "403" "$A_SAL" /tmp/m10_a_sal.json

echo "6) Super Admin salary report"
SA_SAL=$(curl -s -o /tmp/m10_sa_sal.json -w "%{http_code}" \
  "${BASE}/reports/salary?${RANGE}" -H "Authorization: Bearer ${ADMIN_TOKEN}")
assert_code "GET reports/salary (SA)" "200" "$SA_SAL" /tmp/m10_sa_sal.json

echo "7) Amir enrollment report"
A_ENR=$(curl -s -o /tmp/m10_a_enr.json -w "%{http_code}" \
  "${BASE}/reports/enrollment?${RANGE}&medresaId=${MEDRESA_ID}" \
  -H "Authorization: Bearer ${AMIR_TOKEN}")
assert_code "GET reports/enrollment" "200" "$A_ENR" /tmp/m10_a_enr.json

echo "8) Teacher blocked from enrollment"
T_ENR=$(curl -s -o /tmp/m10_t_enr.json -w "%{http_code}" \
  "${BASE}/reports/enrollment?${RANGE}" -H "Authorization: Bearer ${TEACHER_TOKEN}")
assert_code "GET reports/enrollment (teacher)" "403" "$T_ENR" /tmp/m10_t_enr.json

echo "9) Amir cross-medresa fees -> 403"
A_FEE_CROSS=$(curl -s -o /tmp/m10_fee_cross.json -w "%{http_code}" \
  "${BASE}/reports/fees?${RANGE}&medresaId=${OTHER_MEDRESA}" \
  -H "Authorization: Bearer ${AMIR_TOKEN}")
assert_code "GET reports/fees (other medresa)" "403" "$A_FEE_CROSS" /tmp/m10_fee_cross.json

echo "10) Teacher attendance report"
T_ATT=$(curl -s -o /tmp/m10_t_att.json -w "%{http_code}" \
  "${BASE}/reports/attendance?${RANGE}" -H "Authorization: Bearer ${TEACHER_TOKEN}")
assert_code "GET reports/attendance (teacher)" "200" "$T_ATT" /tmp/m10_t_att.json

echo "11) Grades report (Amir)"
A_GR=$(curl -s -o /tmp/m10_a_gr.json -w "%{http_code}" \
  "${BASE}/reports/grades?${RANGE}&medresaId=${MEDRESA_ID}" \
  -H "Authorization: Bearer ${AMIR_TOKEN}")
assert_code "GET reports/grades" "200" "$A_GR" /tmp/m10_a_gr.json

echo "12) SA dashboard has no salary leak to teacher (teacher dashboard JSON)"
python3 <<'PY'
import json
with open("/tmp/m10_t_dash.json") as f:
    d = json.load(f)["data"]
assert "salaryDisbursed" not in d and "unpaidTeachers" not in d
print("   teacher dashboard has no salary fields OK")
PY

echo ""
echo "M10 reports API verify passed."
