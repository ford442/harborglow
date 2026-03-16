#!/usr/bin/env bash
set -euo pipefail
  # 2.5. Colab secret (if running in Colab environment)
  if command -v python3 >/dev/null 2>&1 && python3 -c "import google.colab" 2>/dev/null; then
    TOKEN=$(python3 -c "from google.colab import userdata; print(userdata.get('PERSONAL_ACCESS_TOKEN'))" 2>/dev/null || echo "")
    if [ -n "$TOKEN" ]; then
      echo "✓ Using PERSONAL_ACCESS_TOKEN from Colab secret" >&2
      echo "${TOKEN:0:4}****" >&2
      echo "$TOKEN"
      return
    fi
  fi
git add .
if git diff --cached --quiet; then
  echo "✓ No changes to commit"
  exit 0
fi

git commit -m "codespace"
git push
echo "✅ Successfully pushed!"
