#!/usr/bin/env node
/**
 * Micro-benchmark scalar vs SIMD harborglow_dsp.wasm reactors.
 * Usage: node scripts/bench-wasm-dsp.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'

const SIMD_PROBE = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8,
  0, 65, 0, 253, 15, 253, 98, 11,
])

function wasmSimdSupported() {
  try {
    return WebAssembly.validate(SIMD_PROBE)
  } catch {
    return false
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

async function load(name) {
  const bytes = readFileSync(join(root, 'public/wasm', name))
  const result = await WebAssembly.instantiate(bytes, {
    env: { emscripten_notify_memory_growth: () => {} },
  })
  const api = result.instance.exports
  api._initialize?.()
  return api
}

function bench(label, iterations, fn) {
  fn()
  const start = performance.now()
  for (let i = 0; i < iterations; i++) fn()
  const us = ((performance.now() - start) * 1000) / iterations
  console.log(`  ${label}: ${us.toFixed(3)} µs/call`)
  return us
}

const batchCount = 256
const rmsCount = 1024
const log2n = 11
const n = 1 << log2n
const iters = 200

function run(api, title) {
  const xs = api.malloc(batchCount * 4)
  const zs = api.malloc(batchCount * 4)
  const out = api.malloc(batchCount * 4)
  const audio = api.malloc(rmsCount * 4)
  const fftIn = api.malloc(n * 4)
  const fftRe = api.malloc(n * 4)
  const fftIm = api.malloc(n * 4)
  const xsView = new Float32Array(api.memory.buffer, xs, batchCount)
  const zsView = new Float32Array(api.memory.buffer, zs, batchCount)
  const audioView = new Float32Array(api.memory.buffer, audio, rmsCount)
  const fftView = new Float32Array(api.memory.buffer, fftIn, n)
  for (let i = 0; i < batchCount; i++) {
    xsView[i] = i * 0.37
    zsView[i] = i * 0.11
  }
  for (let i = 0; i < rmsCount; i++) audioView[i] = Math.sin(0.015 * i)
  for (let i = 0; i < n; i++) fftView[i] = Math.sin(0.02 * i)

  console.log(title)
  bench(`wave_height_batch n=${batchCount}`, iters, () => {
    api.dsp_wave_height_batch(xs, zs, 1, 0.8, 0.4, 1.2, 0.6, 0.8, out, batchCount)
  })
  bench(`audio_rms n=${rmsCount}`, iters, () => {
    api.dsp_audio_rms(audio, rmsCount)
  })
  bench(`fft_r2c N=${n}`, iters, () => {
    api.dsp_fft_r2c(fftIn, fftRe, fftIm, log2n)
  })
}

const scalar = await load('harborglow_dsp.wasm')
run(scalar, 'WASM scalar (harborglow_dsp.wasm)')
if (wasmSimdSupported()) {
  const simd = await load('harborglow_dsp_simd.wasm')
  run(simd, 'WASM SIMD (harborglow_dsp_simd.wasm)')
} else {
  console.log('WASM SIMD: skipped (WebAssembly.validate probe failed)')
}
