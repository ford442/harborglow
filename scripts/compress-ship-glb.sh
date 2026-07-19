#!/usr/bin/env bash
# Optional Draco compression for ship GLBs (requires @gltf-transform/cli).
# Usage: ./scripts/compress-ship-glb.sh [input.glb] [output.glb]
set -euo pipefail

INPUT="${1:-public/models/cruise_liner.glb}"
OUTPUT="${2:-${INPUT%.glb}.draco.glb}"

if ! command -v gltf-transform >/dev/null 2>&1; then
  echo "gltf-transform not installed. Run: npm i -g @gltf-transform/cli"
  echo "Skipping compression — using uncompressed GLB at $INPUT"
  exit 0
fi

gltf-transform draco "$INPUT" "$OUTPUT" --method edgebreaker
echo "Compressed $INPUT -> $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
