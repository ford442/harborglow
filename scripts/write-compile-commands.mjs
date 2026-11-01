#!/usr/bin/env node
/**
 * Emit cpp/compile_commands.json for clangd / clang-tidy (gitignored).
 *
 * One entry per translation unit, clang-like argv (not em++; clangd copes
 * badly with the em++ driver):
 *   - shipping sources  → wasm32 entry, so __wasm_simd128__ is defined and
 *                         the DSP_HAS_SIMD blocks index as active
 *   - cpp/tests/*.cpp   → host entry (native-only tests)
 *
 * Usage: node scripts/write-compile-commands.mjs [--check]
 *   --check  assert the generated database is well-formed without writing
 *            it (CI guard against losing the wasm target triple).
 */
import { existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cppDir = join(root, 'cpp')

const warn = ['-Wall', '-Wextra', '-Wshadow', '-Wconversion', '-Werror=return-type']
const clang = process.env.CLANG ?? 'clang'
const clangxx = process.env.CLANGXX ?? 'clang++'
const nativeCc = process.env.NATIVE_CC ?? 'cc'
const nativeCxx = process.env.NATIVE_CXX ?? 'c++'

export const WASM_TARGET = 'wasm32-unknown-emscripten'
export const SHIPPING_SOURCES = [
  'harborglow_dsp.cpp',
  'harborglow_audio_engine.cpp',
  'dsp_ring_buffer.c',
]
const HOST_SOURCES = [
  'tests/dsp_native_test.cpp',
  'tests/dsp_bench.cpp',
  'tests/audio_engine_native_test.cpp',
  'tests/audio_engine_header_c.c',
]

// Emscripten sysroot for libc headers, when an emsdk is active.
// wasm_simd128.h itself is a clang builtin header and needs no sysroot.
const sysroot = process.env.EMSDK
  ? join(process.env.EMSDK, 'upstream/emscripten/cache/sysroot')
  : null

const isC = (f) => f.endsWith('.c')

function wasmEntry(file) {
  return {
    directory: cppDir,
    file: join(cppDir, file),
    arguments: [
      isC(file) ? clang : clangxx,
      `--target=${WASM_TARGET}`,
      ...(sysroot && existsSync(sysroot)
        // Same include setup em++ uses (see `em++ --cflags`).
        ? [`--sysroot=${sysroot}`, '-Xclang', '-iwithsysroot/include/compat']
        : []),
      isC(file) ? '-std=c11' : '-std=c++17',
      '-I.', ...warn,
      '-msimd128', '-matomics', '-mbulk-memory',
      '-DDSP_EXPORT=', '-DEMSCRIPTEN_KEEPALIVE=',
      '-c', file,
    ],
  }
}

function hostEntry(file) {
  return {
    directory: cppDir,
    file: join(cppDir, file),
    arguments: [
      isC(file) ? nativeCc : nativeCxx,
      isC(file) ? '-std=c11' : '-std=c++17',
      '-I.', ...warn, '-c', file,
    ],
  }
}

export function buildEntries() {
  return [...SHIPPING_SOURCES.map(wasmEntry), ...HOST_SOURCES.map(hostEntry)]
}

function check(entries) {
  const errors = []
  const seen = new Set()
  for (const e of entries) {
    if (seen.has(e.file)) errors.push(`duplicate entry for ${e.file}`)
    seen.add(e.file)
  }
  for (const src of SHIPPING_SOURCES) {
    const e = entries.find((x) => x.file === join(cppDir, src))
    if (!e) errors.push(`missing entry for ${src}`)
    else if (!e.arguments.some((a) => a.startsWith('--target=wasm32'))) {
      errors.push(`${src}: wasm entry lost its --target=wasm32* triple`)
    } else if (!e.arguments.includes('-msimd128')) {
      errors.push(`${src}: wasm entry lost -msimd128`)
    }
  }
  return errors
}

const entries = buildEntries()
const errors = check(entries)
if (errors.length) {
  for (const e of errors) console.error(`write-compile-commands: ${e}`)
  process.exit(1)
}
if (process.argv.includes('--check')) {
  console.log(`write-compile-commands: OK (${entries.length} entries)`)
} else {
  writeFileSync(join(cppDir, 'compile_commands.json'), `${JSON.stringify(entries, null, 2)}\n`)
  console.log('wrote cpp/compile_commands.json')
}
