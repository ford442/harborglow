#!/usr/bin/env node
// =============================================================================
// check-wasm-drift.mjs — "binaries must not change without a source change"
//
// On 2026-09-23 a PR committed public/wasm binaries built outside CI. The
// manifest named the pinned toolchain, so the provenance guard in
// check-wasm.mjs passed, but the bytes differed from what gate-wasm rebuilt
// and main went red. This guard closes that hole from the other side: a diff
// against origin/main that touches public/wasm/** while nothing that feeds
// the build (cpp/**, scripts/wasm-exports.mjs, or the emsdk pin in ci.yml)
// changed is rejected. Fresh binaries come from the wasm-rebuild workflow
// (.github/workflows/wasm-rebuild.yml), never from a local em++.
//
// Escape hatch: ALLOW_WASM_BINARY_DRIFT=1 downgrades the failure to a warning.
// The two CI jobs that rebuild from source with the pinned toolchain
// (gate-wasm and wasm-rebuild) set it, because there the rebuild + `git diff`
// is the stronger check and a workflow-produced binary fix legitimately has
// no source change. A developer machine must never set it.
//
// Usage:
//   node scripts/check-wasm-drift.mjs            # exit 1 on unexplained drift
//   import { checkBinaryDrift } from './check-wasm-drift.mjs'
// =============================================================================
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parsePinnedEmsdkVersion, pinnedEmsdkVersion } from './emsdk-pin.mjs'

const BINARY_PREFIX = 'public/wasm/'
const SOURCE_PREFIXES = ['cpp/']
const SOURCE_FILES = ['scripts/wasm-exports.mjs']
const WORKFLOW = '.github/workflows/ci.yml'
const BASE_REF = 'origin/main'

/**
 * Splits a changed-file list into the binaries that moved and the reasons
 * that would explain the move.
 *
 * @param {string[]} changedFiles repo-relative paths changed vs the base.
 * @param {{ basePin: string|null, headPin: string|null }} pins emsdk pin on
 *   each side of the diff; a changed pin explains a binary change.
 * @returns {{ binaries: string[], sources: string[], pinChanged: boolean }}
 */
export function classifyDrift(changedFiles, { basePin, headPin }) {
  const binaries = changedFiles.filter((file) => file.startsWith(BINARY_PREFIX))
  const sources = changedFiles.filter(
    (file) =>
      SOURCE_PREFIXES.some((prefix) => file.startsWith(prefix)) || SOURCE_FILES.includes(file),
  )
  const pinChanged = basePin !== headPin
  return { binaries, sources, pinChanged }
}

/**
 * Runs git in `cwd` and returns its stdout; throws on a non-zero exit.
 *
 * @param {string[]} args git arguments.
 * @param {string} cwd repository root.
 * @returns {string}
 */
function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

/**
 * Like git(), trimmed, but returns null instead of throwing.
 *
 * @param {string[]} args git arguments.
 * @param {string} cwd repository root.
 * @returns {string|null}
 */
function tryGit(args, cwd) {
  try {
    return git(args, cwd).trim()
  } catch {
    return null
  }
}

/**
 * Compares the working tree (committed + staged + unstaged) against the merge
 * base with origin/main.
 *
 * @param {string} cwd repository root.
 * @returns {{ skipped: string } | { ok: true } | { ok: false, message: string }}
 *   `skipped` carries the reason the comparison could not be made (no git, no
 *   origin/main); the caller decides whether that is a warning.
 */
export function checkBinaryDrift(cwd) {
  if (tryGit(['rev-parse', '--is-inside-work-tree'], cwd) !== 'true') {
    return { skipped: 'not a git work tree' }
  }
  const baseCommit = tryGit(['rev-parse', '--verify', `${BASE_REF}^{commit}`], cwd)
  if (!baseCommit) {
    return { skipped: `${BASE_REF} is not available (run \`git fetch origin main\`)` }
  }
  const mergeBase = tryGit(['merge-base', BASE_REF, 'HEAD'], cwd) ?? baseCommit

  const changedFiles = git(['diff', '--name-only', mergeBase, '--'], cwd)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const basePin = parsePinnedEmsdkVersion(tryGit(['show', `${mergeBase}:${WORKFLOW}`], cwd) ?? '')
  const headPin = pinnedEmsdkVersion(join(cwd, WORKFLOW))

  const { binaries, sources, pinChanged } = classifyDrift(changedFiles, { basePin, headPin })
  if (binaries.length === 0 || sources.length > 0 || pinChanged) return { ok: true }

  return {
    ok: false,
    message:
      `changed vs ${BASE_REF} (merge base ${mergeBase.slice(0, 12)}): ${binaries.join(', ')}; ` +
      `but nothing under cpp/, scripts/wasm-exports.mjs, or the emsdk pin in ${WORKFLOW} ` +
      `changed in the same diff. Committed WASM must only change together with a source ` +
      `change, and must be built by CI: run the "WASM rebuild" workflow ` +
      `(.github/workflows/wasm-rebuild.yml) against your branch instead of committing a ` +
      `local build. Set ALLOW_WASM_BINARY_DRIFT=1 to downgrade this to a warning.`,
  }
}

/**
 * Runs the guard against a repository and reports on stdout/stderr.
 *
 * @param {string} cwd repository root.
 * @param {NodeJS.ProcessEnv} env environment to read the escape hatch from.
 * @returns {boolean} false only when the guard failed and the escape hatch is unset.
 */
export function runBinaryDriftGuard(cwd, env = process.env) {
  const result = checkBinaryDrift(cwd)
  if ('skipped' in result) {
    console.warn(`check-wasm: WARNING binary-drift guard skipped: ${result.skipped}`)
    return true
  }
  if (result.ok) return true
  if (env.ALLOW_WASM_BINARY_DRIFT === '1') {
    console.warn(`check-wasm: WARNING ${result.message}`)
    return true
  }
  console.error(`check-wasm: ${result.message}`)
  return false
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = process.env.WASM_DRIFT_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..')
  if (!runBinaryDriftGuard(root)) process.exit(1)
  console.log('check-wasm-drift: OK')
}
