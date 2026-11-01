#!/usr/bin/env node
// Static chunk-graph guard for the production bundle (run by check:bundle).
//
// From 2026-09-27 to 2026-10-04 main shipped a build in which vendor-3d-core
// statically imported an app chunk that imported vendor-3d-core back. The cycle
// evaluated `GLTFLoader extends Loader` before `Loader` existed and the page
// died at boot, while every merge gate stayed green. This script fails on:
//
//   1. any static import cycle among dist/assets/*.js (dynamic `import()` edges
//      are lazy and may legitimately close a loop, so they never count), and
//   2. any `vendor-*` chunk that statically imports a non-vendor chunk, except
//      `rolldown-runtime-*` and `with-selector-*` (shared leaf helpers), and
//      the entry chunk when it only supplies Vite's preload helper to a lazily
//      loaded vendor chunk (see `isPreloadHelperEdge`).
//
// Usage: node scripts/check-chunk-cycles.mjs [assetsDir]   (default dist/assets)

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const assetsDir = process.argv[2] ?? join(root, 'dist', 'assets')

const STATIC_EDGE = /(?:\bfrom|\bimport)\s*["']\.\/([^"']+\.js)["']/g
const DYNAMIC_EDGE = /\bimport\s*\(\s*["']\.\/([^"']+\.js)["']/g
const NAMED_IMPORT = /\bimport\s*\{([^}]*)\}\s*from\s*["']\.\/([^"']+\.js)["']/g
const LEAF_HELPERS = ['rolldown-runtime-', 'with-selector-']

const isVendor = (chunk) => chunk.startsWith('vendor-')

function fail(lines) {
  console.error(['check-chunk-cycles: FAILED', ...lines].join('\n'))
  process.exit(1)
}

if (!existsSync(assetsDir)) fail([`  missing ${assetsDir} — run vite build first`])

const chunks = readdirSync(assetsDir).filter((name) => name.endsWith('.js')).sort()
const sources = new Map(chunks.map((name) => [name, readFileSync(join(assetsDir, name), 'utf8')]))

/** @type {Map<string, Set<string>>} */
const staticEdges = new Map()
let dynamicCount = 0
for (const [name, source] of sources) {
  const targets = new Set()
  for (const [, target] of source.matchAll(STATIC_EDGE)) {
    if (sources.has(target)) targets.add(target)
  }
  staticEdges.set(name, targets)
  dynamicCount += [...source.matchAll(DYNAMIC_EDGE)].length
}

// The entry is what index.html loads; fall back to index-*.js (fixtures, or a
// dist/ without its html next to it).
function findEntry() {
  const html = join(assetsDir, '..', 'index.html')
  if (existsSync(html)) {
    const match = readFileSync(html, 'utf8').match(/<script[^>]+src=["'][^"']*assets\/([^"'/]+\.js)["']/)
    if (match && sources.has(match[1])) return match[1]
  }
  return chunks.find((name) => name.startsWith('index-')) ?? null
}
const entry = findEntry()

function reachableFrom(start) {
  const seen = new Set()
  const stack = start ? [start] : []
  while (stack.length) {
    const node = stack.pop()
    if (seen.has(node)) continue
    seen.add(node)
    stack.push(...(staticEdges.get(node) ?? []))
  }
  return seen
}
const eager = reachableFrom(entry)

// Vite hoists its `__vitePreload` helper into the entry chunk, and a vendor
// chunk with its own dynamic import() (rapier's `import('@dimforge/...')`)
// imports that one binding back from the entry. That edge cannot close a cycle
// as long as the vendor chunk is lazy: the entry never statically reaches it.
// An eager vendor importing the entry *is* a cycle and is reported as one.
function isPreloadHelperEdge(from, to) {
  if (to !== entry || eager.has(from)) return false
  const bindings = [...sources.get(from).matchAll(NAMED_IMPORT)]
    .filter(([, , target]) => target === to)
    .flatMap(([, names]) => names.split(',').map((s) => s.trim()).filter(Boolean))
  return bindings.length === 1
}

const problems = []

for (const [from, targets] of staticEdges) {
  if (!isVendor(from)) continue
  for (const to of targets) {
    if (isVendor(to) || LEAF_HELPERS.some((prefix) => to.startsWith(prefix))) continue
    if (isPreloadHelperEdge(from, to)) continue
    problems.push(`  vendor chunk statically imports an app chunk: ${from} -> ${to}`)
  }
}

// Iterative-enough DFS; the graph is a few dozen nodes.
const WHITE = 0
const GREY = 1
const BLACK = 2
const color = new Map(chunks.map((name) => [name, WHITE]))
const seenCycles = new Set()
function visit(node, path) {
  color.set(node, GREY)
  path.push(node)
  for (const next of staticEdges.get(node)) {
    if (color.get(next) === GREY) {
      const cycle = [...path.slice(path.indexOf(next)), next]
      const key = [...cycle.slice(0, -1)].sort().join('|')
      if (!seenCycles.has(key)) {
        seenCycles.add(key)
        problems.push(`  static import cycle: ${cycle.join(' -> ')}`)
      }
    } else if (color.get(next) === WHITE) {
      visit(next, path)
    }
  }
  path.pop()
  color.set(node, BLACK)
}
for (const name of chunks) {
  if (color.get(name) === WHITE) visit(name, [])
}

if (problems.length) {
  fail([
    ...problems,
    '  A module left out of every codeSplitting group is emitted into an app chunk and',
    '  imported back by the vendor chunk; see AGENTS.md "Chunk groups and boot".',
  ])
}

const edgeCount = [...staticEdges.values()].reduce((n, set) => n + set.size, 0)
console.log(
  `check-chunk-cycles: OK (${chunks.length} chunks, ${edgeCount} static edges, ${dynamicCount} dynamic imports, entry ${entry ? basename(entry) : 'none'})`,
)
