#!/usr/bin/env bash
set -euo pipefail

# === Load token (works in CI + local + Codespaces) ===
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

# === Configure Git committer (required in CI/Codespaces) ===
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

# === Make Git use your PAT for push (key missing piece) ===
if [ -n "${GITHUB_REPOSITORY:-}" ]; then
  git remote set-url origin "https://x-access-token:${PERSONAL_ACCESS_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
  echo "✓ Git remote authenticated with PAT"
fi

# === Only commit & push if there are actual changes ===
git add .

if git diff --cached --quiet; then
  echo "✓ No changes to commit"
  exit 0
fi

git commit -m "codespace"
git push
echo "✓ Successfully pushed!"
