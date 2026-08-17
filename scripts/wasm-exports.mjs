#!/usr/bin/env node
/**
 * Single source of truth for WASM export names: C/C++ public headers.
 *
 * Usage:
 *   node scripts/wasm-exports.mjs --emcc core
 *   node scripts/wasm-exports.mjs --emcc audio
 *   node scripts/wasm-exports.mjs --check
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const ALLOCATOR_EXPORTS = ['malloc', 'free']

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

function parseDspFunctions(source) {
  const names = []
  const re = /(?:extern\s+"C"\s+)?[\w:*\s]+?\b(dsp_[A-Za-z0-9_]+)\s*\(/g
  const text = stripComments(source)
  let match
  while ((match = re.exec(text)) !== null) {
    if (!names.includes(match[1])) names.push(match[1])
  }
  return names
}

function readHeader(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

export function coreFunctionNames() {
  return [
    ...parseDspFunctions(readHeader('cpp/harborglow_dsp.h')),
    ...parseDspFunctions(readHeader('cpp/dsp_ring_buffer.h')),
  ]
}

export function engineFunctionNames() {
  return parseDspFunctions(readHeader('cpp/harborglow_audio_engine.h'))
}

export function coreExports() {
  return [...coreFunctionNames(), ...ALLOCATOR_EXPORTS]
}

export function engineExports() {
  return engineFunctionNames()
}

export function wasmDspRequiredNames() {
  return parseDspFunctions(readHeader('cpp/harborglow_dsp.h'))
}

function emccList(kind) {
  const names = kind === 'audio'
    ? [...coreExports(), ...engineExports()]
    : coreExports()
  return names.map((name) => `_${name}`).join(',')
}

function parseWasmDspRequired(source) {
  const block = source.match(/const required:\s*Array<[^>]+>\s*=\s*\[([\s\S]*?)\]/)
  if (!block) {
    throw new Error('could not find required export array in wasmDSP.ts')
  }
  return [...block[1].matchAll(/'([A-Za-z0-9_]+)'/g)].map((match) => match[1])
}

function assertSame(actual, expected, label) {
  const missing = expected.filter((name) => !actual.includes(name))
  const extra = actual.filter((name) => !expected.includes(name))
  if (missing.length || extra.length) {
    const parts = []
    if (missing.length) parts.push(`missing ${missing.join(', ')}`)
    if (extra.length) parts.push(`extra ${extra.join(', ')}`)
    throw new Error(`${label}: ${parts.join('; ')}`)
  }
}

function check() {
  const dspTs = readFileSync(join(root, 'src/systems/wasmDSP.ts'), 'utf8')
  const required = parseWasmDspRequired(dspTs)
  const expectedRequired = ['memory', ...ALLOCATOR_EXPORTS, ...wasmDspRequiredNames()]
  assertSame(required, expectedRequired, 'wasmDSP.ts required')

  const checkWasm = readFileSync(join(root, 'scripts/check-wasm.mjs'), 'utf8')
  if (!checkWasm.includes("from './wasm-exports.mjs'") &&
      !checkWasm.includes('from "./wasm-exports.mjs"')) {
    throw new Error('check-wasm.mjs must import scripts/wasm-exports.mjs')
  }
}

const args = process.argv.slice(2)
if (args[0] === '--emcc') {
  const kind = args[1]
  if (kind !== 'core' && kind !== 'audio') {
    throw new Error('usage: --emcc core|audio')
  }
  process.stdout.write(emccList(kind))
} else if (args[0] === '--check') {
  check()
  console.log('wasm-exports: OK')
} else if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('core', coreExports().join(','))
  console.log('engine', engineExports().join(','))
}
