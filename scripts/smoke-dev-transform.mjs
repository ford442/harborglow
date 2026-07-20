/**
 * Smoke-test that source modules load through the live Vite dev server
 * (@vitejs/plugin-react / Babel). Catches duplicate-declaration and other
 * parse errors that tsc + esbuild tolerate but break `npm run dev`.
 *
 * Uses a real `vite dev` process (not transformRequest) so the gate tracks
 * the same pipeline as local development. When upgrading to Vite 8 + Oxc,
 * re-validate this script against the new dev transform path.
 */
import { spawn } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const PORT = 5174
const HOST = '127.0.0.1'

const SOURCE_ROOTS = [
  path.join(root, 'src/scenes'),
  path.join(root, 'src/store'),
]

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])

/** Recursively collect /src/... module URLs under scenes/ and store/. */
function collectModuleUrls(dir) {
  const urls = []
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue
    const fullPath = path.join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      urls.push(...collectModuleUrls(fullPath))
      continue
    }
    if (!SOURCE_EXTENSIONS.has(path.extname(entry))) continue
    const rel = path.relative(root, fullPath).split(path.sep).join('/')
    urls.push(`/${rel}`)
  }
  return urls.sort()
}

const MODULES = SOURCE_ROOTS.flatMap(collectModuleUrls)

function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get(url, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode < 500) {
          resolve(undefined)
          return
        }
        if (Date.now() >= deadline) {
          reject(new Error(`Server not ready (status ${res.statusCode})`))
          return
        }
        setTimeout(attempt, 250)
      }).on('error', () => {
        if (Date.now() >= deadline) {
          reject(new Error('Timed out waiting for Vite dev server'))
          return
        }
        setTimeout(attempt, 250)
      })
    }
    attempt()
  })
}

function fetchModule(modulePath) {
  return new Promise((resolve, reject) => {
    const url = `http://${HOST}:${PORT}${modulePath}`
    http.get(url, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        resolve({ status: res.statusCode ?? 0, body })
      })
    }).on('error', reject)
  })
}

const dev = spawn('npx', ['vite', '--host', HOST, '--port', String(PORT), '--strictPort'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, FORCE_COLOR: '0' },
})

let failed = false
let stderr = ''

dev.stderr.on('data', (chunk) => {
  stderr += chunk.toString()
})

try {
  await waitForServer(`http://${HOST}:${PORT}/`)
  console.log(`Dev-transform smoke: checking ${MODULES.length} modules under src/scenes and src/store`)

  for (const moduleId of MODULES) {
    const { status, body } = await fetchModule(moduleId)
    if (status !== 200) {
      failed = true
      console.error(`✗ dev transform failed: ${moduleId} (HTTP ${status})`)
      if (body.includes('has already been declared') || body.includes('Multiple exports with the same name')) {
        console.error('  Duplicate identifier — Babel parse error')
      }
      const snippet = body.slice(0, 400).replace(/\n/g, '\n  ')
      console.error(`  ${snippet}`)
      continue
    }
    if (
      body.includes('has already been declared')
      || body.includes('Multiple exports with the same name')
    ) {
      failed = true
      console.error(`✗ dev transform failed: ${moduleId}`)
      console.error('  Response contains duplicate-declaration error')
      continue
    }
    console.log(`✓ dev transform OK: ${moduleId}`)
  }
} catch (err) {
  failed = true
  const message = err instanceof Error ? err.message : String(err)
  console.error(`✗ smoke test setup failed: ${message}`)
  if (stderr) console.error(stderr.slice(-2000))
} finally {
  if (!dev.killed) {
    dev.kill('SIGKILL')
  }
  await Promise.race([
    new Promise((resolve) => dev.on('close', resolve)),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ])
}

if (failed) {
  process.exit(1)
}
