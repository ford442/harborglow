#!/usr/bin/env node
import { gzipSync } from 'node:zlib'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const distAssets = join(root, 'dist/assets')
const budgetPath = join(root, 'bundle-budget.json')

function fail(message) {
  throw new Error(`check-bundle: ${message}`)
}

function gzipKb(bytes) {
  return gzipSync(bytes).byteLength / 1024
}

function chunkPrefix(filename) {
  const base = filename.replace(/\.(js|css)$/, '')
  const hashIdx = base.lastIndexOf('-')
  if (hashIdx <= 0) return base
  const tail = base.slice(hashIdx + 1)
  if (/^[A-Za-z0-9_-]{6,}$/.test(tail)) {
    return base.slice(0, hashIdx)
  }
  return base
}

function findChunks(prefix) {
  if (!existsSync(distAssets)) return []
  return readdirSync(distAssets).filter((name) => {
    if (prefix === 'index.css') return name === 'index.css' || name.endsWith('.css') && name.startsWith('index')
    return name.startsWith(prefix) && (name.endsWith('.js') || name.endsWith('.css'))
  })
}

function totalGzipKbForPrefixes(prefixes, cssPrefixes = []) {
  let total = 0
  for (const prefix of prefixes) {
    total += totalGzipKbForAssetPrefix(prefix, '.js')
  }
  for (const prefix of cssPrefixes) {
    total += totalGzipKbForAssetPrefix(prefix, '.css')
  }
  return total
}

function totalGzipKbForAssetPrefix(prefix, ext) {
  const matches = findChunks(prefix).filter((name) => name.endsWith(ext))
  if (!matches.length) {
    fail(`no dist asset matches prefix "${prefix}" with extension ${ext}`)
  }
  let total = 0
  for (const name of matches) {
    total += gzipKb(readFileSync(join(distAssets, name)))
  }
  return total
}

function maxGzipKbForPrefix(prefix) {
  const matches = findChunks(prefix)
  if (!matches.length) {
    fail(`no dist asset matches prefix "${prefix}"`)
  }
  let max = 0
  let worst = matches[0]
  for (const name of matches) {
    const kb = gzipKb(readFileSync(join(distAssets, name)))
    if (kb > max) {
      max = kb
      worst = name
    }
  }
  return { kb: max, file: worst }
}

if (!existsSync(budgetPath)) fail('missing bundle-budget.json')
if (!existsSync(distAssets)) fail('missing dist/assets — run vite build first')

const budget = JSON.parse(readFileSync(budgetPath, 'utf8'))

for (const [prefix, ceilingKb] of Object.entries(budget.chunks ?? {})) {
  const { kb, file } = maxGzipKbForPrefix(prefix)
  if (kb > ceilingKb) {
    fail(`${file}: ${kb.toFixed(1)} KB gzip exceeds ${prefix} budget ${ceilingKb} KB`)
  }
  console.log(`  ${prefix}: ${kb.toFixed(1)} KB gzip (${file})`)
}

for (const [profileName, profile] of Object.entries(budget.profiles ?? {})) {
  const prefixes = profile.prefixes ?? []
  const cssPrefixes = profile.cssPrefixes ?? []
  const ceilingKb = profile.gzipMaxKb
  const total = totalGzipKbForPrefixes(prefixes, cssPrefixes)
  if (total > ceilingKb) {
    fail(
      `profile "${profileName}": ${total.toFixed(1)} KB gzip exceeds budget ${ceilingKb} KB (prefixes: ${prefixes.join(', ')})`
    )
  }
  console.log(`  profile ${profileName}: ${total.toFixed(1)} KB gzip`)
}

// Async chunk sanity: menu entry must not statically import heavy 3D splits.
const indexFiles = findChunks('index').filter((n) => n.endsWith('.js'))
if (!indexFiles.length) fail('no index-*.js entry chunk found')
const indexSource = readFileSync(join(distAssets, indexFiles[0]), 'utf8')
for (const chunk of ['vendor-3d-webgpu', 'vendor-3d-rapier', 'vendor-3d-post', 'vendor-3d-drei']) {
  const re = new RegExp(`from"\\.\\/${chunk}-`)
  if (re.test(indexSource)) {
    fail(`index entry statically imports ${chunk} — expected async boundary`)
  }
}

console.log('check-bundle: OK')
