#!/usr/bin/env node
/**
 * Fails when two or more files under public/ are byte-identical (same
 * sha256). Guards against the kind of accidental duplicate that shipped
 * clear_harbor_glow_intro.mp3 and clear_harbor_glow_loop.mp3 as the same
 * 4.77 MB file twice (see docs/DEPLOY_SUBPATH_PROBE.md).
 *
 * Usage: node scripts/check-duplicate-assets.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(__dirname, '..')
export const PUBLIC_DIR = path.join(ROOT, 'public')

function formatBytes(n) {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${n} B`
}

/** @returns {string[]} relative file paths under `dir`, recursively. */
export function listFilesRecursive(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.isFile()) {
        out.push(full)
      }
    }
  }
  walk(dir)
  return out.sort()
}

function sha256(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

/**
 * @returns {{ hash: string, files: string[], bytes: number }[]} groups of
 * two or more files under `dir` that share a sha256.
 */
export function findDuplicateAssets(dir = PUBLIC_DIR) {
  /** @type {Map<string, { files: string[], bytes: number }>} */
  const byHash = new Map()

  for (const filePath of listFilesRecursive(dir)) {
    const bytes = fs.statSync(filePath).size
    const hash = sha256(filePath)
    const group = byHash.get(hash) ?? { files: [], bytes }
    group.files.push(path.relative(ROOT, filePath))
    byHash.set(hash, group)
  }

  return [...byHash.entries()]
    .filter(([, group]) => group.files.length > 1)
    .map(([hash, group]) => ({ hash, files: group.files, bytes: group.bytes }))
}

function isMain() {
  const entry = process.argv[1] ? path.resolve(process.argv[1]) : ''
  return entry === fileURLToPath(import.meta.url)
}

if (isMain()) {
  const duplicates = findDuplicateAssets()
  if (duplicates.length) {
    console.error(`check-duplicate-assets: found ${duplicates.length} duplicate asset group(s) under public/:\n`)
    for (const { hash, files, bytes } of duplicates) {
      console.error(`  sha256 ${hash.slice(0, 12)}… (${formatBytes(bytes)} × ${files.length}):`)
      for (const file of files) console.error(`    ${file}`)
    }
    console.error('\nDelete the duplicate(s) or point both consumers at the same file.')
    process.exit(1)
  }
  console.log('check-duplicate-assets: OK — no duplicate files under public/')
}
