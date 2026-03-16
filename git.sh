#!/usr/bin/env bash
set -euo pipefail

# Works in CI (PERSONAL_ACCESS_TOKEN from workflow) + locally (.env or gh)
get_PERSONAL_ACCESS_TOKEN() {
  if [ -n "${PERSONAL_ACCESS_TOKEN:-}" ]; then
    echo "$PERSONAL_ACCESS_TOKEN"
  elif [ -f .env ]; then
    set -a; source .env; set +a
    echo "${PERSONAL_ACCESS_TOKEN:-}"
  elif command -v gh >/dev/null; then
    gh auth token 2>/dev/null || true
  else
    echo ""
  fi
}

PERSONAL_ACCESS_TOKEN=$(get_PERSONAL_ACCESS_TOKEN)

if [ -z "$PERSONAL_ACCESS_TOKEN" ]; then
  echo "❌ No PERSONAL_ACCESS_TOKEN found (add to workflow env or .env or run gh auth login)" >&2
  exit 1
fi

git add .
git commit -m "codespace"
git push
