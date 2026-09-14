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

# A local run on a different Node major than CI can pass here and still fail
# there — Node 20 rejects the relaxed-SIMD audio artifact that Node 22 accepts,
# which is exactly how gate-build/gate-wasm went red while `verify` was green.
check_node_major() {
  local ci_major local_major
  ci_major="$(grep -m1 -oE 'node-version: "[0-9]+"' .github/workflows/ci.yml | grep -oE '[0-9]+' || true)"
  local_major="$(node --version | sed 's/^v//' | cut -d. -f1)"
  if [[ -n "$ci_major" && "$ci_major" != "$local_major" ]]; then
    echo ""
    echo "!!! node major mismatch: local v${local_major}, CI node-version ${ci_major}."
    echo "!!! Gates can pass here and still fail in CI. Switch to Node ${ci_major}."
    echo ""
  fi
}

TOTAL_START=$(date +%s)
banner
check_node_major

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
