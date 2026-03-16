#!/usr/bin/env bash
set -euo pipefail

# === SMART TOKEN LOADER (works everywhere) ===
get_github_token() {
  echo "=== GitHub Token Debug ===" >&2

  # 1. Built-in (Codespaces / Actions) — most secure
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    echo "✓ Using built-in GITHUB_TOKEN (Codespaces)" >&2
    echo "${GITHUB_TOKEN:0:4}****" >&2
    echo "$GITHUB_TOKEN"
    return
  fi

  # 2. Your existing secret (Colab / Kimi Claw / Codespaces secret / .env)
  if [ -n "${PERSONAL_ACCESS_TOKEN:-}" ]; then
    echo "✓ Using PERSONAL_ACCESS_TOKEN (your secret)" >&2
    echo "${PERSONAL_ACCESS_TOKEN:0:4}****" >&2
    echo "$PERSONAL_ACCESS_TOKEN"
    return
  fi

  # 3. GitHub CLI (local)
  if command -v gh >/dev/null 2>&1; then
    TOKEN=$(gh auth token 2>/dev/null || echo "")
    if [ -n "$TOKEN" ]; then
      echo "✓ Using token from gh CLI" >&2
      echo "$TOKEN"
      return
    fi
  fi

  # 4. .env file (works on any platform)
  if [ -f .env ]; then
    echo ".env found — loading..." >&2
    set -a; source .env; set +a
    if [ -n "${PERSONAL_ACCESS_TOKEN:-}" ]; then
      echo "✓ Loaded PERSONAL_ACCESS_TOKEN from .env" >&2
      echo "${PERSONAL_ACCESS_TOKEN:0:4}****" >&2
      echo "$PERSONAL_ACCESS_TOKEN"
      return
    elif [ -n "${GITHUB_TOKEN:-}" ]; then
      echo "✓ Loaded GITHUB_TOKEN from .env" >&2
      echo "${GITHUB_TOKEN:0:4}****" >&2
      echo "$GITHUB_TOKEN"
      return
    fi
  fi

  echo "✗ No token found" >&2
  echo ""
}

TOKEN=$(get_github_token)

if [ -z "$TOKEN" ]; then
  cat <<EOF >&2
  ❌ No token found!

EOF
  exit 1
fi

# Use the token from here on (works for git push, curl, etc.)
GITHUB_TOKEN="$TOKEN"   # normalize name for the rest of the script

# === Auto-configure Git remote + committer ===
if git remote get-url origin &>/dev/null; then
  ORIGINAL_URL=$(git remote get-url origin)
  if [[ $ORIGINAL_URL == https://github.com/* ]]; then
    git remote set-url origin "https://x-access-token:${GITHUB_TOKEN}@${ORIGINAL_URL#https://}"
    echo "✓ Git remote authenticated" >&2
  fi
fi

git config user.name "${GIT_COMMITTER_NAME:-github-actions[bot]}"
git config user.email "${GIT_COMMITTER_EMAIL:-41898282+github-actions[bot]@users.noreply.github.com}"

git add .
if git diff --cached --quiet; then
  echo "✓ No changes to commit"
  exit 0
fi

git commit -m "codespace"
git push
echo "✅ Successfully pushed!"
