#!/usr/bin/env node
// =============================================================================
// emsdk-pin.mjs — The one place that knows which Emscripten release CI pins.
//
// `gate-wasm` in .github/workflows/ci.yml installs a pinned emsdk with
// `mymindstorm/setup-emsdk` and rebuilds public/wasm from it. Every other
// consumer (check-wasm.mjs, the wasm-rebuild workflow) reads the pin from that
// file instead of carrying a copy that can drift.
//
// Usage:
//   node scripts/emsdk-pin.mjs            # prints the version, e.g. 6.0.6
//   import { pinnedEmsdkVersion } from './emsdk-pin.mjs'
// =============================================================================
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const workflowPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '.github/workflows/ci.yml',
)

/**
 * Extracts the `version:` of the first `mymindstorm/setup-emsdk` step.
 *
 * @param {string} workflowText contents of ci.yml.
 * @returns {string|null} the pinned version, or null when no such step exists.
 */
export function parsePinnedEmsdkVersion(workflowText) {
  const lines = workflowText.split('\n')
  const anchor = lines.findIndex((line) => /uses:\s*mymindstorm\/setup-emsdk@/.test(line))
  if (anchor === -1) return null
  for (const line of lines.slice(anchor + 1, anchor + 6)) {
    const match = line.match(/^\s*version:\s*["']?([\w.]+)["']?\s*$/)
    if (match) return match[1]
  }
  return null
}

/**
 * Reads the Emscripten release that `gate-wasm` pins, from the workflow itself.
 *
 * @param {string} [path] workflow file to read; defaults to this repo's ci.yml.
 * @returns {string|null} the pinned version, or null if the workflow or the
 *   `setup-emsdk` step cannot be read.
 */
export function pinnedEmsdkVersion(path = workflowPath) {
  if (!existsSync(path)) return null
  return parsePinnedEmsdkVersion(readFileSync(path, 'utf8'))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const version = pinnedEmsdkVersion()
  if (!version) {
    console.error('emsdk-pin: no mymindstorm/setup-emsdk step with a version found in ci.yml')
    process.exit(1)
  }
  process.stdout.write(`${version}\n`)
}
