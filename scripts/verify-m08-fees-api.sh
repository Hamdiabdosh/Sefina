#!/usr/bin/env bash
# M08 fees API smoke tests (docs/m08-fees-api-tests.md).
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

echo "== M08 fees API verify =="

ADMIN_JSON=$(login "$SUPER_ADMIN_EMAIL" "$SUPER_ADMIN_PASSWORD")
ADMIN_TOKEN=$(json_get "$ADMIN_JSON" "d['data']['accessToken']")

TEACHER_JSON=$(login "ustaz06@sefinet.dev")
TEACHER_TOKEN=$(json_get "$TEACHER_JSON" "d['data']['accessToken']")

AMIR_JSON=$(login "admin01@sefinet.dev")
AMIR_TOKEN=$(json_get "$AMIR_JSON" "d['data']['accessToken']")
MEDRESA_ID=$(json_get "$AMIR_JSON" "d['data']['user']['medresaRoles'][0]['medresaId']")

OTHER_JSON=$(login "admin02@sefinet.dev")
OTHER_MEDRESA=$(json_get "$OTHER_JSON" "d['data']['user']['medresaRoles'][0]['medresaId']")

# Ethiopian month/year for "today" (mirrors backend/src/lib/ethiopian-calendar.ts)
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
if [[ -z "${ET_MONTH}" || -z "${ET_YEAR}" ]]; then
  echo "FAIL: could not resolve Ethiopian month/year for today"
  exit 1
fi

echo "1) Teacher blocked from fee structures"
T_CODE=$(curl -s -o /tmp/m08_t_struct.json -w "%{http_code}" \
  "${BASE}/fee-structures/active" -H "Authorization: Bearer ${TEACHER_TOKEN}")
assert_code "GET fee-structures/active (teacher)" "403" "$T_CODE" /tmp/m08_t_struct.json

echo "2) Amir fee collection"
COLL_CODE=$(curl -s -o /tmp/m08_coll.json -w "%{http_code}" \
  "${BASE}/medresas/${MEDRESA_ID}/fees/collection?month=${ET_MONTH}&year=${ET_YEAR}&status=ALL" \
  -H "Authorization: Bearer ${AMIR_TOKEN}")
assert_code "GET fees/collection (own medresa)" "200" "$COLL_CODE" /tmp/m08_coll.json
COLL_JSON=$(cat /tmp/m08_coll.json)
STUDENT_ID=$(json_get "$COLL_JSON" "d['data']['items'][0]['studentId']")
echo "   studentId=${STUDENT_ID} month=${ET_MONTH} year=${ET_YEAR}"

echo "3) Amir cross-medresa collection -> 403"
CROSS_CODE=$(curl -s -o /tmp/m08_cross.json -w "%{http_code}" \
  "${BASE}/medresas/${OTHER_MEDRESA}/fees/collection?month=${ET_MONTH}&year=${ET_YEAR}&status=ALL" \
  -H "Authorization: Bearer ${AMIR_TOKEN}")
assert_code "GET collection (other medresa)" "403" "$CROSS_CODE" /tmp/m08_cross.json

echo "4) Bank transfer without reference -> 400"
BANK_CODE=$(curl -s -o /tmp/m08_bank.json -w "%{http_code}" -X POST "${BASE}/fee-payments" \
  -H "Authorization: Bearer ${AMIR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"studentId":"%s","medresaId":"%s","month":%s,"year":%s,"amountPaidEtb":10,"paymentMethod":"BANK_TRANSFER","paymentDate":"2026-05-01"}' \
    "$STUDENT_ID" "$MEDRESA_ID" "$ET_MONTH" "$ET_YEAR")")
assert_code "POST payment (no bank ref)" "400" "$BANK_CODE" /tmp/m08_bank.json

echo "5) Future payment date -> 400"
FUTURE_CODE=$(curl -s -o /tmp/m08_future.json -w "%{http_code}" -X POST "${BASE}/fee-payments" \
  -H "Authorization: Bearer ${AMIR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"studentId":"%s","medresaId":"%s","month":%s,"year":%s,"amountPaidEtb":10,"paymentMethod":"CASH","paymentDate":"2099-12-31"}' \
    "$STUDENT_ID" "$MEDRESA_ID" "$ET_MONTH" "$ET_YEAR")")
assert_code "POST payment (future date)" "400" "$FUTURE_CODE" /tmp/m08_future.json

echo "6) Record partial payment"
PAY_CODE=$(curl -s -o /tmp/m08_pay.json -w "%{http_code}" -X POST "${BASE}/fee-payments" \
  -H "Authorization: Bearer ${AMIR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"studentId":"%s","medresaId":"%s","month":%s,"year":%s,"amountPaidEtb":25,"paymentMethod":"CASH","paymentDate":"2026-05-01","note":"verify-m08"}' \
    "$STUDENT_ID" "$MEDRESA_ID" "$ET_MONTH" "$ET_YEAR")")
echo "   POST payment -> ${PAY_CODE}"
if [[ "$PAY_CODE" != "201" ]]; then
  cat /tmp/m08_pay.json
  exit 1
fi
PAY_ID=$(json_get "$(cat /tmp/m08_pay.json)" "d['data']['id']")

echo "7) Super Admin POST new fee structure"
NEW_CODE=$(curl -s -o /tmp/m08_newfs.json -w "%{http_code}" -X POST "${BASE}/fee-structures" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"monthlyAmountEtb":550,"effectiveFrom":"2026-05-15"}')
assert_code "POST fee-structures" "201" "$NEW_CODE" /tmp/m08_newfs.json

echo "8) Super Admin void payment"
VOID_CODE=$(curl -s -o /tmp/m08_void.json -w "%{http_code}" -X PATCH "${BASE}/fee-payments/${PAY_ID}/void" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"reason":"verify void"}')
assert_code "PATCH void payment" "200" "$VOID_CODE" /tmp/m08_void.json

echo "9) Network overview"
curl -sf "${BASE}/fees/network-overview?fromMonth=${ET_MONTH}&fromYear=${ET_YEAR}&toMonth=${ET_MONTH}&toYear=${ET_YEAR}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" >/dev/null
echo "   GET network overview OK"

echo ""
echo "M08 fees API verify passed."
