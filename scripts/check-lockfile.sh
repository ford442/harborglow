#!/usr/bin/env bash
# =============================================================================
# check-lockfile.sh — Fast lockfile integrity check (gate-lockfile mirror)
#
# Mirrors CI gate-lockfile without a cold `npm ci` install:
#   1. npm ci --dry-run  (package.json ↔ package-lock.json sync)
#   2. npm ls three @react-three/fiber @react-three/drei @react-three/rapier
#
# Uses npm 10 semantics when the host npm is ≥ 11 — npm 11 is lenient on
# incomplete lockfiles (see cce01c3 / 0610f3e esbuild@0.28.2 regression).
# CI runs Node 22, which ships npm 10.9.x, so npm 10 is the reference.
# =============================================================================

set -euo pipefail
cd "$(dirname "$0")/.."

NPM_BIN=(npm)
NPM_MAJOR="$(npm --version | cut -d. -f1)"
if [[ "${NPM_MAJOR}" -ge 11 ]]; then
  echo "check-lockfile: host npm is $(npm --version); using npm@10.9.2 for lockfile validation (matches CI Node 20)."
  NPM_BIN=(npx -y npm@10.9.2)
fi

echo "check-lockfile: npm ci --dry-run"
if ! "${NPM_BIN[@]}" ci --dry-run; then
  echo ""
  echo "check-lockfile: package-lock.json is out of sync with package.json."
  echo "  Fix: npm install --package-lock-only"
  echo "  Then commit package-lock.json and re-run npm run verify"
  exit 1
fi

echo "check-lockfile: peer graph (three / R3F)"
"${NPM_BIN[@]}" ls three @react-three/fiber @react-three/drei @react-three/rapier

echo "check-lockfile: OK"
