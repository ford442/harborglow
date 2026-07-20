/**
 * Smoke-test that MainSceneHelpers.tsx loads through the live Vite dev server
 * (@vitejs/plugin-react / Babel). Catches duplicate-declaration and other
 * parse errors that tsc + esbuild tolerate but break `npm run dev`.
 */
import { spawn } from 'node:child_process'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const PORT = 5174
const HOST = '127.0.0.1'

const MODULES = [
  '/src/scenes/mainScene/MainSceneHelpers.tsx',
  '/src/scenes/mainScene/nightLighting.tsx',
  '/src/scenes/mainScene/levaControls.ts',
  '/src/scenes/mainScene/shipFleet.tsx',
  '/src/scenes/mainScene/spectatorCamera.tsx',
  '/src/scenes/mainScene/underwaterEffects.tsx',
  '/src/scenes/MainScene.tsx',
]

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

  for (const moduleId of MODULES) {
    const { status, body } = await fetchModule(moduleId)
    if (status !== 200) {
      failed = true
      console.error(`✗ dev transform failed: ${moduleId} (HTTP ${status})`)
      if (body.includes('has already been declared')) {
        console.error('  Duplicate identifier — Babel parse error')
      }
      const snippet = body.slice(0, 400).replace(/\n/g, '\n  ')
      console.error(`  ${snippet}`)
      continue
    }
    if (body.includes('has already been declared')) {
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
