import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { beforeAll, describe, expect, it } from 'vitest'

// Every package in the R3F runtime-dependency closure must be claimed by a
// codeSplitting group. With includeDependenciesRecursively: false, an
// unclaimed package is emitted into an app chunk (MainScene, or a chunk of its
// own) that vendor-3d-core then imports back; that chunk cycle evaluated
// `GLTFLoader extends Loader` before `Loader` existed and left main blank at
// boot 2026-09-27 → 2026-10-04. Adding an R3F-ecosystem dependency without
// adding it to the vendor-3d-core list fails here, naming the package.

const ROOT = join(__dirname, '..', '..', '..')
// vite.config.ts imports its group list from here; loaded by URL so tsc does
// not need typings for the .mjs module.
const CHUNK_GROUPS = join(ROOT, 'scripts', 'chunkGroups.mjs')
const ROOTS = ['@react-three/fiber', '@react-three/drei', 'three-stdlib', 'troika-three-text']

/** Shared with the app graph or owned by another group: not walked. */
function isBoundary(pkg: string): boolean {
  return (
    ['react', 'react-dom', 'scheduler', 'zustand', 'use-sync-external-store', 'cross-env'].includes(pkg) ||
    pkg.startsWith('@types/') ||
    pkg.startsWith('@react-three/rapier') ||
    pkg.startsWith('@dimforge/')
  )
}

type Manifest = { name: string; dependencies?: Record<string, string> }

/** Node-style lookup: nearest node_modules/<pkg> walking up from `fromDir`. */
function resolveManifest(pkg: string, fromDir: string): { dir: string; manifest: Manifest } | null {
  let dir = fromDir
  for (;;) {
    const candidate = join(dir, 'node_modules', pkg, 'package.json')
    if (existsSync(candidate)) {
      return { dir: dirname(candidate), manifest: JSON.parse(readFileSync(candidate, 'utf8')) as Manifest }
    }
    const parent = dirname(dir)
    if (parent === dir || !parent.startsWith(ROOT)) return null
    dir = parent
  }
}

function dependencyClosure(): { packages: string[]; missing: string[] } {
  const packages = new Set<string>()
  const missing: string[] = []
  const queue = ROOTS.map((pkg) => ({ pkg, from: ROOT }))
  const visitedDirs = new Set<string>()
  while (queue.length) {
    const { pkg, from } = queue.shift()!
    if (isBoundary(pkg)) continue
    const resolved = resolveManifest(pkg, from)
    if (!resolved) {
      missing.push(pkg)
      continue
    }
    packages.add(pkg)
    if (visitedDirs.has(resolved.dir)) continue
    visitedDirs.add(resolved.dir)
    for (const dep of Object.keys(resolved.manifest.dependencies ?? {})) {
      queue.push({ pkg: dep, from: resolved.dir })
    }
  }
  return { packages: [...packages].sort(), missing }
}

/**
 * In the closure but not claimed by any group, and not reached by any bundled
 * module today (verified 2026-10-04 by listing every chunk's module ids): drei's
 * `promise-worker-transferable` (+ `is-promise`, `lie`, `immediate`), buffer's
 * `ieee754`, detect-gpu/three-stdlib's `webgl-constants`, `require-from-string`.
 * They are latent holes, not safe: the day a dependency starts importing one,
 * it lands outside every group. The fix is adding them to the vendor-3d-core
 * list in scripts/chunkGroups.mjs and deleting this set (out of scope for the
 * change that added this test, which could not edit the groups). Entries that
 * become claimed fail the stale-entry test below.
 */
const KNOWN_UNCLAIMED = new Set([
  'ieee754',
  'immediate',
  'is-promise',
  'lie',
  'promise-worker-transferable',
  'require-from-string',
  'webgl-constants',
])

type Group = { name: string; test?: RegExp | ((id: string) => boolean) }

function claims(group: Group, id: string): boolean {
  if (group.test instanceof RegExp) return group.test.test(id)
  if (typeof group.test === 'function') return group.test(id)
  return false
}

describe('vite codeSplitting groups', () => {
  let groups: Group[] = []
  const { packages, missing } = dependencyClosure()

  beforeAll(async () => {
    const mod = (await import(/* @vite-ignore */ pathToFileURL(CHUNK_GROUPS).href)) as {
      codeSplittingGroups: Group[]
    }
    groups = mod.codeSplittingGroups
  })

  const isClaimed = (pkg: string) =>
    [`node_modules/${pkg}/index.js`, `node_modules\\${pkg.replace('/', '\\')}\\index.js`].every((id) =>
      groups.some((group) => claims(group, id)),
    )

  it('reads the groups vite.config.ts builds with', () => {
    expect(groups.map((g) => g.name)).toContain('vendor-3d-core')
  })

  it('walks the installed R3F dependency closure', () => {
    expect(missing, `root packages not installed: ${missing.join(', ')}`).not.toEqual(
      expect.arrayContaining(ROOTS),
    )
    expect(packages).toEqual(expect.arrayContaining(ROOTS))
    expect(packages).toContain('three')
  })

  it('claims every package in the closure with some group', () => {
    const unclaimed = packages.filter((pkg) => !KNOWN_UNCLAIMED.has(pkg) && !isClaimed(pkg))
    expect(
      unclaimed,
      `R3F runtime dependencies no codeSplitting group claims (add them to the vendor-3d-core list in scripts/chunkGroups.mjs): ${unclaimed.join(', ')}`,
    ).toEqual([])
  })

  it('has no stale KNOWN_UNCLAIMED entries', () => {
    const stale = [...KNOWN_UNCLAIMED].filter((pkg) => !packages.includes(pkg) || isClaimed(pkg))
    expect(stale, `remove from KNOWN_UNCLAIMED (now claimed, or no longer a dependency): ${stale.join(', ')}`).toEqual([])
  })
})
