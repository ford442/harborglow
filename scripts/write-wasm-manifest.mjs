#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sources = [
  'cpp/harborglow_dsp.cpp',
  'cpp/harborglow_dsp.h',
  'cpp/harborglow_audio_engine.cpp',
  'cpp/harborglow_audio_engine.h',
  'cpp/dsp_ring_buffer.c',
  'cpp/dsp_ring_buffer.h',
  'cpp/Makefile',
  'cpp/build.sh',
]
const binaries = [
  'public/wasm/harborglow_dsp.wasm',
  'public/wasm/harborglow_audio_shared.wasm',
  'public/wasm/harborglow_audio_shared_simd.wasm',
]

function digest(path, algorithm) {
  return createHash(algorithm).update(readFileSync(join(root, path))).digest('hex')
}

const sourceMd5 = createHash('md5')
for (const source of sources) {
  sourceMd5.update(source)
  sourceMd5.update('\0')
  sourceMd5.update(readFileSync(join(root, source)))
  sourceMd5.update('\0')
}

let emscripten = 'unknown'
try {
  emscripten = execFileSync('em++', ['--version'], { encoding: 'utf8' })
    .split('\n')[0]
    .trim()
} catch {
  // The artifact remains verifiable on machines without the compiler.
}

const manifest = {
  schema: 1,
  sourceMd5: sourceMd5.digest('hex'),
  sources: Object.fromEntries(sources.map((source) => [source, digest(source, 'md5')])),
  binaries: Object.fromEntries(binaries.map((binary) => [binary, {
    bytes: readFileSync(join(root, binary)).byteLength,
    sha256: digest(binary, 'sha256'),
  }])),
  toolchain: emscripten,
}

writeFileSync(
  join(root, 'public/wasm/manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
)
console.log(`write-wasm-manifest: ${manifest.sourceMd5}`)
