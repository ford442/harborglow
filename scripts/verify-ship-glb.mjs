#!/usr/bin/env node
/**
 * Verify authored hero GLBs by reading the glTF JSON chunk only — no mesh
 * decode, no glTF library, no network. Checks: file exists, root name,
 * Empty_HP_* hardpoints, emissive_/glow_ names, attachment socket resolution
 * (shared with the runtime), draw-call budgets, banned compression extensions,
 * SHIP_MODEL_FILENAMES vs disk, icebreaker exist-gate, gzip size budgets.
 *
 * Usage: node scripts/verify-ship-glb.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { checkGlbSizes, parseShipModelFilenames, ROOT } from './check-glb-size.mjs'
import { resolveSocketName } from '../src/ships/shipSocketResolution.mjs'

// ---------------------------------------------------------------------------
// Draw-call budgets
//
// Gate what costs frames, not what costs bytes. A glTF primitive is one draw
// call and a distinct material is one state change; file size predicts neither
// (oil_tanker.glb is 46 kB and 17 draw calls). Byte size is reported below and
// separately gated on gzip by check-glb-size.mjs.
//
// Seeded from the 12-model baseline (max 44 primitives / 17 materials per hull,
// 201 fleet primitives) with room for authored hulls, which legitimately carry
// more primitives while good atlasing should *lower* material counts.
// ---------------------------------------------------------------------------
const MAX_PRIMITIVES_PER_MODEL = 64
const MAX_MATERIALS_PER_MODEL = 24
const MAX_FLEET_PRIMITIVES = 320

/**
 * Compression extensions that must never reach a committed asset. Draco needs a
 * separately hosted WASM decoder; the runtime deliberately has no decoder path
 * (see src/ships/configureGltfLoader.ts), so a Draco GLB would silently fall
 * back to a procedural hull. Meshopt decodes with a module bundled in three.
 */
const BANNED_EXTENSIONS = ['KHR_draco_mesh_compression']

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

/** Draw calls: one per mesh primitive. */
function countPrimitives(gltf) {
  return (gltf.meshes ?? []).reduce((sum, mesh) => sum + (mesh.primitives?.length ?? 0), 0)
}

function bannedExtensions(gltf) {
  const used = new Set([...(gltf.extensionsUsed ?? []), ...(gltf.extensionsRequired ?? [])])
  return BANNED_EXTENSIONS.filter((ext) => used.has(ext))
}

/** Per-model budget rows, printed as a table after the socket checks. */
const budgetRows = []

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
  // Resolution order is shared with the runtime (src/ships/extractAttachmentPoints.ts),
  // so a convention-named model with no socket map verifies exactly as it renders.
  const missingAttach = (bp.attachmentPoints ?? []).filter(
    (id) => resolveSocketName(id, nodeNames, socketMap) === null,
  )
  // A declared socket node that is absent from the GLB is still a hard failure:
  // it is a typo in the blueprint, not a convention fallback.
  const unresolvedNodes = Object.keys(socketMap).filter((n) => !nodeNames.includes(n))

  const primitives = countPrimitives(gltf)
  const materialCount = (gltf.materials ?? []).length
  const banned = bannedExtensions(gltf)
  const bytes = fs.statSync(filePath).size
  const kb = (bytes / 1024).toFixed(1)
  budgetRows.push({ filename, bytes, primitives, materials: materialCount })

  const overPrimitives = primitives > MAX_PRIMITIVES_PER_MODEL
  const overMaterials = materialCount > MAX_MATERIALS_PER_MODEL

  const ok =
    hasRoot &&
    hardpoints.length > 0 &&
    emissives.length > 0 &&
    missingAttach.length === 0 &&
    unresolvedNodes.length === 0 &&
    banned.length === 0 &&
    !overPrimitives &&
    !overMaterials

  const flag = ok ? '✓' : '✗'
  console.log(
    `${flag} ${filename} — ${kb} KB, ${hardpoints.length} hardpoints, ${emissives.length} emissive names`,
  )
  if (!hasRoot) console.log(`    missing root node ${rootName}`)
  if (missingAttach.length) console.log(`    socket map missing attachment ids: ${missingAttach.join(', ')}`)
  if (unresolvedNodes.length) console.log(`    socket map nodes not in GLB: ${unresolvedNodes.join(', ')}`)
  if (hardpoints.length === 0) console.log('    no Empty_HP_* hardpoint nodes')
  if (emissives.length === 0) console.log('    no emissive_/glow_ names')
  if (banned.length)
    console.log(
      `    banned compression extension(s): ${banned.join(', ')} — re-export uncompressed or with meshopt`,
    )
  if (overPrimitives)
    console.log(
      `    ${primitives} primitives (≈draw calls) exceeds the per-model cap of ${MAX_PRIMITIVES_PER_MODEL}`,
    )
  if (overMaterials)
    console.log(`    ${materialCount} materials exceeds the per-model cap of ${MAX_MATERIALS_PER_MODEL}`)
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
  const gltf = readGlbJson(ICEBREAKER_GLB)
  const nodeNames = collectNodeNames(gltf)

  const missingAttach = ICEBREAKER_ATTACHMENTS.filter(
    (id) => resolveSocketName(id, nodeNames, socketMap) === null,
  )
  if (missingAttach.length) {
    console.error(`✗ icebreaker attachment ids unresolvable in GLB: ${missingAttach.join(', ')}`)
    failed++
  }
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

/**
 * Report bytes, gate draw calls. Ships spawn together, so the fleet primitive
 * total is the number that decides whether a full harbour holds frame rate.
 */
function reportDrawCallBudgets() {
  console.log('\nDraw-call budgets (primitives ≈ draw calls; KB reported, not gated)')
  const pad = Math.max(...budgetRows.map((r) => r.filename.length), 8)
  console.log(
    `  ${'file'.padEnd(pad)}  ${'KB'.padStart(7)}  ${'prims'.padStart(6)}/${MAX_PRIMITIVES_PER_MODEL}  ${'mats'.padStart(5)}/${MAX_MATERIALS_PER_MODEL}`,
  )
  let fleetPrimitives = 0
  for (const row of budgetRows) {
    fleetPrimitives += row.primitives
    const over = row.primitives > MAX_PRIMITIVES_PER_MODEL || row.materials > MAX_MATERIALS_PER_MODEL
    console.log(
      `  ${over ? '✗' : '✓'} ${row.filename.padEnd(pad)}  ${(row.bytes / 1024).toFixed(1).padStart(7)}  ${String(row.primitives).padStart(6)}     ${String(row.materials).padStart(5)}`,
    )
  }
  if (fleetPrimitives > MAX_FLEET_PRIMITIVES) {
    console.error(
      `✗ fleet total ${fleetPrimitives} primitives exceeds the fleet cap of ${MAX_FLEET_PRIMITIVES} — the whole fleet can spawn at once`,
    )
    failed++
  } else {
    console.log(
      `✓ fleet total ${fleetPrimitives} primitives across ${budgetRows.length} models (cap ${MAX_FLEET_PRIMITIVES})`,
    )
  }
}

function main() {
  const filenamesMap = parseShipModelFilenames()
  const ids = shipsJson.ships.filter((s) => s.model?.url).map((s) => s.id)
  for (const id of ids) verify(id)
  verifyFilenameMapOnDisk(filenamesMap)
  verifyIcebreakerExistGate(filenamesMap)
  reportDrawCallBudgets()

  console.log('\nGLB gzip size budgets')
  failed += checkGlbSizes()

  if (failed) {
    console.error(`\n${failed} check(s) failed`)
    process.exit(1)
  }
  console.log(`\nAll ${ids.length} authored models verified (sockets, registry, size).`)
}

main()
