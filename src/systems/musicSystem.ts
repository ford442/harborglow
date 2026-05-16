// =============================================================================
// MUSIC SYSTEM - Re-export for backward compatibility
// This file re-exports the modularized music system
// =============================================================================

export type { LyricEntry, BandInfo } from './music'
export { getBandInfo } from './music'
export { getLyrics, getAllLyrics } from './music'
export { createSynthChain } from './music'
export { musicSystem, MusicSystem } from './music'
