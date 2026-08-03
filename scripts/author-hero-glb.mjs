#!/usr/bin/env node
/**
 * Author retopo'd hero GLB hulls for HarborGlow.
 *
 * Unlike `generate-ship-glb.mjs` (1:1 blueprint box dump), this script builds
 * ship-like meshes: lofted hulls, beveled decks, window/emissive slots, and
 * artist-named hardpoint empties (Empty_HP_*) that blueprints map via
 * `model.attachmentSocketMap`.
 *
 * Usage: node scripts/author-hero-glb.mjs
 * Output: public/models/{cruise_liner,container_vessel,oil_tanker,fireboat,lng_carrier}.glb
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// GLTFExporter expects browser FileReader when writing binary GLBs.
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class FileReader {
    constructor() {
      this.result = null
      this.onloadend = null
    }
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buffer) => {
        this.result = buffer
        this.onloadend?.({ target: this })
      })
    }
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'public/models')

/** @typedef {{ id: string; position: [number, number, number]; rotation?: [number, number, number] }} Hardpoint */

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

function mat(hex, opts = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    metalness: opts.metalness ?? 0.45,
    roughness: opts.roughness ?? 0.55,
    emissive: new THREE.Color(opts.emissive ?? '#000000'),
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    name: opts.name ?? '',
  })
  return m
}

function emissiveMat(hex, glowHex, name) {
  return mat(hex, {
    name,
    emissive: glowHex,
    emissiveIntensity: 0.35,
    metalness: 0.2,
    roughness: 0.4,
  })
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function meshFromGeo(geo, material, name, position, rotation) {
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, material)
  mesh.name = name
  if (position) mesh.position.set(...position)
  if (rotation) mesh.rotation.set(...rotation)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** Beveled box — reads as authored plating rather than a raw BoxGeometry. */
function beveledBox(w, h, d, bevel = 0.15, segments = 2) {
  const geo = new THREE.BoxGeometry(w, h, d, segments, segments, segments)
  const pos = geo.attributes.position
  const hw = w / 2
  const hh = h / 2
  const hd = d / 2
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const ax = Math.abs(x)
    const ay = Math.abs(y)
    const az = Math.abs(z)
    // Pull edge vertices inward slightly for a soft bevel cue.
    if (ax > hw - bevel && ay > hh - bevel) {
      const sx = Math.sign(x) || 1
      const sy = Math.sign(y) || 1
      pos.setX(i, sx * (hw - bevel * 0.35))
      pos.setY(i, sy * (hh - bevel * 0.35))
    }
    if (ax > hw - bevel && az > hd - bevel) {
      const sx = Math.sign(x) || 1
      const sz = Math.sign(z) || 1
      pos.setX(i, sx * (hw - bevel * 0.35))
      pos.setZ(i, sz * (hd - bevel * 0.35))
    }
    if (ay > hh - bevel && az > hd - bevel) {
      const sy = Math.sign(y) || 1
      const sz = Math.sign(z) || 1
      pos.setY(i, sy * (hh - bevel * 0.35))
      pos.setZ(i, sz * (hd - bevel * 0.35))
    }
  }
  pos.needsUpdate = true
  return geo
}

/**
 * Lofted ship hull along +Z (bow). Stations are half-breadth profiles.
 * Returns merged BufferGeometry centered at origin.
 */
function loftHull({
  length,
  beam,
  depth,
  stations = 64,
  halfSections = 18,
  bowFraction = 0.22,
  sternFraction = 0.12,
  flare = 0.18,
}) {
  const positions = []
  const indices = []
  const uvs = []

  const halfLen = length / 2
  const rows = stations + 1
  const cols = halfSections * 2 + 1

  for (let si = 0; si < rows; si++) {
    const t = si / stations
    const z = -halfLen + t * length

    // Longitudinal half-breadth envelope (pointed bow, fuller mid, rounded stern).
    let breadthScale = 1
    if (t > 1 - bowFraction) {
      const bt = (t - (1 - bowFraction)) / bowFraction
      breadthScale = Math.sqrt(Math.max(0, 1 - bt * bt))
    } else if (t < sternFraction) {
      const st = 1 - t / sternFraction
      breadthScale = 0.55 + 0.45 * Math.cos(st * Math.PI * 0.5)
    }

    // Deck camber + bilge radius via polar sections.
    for (let ci = 0; ci < cols; ci++) {
      const u = ci / (cols - 1) // 0 = port keel→deck, 1 = stbd
      const side = u <= 0.5 ? -1 : 1
      const localU = u <= 0.5 ? u * 2 : (1 - u) * 2 // 0 at outer, 1 at centerline remap
      // Remap: walk from deck edge down around bilge to keel.
      const angle = (1 - localU) * Math.PI * 0.5 // 0 at deck → π/2 at keel
      const halfBeam = (beam / 2) * breadthScale * (1 + flare * Math.max(0, Math.cos(angle)))
      const x = side * halfBeam * Math.sin(angle + 0.001)
      // Waterline at y=0; keel at -depth*0.55, deck sheer at +depth*0.45.
      const keelY = -depth * 0.55
      const deckY = depth * 0.42
      const y = THREE.MathUtils.lerp(deckY, keelY, Math.sin(angle))
      // Slight bow rise.
      const sheer = t > 1 - bowFraction ? (t - (1 - bowFraction)) / bowFraction * depth * 0.12 : 0

      positions.push(x, y + sheer, z)
      uvs.push(t, u)
    }
  }

  for (let si = 0; si < stations; si++) {
    for (let ci = 0; ci < cols - 1; ci++) {
      const a = si * cols + ci
      const b = a + 1
      const c = (si + 1) * cols + ci
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }

  // Cap deck as a flat strip (port→stbd along each station top = ci where angle~0).
  // Deck vertices are at ci = 0 (port deck) and ci = cols-1 (stbd deck).
  const deckIndices = []
  for (let si = 0; si < stations; si++) {
    const p0 = si * cols
    const p1 = (si + 1) * cols
    const s0 = si * cols + (cols - 1)
    const s1 = (si + 1) * cols + (cols - 1)
    deckIndices.push(p0, s0, p1, p1, s0, s1)
  }

  const hull = new THREE.BufferGeometry()
  hull.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  hull.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  hull.setIndex(indices.concat(deckIndices))
  hull.computeVertexNormals()
  return hull
}

function cylinderGeo(rTop, rBot, h, radial = 16) {
  return new THREE.CylinderGeometry(rTop, rBot, h, radial, 1, false)
}

/**
 * Dense window-pane grid on a vertical plane (adds authored close-up detail).
 * Panes use a static emissive material (not night-driven slots) so we don't
 * clone hundreds of MeshStandardMaterials per ship instance.
 * plane: 'x' = port/stbd hull face (offset along ±X), 'z' = forward/aft face.
 */
function addWindowGrid(parent, {
  origin,
  plane = 'x',
  cols = 12,
  rows = 3,
  paneW = 0.7,
  paneH = 0.55,
  gapX = 0.25,
  gapY = 0.35,
  material,
  namePrefix = 'window_pane',
}) {
  const [ox, oy, oz] = origin
  const totalW = cols * paneW + (cols - 1) * gapX
  const totalH = rows * paneH + (rows - 1) * gapY
  // One shared material — not an emissive_* slot name.
  const paneMat =
    material?.name && !isEmissiveSlotNameSafe(material.name)
      ? material
      : mat('#1a2a3a', {
          name: 'window_glass',
          emissive: '#ffcc66',
          emissiveIntensity: 0.25,
          metalness: 0.1,
          roughness: 0.35,
        })
  let n = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lx = -totalW / 2 + paneW / 2 + c * (paneW + gapX)
      const ly = -totalH / 2 + paneH / 2 + r * (paneH + gapY)
      let pos
      let geo
      if (plane === 'x') {
        geo = beveledBox(0.08, paneH, paneW, 0.01, 1)
        pos = [ox, oy + ly, oz + lx]
      } else {
        geo = beveledBox(paneW, paneH, 0.08, 0.01, 1)
        pos = [ox + lx, oy + ly, oz]
      }
      parent.add(meshFromGeo(geo, paneMat, `${namePrefix}_${n++}`, pos))
    }
  }
}

function isEmissiveSlotNameSafe(name) {
  const lower = String(name || '').toLowerCase()
  return lower.startsWith('emissive_') || lower.startsWith('glow_')
}

/** Thin longitudinal plating seams for silhouette breakup at crane distance. */
function addPlatingSeams(parent, { length, y, xOffsets, material, namePrefix = 'plate_seam' }) {
  xOffsets.forEach((x, i) => {
    parent.add(
      meshFromGeo(beveledBox(0.06, 0.12, length * 0.92, 0.01, 1), material, `${namePrefix}_${i}`, [x, y, 0]),
    )
  })
}

function addHardpoint(parent, name, position, rotation = [0, 0, 0]) {
  const empty = new THREE.Object3D()
  empty.name = name
  empty.position.set(...position)
  empty.rotation.set(...rotation)
  parent.add(empty)
  return empty
}

function countTriangles(root) {
  let tris = 0
  root.traverse((child) => {
    const mesh = /** @type {THREE.Mesh} */ (child)
    if (!mesh.isMesh || !mesh.geometry) return
    const geo = mesh.geometry
    const indexed = geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3
    tris += indexed
  })
  return Math.round(tris)
}

// ---------------------------------------------------------------------------
// Ship builders
// ---------------------------------------------------------------------------

function buildCruise() {
  const root = new THREE.Group()
  root.name = 'cruise_root'

  const hullPaint = mat('#0a2540', { metalness: 0.35, roughness: 0.6, name: 'hull_paint' })
  const deckPaint = mat('#1a3a5c', { metalness: 0.25, roughness: 0.7, name: 'deck_paint' })
  const whitePaint = mat('#e8eef5', { metalness: 0.15, roughness: 0.55, name: 'superstructure' })
  const funnelPaint = mat('#c45c26', { metalness: 0.4, roughness: 0.45, name: 'funnel_paint' })
  const windowGlow = emissiveMat('#1a2a3a', '#ffcc66', 'emissive_windows')
  const funnelGlow = emissiveMat('#882200', '#ffaa00', 'glow_funnel')

  root.add(meshFromGeo(loftHull({ length: 80, beam: 18, depth: 6, stations: 96, halfSections: 24 }), hullPaint, 'hull'))

  // Tiered decks (beveled)
  const decks = [
    { y: 2.2, w: 16, h: 2.4, d: 68 },
    { y: 4.8, w: 14, h: 2.2, d: 58 },
    { y: 7.2, w: 12, h: 2.0, d: 48 },
  ]
  decks.forEach((d, i) => {
    root.add(meshFromGeo(beveledBox(d.w, d.h, d.d, 0.2, 6), i === 0 ? deckPaint : whitePaint, `deck_${i + 1}`, [0, d.y, -2]))
  })

  // Bridge
  root.add(meshFromGeo(beveledBox(10, 5.5, 11, 0.25, 6), whitePaint, 'bridge', [0, 11, -18]))
  // Bridge window strip
  root.add(meshFromGeo(beveledBox(9.2, 1.4, 0.35, 0.05, 1), windowGlow, 'emissive_bridge_windows', [0, 11.5, -12.4]))
  addWindowGrid(root, {
    origin: [0, 11.2, -12.35],
    plane: 'z',
    cols: 10,
    rows: 2,
    paneW: 0.65,
    paneH: 0.5,
    material: windowGlow,
    namePrefix: 'window_bridge_pane',
  })

  addPlatingSeams(root, {
    length: 70,
    y: 0.5,
    xOffsets: [-8.5, -4, 4, 8.5],
    material: mat('#0c2a48', { name: 'plate' }),
  })

  // Balcony window strips along each deck side
  const balconyZs = [22, 8, -6, -20]
  balconyZs.forEach((z, i) => {
    for (const side of [-1, 1]) {
      root.add(
        meshFromGeo(
          beveledBox(0.25, 1.1, 10, 0.04, 1),
          windowGlow,
          `emissive_balcony_${side < 0 ? 'port' : 'stbd'}_${i}`,
          [side * 7.6, 4.2 + (i % 3) * 0.15, z],
        ),
      )
      addWindowGrid(root, {
        origin: [side * 7.55, 4.2, z],
        plane: 'x',
        cols: 8,
        rows: 2,
        paneW: 0.85,
        paneH: 0.4,
        gapX: 0.2,
        gapY: 0.25,
        material: windowGlow,
        namePrefix: `window_balc_${side < 0 ? 'p' : 's'}_${i}`,
      })
    }
  })

  // Funnels
  for (const [x, name] of [
    [-5, 'funnel_port'],
    [5, 'funnel_stbd'],
  ]) {
    root.add(meshFromGeo(cylinderGeo(1.8, 2.1, 7, 20), funnelPaint, name, [x, 13.5, -10]))
    root.add(meshFromGeo(cylinderGeo(1.5, 1.5, 1.2, 16), funnelGlow, `glow_${name}`, [x, 17.5, -10]))
  }

  // Lifeboat nests (silhouette detail)
  for (const z of [-5, 5, 15]) {
    for (const side of [-1, 1]) {
      root.add(meshFromGeo(beveledBox(2.2, 1.4, 5.5, 0.1, 2), mat('#ff6b6b', { name: 'lifeboat' }), `lifeboat_${side}_${z}`, [side * 8.5, 3.5, z]))
    }
  }

  /** @type {Hardpoint[]} */
  const hardpoints = [
    { id: 'Empty_HP_01', position: [-8.2, 4.5, 22] }, // balcony0 port fore
    { id: 'Empty_HP_02', position: [8.2, 4.5, 22] }, // balcony1 stbd fore
    { id: 'Empty_HP_03', position: [-8.2, 4.5, -18] }, // balcony5 port aft
    { id: 'Empty_HP_04', position: [8.2, 4.5, -18] }, // balcony6 stbd aft
    { id: 'Empty_HP_05', position: [-5, 17.2, -10] }, // funnel1
    { id: 'Empty_HP_06', position: [5, 17.2, -10] }, // funnel2
  ]
  for (const hp of hardpoints) addHardpoint(root, hp.id, hp.position)

  return root
}

function buildContainer() {
  const root = new THREE.Group()
  root.name = 'container_root'

  const hullPaint = mat('#1a1a2e', { metalness: 0.5, roughness: 0.65, name: 'hull_paint' })
  const deckPaint = mat('#2a2a3e', { roughness: 0.85, metalness: 0.3, name: 'deck_paint' })
  const bridgePaint = mat('#2a2a3e', { metalness: 0.35, roughness: 0.55, name: 'bridge_paint' })
  const cranePaint = mat('#ff8800', { metalness: 0.55, roughness: 0.4, name: 'crane_paint' })
  const ledGlow = emissiveMat('#003344', '#00ffff', 'emissive_led_strip')
  const mastGlow = emissiveMat('#330000', '#ff0000', 'glow_nav_mast')

  root.add(meshFromGeo(loftHull({ length: 110, beam: 24, depth: 5, stations: 100, halfSections: 22, bowFraction: 0.14, sternFraction: 0.1, flare: 0.1 }), hullPaint, 'hull'))
  root.add(meshFromGeo(beveledBox(23, 0.45, 106, 0.08, 4), deckPaint, 'deck', [0, 2.1, 0]))

  // Bridge island (aft offset port)
  root.add(meshFromGeo(beveledBox(10, 10, 14, 0.2, 6), bridgePaint, 'bridge', [-8, 8, 30]))
  root.add(meshFromGeo(cylinderGeo(0.45, 0.45, 6, 12), mastGlow, 'glow_mast', [-8, 15, 30]))
  addWindowGrid(root, {
    origin: [-8, 9, 37.1],
    plane: 'z',
    cols: 6,
    rows: 4,
    paneW: 1.0,
    paneH: 1.2,
    material: emissiveMat('#111122', '#6688aa', 'emissive_bridge_win'),
    namePrefix: 'window_bridge_pane',
  })
  addPlatingSeams(root, {
    length: 100,
    y: 0.8,
    xOffsets: [-11, 11],
    material: mat('#12122a', { name: 'plate' }),
  })

  // Cell-guide posts between stacks
  for (const z of [-28, -12, 4, 20, 36]) {
    for (const x of [-3.5, 3.5]) {
      root.add(meshFromGeo(beveledBox(0.35, 9, 0.35, 0.04, 2), mat('#555566', { metalness: 0.7, name: 'cellguide' }), `cellguide_${x}_${z}`, [x, 6.5, z]))
    }
  }

  // Deck LED strips
  root.add(meshFromGeo(beveledBox(0.28, 0.28, 100, 0.02, 1), ledGlow, 'emissive_led_port', [-11, 3, 0]))
  root.add(meshFromGeo(beveledBox(0.28, 0.28, 100, 0.02, 1), ledGlow, 'emissive_led_stbd', [11, 3, 0]))

  // Cranes
  const craneSpecs = [
    { x: -10, z: -25, armSide: 1 },
    { x: 10, z: -15, armSide: -1 },
  ]
  craneSpecs.forEach((c, i) => {
    root.add(meshFromGeo(beveledBox(1.5, 12, 1.5, 0.1, 2), cranePaint, `crane_tower_${i + 1}`, [c.x, 6, c.z]))
    root.add(meshFromGeo(beveledBox(10, 0.8, 0.8, 0.05, 1), cranePaint, `crane_arm_${i + 1}`, [c.x + c.armSide * 5, 11, c.z]))
  })

  // Container stacks — individual boxes with slight color variation
  const stackColors = ['#00ff88', '#ff6b6b', '#4ecdc4', '#ffe66d', '#ff00ff', '#00aaff']
  const stacks = [
    { x: -7, y: 5, z: -35, h: 7 },
    { x: 7, y: 4, z: -20, h: 5 },
    { x: -7, y: 6, z: -5, h: 9 },
    { x: 7, y: 5, z: 10, h: 7 },
    { x: -7, y: 4, z: 25, h: 5 },
    { x: 7, y: 6, z: 40, h: 8 },
  ]
  stacks.forEach((s, i) => {
    const layers = Math.max(2, Math.round(s.h / 2.4))
    for (let L = 0; L < layers; L++) {
      const isTop = L === layers - 1
      const paint = isTop
        ? emissiveMat('#111111', stackColors[i], `emissive_stack_${i + 1}`)
        : mat(stackColors[i], { metalness: 0.35, roughness: 0.55, name: `container_paint_${i + 1}` })
      root.add(
        meshFromGeo(
          beveledBox(6.8, 2.3, 8.6, 0.08, 2),
          paint,
          isTop ? `emissive_stack_${i + 1}` : `container_${i + 1}_${L}`,
          [s.x, 2.4 + L * 2.35, s.z],
        ),
      )
    }
  })

  const hardpoints = [
    { id: 'Empty_HP_01', position: [-7, 8.5, -35] }, // stack1
    { id: 'Empty_HP_02', position: [7, 6.5, -20] }, // stack2
    { id: 'Empty_HP_03', position: [-7, 10.5, -5] }, // stack3
    { id: 'Empty_HP_04', position: [7, 8.5, 10] }, // stack4
    { id: 'Empty_HP_05', position: [-7, 6.5, 25] }, // stack5
    { id: 'Empty_HP_06', position: [7, 10, 40] }, // stack6
    { id: 'Empty_HP_07', position: [-10, 12, -25] }, // crane1
    { id: 'Empty_HP_08', position: [10, 12, -15] }, // crane2
    { id: 'Empty_HP_09', position: [-8, 18, 30] }, // mast
  ]
  for (const hp of hardpoints) addHardpoint(root, hp.id, hp.position)

  return root
}

function buildTanker() {
  const root = new THREE.Group()
  root.name = 'tanker_root'

  const hullPaint = mat('#0f0f1a', { metalness: 0.55, roughness: 0.5, name: 'hull_paint' })
  const deckPaint = mat('#1a1a28', { roughness: 0.8, metalness: 0.4, name: 'deck_paint' })
  const accomPaint = mat('#1a1a2e', { metalness: 0.35, roughness: 0.55, name: 'accommodation' })
  const pipePaint = mat('#444455', { metalness: 0.7, roughness: 0.35, name: 'pipe_paint' })
  const flareGlow = emissiveMat('#441100', '#ff4400', 'glow_flare')
  const tipGlow = emissiveMat('#662200', '#ff8800', 'glow_flare_tip')
  const railGlow = emissiveMat('#222233', '#666677', 'emissive_rail')

  root.add(
    meshFromGeo(
      loftHull({ length: 130, beam: 22, depth: 10, stations: 100, halfSections: 24, bowFraction: 0.18, sternFraction: 0.1, flare: 0.12 }),
      hullPaint,
      'hull',
    ),
  )

  // Bulbous bow
  root.add(meshFromGeo(new THREE.SphereGeometry(5.5, 24, 18), hullPaint, 'bulbous_bow', [0, -3.5, 62]))
  root.add(meshFromGeo(beveledBox(21, 0.5, 126, 0.1, 4), deckPaint, 'deck', [0, 2.5, 0]))

  // Catwalk / railings
  root.add(meshFromGeo(beveledBox(0.25, 1.0, 118, 0.04, 1), railGlow, 'emissive_rail_port', [-10, 4, 0]))
  root.add(meshFromGeo(beveledBox(0.25, 1.0, 118, 0.04, 1), railGlow, 'emissive_rail_stbd', [10, 4, 0]))

  // Manifold pipes
  for (const [x, z] of [
    [5, -10],
    [5, 10],
    [-5, 0],
  ]) {
    root.add(meshFromGeo(cylinderGeo(0.7, 0.7, 7, 12), pipePaint, `pipe_${x}_${z}`, [x, 5, z]))
  }

  // Cargo hatches
  const hatchZs = [-30, -5, 20, 45]
  hatchZs.forEach((z, i) => {
    root.add(meshFromGeo(beveledBox(14, 0.7, 16, 0.12, 2), mat('#2a2a38', { name: 'hatch' }), `hatch_${i + 1}`, [0, 3.1, z]))
  })

  root.add(meshFromGeo(beveledBox(16, 12, 24, 0.25, 6), accomPaint, 'superstructure', [0, 10, 40]))
  root.add(meshFromGeo(beveledBox(12, 7, 10, 0.2, 6), mat('#e8eef5', { name: 'bridge_white' }), 'bridge', [0, 16.5, 42]))
  root.add(meshFromGeo(beveledBox(11, 1.5, 0.3, 0.05, 1), emissiveMat('#112233', '#88aaff', 'emissive_bridge_windows'), 'emissive_bridge_windows', [0, 17, 37]))
  addWindowGrid(root, {
    origin: [0, 16.5, 36.9],
    plane: 'z',
    cols: 8,
    rows: 3,
    paneW: 0.9,
    paneH: 1.0,
    material: emissiveMat('#112233', '#88aaff', 'emissive_bridge_pane'),
    namePrefix: 'window_tanker_pane',
  })
  addPlatingSeams(root, {
    length: 120,
    y: -0.5,
    xOffsets: [-10, -5, 5, 10],
    material: mat('#151520', { name: 'plate' }),
  })

  // Flare stack
  root.add(meshFromGeo(cylinderGeo(1.8, 2.0, 15, 18), mat('#555566', { metalness: 0.6, name: 'flare_stack' }), 'flare_stack', [-7, 18, 35]))
  root.add(meshFromGeo(cylinderGeo(1.5, 1.5, 2, 14), flareGlow, 'glow_flare', [-7, 26, 35]))
  root.add(meshFromGeo(new THREE.ConeGeometry(2.8, 5, 14), tipGlow, 'glow_flare_tip', [-7, 29.5, 35]))

  const hardpoints = [
    { id: 'Empty_HP_01', position: [-7, 26, 35] }, // flareStack
    { id: 'Empty_HP_02', position: [-7, 30.5, 35] }, // flareTip
    { id: 'Empty_HP_03', position: [0, 3.6, -30] }, // hatch1
    { id: 'Empty_HP_04', position: [0, 3.6, -5] }, // hatch2
    { id: 'Empty_HP_05', position: [0, 3.6, 20] }, // hatch3
    { id: 'Empty_HP_06', position: [0, 3.6, 45] }, // hatch4
    { id: 'Empty_HP_07', position: [0, 20, 42] }, // bridge
    { id: 'Empty_HP_08', position: [-10, 4.5, 0] }, // railingL
    { id: 'Empty_HP_09', position: [10, 4.5, 0] }, // railingR
  ]
  for (const hp of hardpoints) addHardpoint(root, hp.id, hp.position)

  return root
}

function buildFireboat() {
  const root = new THREE.Group()
  root.name = 'fireboat_root'

  const hullPaint = mat('#cc1a1a', { metalness: 0.4, roughness: 0.5, name: 'hull_paint' })
  const deckPaint = mat('#222222', { roughness: 0.75, name: 'deck_paint' })
  const whitePaint = mat('#f5f5f5', { metalness: 0.2, roughness: 0.5, name: 'bridge_paint' })
  const cannonPaint = mat('#3366ff', { metalness: 0.65, roughness: 0.35, name: 'monitor_paint' })
  const sirenGlow = emissiveMat('#440000', '#ff0000', 'glow_siren')
  const stripeGlow = emissiveMat('#ffffff', '#ffffff', 'emissive_hull_stripe')
  const washGlow = emissiveMat('#881111', '#ff2222', 'emissive_hull_wash')

  root.add(
    meshFromGeo(
      loftHull({ length: 28, beam: 10, depth: 3, stations: 64, halfSections: 20, bowFraction: 0.28, sternFraction: 0.14, flare: 0.22 }),
      hullPaint,
      'hull',
    ),
  )
  root.add(meshFromGeo(beveledBox(9, 0.35, 24, 0.06, 2), deckPaint, 'deck', [0, 1.1, 0]))
  root.add(meshFromGeo(beveledBox(8.5, 0.4, 20, 0.05, 1), washGlow, 'emissive_hull_wash', [0, -0.4, 0]))
  root.add(meshFromGeo(beveledBox(0.25, 1.2, 22, 0.03, 1), stripeGlow, 'emissive_stripe_port', [-4.7, 0.2, 0]))
  root.add(meshFromGeo(beveledBox(0.25, 1.2, 22, 0.03, 1), stripeGlow, 'emissive_stripe_stbd', [4.7, 0.2, 0]))

  root.add(meshFromGeo(beveledBox(7, 4.5, 6, 0.15, 3), whitePaint, 'bridge', [0, 4, -8]))
  root.add(meshFromGeo(beveledBox(6.2, 1.2, 0.25, 0.04, 1), emissiveMat('#112233', '#88ccff', 'emissive_bridge_windows'), 'emissive_bridge_windows', [0, 4.5, -5]))
  addWindowGrid(root, {
    origin: [0, 4.3, -4.9],
    plane: 'z',
    cols: 5,
    rows: 2,
    paneW: 0.8,
    paneH: 0.7,
    material: emissiveMat('#112233', '#88ccff', 'emissive_fb_win'),
    namePrefix: 'window_fb_pane',
  })
  addPlatingSeams(root, {
    length: 24,
    y: 0.3,
    xOffsets: [-4.2, 4.2],
    material: mat('#aa1515', { name: 'plate' }),
  })

  // Water monitors
  for (const [x, name] of [
    [-3.5, 'cannon_port'],
    [3.5, 'cannon_stbd'],
  ]) {
    root.add(meshFromGeo(cylinderGeo(0.55, 0.55, 7.5, 12), cannonPaint, name, [x, 5, 4], [0.3, 0, 0]))
  }

  root.add(meshFromGeo(cylinderGeo(0.4, 0.4, 9, 10), mat('#333333', { name: 'siren_mast' }), 'siren_mast', [0, 8.5, -6]))
  root.add(meshFromGeo(beveledBox(2, 1, 2, 0.08, 1), sirenGlow, 'glow_siren', [0, 12, -6]))
  root.add(meshFromGeo(beveledBox(4, 1.8, 3, 0.1, 2), mat('#ffcc00', { name: 'foam_deck' }), 'foam_deck', [0, 2.4, 10]))

  const hardpoints = [
    { id: 'Empty_HP_01', position: [-3.5, 8.5, 6] }, // waterCannonPort
    { id: 'Empty_HP_02', position: [3.5, 8.5, 6] }, // waterCannonStbd
    { id: 'Empty_HP_03', position: [0, 6.5, -8] }, // bridge
    { id: 'Empty_HP_04', position: [0, 13, -6] }, // sirenMast
    { id: 'Empty_HP_05', position: [0, 0, 0] }, // hullWash
    { id: 'Empty_HP_06', position: [0, 3.5, 10] }, // foamDeck
  ]
  for (const hp of hardpoints) addHardpoint(root, hp.id, hp.position)

  return root
}

function buildLng() {
  const root = new THREE.Group()
  root.name = 'lng_root'

  const hullPaint = mat('#1e3a5f', { metalness: 0.55, roughness: 0.45, name: 'hull_paint' })
  const tankPaint = mat('#88aacc', { metalness: 0.7, roughness: 0.25, name: 'tank_shell' })
  const barrierPaint = mat('#ff6600', { metalness: 0.4, roughness: 0.5, name: 'barrier' })
  const accomPaint = mat('#2a4060', { metalness: 0.35, roughness: 0.55, name: 'accommodation' })
  const cryoGlow = emissiveMat('#003355', '#00aaff', 'emissive_cryo_tank')
  const mastGlow = emissiveMat('#330000', '#ff0000', 'glow_nav_mast')

  root.add(
    meshFromGeo(
      loftHull({ length: 172, beam: 55, depth: 12, stations: 104, halfSections: 24, bowFraction: 0.12, sternFraction: 0.1, flare: 0.08 }),
      hullPaint,
      'hull',
    ),
  )

  // Membrane tanks (boxy GTT-style with emissive top bands)
  const tanks = [
    { z: -55, d: 45, color: '#00aaff' },
    { z: -5, d: 45, color: '#0088cc' },
    { z: 45, d: 45, color: '#006699' },
    { z: 95, d: 35, color: '#004466' },
  ]
  tanks.forEach((t, i) => {
    root.add(meshFromGeo(beveledBox(48, 14, t.d, 0.4, 6), tankPaint, `tank_${i + 1}`, [0, 6, t.z]))
    root.add(
      meshFromGeo(
        beveledBox(46, 0.6, t.d - 2, 0.05, 1),
        emissiveMat('#001122', t.color, `emissive_tank_${i + 1}`),
        `emissive_tank_${i + 1}`,
        [0, 13.2, t.z],
      ),
    )
  })

  // Inter-tank barriers
  for (const z of [-30, 20, 70]) {
    root.add(meshFromGeo(beveledBox(50, 14, 1.8, 0.15, 2), barrierPaint, `barrier_${z}`, [0, 6, z]))
  }

  root.add(meshFromGeo(beveledBox(20, 16, 24, 0.3, 6), accomPaint, 'superstructure', [-18, 14, 65]))
  root.add(meshFromGeo(beveledBox(18, 9, 14, 0.2, 6), mat('#e8eef5', { name: 'bridge' }), 'bridge', [-18, 24, 70]))
  root.add(meshFromGeo(cylinderGeo(0.7, 0.7, 8, 12), mastGlow, 'glow_mast', [-18, 30, 60]))
  addWindowGrid(root, {
    origin: [-18, 24, 77.1],
    plane: 'z',
    cols: 8,
    rows: 3,
    paneW: 1.2,
    paneH: 1.4,
    material: emissiveMat('#112233', '#88aaff', 'emissive_lng_win'),
    namePrefix: 'window_lng_pane',
  })
  addPlatingSeams(root, {
    length: 160,
    y: 0,
    xOffsets: [-24, 24],
    material: mat('#152838', { name: 'plate' }),
  })

  // Loading arms
  root.add(meshFromGeo(cylinderGeo(0.9, 0.9, 12, 12), mat('#c0c0c0', { metalness: 0.8, name: 'loading_arm' }), 'loading_arm_stbd', [28, 10, 85], [0, 0, 1.57]))
  root.add(meshFromGeo(cylinderGeo(0.9, 0.9, 12, 12), mat('#c0c0c0', { metalness: 0.8, name: 'loading_arm' }), 'loading_arm_port', [-28, 10, 85], [0, 0, 1.57]))
  root.add(meshFromGeo(beveledBox(8, 6, 10, 0.15, 2), cryoGlow, 'emissive_reliquefaction', [15, 8, 65]))

  const hardpoints = [
    { id: 'Empty_HP_01', position: [0, 13.5, -55] }, // membraneTank1
    { id: 'Empty_HP_02', position: [0, 13.5, -5] }, // membraneTank2
    { id: 'Empty_HP_03', position: [0, 13.5, 45] }, // membraneTank3
    { id: 'Empty_HP_04', position: [0, 13.5, 95] }, // membraneTank4
    { id: 'Empty_HP_05', position: [-18, 22, 65] }, // superstructure
    { id: 'Empty_HP_06', position: [-18, 34, 60] }, // mast
    { id: 'Empty_HP_07', position: [28, 10, 85] }, // loadingArm1
    { id: 'Empty_HP_08', position: [-28, 10, 85] }, // loadingArm2
    { id: 'Empty_HP_09', position: [15, 11, 65] }, // reliquefaction
    { id: 'Empty_HP_10', position: [0, 13, -30] }, // tankBarrier1
  ]
  for (const hp of hardpoints) addHardpoint(root, hp.id, hp.position)

  return root
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

async function exportGlb(scene, outPath) {
  const exporter = new GLTFExporter()
  const buffer = await exporter.parseAsync(scene, { binary: true })
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, Buffer.from(buffer))
}

const SHIPS = [
  { id: 'cruise', filename: 'cruise_liner.glb', build: buildCruise, budget: [8_000, 45_000] },
  { id: 'container', filename: 'container_vessel.glb', build: buildContainer, budget: [8_000, 40_000] },
  { id: 'tanker', filename: 'oil_tanker.glb', build: buildTanker, budget: [8_000, 40_000] },
  { id: 'fireboat', filename: 'fireboat.glb', build: buildFireboat, budget: [3_000, 25_000] },
  { id: 'lng', filename: 'lng_carrier.glb', build: buildLng, budget: [8_000, 50_000] },
]

async function main() {
  // Touch mergeGeometries so the import stays used if we later merge parts.
  void mergeGeometries

  for (const ship of SHIPS) {
    const scene = ship.build()
    const tris = countTriangles(scene)
    const outPath = path.join(outDir, ship.filename)
    await exportGlb(scene, outPath)
    const kb = (fs.statSync(outPath).size / 1024).toFixed(1)
    const [lo, hi] = ship.budget
    const budgetOk = tris >= lo && tris <= hi
    const flag = budgetOk ? '✓' : '⚠'
    console.log(
      `${flag} ${ship.filename} — ${tris.toLocaleString()} tris, ${kb} KB` +
        (budgetOk ? '' : ` (budget ${lo}–${hi})`),
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
