#!/usr/bin/env bash
# Compress ship GLBs with meshopt via @gltf-transform/cli (npx).
#
# Meshopt — NOT Draco. The Draco decoder is only distributable as a separately
# hosted WASM bundle, so a Draco GLB would need a third-party CDN at runtime;
# the meshopt decoder ships inside three. `npm run models:verify` fails the
# build on any committed `KHR_draco_mesh_compression` asset.
#
# Uses `meshopt` only — NOT `optimize` — so Empty_HP_* hardpoints and
# `{shipId}_root` hierarchy survive.
#
# NOTE: this reaches the network via npx. Keep it out of CI gates — the
# verifier is deliberately dependency-free.
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
  npx --yes @gltf-transform/cli meshopt "$input" "$tmp"

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
