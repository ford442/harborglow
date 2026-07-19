// =============================================================================
// SHIP MODEL PRELOAD — probe, fetch, and cache priority GLB hulls
// =============================================================================

import { useGLTF } from '@react-three/drei'
import type { ShipType } from '../store/gameStoreTypes'
import { configureDreiGltf, createConfiguredGltfLoader } from './configureGltfLoader'
import { extractAttachmentPoints } from './extractAttachmentPoints'
import {
  getShipModelCacheEntry,
  setShipModelCacheEntry,
} from './shipModelCache'
import {
  getShipGlbContract,
  getShipModelUrl,
  listGlbContracts,
} from './shipModelRegistry'
import type { ShipModelPreloadProgress } from './shipModelContract'

export type PreloadShipModelsOptions = {
  /** Defaults to all priority GLB contracts (cruise, container, tanker). */
  shipTypes?: ShipType[]
  onProgress?: (progress: ShipModelPreloadProgress) => void
}

async function probeModelUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' })
    if (response.ok) return true
    // Some static hosts don't support HEAD — fall back to a tiny ranged GET.
    if (response.status === 405 || response.status === 501) {
      const getResponse = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-15' },
        cache: 'no-cache',
      })
      return getResponse.ok
    }
    return false
  } catch {
    return false
  }
}

async function loadAndCacheShipModel(shipType: ShipType, url: string): Promise<void> {
  const contract = getShipGlbContract(shipType as 'cruise' | 'container' | 'tanker')
  const loader = createConfiguredGltfLoader()
  const gltf = await loader.loadAsync(url)
  const attachments = extractAttachmentPoints(gltf.scene, contract.attachmentNodeIds)

  setShipModelCacheEntry(shipType, {
    available: true,
    url,
    attachments,
  })

  // Warm drei cache so in-scene useGLTF hits the same asset.
  await useGLTF.preload(url, true, true)
}

function markUnavailable(shipType: ShipType, url: string): void {
  setShipModelCacheEntry(shipType, {
    available: false,
    url,
    attachments: {},
  })
}

/**
 * Probe and preload priority ship GLBs. Missing files are cached as unavailable
 * so runtime never throws on 404 — ProceduralShip keeps rendering.
 */
export async function preloadShipModels(options: PreloadShipModelsOptions = {}): Promise<void> {
  configureDreiGltf()

  const contracts = options.shipTypes
    ? listGlbContracts().filter((c) => options.shipTypes!.includes(c.shipType))
    : listGlbContracts()

  const total = contracts.length
  let loaded = 0

  const report = (label: string) => {
    options.onProgress?.({
      loaded,
      total,
      label,
      percent: total === 0 ? 100 : Math.round((loaded / total) * 100),
    })
  }

  for (const contract of contracts) {
    const url = getShipModelUrl(contract.shipType)
    if (!url) {
      loaded += 1
      report(`Skipped ${contract.shipType} (no registry URL)`)
      continue
    }

    report(`Checking ${contract.filename}…`)

    const exists = await probeModelUrl(url)
    if (!exists) {
      markUnavailable(contract.shipType, url)
      loaded += 1
      report(`${contract.filename} not found — procedural fallback`)
      continue
    }

    try {
      report(`Loading ${contract.filename}…`)
      await loadAndCacheShipModel(contract.shipType, url)
      loaded += 1
      report(`Loaded ${contract.filename}`)
    } catch (error) {
      console.warn(`[shipModels] Failed to load ${url}`, error)
      markUnavailable(contract.shipType, url)
      loaded += 1
      report(`${contract.filename} failed — procedural fallback`)
    }
  }

  report('Ship models ready')
}

/** Preload a single ship type (lazy chunk entry point). */
export async function preloadShipModel(shipType: ShipType): Promise<boolean> {
  const existing = getShipModelCacheEntry(shipType)
  if (existing) return existing.available

  const url = getShipModelUrl(shipType)
  if (!url) {
    markUnavailable(shipType, '')
    return false
  }

  configureDreiGltf()
  const exists = await probeModelUrl(url)
  if (!exists) {
    markUnavailable(shipType, url)
    return false
  }

  try {
    await loadAndCacheShipModel(shipType, url)
    return true
  } catch {
    markUnavailable(shipType, url)
    return false
  }
}

export function preloadPriorityShipModels(): void {
  for (const contract of listGlbContracts()) {
    const url = getShipModelUrl(contract.shipType)
    if (!url || !getShipModelCacheEntry(contract.shipType)?.available) continue
    useGLTF.preload(url, true, true)
  }
}
