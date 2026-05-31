#!/usr/bin/env bash
# =============================================================================
# build.sh — Convenience wrapper for the Emscripten build
#
# Usage:
#   ./build.sh          # optimised release build
#   ./build.sh debug    # debug build with sanitizers
#   ./build.sh clean    # clean artifacts
#
# Prerequisites:
#   • Emscripten SDK ≥ 3.1:  https://emscripten.org/docs/getting_started/
#   • Run: source /path/to/emsdk/emsdk_env.sh   (sets up emcc / em++ in PATH)
# =============================================================================

set -euo pipefail
cd "$(dirname "$0")"

EMSDK_ENV=""
for candidate in "${EMSDK_ENV:-}" /content/buil*/emsdk/emsdk_env.sh "$HOME"/emsdk/emsdk_env.sh; do
  if [[ -n "$candidate" && -f "$candidate" ]]; then
    EMSDK_ENV="$candidate"
    break
  fi
done

if [[ -n "$EMSDK_ENV" ]]; then
  # shellcheck source=/dev/null
  source "$EMSDK_ENV"
fi

if ! command -v em++ &>/dev/null; then
  echo "⚠️  Emscripten SDK not found; skipping wasm build."
  exit 0
fi

# ---------------------------------------------------------------------------
# Check Emscripten
# ---------------------------------------------------------------------------
if ! command -v em++ &>/dev/null; then
  echo "❌  em++ not found. Please activate the Emscripten SDK first:"
  echo "    source /path/to/emsdk/emsdk_env.sh"
  exit 1
fi

echo "🔧  em++ $(em++ --version | head -1)"

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------
TARGET="${1:-all}"

case "$TARGET" in
  all|"")
    make all
    ;;
  debug)
    make debug
    ;;
  clean)
    make clean
    ;;
  *)
    echo "Unknown target: $TARGET  (use: all | debug | clean)"
    exit 1
    ;;
esac
