import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

// Regression guard for scripts/check-wasm-drift.mjs (wired into check:wasm):
// a public/wasm/** change that no source change explains must fail, because
// committed binaries are produced by the wasm-rebuild workflow, never locally
// (PR #254, 2026-09-23, shipped locally built bytes with the right toolchain
// string and turned main red).
//
// The script is exercised as a child process against a throwaway git repo so
// the test needs no fixture binaries and no typings for the .mjs module.

const ROOT = join(__dirname, '..', '..', '..')
const SCRIPT = join(ROOT, 'scripts', 'check-wasm-drift.mjs')
const CI_YML = `jobs:
  gate-wasm:
    steps:
      - uses: mymindstorm/setup-emsdk@v14
        with:
          version: "6.0.6"
`

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
}

let repo: string

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: repo, env: GIT_ENV, encoding: 'utf8' }).trim()
}

function write(relative: string, contents: string | Buffer): void {
  const path = join(repo, relative)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents)
}

function runGuard(extraEnv: Record<string, string> = {}) {
  const result = spawnSync(process.execPath, [SCRIPT], {
    cwd: repo,
    env: { ...GIT_ENV, WASM_DRIFT_ROOT: repo, ...extraEnv },
    encoding: 'utf8',
  })
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'harborglow-wasm-drift-'))
  git('init', '-q', '-b', 'main')
  write('.github/workflows/ci.yml', CI_YML)
  write('cpp/harborglow_dsp.cpp', 'int dsp() { return 1; }\n')
  write('cpp/Makefile', 'all:\n\ttrue\n')
  write('public/wasm/harborglow_dsp.wasm', Buffer.from([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0]))
  write('public/wasm/manifest.json', '{"schema":1}\n')
  git('add', '-A')
  git('commit', '-q', '-m', 'baseline')
  // Stand in for the fetched main: what the guard compares against.
  git('update-ref', 'refs/remotes/origin/main', 'HEAD')
})

afterEach(() => {
  rmSync(repo, { recursive: true, force: true })
})

describe('check-wasm-drift', () => {
  it('passes when public/wasm matches origin/main', () => {
    const { status, stdout } = runGuard()
    expect(status).toBe(0)
    expect(stdout).toContain('check-wasm-drift: OK')
  })

  it('fails when a binary changes with no source change (uncommitted)', () => {
    write('public/wasm/harborglow_dsp.wasm', Buffer.from([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 0xff]))
    const { status, stderr } = runGuard()
    expect(status).toBe(1)
    expect(stderr).toContain('public/wasm/harborglow_dsp.wasm')
    expect(stderr).toContain('wasm-rebuild')
  })

  it('fails when a binary changes with no source change (committed on a branch)', () => {
    git('checkout', '-q', '-b', 'feature')
    write('public/wasm/manifest.json', '{"schema":1,"sourceMd5":"different"}\n')
    git('commit', '-q', '-am', 'hand-edited manifest')
    const { status, stderr } = runGuard()
    expect(status).toBe(1)
    expect(stderr).toContain('public/wasm/manifest.json')
  })

  it('passes when a file under cpp/ changed in the same diff', () => {
    write('cpp/harborglow_dsp.cpp', 'int dsp() { return 2; }\n')
    write('public/wasm/harborglow_dsp.wasm', Buffer.from([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 0xff]))
    expect(runGuard().status).toBe(0)
  })

  it('passes when only cpp/Makefile changed alongside the binary', () => {
    write('cpp/Makefile', 'all:\n\ttrue\n\techo rebuilt\n')
    write('public/wasm/harborglow_dsp.wasm', Buffer.from([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 0xff]))
    expect(runGuard().status).toBe(0)
  })

  it('passes when the emsdk pin in ci.yml changed alongside the binary', () => {
    write('.github/workflows/ci.yml', CI_YML.replace('6.0.6', '6.0.7'))
    write('public/wasm/harborglow_dsp.wasm', Buffer.from([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 0xff]))
    expect(runGuard().status).toBe(0)
  })

  it('ignores changes on origin/main that the branch does not carry (merge base)', () => {
    git('checkout', '-q', '-b', 'feature')
    git('checkout', '-q', 'main')
    write('public/wasm/harborglow_dsp.wasm', Buffer.from([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 0xee]))
    write('cpp/harborglow_dsp.cpp', 'int dsp() { return 3; }\n')
    git('commit', '-q', '-am', 'main moved on')
    git('update-ref', 'refs/remotes/origin/main', 'HEAD')
    git('checkout', '-q', 'feature')
    expect(runGuard().status).toBe(0)
  })

  it('ALLOW_WASM_BINARY_DRIFT=1 downgrades the failure to a warning', () => {
    write('public/wasm/harborglow_dsp.wasm', Buffer.from([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 0xff]))
    const { status, stderr } = runGuard({ ALLOW_WASM_BINARY_DRIFT: '1' })
    expect(status).toBe(0)
    expect(stderr).toContain('WARNING')
  })

  it('skips with a warning when origin/main is unavailable', () => {
    git('update-ref', '-d', 'refs/remotes/origin/main')
    write('public/wasm/harborglow_dsp.wasm', Buffer.from([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 0xff]))
    const { status, stderr } = runGuard()
    expect(status).toBe(0)
    expect(stderr).toContain('origin/main is not available')
  })
})
