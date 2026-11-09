// =============================================================================
// USER SHOWS (#270) — the player's forked LightShowV2 per ship.
//
// THE store of player-authored shows: both the cabin desk and the cue editor
// read and write it (the desk used to keep its own copy in the game save — see
// importLegacyAuthoredShows for the one-time migration).
//
// Persistence is a `Record<ShipType, LightShowV2>` under its own localStorage
// key, deliberately NOT in the game save: shows are authored content, not
// progress, so a save-version bump (loadGameState returns null on mismatch,
// #261) or New Game must never take them (docs/systems/LIGHT_SHOWS.md, "Save
// rule"). Anything read back is untrusted and validated with
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
/** Desk shows read from an old save whose import has not been persisted yet. */
let pendingLegacy: Record<string, unknown> | undefined
/** The last write failed, so memory is ahead of storage. */
let unwritten = false
let legacyImport: Promise<void> = Promise.resolve()

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
  unwritten = true
  const ls = storage()
  if (!ls) return false
  try {
    if (shows.size === 0) ls.removeItem(USER_SHOWS_KEY)
    else ls.setItem(USER_SHOWS_KEY, JSON.stringify(Object.fromEntries(shows)))
    unwritten = false
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
  await legacyImport
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
  await legacyImport
  if (!shows.delete(shipType)) return true
  const stored = persist()
  notify()
  return stored
}

/**
 * One-time migration of the light-show desk's old store. Before the stores were
 * unified the desk kept `authoredShows` (id = the ship type) in the game save.
 * `raw` is that field, untrusted. Each valid entry becomes the ship's user show
 * (id `${shipType}-user`), unless the ship already has one: the cue editor's
 * show already outranked the desk's in resolveShowForShip, so it keeps winning.
 *
 * Until the result is written to the user-shows key, `getPendingLegacyShows()`
 * returns `raw` so the game save keeps carrying it — an autosave that fires
 * while the lazy schema is still loading cannot lose the player's shows. Safe
 * to call again with the same data (a ship that has a show is skipped).
 */
export function importLegacyAuthoredShows(
  raw: unknown,
  isShipType: (key: string) => boolean = () => true,
): Promise<void> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).length === 0) {
    return legacyImport
  }
  const legacy = raw as Record<string, unknown>
  pendingLegacy = legacy
  legacyImport = legacyImport
    .then(async () => {
      await hydrateUserShows(isShipType)
      let changed = false
      for (const [key, value] of Object.entries(legacy)) {
        if (!isShipType(key)) {
          console.warn(`🎛️ userShows: dropping saved desk show for unknown ship type "${key}"`)
          continue
        }
        const shipType = key as ShipType
        if (shows.has(shipType)) continue
        const r = await parseWithSchema(value)
        if (!r.ok) {
          console.warn(`🎛️ userShows: dropping invalid saved ${shipType} desk show (${r.message})`)
          continue
        }
        if (r.show.id !== shipType) {
          console.warn(`🎛️ userShows: dropping saved ${shipType} desk show (it is for "${r.show.id}")`)
          continue
        }
        if (shows.has(shipType)) continue // a save landed while the schema loaded
        shows.set(shipType, { ...r.show, id: userShowId(shipType) })
        changed = true
      }
      // Keep the legacy copy in the save until every show is on disk: a failed
      // write is retried by the next import, not forgotten.
      const stored = changed || unwritten ? persist() : true
      if (stored) {
        if (pendingLegacy === legacy) pendingLegacy = undefined
      }
      if (changed) notify()
    })
    .catch((err) => {
      console.warn('🎛️ userShows: could not import saved desk shows', err)
    })
  return legacyImport
}

/** Raw legacy desk shows still waiting to be persisted; the game save carries them until then. */
export function getPendingLegacyShows(): Record<string, unknown> | undefined {
  return pendingLegacy
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
  pendingLegacy = undefined
  unwritten = false
  legacyImport = Promise.resolve()
}
