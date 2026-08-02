#!/usr/bin/env node
/**
 * CI guard: committed harborglow_dsp.wasm must be a real Emscripten build,
 * not the historical 121-byte hand-written stub.
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const wasmPath = join(root, 'public/wasm/harborglow_dsp.wasm')

const MIN_BYTES = 5000

const REQUIRED_EXPORTS = [
  'dsp_mix',
  'dsp_clamp',
  'dsp_remap',
  'dsp_smooth_step',
  'dsp_smoother_step',
  'dsp_sin_approx',
  'dsp_sin_full',
  'dsp_wave_height',
  'dsp_wave_height_batch',
  'dsp_additive_synth_sample',
  'dsp_audio_rms',
  'malloc',
  'free',
  'memory',
]

function fail(msg) {
  console.error(`check-wasm: ${msg}`)
  process.exit(1)
}

if (!existsSync(wasmPath)) {
  fail(`missing ${wasmPath}`)
}

const bytes = readFileSync(wasmPath)
if (bytes.length < MIN_BYTES) {
  fail(
    `WASM too small (${bytes.length} B < ${MIN_BYTES} B) — likely stub binary; run npm run build:wasm`,
  )
}

let mod
try {
  mod = new WebAssembly.Module(bytes)
} catch (err) {
  fail(`invalid WASM module: ${err instanceof Error ? err.message : String(err)}`)
}

const exportNames = new Set(WebAssembly.Module.exports(mod).map((e) => e.name))
const missing = REQUIRED_EXPORTS.filter((name) => !exportNames.has(name))
if (missing.length > 0) {
  fail(`missing exports: ${missing.join(', ')}`)
}

// Smoke: instantiate with Emscripten env stub and call dsp_mix
const imports = {
  env: {
    emscripten_notify_memory_growth: () => {},
  },
}
try {
  const result = await WebAssembly.instantiate(bytes, imports)
  const instance =
    result instanceof WebAssembly.Instance ? result : result.instance
  if (instance.exports._initialize) {
    instance.exports._initialize()
  }
  const mix = instance.exports.dsp_mix
  if (typeof mix !== 'function') {
    fail('dsp_mix is not a function after instantiate')
  }
  const resultMix = mix(10, 20, 0.5)
  if (Math.abs(resultMix - 15) > 1e-6) {
    fail(`dsp_mix smoke test failed: expected 15, got ${resultMix}`)
  }
} catch (err) {
  fail(`instantiate smoke test failed: ${err instanceof Error ? err.message : String(err)}`)
}

console.log(
  `check-wasm: OK (${bytes.length} B, ${exportNames.size} exports, dsp_mix smoke passed)`,
)
