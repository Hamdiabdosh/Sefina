#!/usr/bin/env bash
# M09 salaries API smoke tests (docs/m09-salaries-api-tests.md).
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

echo "== M09 salaries API verify =="

ADMIN_JSON=$(login "$SUPER_ADMIN_EMAIL" "$SUPER_ADMIN_PASSWORD")
ADMIN_TOKEN=$(json_get "$ADMIN_JSON" "d['data']['accessToken']")

TEACHER_JSON=$(login "ustaz06@sefinet.dev")
TEACHER_TOKEN=$(json_get "$TEACHER_JSON" "d['data']['accessToken']")

AMIR_JSON=$(login "admin01@sefinet.dev")
AMIR_TOKEN=$(json_get "$AMIR_JSON" "d['data']['accessToken']")

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

echo "1) Teacher blocked from salary ranks"
T_CODE=$(curl -s -o /tmp/m09_t_ranks.json -w "%{http_code}" \
  "${BASE}/salary-ranks" -H "Authorization: Bearer ${TEACHER_TOKEN}")
assert_code "GET salary-ranks (teacher)" "403" "$T_CODE" /tmp/m09_t_ranks.json

echo "2) Amir blocked from salary payments"
A_CODE=$(curl -s -o /tmp/m09_a_pay.json -w "%{http_code}" \
  "${BASE}/salary-payments?month=${ET_MONTH}&year=${ET_YEAR}&status=ALL" \
  -H "Authorization: Bearer ${AMIR_TOKEN}")
assert_code "GET salary-payments (amir)" "403" "$A_CODE" /tmp/m09_a_pay.json

echo "3) Super Admin create salary rank"
RANK_CODE=$(curl -s -o /tmp/m09_rank.json -w "%{http_code}" -X POST "${BASE}/salary-ranks" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":{"en":"Verify Rank M09"},"monthlyAmountEtb":3000,"effectiveFrom":"2026-05-01"}')
assert_code "POST salary-ranks" "201" "$RANK_CODE" /tmp/m09_rank.json
RANK_ID=$(json_get "$(cat /tmp/m09_rank.json)" "d['data']['id']")

echo "4) Pick unpaid teacher from payment list"
LIST_JSON=$(curl -sf "${BASE}/salary-payments?month=${ET_MONTH}&year=${ET_YEAR}&status=UNPAID" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")
TEACHER_ID=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); items=d.get('data',{}).get('items',[]); print(next((i['teacherId'] for i in items if i.get('status')=='UNPAID'), '') or (items[0]['teacherId'] if items else ''))" "$LIST_JSON")
if [[ -z "$TEACHER_ID" ]]; then
  TEACHERS_JSON=$(curl -sf "${BASE}/teachers?search=ustaz10&limit=1" -H "Authorization: Bearer ${ADMIN_TOKEN}")
  TEACHER_ID=$(json_get "$TEACHERS_JSON" "d['data']['items'][0]['id']")
fi
echo "   teacherId=${TEACHER_ID}"

echo "5) Assign rank to teacher"
ASSIGN_CODE=$(curl -s -o /tmp/m09_assign.json -w "%{http_code}" -X POST "${BASE}/teachers/${TEACHER_ID}/rank" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"salaryRankId":"%s","effectiveFrom":"2026-05-01"}' "$RANK_ID")")
assert_code "POST teachers rank" "201" "$ASSIGN_CODE" /tmp/m09_assign.json

echo "6) Payment without bank reference -> 422"
NO_REF_CODE=$(curl -s -o /tmp/m09_noref.json -w "%{http_code}" -X POST "${BASE}/salary-payments" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"teacherId":"%s","month":%s,"year":%s,"amountPaidEtb":3000,"bankReference":"","paymentDate":"2026-05-01"}' \
    "$TEACHER_ID" "$ET_MONTH" "$ET_YEAR")")
assert_code "POST payment (no bank ref)" "422" "$NO_REF_CODE" /tmp/m09_noref.json

echo "7) Future payment date -> 400"
FUTURE_CODE=$(curl -s -o /tmp/m09_future.json -w "%{http_code}" -X POST "${BASE}/salary-payments" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"teacherId":"%s","month":%s,"year":%s,"amountPaidEtb":3000,"bankReference":"REF-FUTURE","paymentDate":"2099-12-31"}' \
    "$TEACHER_ID" "$ET_MONTH" "$ET_YEAR")")
assert_code "POST payment (future date)" "400" "$FUTURE_CODE" /tmp/m09_future.json

echo "8) Record salary payment"
PAY_CODE=$(curl -s -o /tmp/m09_pay.json -w "%{http_code}" -X POST "${BASE}/salary-payments" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"teacherId":"%s","month":%s,"year":%s,"amountPaidEtb":3000,"bankReference":"VERIFY-M09-001","paymentDate":"2026-05-01","note":"verify-m09"}' \
    "$TEACHER_ID" "$ET_MONTH" "$ET_YEAR")")
assert_code "POST salary-payments" "201" "$PAY_CODE" /tmp/m09_pay.json

echo "9) Duplicate payment -> 409"
DUP_CODE=$(curl -s -o /tmp/m09_dup.json -w "%{http_code}" -X POST "${BASE}/salary-payments" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"teacherId":"%s","month":%s,"year":%s,"amountPaidEtb":3000,"bankReference":"VERIFY-M09-DUP","paymentDate":"2026-05-01"}' \
    "$TEACHER_ID" "$ET_MONTH" "$ET_YEAR")")
assert_code "POST duplicate payment" "409" "$DUP_CODE" /tmp/m09_dup.json

echo "10) Network overview"
curl -sf "${BASE}/salaries/network-overview?fromMonth=${ET_MONTH}&fromYear=${ET_YEAR}&toMonth=${ET_MONTH}&toYear=${ET_YEAR}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" >/dev/null
echo "   GET network overview OK"

echo ""
echo "M09 salaries API verify passed."
