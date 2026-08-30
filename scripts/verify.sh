#!/usr/bin/env bash
# =============================================================================
# verify.sh — Local mirror of CI merge gates (7/8; gate-wasm excluded)
#
# Usage:
#   npm run verify        # full gate sequence
#   npm run verify:fast   # lockfile + typecheck + lint only
# =============================================================================

set -euo pipefail
cd "$(dirname "$0")/.."

FAST=0
if [[ "${1:-}" == "--fast" ]]; then
  FAST=1
fi

banner() {
  cat <<'BANNER'
=============================================================================
npm run verify — local CI merge gates (7 of 8)

  COVERED: gate-lockfile, gate-typecheck, gate-lint, gate-test,
           gate-smoke, gate-build, gate-size

  SKIPPED: gate-wasm (Emscripten rebuild + git diff public/wasm)
           If you changed cpp/ or public/wasm/, run gate-wasm steps from
           AGENTS.md before pushing.
=============================================================================
BANNER
}

step() {
  local label="$1"
  shift
  local start end elapsed
  start=$(date +%s)
  echo ""
  echo ">>> $label"
  "$@"
  end=$(date +%s)
  elapsed=$((end - start))
  echo "<<< $label (${elapsed}s)"
}

TOTAL_START=$(date +%s)
banner

step "gate-lockfile (check-lockfile)" bash scripts/check-lockfile.sh
step "gate-typecheck (typecheck)" npm run typecheck
step "gate-typecheck (typecheck:tests)" npm run typecheck:tests
step "gate-lint (lint)" npm run lint

if [[ "$FAST" -eq 1 ]]; then
  TOTAL_END=$(date +%s)
  echo ""
  echo "verify:fast complete in $((TOTAL_END - TOTAL_START))s"
  echo "(skipped: test, smoke:dev-transform, build — use npm run verify for full gates)"
  exit 0
fi

step "gate-test (test)" npm run test
step "gate-smoke (smoke:dev-transform)" npm run smoke:dev-transform
step "gate-build + gate-size (build)" env ALLOW_MISSING_EMSDK=1 npm run build

TOTAL_END=$(date +%s)
echo ""
echo "verify: all gates passed in $((TOTAL_END - TOTAL_START))s"
echo "(gate-wasm was not run — see banner above)"
