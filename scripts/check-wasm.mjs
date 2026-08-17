#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { coreExports, engineExports } from './wasm-exports.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = join(root, 'public/wasm/manifest.json')
const sourcePaths = [
  'cpp/harborglow_dsp.cpp',
  'cpp/harborglow_dsp.h',
  'cpp/harborglow_audio_engine.cpp',
  'cpp/harborglow_audio_engine.h',
  'cpp/dsp_ring_buffer.c',
  'cpp/dsp_ring_buffer.h',
  'cpp/Makefile',
  'cpp/build.sh',
  'scripts/wasm-exports.mjs',
]
const binaryPaths = [
  'public/wasm/harborglow_dsp.wasm',
  'public/wasm/harborglow_dsp_simd.wasm',
  'public/wasm/harborglow_audio_shared.wasm',
  'public/wasm/harborglow_audio_shared_simd.wasm',
]
const coreExportList = coreExports()
const engineExportList = engineExports()

function fail(message) {
  throw new Error(`check-wasm: ${message}`)
}

function digest(bytes, algorithm) {
  return createHash(algorithm).update(bytes).digest('hex')
}

function computeSourceMd5() {
  const hash = createHash('md5')
  for (const source of sourcePaths) {
    hash.update(source)
    hash.update('\0')
    hash.update(readFileSync(join(root, source)))
    hash.update('\0')
  }
  return hash.digest('hex')
}

function assertExports(module, expected, label) {
  const exports = new Set(WebAssembly.Module.exports(module).map(({ name }) => name))
  const missing = expected.filter((name) => !exports.has(name))
  if (missing.length) fail(`${label} missing exports: ${missing.join(', ')}`)
}

function assertNear(actual, expected, tolerance, label) {
  if (Math.abs(actual - expected) > tolerance) {
    fail(`${label}: expected ${expected}, got ${actual}`)
  }
}

if (!existsSync(manifestPath)) fail('missing public/wasm/manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
if (manifest.sourceMd5 !== computeSourceMd5()) {
  fail('source digest differs from committed WASM manifest; run npm run build:wasm')
}

const { execFileSync } = await import('node:child_process')
execFileSync(process.execPath, [join(root, 'scripts/wasm-exports.mjs'), '--check'], {
  stdio: 'inherit',
})

const modules = new Map()
for (const binary of binaryPaths) {
  const path = join(root, binary)
  if (!existsSync(path)) fail(`missing ${binary}`)
  const bytes = readFileSync(path)
  const record = manifest.binaries?.[binary]
  if (!record || record.bytes !== bytes.byteLength ||
      record.sha256 !== digest(bytes, 'sha256')) {
    fail(`${binary} differs from committed manifest; run npm run build:wasm`)
  }
  modules.set(binary, { bytes, module: new WebAssembly.Module(bytes) })
}

const core = modules.get(binaryPaths[0])
assertExports(core.module, [...coreExportList, 'memory'], 'harborglow_dsp.wasm')
const simdCore = modules.get(binaryPaths[1])
assertExports(simdCore.module, [...coreExportList, 'memory'], 'harborglow_dsp_simd.wasm')

const coreResult = await WebAssembly.instantiate(core.bytes, {
  env: { emscripten_notify_memory_growth: () => {} },
})
const coreInstance = coreResult instanceof WebAssembly.Instance
  ? coreResult
  : coreResult.instance
const coreApi = coreInstance.exports
coreApi._initialize?.()
assertNear(coreApi.dsp_mix(10, 20, 0.5), 15, 1e-6, 'dsp_mix')

const simdResult = await WebAssembly.instantiate(simdCore.bytes, {
  env: { emscripten_notify_memory_growth: () => {} },
})
const simdInstance = simdResult instanceof WebAssembly.Instance
  ? simdResult
  : simdResult.instance
simdInstance.exports._initialize?.()
assertNear(simdInstance.exports.dsp_mix(10, 20, 0.5), 15, 1e-6, 'simd dsp_mix')

const memory = coreApi.memory
const malloc = coreApi.malloc
const free = coreApi.free
const out = malloc(8 * 4)
const frequency = malloc(4)
const amplitude = malloc(4)
const phase = malloc(4)
new Float32Array(memory.buffer, frequency, 1)[0] = 6000
new Float32Array(memory.buffer, amplitude, 1)[0] = 1
new Float32Array(memory.buffer, phase, 1)[0] = 0
coreApi.dsp_additive_block(out, 8, frequency, amplitude, 1, 48000, phase)
const additive = new Float32Array(memory.buffer, out, 8)
for (let index = 0; index < additive.length; index++) {
  assertNear(additive[index], Math.sin(index * Math.PI / 4), 1e-5, `additive[${index}]`)
}

const impulse = malloc(3 * 4)
const input = malloc(3 * 4)
const convolved = malloc(3 * 4)
new Float32Array(memory.buffer, impulse, 3).set([0.5, -0.25, 0.125])
new Float32Array(memory.buffer, input, 3).set([1, 0, 0])
const convolver = coreApi.dsp_convolver_create(impulse, 3)
coreApi.dsp_convolver_process(convolver, input, convolved, 3)
const convolution = new Float32Array(memory.buffer, convolved, 3)
for (const [index, expected] of [0.5, -0.25, 0.125].entries()) {
  assertNear(convolution[index], expected, 1e-6, `convolution[${index}]`)
}
coreApi.dsp_convolver_destroy(convolver)

const ringBytes = coreApi.dsp_ring_required_bytes(4, 4)
const ring = malloc(ringBytes)
const item = malloc(4)
const popped = malloc(4)
if (!coreApi.dsp_ring_init(ring, 4, 4)) fail('ring initialization failed')
for (let value = 0; value < 4; value++) {
  new Int32Array(memory.buffer, item, 1)[0] = value
  if (!coreApi.dsp_ring_push(ring, item)) fail(`ring rejected item ${value}`)
}
if (coreApi.dsp_ring_push(ring, item)) fail('ring accepted an item while full')
for (let expected = 0; expected < 4; expected++) {
  if (!coreApi.dsp_ring_pop(ring, popped)) fail(`ring failed to pop ${expected}`)
  const value = new Int32Array(memory.buffer, popped, 1)[0]
  if (value !== expected) fail(`ring order: expected ${expected}, got ${value}`)
}
if (coreApi.dsp_ring_pop(ring, popped)) fail('ring returned an item while empty')

coreApi.dsp_convolver_destroy(convolver)
for (const pointer of [
  out, frequency, amplitude, phase, impulse, input, convolved, ring, item, popped,
]) free(pointer)

for (const binary of binaryPaths.slice(2)) {
  const artifact = modules.get(binary)
  assertExports(artifact.module, [...coreExportList, ...engineExportList], binary)
  const imports = WebAssembly.Module.imports(artifact.module)
  const importedMemory = imports.find(({ kind }) => kind === 'memory')
  if (!importedMemory || importedMemory.module !== 'env' || importedMemory.name !== 'memory') {
    fail(`${binary} must import env.memory`)
  }
  // Instantiation proves that the artifact requests shared, fixed-size memory.
  const sharedMemory = new WebAssembly.Memory({
    initial: 512,
    maximum: 512,
    shared: true,
  })
  const noop = () => 0
  await WebAssembly.instantiate(artifact.module, {
    env: {
      memory: sharedMemory,
      _emscripten_notify_mailbox_postmessage: noop,
      emscripten_check_blocking_allowed: noop,
      _emscripten_receive_on_main_thread_js: noop,
      _emscripten_init_main_thread_js: noop,
      _emscripten_thread_mailbox_await: noop,
      _emscripten_thread_set_strongref: noop,
      emscripten_exit_with_live_runtime: noop,
      _emscripten_thread_cleanup: noop,
    },
    wasi_snapshot_preview1: {
      clock_time_get: noop,
      proc_exit: noop,
      fd_close: noop,
      fd_write: noop,
      fd_seek: noop,
    },
  })
}

console.log(
  `check-wasm: OK (${binaryPaths.length} artifacts, additive/convolution/ring goldens passed)`,
)
