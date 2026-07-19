#!/usr/bin/env node
/**
 * Generate placeholder GLB hulls for priority ship types from ships.json blueprints.
 * Output: public/models/{cruise_liner,container_vessel,oil_tanker}.glb
 *
 * Usage: node scripts/generate-ship-glb.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

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
const shipsJson = JSON.parse(fs.readFileSync(path.join(root, 'src/blueprints/ships.json'), 'utf8'))

const OUTPUT_MAP = {
  cruise: 'cruise_liner.glb',
  container: 'container_vessel.glb',
  tanker: 'oil_tanker.glb',
}

function partToMesh(part, baseColor) {
  const color = part.material?.color ?? baseColor
  const material = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.5 })
  let geometry

  switch (part.type) {
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(part.size[0], part.size[1], part.size[2], 16)
      break
    case 'cone':
      geometry = new THREE.ConeGeometry(part.size[0], part.size[2], 16)
      break
    case 'box':
    default:
      geometry = new THREE.BoxGeometry(part.size[0], part.size[1], part.size[2])
      break
  }

  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = part.id
  mesh.position.set(part.position[0], part.position[1], part.position[2])
  mesh.rotation.set(part.rotation[0], part.rotation[1], part.rotation[2])
  return mesh
}

function buildShipScene(blueprint) {
  const root = new THREE.Group()
  root.name = `${blueprint.id}_root`

  for (const part of blueprint.parts) {
    root.add(partToMesh(part, blueprint.baseColor))
  }

  for (const attachId of blueprint.attachmentPoints) {
    const part = blueprint.parts.find((p) => p.id === attachId)
    const anchor = new THREE.Object3D()
    anchor.name = attachId
    if (part) {
      anchor.position.set(part.position[0], part.position[1], part.position[2])
      anchor.rotation.set(part.rotation[0], part.rotation[1], part.rotation[2])
    }
    root.add(anchor)
  }

  return root
}

async function exportGlb(scene, outPath) {
  const exporter = new GLTFExporter()
  const buffer = await exporter.parseAsync(scene, { binary: true })
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, Buffer.from(buffer))
}

async function main() {
  const outDir = path.join(root, 'public/models')

  for (const [shipId, filename] of Object.entries(OUTPUT_MAP)) {
    const blueprint = shipsJson.ships.find((s) => s.id === shipId)
    if (!blueprint) {
      console.warn(`Blueprint not found: ${shipId}`)
      continue
    }

    const scene = buildShipScene(blueprint)
    const outPath = path.join(outDir, filename)
    await exportGlb(scene, outPath)
    const kb = (fs.statSync(outPath).size / 1024).toFixed(1)
    console.log(`✓ ${filename} (${kb} KB) — ${blueprint.attachmentPoints.length} attachment nodes`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
