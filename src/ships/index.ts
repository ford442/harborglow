export {
  SHIP_ATTACH_PREFIX,
  SHIP_MODEL_FORWARD_AXIS,
  SHIP_MODEL_UNIT_METERS,
  SHIP_MODEL_UP_AXIS,
  PRIORITY_GLB_SHIP_TYPES,
  shipModelRootName,
} from './shipModelContract'
export type {
  PriorityGlbShipType,
  ShipGlbContract,
  ShipModelAttachmentPose,
  ShipModelCacheEntry,
  ShipModelPreloadProgress,
} from './shipModelContract'

export {
  getShipGlbContract,
  getShipModelUrl,
  isGlbCapableShipType,
  listGlbContracts,
  SHIP_MODEL_FILENAMES,
} from './shipModelRegistry'

export {
  configureDreiGltf,
  configureGltfLoader,
  createConfiguredGltfLoader,
  DRACO_DECODER_PATH,
} from './configureGltfLoader'

export {
  clearShipModelCache,
  getCachedShipModelTypes,
  getShipModelAttachmentPose,
  getShipModelCacheEntry,
  isShipModelAvailable,
  setShipModelCacheEntry,
} from './shipModelCache'

export { extractAttachmentPoints } from './extractAttachmentPoints'
export { preloadPriorityShipModels, preloadShipModel, preloadShipModels } from './preloadShipModels'
export { default as GlbShipModel } from './GlbShipModel'
