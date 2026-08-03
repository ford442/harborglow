#!/usr/bin/env bash
# Compress ship GLBs with Draco via @gltf-transform/cli (npx).
# Uses `draco` only — NOT `optimize` — so Empty_HP_* hardpoints and
# `{shipId}_root` hierarchy survive. Meshopt remains supported at runtime.
#
# Usage:
#   ./scripts/compress-ship-glb.sh                         # all public/models/*.glb
#   ./scripts/compress-ship-glb.sh public/models/foo.glb   # one file (in-place)
#   ./scripts/compress-ship-glb.sh in.glb out.glb          # explicit out path
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

run_compress() {
  local input="$1"
  local output="$2"
  local tmp
  tmp="$(mktemp "${output}.XXXXXX.glb")"

  echo "Compressing $input → $output"
  npx --yes @gltf-transform/cli draco "$input" "$tmp" --method edgebreaker

  mv "$tmp" "$output"
  echo "  $(du -h "$output" | cut -f1)  $output"
}

if [[ $# -eq 0 ]]; then
  shopt -s nullglob
  files=(public/models/*.glb)
  if [[ ${#files[@]} -eq 0 ]]; then
    echo "No GLBs in public/models/"
    exit 0
  fi
  for f in "${files[@]}"; do
    run_compress "$f" "$f"
  done
elif [[ $# -eq 1 ]]; then
  run_compress "$1" "$1"
else
  run_compress "$1" "$2"
fi
