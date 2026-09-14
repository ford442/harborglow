#!/usr/bin/env node
/**
 * Gzip size budgets for public/models/*.glb (not Vite JS chunks).
 *
 * Hero (cruise, container, tanker): ≤ 1.5 MB gzip
 * Stretch (everything else, including future icebreaker.glb): ≤ 800 kB gzip
 *
 * Usage: node scripts/check-glb-size.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(__dirname, '..')
const MODELS_DIR = path.join(ROOT, 'public', 'models')
const REGISTRY_PATH = path.join(ROOT, 'src', 'ships', 'shipModelRegistry.ts')

export const HERO_SHIP_TYPES = new Set(['cruise', 'container', 'tanker'])
export const HERO_GZIP_MAX = 1.5 * 1024 * 1024
export const STRETCH_GZIP_MAX = 800 * 1024

const ICEBREAKER_FILE = 'icebreaker.glb'

/** Parse SHIP_MODEL_FILENAMES from shipModelRegistry.ts (no TS runtime). */
export function parseShipModelFilenames(source = fs.readFileSync(REGISTRY_PATH, 'utf8')) {
  const match = source.match(/export const SHIP_MODEL_FILENAMES[^{]*\{([^}]+)\}/)
  if (!match) {
    throw new Error('Could not parse SHIP_MODEL_FILENAMES from shipModelRegistry.ts')
  }
  /** @type {Record<string, string>} */
  const map = {}
  for (const line of match[1].split('\n')) {
    const entry = line.match(/^\s*([A-Za-z0-9_]+)\s*:\s*['"]([^'"]+)['"]/)
    if (entry) map[entry[1]] = entry[2]
  }
  return map
}

export function shipTypeForGlbFilename(filename, filenamesMap = parseShipModelFilenames()) {
  for (const [shipType, file] of Object.entries(filenamesMap)) {
    if (file === filename) return shipType
  }
  if (filename === ICEBREAKER_FILE) return 'icebreaker'
  return null
}

function formatBytes(n) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${n} B`
}

/**
 * @returns {number} failure count
 */
export function checkGlbSizes({ log = console.log, error = console.error } = {}) {
  const filenamesMap = parseShipModelFilenames()
  if (!fs.existsSync(MODELS_DIR)) {
    error(`✗ missing ${MODELS_DIR}`)
    return 1
  }

  const files = fs
    .readdirSync(MODELS_DIR)
    .filter((name) => name.endsWith('.glb'))
    .sort()

  if (files.length === 0) {
    log('No GLBs in public/models/ — size check skipped.')
    return 0
  }

  let failed = 0
  for (const name of files) {
    const filePath = path.join(MODELS_DIR, name)
    const raw = fs.readFileSync(filePath)
    const gzipLen = gzipSync(raw).length
    const shipType = shipTypeForGlbFilename(name, filenamesMap)
    const hero = shipType !== null && HERO_SHIP_TYPES.has(shipType)
    const max = hero ? HERO_GZIP_MAX : STRETCH_GZIP_MAX
    const tier = hero ? 'hero' : 'stretch'
    const ok = gzipLen <= max
    const flag = ok ? '✓' : '✗'
    log(
      `${flag} ${name} — raw ${formatBytes(raw.length)}, gzip ${formatBytes(gzipLen)} (${tier} ≤ ${formatBytes(max)})`,
    )
    if (!ok) {
      error(`    gzip ${gzipLen} exceeds ${tier} budget ${max}`)
      failed++
    }
  }
  return failed
}

function isMain() {
  const entry = process.argv[1] ? path.resolve(process.argv[1]) : ''
  return entry === fileURLToPath(import.meta.url)
}

if (isMain()) {
  const failed = checkGlbSizes()
  if (failed) {
    console.error(`\n${failed} GLB(s) over size budget`)
    process.exit(1)
  }
  console.log('\nAll GLB gzip sizes within budget.')
}
