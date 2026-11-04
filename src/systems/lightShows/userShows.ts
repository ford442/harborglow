// =============================================================================
// USER SHOWS (#270) — the player's forked LightShowV2 per ship.
//
// Persistence is a `Record<ShipType, LightShowV2>` under its own localStorage
// key, deliberately NOT in the game save: no storage_manager VERSION bump, no
// loadGameState change, no dependency on #261 (docs/systems/LIGHT_SHOWS.md,
// "Save rule"). Anything read back is untrusted and validated with
// parseLightShow(); an invalid entry is dropped with one console.warn, never
// thrown.
//
// This module is reachable from game-initial (lightShows/index.ts resolves
// through it), so it is a leaf with type-only imports: the valibot schema loads
// with a dynamic import() only when something is stored, and the set of valid
// ship types is injected by index.ts (importing it here would close a cycle
// through the store).
// =============================================================================

import type { ShipType } from '../../store/gameStoreDomainTypes'
import type { LightShowV2 } from './types'

export const USER_SHOWS_KEY = 'harborglow:userShows:v1'

/** A player's forked show for `shipType` always carries this id. */
export function userShowId(shipType: ShipType): string {
  return `${shipType}-user`
}

const shows = new Map<ShipType, LightShowV2>()
const listeners = new Set<() => void>()
let hydration: Promise<void> | null = null

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null // access itself can throw (blocked site data)
  }
}

function notify() {
  for (const l of listeners) l()
}

async function parseWithSchema(input: unknown): Promise<{ ok: true; show: LightShowV2 } | { ok: false; message: string }> {
  const { parseLightShow } = await import('../../schemas/lightShow')
  const r = parseLightShow(input)
  return r.ok ? { ok: true, show: r.show } : { ok: false, message: r.error.message }
}

async function hydrate(isShipType: (key: string) => boolean): Promise<void> {
  const ls = storage()
  let raw: string | null = null
  try {
    raw = ls?.getItem(USER_SHOWS_KEY) ?? null
  } catch {
    raw = null
  }
  if (!raw) return
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.warn('🎛️ userShows: stored shows are not valid JSON — ignoring them')
    return
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.warn('🎛️ userShows: stored shows have the wrong shape — ignoring them')
    return
  }
  for (const [key, value] of Object.entries(parsed)) {
    if (!isShipType(key)) {
      console.warn(`🎛️ userShows: dropping show for unknown ship type "${key}"`)
      continue
    }
    const shipType = key as ShipType
    const r = await parseWithSchema(value)
    if (!r.ok) {
      console.warn(`🎛️ userShows: dropping invalid ${shipType} show (${r.message})`)
      continue
    }
    // A show saved before hydration finished (a fresh save wins) is kept.
    if (!shows.has(shipType)) shows.set(shipType, { ...r.show, id: userShowId(shipType) })
  }
  notify()
}

/** Is anything stored? Cheap; lets callers skip hydration (and the schema chunk) entirely. */
export function hasStoredUserShows(): boolean {
  try {
    return !!storage()?.getItem(USER_SHOWS_KEY)
  } catch {
    return false
  }
}

/**
 * Load stored shows into memory. Idempotent and safe to await from anywhere;
 * resolves (never rejects) once the stored record has been validated. The first
 * call decides which keys are valid ship types (default: all); later calls
 * just await the same load.
 */
export function hydrateUserShows(isShipType: (key: string) => boolean = () => true): Promise<void> {
  hydration ??= hydrate(isShipType).catch((err) => {
    console.warn('🎛️ userShows: could not load stored shows', err)
  })
  return hydration
}

/** The saved show for `shipType`, or undefined. The same object every call until it changes. */
export function getUserShow(shipType: ShipType): LightShowV2 | undefined {
  return shows.get(shipType)
}

export function hasUserShow(shipType: ShipType): boolean {
  return shows.has(shipType)
}

function persist(): boolean {
  const ls = storage()
  if (!ls) return false
  try {
    if (shows.size === 0) ls.removeItem(USER_SHOWS_KEY)
    else ls.setItem(USER_SHOWS_KEY, JSON.stringify(Object.fromEntries(shows)))
    return true
  } catch (err) {
    console.warn('🎛️ userShows: could not write to localStorage (quota or blocked)', err)
    return false
  }
}

/**
 * Validate and save `show` as the player's show for `shipType`. Resolves true
 * when it was stored durably; false when it was invalid (nothing changes) or
 * storage failed (the show still plays this session, from memory).
 */
export async function saveUserShow(shipType: ShipType, show: LightShowV2): Promise<boolean> {
  await hydrateUserShows() // never overwrite entries that have not loaded yet
  const copy = JSON.parse(JSON.stringify({ ...show, id: userShowId(shipType) })) as unknown
  const r = await parseWithSchema(copy)
  if (!r.ok) {
    console.warn(`🎛️ userShows: refusing to save invalid ${shipType} show (${r.message})`)
    return false
  }
  shows.set(shipType, r.show)
  const stored = persist()
  notify()
  return stored
}

/** Forget the player's show for `shipType` (back to the factory show). */
export async function deleteUserShow(shipType: ShipType): Promise<boolean> {
  await hydrateUserShows()
  if (!shows.delete(shipType)) return true
  const stored = persist()
  notify()
  return stored
}

/** Call `listener` after the set of saved shows changes. Returns an unsubscribe. */
export function subscribeUserShows(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Test hook: forget everything held in memory (storage is left alone). */
export function resetUserShowsMemory(): void {
  shows.clear()
  listeners.clear()
  hydration = null
}
