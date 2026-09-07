#!/usr/bin/env node
/**
 * Verify authored hero GLBs without a full GLTF decode (works on Draco assets).
 * Checks: file exists, root name, Empty_HP_* hardpoints in the glTF JSON,
 * emissive_/glow_ mesh names, blueprint attachmentSocketMap coverage,
 * SHIP_MODEL_FILENAMES vs disk, icebreaker exist-gate, gzip size budgets.
 *
 * Usage: node scripts/verify-ship-glb.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { checkGlbSizes, parseShipModelFilenames, ROOT } from './check-glb-size.mjs'

const root = ROOT
const shipsJson = JSON.parse(fs.readFileSync(path.join(root, 'src/blueprints/ships.json'), 'utf8'))
const MODELS_DIR = path.join(root, 'public', 'models')
const ICEBREAKER_GLB = path.join(MODELS_DIR, 'icebreaker.glb')
const ICEBREAKER_ATTACHMENTS = [
  'funnelMain',
  'heliDeck',
  'towingNotch',
  'bridge',
  'secondaryCrane',
  'secondaryStack',
  'mastArray',
  'spoonBow',
]

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
  const missingAttach = (bp.attachmentPoints ?? []).filter((id) => !mapped.has(id))
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
  if (hardpoints.length === 0) console.log('    no Empty_HP_* hardpoint nodes')
  if (emissives.length === 0) console.log('    no emissive_/glow_ names')
  if (!ok) failed++
}

function verifyFilenameMapOnDisk(filenamesMap) {
  console.log('\nSHIP_MODEL_FILENAMES vs public/models/')
  for (const [shipType, filename] of Object.entries(filenamesMap)) {
    const filePath = path.join(MODELS_DIR, filename)
    if (!fs.existsSync(filePath)) {
      console.error(`✗ ${shipType}: SHIP_MODEL_FILENAMES lists ${filename} but file is missing`)
      failed++
    } else {
      console.log(`✓ ${shipType} → ${filename}`)
    }
  }
}

function verifyIcebreakerExistGate(filenamesMap) {
  console.log('\nIcebreaker exist-gate')
  const filePresent = fs.existsSync(ICEBREAKER_GLB)
  const inMap = Object.prototype.hasOwnProperty.call(filenamesMap, 'icebreaker')
  const bp = shipsJson.ships.find((s) => s.id === 'icebreaker')
  const hasModelBlock = Boolean(bp?.model)

  if (!filePresent) {
    let ok = true
    if (inMap) {
      console.error('✗ icebreaker is in SHIP_MODEL_FILENAMES but public/models/icebreaker.glb is absent')
      failed++
      ok = false
    }
    if (hasModelBlock) {
      console.error('✗ icebreaker ships.json has a model block but public/models/icebreaker.glb is absent')
      failed++
      ok = false
    }
    if (ok) {
      console.log('✓ icebreaker.glb absent — procedural only (not in registry / no model block)')
    }
    return
  }

  if (filenamesMap.icebreaker !== 'icebreaker.glb') {
    console.error("✗ icebreaker.glb present but SHIP_MODEL_FILENAMES must include icebreaker: 'icebreaker.glb'")
    failed++
  } else {
    console.log("✓ SHIP_MODEL_FILENAMES.icebreaker = 'icebreaker.glb'")
  }

  if (!hasModelBlock) {
    console.error('✗ icebreaker.glb present but ships.json icebreaker has no model block')
    failed++
    return
  }

  const socketMap = bp.model.attachmentSocketMap ?? {}
  const mapped = new Set(Object.values(socketMap))
  const missingAttach = ICEBREAKER_ATTACHMENTS.filter((id) => !mapped.has(id))
  if (missingAttach.length) {
    console.error(`✗ icebreaker socket map missing attachment ids: ${missingAttach.join(', ')}`)
    failed++
  }

  const gltf = readGlbJson(ICEBREAKER_GLB)
  const nodeNames = collectNodeNames(gltf)
  if (!nodeNames.includes('icebreaker_root')) {
    console.error('✗ icebreaker.glb missing root node icebreaker_root')
    failed++
  }
  const hardpoints = nodeNames.filter((n) => n.startsWith('Empty_HP_'))
  if (hardpoints.length < 8) {
    console.error(`✗ icebreaker.glb needs ≥8 Empty_HP_* nodes, found ${hardpoints.length}`)
    failed++
  }
  const unresolvedNodes = Object.keys(socketMap).filter((n) => !nodeNames.includes(n))
  if (unresolvedNodes.length) {
    console.error(`✗ icebreaker socket map nodes not in GLB: ${unresolvedNodes.join(', ')}`)
    failed++
  }
}

function main() {
  const filenamesMap = parseShipModelFilenames()
  const ids = shipsJson.ships.filter((s) => s.model?.url).map((s) => s.id)
  for (const id of ids) verify(id)
  verifyFilenameMapOnDisk(filenamesMap)
  verifyIcebreakerExistGate(filenamesMap)

  console.log('\nGLB gzip size budgets')
  failed += checkGlbSizes()

  if (failed) {
    console.error(`\n${failed} check(s) failed`)
    process.exit(1)
  }
  console.log(`\nAll ${ids.length} authored models verified (sockets, registry, size).`)
}

main()
