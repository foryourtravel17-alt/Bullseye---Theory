#!/usr/bin/env bash
set -euo pipefail

fail() { echo "::error::$1"; exit 1; }
need() {
  local file="$1" text="$2"
  grep -Fqi -- "$text" "$file" || fail "$file is missing required marker: $text"
}

# Public course pages must never expose a payment route or receiving details.
need payment.html "Manual Course Activation"
need payment.html "does not collect money or transaction details"
for forbidden in "UPI" "QR" "PayPal" "USDT" "TRC20" "wallet address" "payment method" "checkout"; do
  if grep -Eiq -- "$forbidden" payment.html; then
    fail "payment.html exposes a forbidden online payment term: $forbidden"
  fi
done

# Signup and student status must describe administrator-led activation.
need auth.html "activated manually by the administrator"
need dashboard.html "activates course access manually"

# Admin access remains available, but activation must be explicit and owner controlled.
need admin.html "Admin-only course access management"
need admin.html "admin_list_course_students"
need admin.html "admin_set_course_access"
need admin.html "Manual enrollment check confirmed"
need admin.html "independently checked this student's enrollment"
need admin.html "standard 85-day course term"

echo "PASS: public course pages expose no online payment methods; admin-only manual activation controls remain wired."
