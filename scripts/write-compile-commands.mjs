#!/usr/bin/env node
/**
 * Emit cpp/compile_commands.json for clangd (gitignored).
 * Usage: node scripts/write-compile-commands.mjs
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cppDir = join(root, 'cpp')

const nativeWarn = [
  '-Wall', '-Wextra', '-Wshadow', '-Wconversion', '-Werror=return-type',
]
const nativeCc = process.env.NATIVE_CC ?? 'cc'
const nativeCxx = process.env.NATIVE_CXX ?? 'c++'
const emxx = process.env.EMXX ?? 'em++'

const nativeCpp = [
  'harborglow_dsp.cpp',
  'harborglow_audio_engine.cpp',
  'tests/dsp_native_test.cpp',
  'tests/dsp_bench.cpp',
  'tests/audio_engine_native_test.cpp',
]
const nativeC = ['dsp_ring_buffer.c']

/** @type {Array<{ directory: string, file: string, arguments: string[] }>} */
const entries = []

for (const file of nativeCpp) {
  entries.push({
    directory: cppDir,
    file: join(cppDir, file),
    arguments: [nativeCxx, '-std=c++17', '-I.', ...nativeWarn, '-c', file],
  })
}

for (const file of nativeC) {
  entries.push({
    directory: cppDir,
    file: join(cppDir, file),
    arguments: [nativeCc, '-std=c11', '-I.', ...nativeWarn, '-c', file],
  })
}

for (const file of ['harborglow_dsp.cpp', 'harborglow_audio_engine.cpp', 'dsp_ring_buffer.c']) {
  const std = file.endsWith('.c') ? '-std=c11' : '-std=c++17'
  entries.push({
    directory: cppDir,
    file: join(cppDir, file),
    arguments: [
      emxx, std, '-I.', ...nativeWarn, '-s', 'STANDALONE_WASM=1',
      '--no-entry', '-msimd128', '-matomics', '-c', file,
    ],
  })
}

writeFileSync(
  join(cppDir, 'compile_commands.json'),
  `${JSON.stringify(entries, null, 2)}\n`,
)
console.log('wrote cpp/compile_commands.json')
