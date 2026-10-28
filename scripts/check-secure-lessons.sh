#!/usr/bin/env bash
set -euo pipefail

for n in $(seq 1 11); do
  file="lesson-${n}.html"
  grep -q "lesson-secure-client.js\\" data-lesson-number=\\"$n\\"" "$file" || {
    echo "FAIL: $file does not load the shared secure client for lesson $n"; exit 1;
  }
  if grep -Eq 'const[[:space:]]+answers[[:space:]]*=|\bans[[:space:]]*=' "$file"; then
    echo "FAIL: browser-side answer key remains in $file"; exit 1
  fi
  if grep -Eq 'from\(["\x27]quiz_attempts["\x27]\)\.insert|from\(["\x27]lesson_progress["\x27]\)\.upsert' "$file"; then
    echo "FAIL: direct student write remains in $file"; exit 1
  fi
done
echo "PASS: all 11 lessons use the shared server-grading client with no inline answer keys/direct writes."
