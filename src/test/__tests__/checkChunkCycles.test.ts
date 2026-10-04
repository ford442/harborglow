import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

// Regression guard for scripts/check-chunk-cycles.mjs (run by check:bundle).
// main was blank at boot 2026-09-27 → 2026-10-04 because vendor-3d-core
// statically imported an app chunk that imported it back. The script runs as a
// child process against hand-written chunks shaped like rolldown's minified
// output, so these fixtures need no real build.

const ROOT = join(__dirname, '..', '..', '..')
const SCRIPT = join(ROOT, 'scripts', 'check-chunk-cycles.mjs')

let dir: string

function chunks(files: Record<string, string>): void {
  for (const [name, source] of Object.entries(files)) {
    writeFileSync(join(dir, name), source)
  }
}

function runGuard() {
  const result = spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' })
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'harborglow-chunk-cycles-'))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('check-chunk-cycles', () => {
  it('passes a clean graph', () => {
    chunks({
      'rolldown-runtime-AAAAAAAA.js': 'export{}',
      'vendor-react-AAAAAAAA.js': 'import"./rolldown-runtime-AAAAAAAA.js";export{}',
      'with-selector-AAAAAAAA.js': 'import{a as t}from"./vendor-react-AAAAAAAA.js";export{}',
      'vendor-3d-core-AAAAAAAA.js':
        'import{t as e}from"./rolldown-runtime-AAAAAAAA.js";import{t}from"./with-selector-AAAAAAAA.js";export{}',
      'index-AAAAAAAA.js':
        'import{a}from"./vendor-3d-core-AAAAAAAA.js";import{b}from"./vendor-react-AAAAAAAA.js";const g=()=>import("./GameShell-AAAAAAAA.js");export{g as t}',
      'GameShell-AAAAAAAA.js': 'import{t}from"./index-AAAAAAAA.js";import{a}from"./vendor-3d-core-AAAAAAAA.js";export{}',
    })
    const { status, output } = runGuard()
    expect(output).toContain('check-chunk-cycles: OK')
    expect(status).toBe(0)
  })

  it('fails when a vendor chunk statically imports an app chunk', () => {
    // The 2026-09-27 shape: three-stdlib left ungrouped, emitted into MainScene.
    chunks({
      'index-AAAAAAAA.js': 'const m=()=>import("./MainScene-AAAAAAAA.js");export{m as t}',
      'MainScene-AAAAAAAA.js': 'class Loader{};export{Loader as t}',
      'vendor-3d-core-AAAAAAAA.js': 'import{t as L}from"./MainScene-AAAAAAAA.js";class GLTFLoader extends L{};export{}',
    })
    const { status, output } = runGuard()
    expect(status).toBe(1)
    expect(output).toContain('vendor-3d-core-AAAAAAAA.js -> MainScene-AAAAAAAA.js')
  })

  it('fails on a three-chunk static cycle and prints its path', () => {
    chunks({
      'a-AAAAAAAA.js': 'import{t}from"./b-AAAAAAAA.js";export{t as a}',
      'b-AAAAAAAA.js': 'import{a}from"./c-AAAAAAAA.js";export{a as t}',
      'c-AAAAAAAA.js': 'export*from"./a-AAAAAAAA.js"',
    })
    const { status, output } = runGuard()
    expect(status).toBe(1)
    expect(output).toContain(
      'static import cycle: a-AAAAAAAA.js -> b-AAAAAAAA.js -> c-AAAAAAAA.js -> a-AAAAAAAA.js',
    )
  })

  it('allows a "cycle" closed by a dynamic import()', () => {
    // GameShell lazy-loads MainScene; MainScene statically imports GameShell.
    chunks({
      'index-AAAAAAAA.js': 'const g=()=>import("./GameShell-AAAAAAAA.js");export{g as t}',
      'GameShell-AAAAAAAA.js': 'const s=()=>import( "./MainScene-AAAAAAAA.js" );export{s as t}',
      'MainScene-AAAAAAAA.js': 'import{t}from"./GameShell-AAAAAAAA.js";export{}',
    })
    const { status, output } = runGuard()
    expect(output).toContain('check-chunk-cycles: OK')
    expect(status).toBe(0)
  })

  it("allows a lazy vendor chunk to import only Vite's preload helper from the entry", () => {
    chunks({
      'index-AAAAAAAA.js': 'const p=(f)=>f();const r=()=>import("./vendor-3d-rapier-AAAAAAAA.js");export{p as t}',
      'vendor-3d-rapier-AAAAAAAA.js': 'import{t as U}from"./index-AAAAAAAA.js";U(()=>import("./compat-AAAAAAAA.js"));export{}',
      'compat-AAAAAAAA.js': 'export{}',
    })
    expect(runGuard().status).toBe(0)
  })

  it('fails when an eager vendor chunk imports the entry back', () => {
    chunks({
      'index-AAAAAAAA.js': 'import{a}from"./vendor-3d-core-AAAAAAAA.js";const p=1;export{p as t}',
      'vendor-3d-core-AAAAAAAA.js': 'import{t}from"./index-AAAAAAAA.js";export{t as a}',
    })
    const { status, output } = runGuard()
    expect(status).toBe(1)
    expect(output).toContain('vendor-3d-core-AAAAAAAA.js -> index-AAAAAAAA.js')
    expect(output).toContain('static import cycle')
  })
})
