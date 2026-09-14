#!/usr/bin/env bash
# =============================================================================
# setup-pre-push-hook.sh — Opt-in pre-push hook (not committed to .git/hooks/)
#
# Installs scripts/pre-push.hook → .git/hooks/pre-push
# Skip once:  git push --no-verify
# Remove:     rm "$(git rev-parse --git-dir)/hooks/pre-push"
# =============================================================================

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GIT_DIR="$(git -C "$ROOT" rev-parse --git-dir)"
HOOK="${GIT_DIR}/hooks/pre-push"
TEMPLATE="${ROOT}/scripts/pre-push.hook"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "setup-pre-push-hook: missing template at $TEMPLATE" >&2
  exit 1
fi

mkdir -p "${GIT_DIR}/hooks"
cp "$TEMPLATE" "$HOOK"
chmod +x "$HOOK"

cat <<OUT
Pre-push hook installed: $HOOK
  Runs: npm run verify (7/8 CI gates; gate-wasm excluded)

Skip once:  git push --no-verify
Remove:      rm "$HOOK"
OUT
