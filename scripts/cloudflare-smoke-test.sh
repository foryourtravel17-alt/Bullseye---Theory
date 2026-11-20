#!/usr/bin/env bash
set -euo pipefail

base="${BULLSEYE_SMOKE_TEST_BASE_URL:-https://bullseye-theory.foryourtravel17.workers.dev}"

check_page() {
  local path="$1"
  local expected="$2"
  local body
  body="$(curl --fail --silent --show-error --location --retry 5 --retry-delay 3 --retry-all-errors "$base/$path")"
  if ! grep -Fqi -- "$expected" <<<"$body"; then
    echo "FAIL: smoke test for /$path; expected page marker not found" >&2
    return 1
  fi
  echo "PASS /$path"
}

echo "== Bullseye Theory post-deploy smoke tests: $base =="
check_page "index.html" "READ THE MARKET"
check_page "auth.html" "Student Login"
check_page "dashboard.html" "Student Dashboard"
check_page "admin.html" "BULLSEYE THEORY — ADMIN"
check_page "payment.html" "Manual Course Activation"
check_page "terms.html" "Terms of Use"
check_page "refund.html" "Refund Information"
check_page "membership.html" "ENROLLMENT CLOSED"
echo "PASS: all 8 public page smoke tests."
