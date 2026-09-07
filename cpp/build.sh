#!/usr/bin/env bash
# =============================================================================
# build.sh — Convenience wrapper for the Emscripten build
#
# Usage:
#   ./build.sh                         # optimised release build (requires em++)
#   ./build.sh debug                   # debug WASM (DWARF + ASSERTIONS, no ASan)
#   ./build.sh debug-wasm              # same as debug
#   ./build.sh debug-native            # host ASan/UBSan tests
#   ./build.sh clean                   # clean artifacts
#   ./build.sh --allow-missing-emsdk   # skip when em++ is absent (exit 0)
#   ALLOW_MISSING_EMSDK=1 ./build.sh   # same skip via env
#
# Prerequisites:
#   • Emscripten SDK ≥ 3.1:  https://emscripten.org/docs/getting_started/
#   • Run: source /path/to/emsdk/emsdk_env.sh   (sets up emcc / em++ in PATH)
# =============================================================================

set -euo pipefail
cd "$(dirname "$0")"

ALLOW_MISSING=0
TARGET="all"
for arg in "$@"; do
  case "$arg" in
    --allow-missing-emsdk)
      ALLOW_MISSING=1
      ;;
    all|debug|debug-wasm|debug-native|clean)
      TARGET="$arg"
      ;;
    "")
      ;;
    *)
      echo "Unknown argument: $arg  (use: all | debug | debug-wasm | debug-native | clean | --allow-missing-emsdk)"
      exit 1
      ;;
  esac
done

if [[ "${ALLOW_MISSING_EMSDK:-0}" == "1" ]]; then
  ALLOW_MISSING=1
fi

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

if [[ "$TARGET" != "debug-native" && "$TARGET" != "clean" ]] && ! command -v em++ &>/dev/null; then
  if [[ "$ALLOW_MISSING" == "1" ]]; then
    echo "⚠️  Emscripten SDK not found; skipping wasm build (--allow-missing-emsdk)."
    exit 0
  fi
  echo "error: Emscripten SDK not found (em++ is not on PATH)." >&2
  echo "Install emsdk and source emsdk_env.sh, or pass --allow-missing-emsdk / ALLOW_MISSING_EMSDK=1 to skip." >&2
  exit 1
fi

if command -v em++ &>/dev/null; then
  echo "🔧  em++ $(em++ --version | head -1)"
fi

case "$TARGET" in
  all)
    make all \
      CORE_EXPORTED_FUNCTIONS="$(node ../scripts/wasm-exports.mjs --emcc core)" \
      AUDIO_EXPORTED_FUNCTIONS="$(node ../scripts/wasm-exports.mjs --emcc audio)"
    ;;
  debug|debug-wasm)
    make debug-wasm \
      CORE_EXPORTED_FUNCTIONS="$(node ../scripts/wasm-exports.mjs --emcc core)" \
      AUDIO_EXPORTED_FUNCTIONS="$(node ../scripts/wasm-exports.mjs --emcc audio)"
    ;;
  debug-native)
    make debug-native
    ;;
  clean)
    make clean
    ;;
esac

if [[ "$TARGET" == "all" ]]; then
  node ../scripts/write-wasm-manifest.mjs
fi
