#!/usr/bin/env node
/**
 * Verify authored hero GLBs without a full GLTF decode (works on Draco assets).
 * Checks: file exists, root name, Empty_HP_* hardpoints in the glTF JSON,
 * emissive_/glow_ mesh names, and blueprint attachmentSocketMap coverage.
 *
 * Usage: node scripts/verify-ship-glb.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const shipsJson = JSON.parse(fs.readFileSync(path.join(root, 'src/blueprints/ships.json'), 'utf8'))

/** Read the JSON chunk of a binary GLB (no mesh decode required). */
function readGlbJson(filePath) {
  const buf = fs.readFileSync(filePath)
  if (buf.toString('utf8', 0, 4) !== 'glTF') {
    throw new Error(`${filePath} is not a GLB`)
  }
  const jsonChunkLength = buf.readUInt32LE(12)
  const jsonChunkType = buf.readUInt32LE(16)
  if (jsonChunkType !== 0x4e4f534a) {
    // 'JSON'
    throw new Error(`${filePath}: first chunk is not JSON`)
  }
  const jsonText = buf.toString('utf8', 20, 20 + jsonChunkLength).replace(/\0+$/, '')
  return JSON.parse(jsonText)
}

function collectNodeNames(gltf) {
  return (gltf.nodes ?? []).map((n) => n.name || '').filter(Boolean)
}

function collectMeshNames(gltf) {
  return (gltf.meshes ?? []).map((m) => m.name || '').filter(Boolean)
}

function collectMaterialNames(gltf) {
  return (gltf.materials ?? []).map((m) => m.name || '').filter(Boolean)
}

let failed = 0

function verify(shipId) {
  const bp = shipsJson.ships.find((s) => s.id === shipId)
  if (!bp?.model?.url) {
    console.error(`✗ ${shipId}: no model block`)
    failed++
    return
  }
  const filename = bp.model.url.replace('./models/', '')
  const filePath = path.join(root, 'public/models', filename)
  if (!fs.existsSync(filePath)) {
    console.error(`✗ ${shipId}: missing ${filename}`)
    failed++
    return
  }

  const gltf = readGlbJson(filePath)
  const nodeNames = collectNodeNames(gltf)
  const meshNames = collectMeshNames(gltf)
  const materialNames = collectMaterialNames(gltf)
  const allNames = new Set([...nodeNames, ...meshNames, ...materialNames])

  const rootName = `${shipId}_root`
  const hasRoot = nodeNames.includes(rootName)
  const hardpoints = nodeNames.filter((n) => n.startsWith('Empty_HP_'))
  const emissives = [...allNames].filter(
    (n) => n.toLowerCase().startsWith('emissive_') || n.toLowerCase().startsWith('glow_'),
  )

  const socketMap = bp.model.attachmentSocketMap ?? {}
  const mapped = new Set(Object.values(socketMap))
  const missingAttach = bp.attachmentPoints.filter((id) => !mapped.has(id))
  const unresolvedNodes = Object.keys(socketMap).filter((n) => !nodeNames.includes(n))

  const kb = (fs.statSync(filePath).size / 1024).toFixed(1)
  const ok =
    hasRoot &&
    hardpoints.length > 0 &&
    emissives.length > 0 &&
    missingAttach.length === 0 &&
    unresolvedNodes.length === 0

  const flag = ok ? '✓' : '✗'
  console.log(
    `${flag} ${filename} — ${kb} KB, ${hardpoints.length} hardpoints, ${emissives.length} emissive names`,
  )
  if (!hasRoot) console.log(`    missing root node ${rootName}`)
  if (missingAttach.length) console.log(`    socket map missing attachment ids: ${missingAttach.join(', ')}`)
  if (unresolvedNodes.length) console.log(`    socket map nodes not in GLB: ${unresolvedNodes.join(', ')}`)
  if (!ok) failed++
}

function main() {
  const ids = shipsJson.ships.filter((s) => s.model?.url).map((s) => s.id)
  for (const id of ids) verify(id)
  if (failed) {
    console.error(`\n${failed} ship(s) failed verification`)
    process.exit(1)
  }
  console.log(`\nAll ${ids.length} authored models verified.`)
}

main()
