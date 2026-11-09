import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lightShowRegistryV2 } from './index'
import { forkShow, moveCue, placeCue } from './editor/editorModel'
import { forkFactoryShow } from './cueEdit'
import {
  USER_SHOWS_KEY,
  deleteUserShow,
  getPendingLegacyShows,
  getUserShow,
  hasUserShow,
  hydrateUserShows,
  importLegacyAuthoredShows,
  resetUserShowsMemory,
  saveUserShow,
  subscribeUserShows,
  userShowId,
} from './userShows'

function installStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  const ls = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: vi.fn((k: string, v: string) => void data.set(k, v)),
    removeItem: vi.fn((k: string) => void data.delete(k)),
  }
  ;(globalThis as { localStorage?: unknown }).localStorage = ls
  return { data, ls }
}

let warn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  resetUserShowsMemory()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  warn.mockRestore()
  delete (globalThis as { localStorage?: unknown }).localStorage
})

const cruiseDraft = () => forkShow('cruise', lightShowRegistryV2.cruise)

describe('userShows', () => {
  it('uses its own key, never the game save', () => {
    expect(USER_SHOWS_KEY).toBe('harborglow:userShows:v1')
    expect(USER_SHOWS_KEY).not.toMatch(/save/)
    expect(userShowId('cruise')).toBe('cruise-user')
  })

  it('saves, persists and reloads a draft', async () => {
    const { data } = installStorage()
    const draft = placeCue(cruiseDraft(), { beat: 3, target: 'mast', color: '#123456' }).draft
    expect(await saveUserShow('cruise', draft.show)).toBe(true)
    expect(getUserShow('cruise')).toEqual(draft.show)
    expect(hasUserShow('cruise')).toBe(true)
    expect(Object.keys(JSON.parse(data.get(USER_SHOWS_KEY)!))).toEqual(['cruise'])

    resetUserShowsMemory() // a new page load
    expect(getUserShow('cruise')).toBeUndefined()
    await hydrateUserShows()
    expect(getUserShow('cruise')).toEqual(draft.show)
    expect(warn).not.toHaveBeenCalled()
  })

  it('stores a copy, returns a stable object, and normalises the id', async () => {
    installStorage()
    const draft = cruiseDraft()
    await saveUserShow('cruise', { ...draft.show, id: 'whatever' })
    const a = getUserShow('cruise')!
    expect(a.id).toBe('cruise-user')
    expect(a).not.toBe(draft.show)
    expect(getUserShow('cruise')).toBe(a)
  })

  it('keeps one entry per ship and persists them together', async () => {
    const { data } = installStorage()
    await saveUserShow('cruise', cruiseDraft().show)
    await saveUserShow('tanker', forkShow('tanker', lightShowRegistryV2.tanker).show)
    expect(Object.keys(JSON.parse(data.get(USER_SHOWS_KEY)!)).sort()).toEqual(['cruise', 'tanker'])
    await deleteUserShow('cruise')
    expect(Object.keys(JSON.parse(data.get(USER_SHOWS_KEY)!))).toEqual(['tanker'])
    await deleteUserShow('tanker')
    expect(data.has(USER_SHOWS_KEY)).toBe(false)
  })

  it('accepts every factory fork and an edited draft (parseLightShow round trip)', async () => {
    installStorage()
    for (const ship of Object.keys(lightShowRegistryV2) as Array<keyof typeof lightShowRegistryV2>) {
      let d = forkShow(ship, lightShowRegistryV2[ship])
      if (d.show.cues[0]) d = moveCue(d, d.show.cues[0].id, 7.25, 'mast')
      expect(await saveUserShow(ship, d.show), ship).toBe(true)
    }
    expect(warn).not.toHaveBeenCalled()
  })

  it('drops an invalid stored entry with one warning and keeps the valid ones', async () => {
    const good = cruiseDraft().show
    const bad = { ...forkShow('tanker', lightShowRegistryV2.tanker).show, cues: [{ id: 'x', beat: -1 }] }
    installStorage({ [USER_SHOWS_KEY]: JSON.stringify({ cruise: good, tanker: bad, kraken: good }) })
    await expect(hydrateUserShows((k) => k !== 'kraken')).resolves.toBeUndefined()
    expect(getUserShow('cruise')).toEqual(good)
    expect(getUserShow('tanker')).toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(2) // tanker invalid + unknown ship "kraken"
  })

  it.each([
    ['garbage', '{not json'],
    ['an array', '[]'],
    ['null', 'null'],
    ['a number', '7'],
  ])('does not throw on %s', async (_n, raw) => {
    installStorage({ [USER_SHOWS_KEY]: raw })
    await expect(hydrateUserShows()).resolves.toBeUndefined()
    expect(hasUserShow('cruise')).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('refuses to save an invalid show and leaves the stored one alone', async () => {
    const { data } = installStorage()
    await saveUserShow('cruise', cruiseDraft().show)
    const before = data.get(USER_SHOWS_KEY)
    const broken = { ...cruiseDraft().show, loopBeats: -4 }
    expect(await saveUserShow('cruise', broken)).toBe(false)
    expect(data.get(USER_SHOWS_KEY)).toBe(before)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('does not clobber stored entries that have not hydrated when saving', async () => {
    const tanker = forkShow('tanker', lightShowRegistryV2.tanker).show
    const { data } = installStorage({ [USER_SHOWS_KEY]: JSON.stringify({ tanker }) })
    // no hydrate() call first: save must wait for it
    await saveUserShow('cruise', cruiseDraft().show)
    expect(Object.keys(JSON.parse(data.get(USER_SHOWS_KEY)!)).sort()).toEqual(['cruise', 'tanker'])
  })

  it('survives quota errors: plays from memory and reports false', async () => {
    const { ls } = installStorage()
    ls.setItem.mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(await saveUserShow('cruise', cruiseDraft().show)).toBe(false)
    expect(hasUserShow('cruise')).toBe(true)
  })

  it('works with no localStorage at all (SSR / blocked)', async () => {
    expect(await saveUserShow('cruise', cruiseDraft().show)).toBe(false)
    expect(hasUserShow('cruise')).toBe(true)
    await expect(hydrateUserShows()).resolves.toBeUndefined()
  })

  it('notifies subscribers on save and delete, and unsubscribes', async () => {
    installStorage()
    const cb = vi.fn()
    const off = subscribeUserShows(cb)
    await saveUserShow('cruise', cruiseDraft().show)
    await deleteUserShow('cruise')
    expect(cb).toHaveBeenCalledTimes(2)
    off()
    await saveUserShow('cruise', cruiseDraft().show)
    expect(cb).toHaveBeenCalledTimes(2)
  })
})

describe('resolveShowForShip', () => {
  it('is the factory show until a user show is saved, then the user show', async () => {
    installStorage()
    const { resolveShowForShip, getLightShowV2 } = await import('./index')
    expect(resolveShowForShip('cruise')).toBe(getLightShowV2('cruise'))
    await saveUserShow('cruise', cruiseDraft().show)
    expect(resolveShowForShip('cruise')).toBe(getUserShow('cruise'))
    expect(resolveShowForShip('cruise')?.id).toBe('cruise-user')
    expect(resolveShowForShip('tanker')).toBe(getLightShowV2('tanker'))
    await deleteUserShow('cruise')
    expect(resolveShowForShip('cruise')).toBe(getLightShowV2('cruise'))
  })
})

// The cabin desk used to keep its shows in the game save (`authoredShows`, id = ship type).
describe('importLegacyAuthoredShows (desk store -> userShows)', () => {
  const desk = (ship: 'cruise' | 'tanker' | 'lng') => forkFactoryShow(ship)!
  const isShip = (k: string) => Object.hasOwn(lightShowRegistryV2, k)

  it('turns desk shows into user shows, keeping cues and normalising the id', async () => {
    const { data } = installStorage()
    const raw = { cruise: desk('cruise'), tanker: desk('tanker') }
    const done = importLegacyAuthoredShows(raw, isShip)
    expect(getPendingLegacyShows()).toBe(raw) // the save keeps carrying them until they are safe
    await done
    expect(getPendingLegacyShows()).toBeUndefined()
    expect(getUserShow('cruise')).toEqual({ ...desk('cruise'), id: 'cruise-user' })
    expect(getUserShow('tanker')?.id).toBe('tanker-user')
    expect(Object.keys(JSON.parse(data.get(USER_SHOWS_KEY)!)).sort()).toEqual(['cruise', 'tanker'])
    expect(warn).not.toHaveBeenCalled()
  })

  it('a show already saved for the ship wins (the cue editor outranked the desk before the merge)', async () => {
    installStorage()
    await saveUserShow('cruise', { ...cruiseDraft().show, loopBeats: 16, cues: [] })
    await importLegacyAuthoredShows({ cruise: desk('cruise'), tanker: desk('tanker') }, isShip)
    expect(getUserShow('cruise')?.loopBeats).toBe(16)
    expect(getUserShow('tanker')?.id).toBe('tanker-user')
  })

  it('also merges into shows that are still only in storage (no hydrate() call first)', async () => {
    const tanker = forkShow('tanker', lightShowRegistryV2.tanker).show
    const { data } = installStorage({ [USER_SHOWS_KEY]: JSON.stringify({ tanker }) })
    await importLegacyAuthoredShows({ cruise: desk('cruise'), tanker: desk('tanker') }, isShip)
    expect(getUserShow('tanker')).toEqual(tanker)
    expect(Object.keys(JSON.parse(data.get(USER_SHOWS_KEY)!)).sort()).toEqual(['cruise', 'tanker'])
  })

  it('drops entries that fail the schema, name another ship or an unknown ship — with warnings, never a throw', async () => {
    installStorage()
    const fork = desk('tanker')
    await expect(
      importLegacyAuthoredShows(
        {
          tanker: fork,
          cruise: { ...fork, id: 'tanker' }, // wrong ship
          lng: { ...desk('lng'), loopBeats: -1 }, // fails parseLightShow
          kraken: fork, // unknown ship
        },
        isShip,
      ),
    ).resolves.toBeUndefined()
    expect(Object.keys(JSON.parse(localStorage.getItem(USER_SHOWS_KEY)!))).toEqual(['tanker'])
    expect(hasUserShow('cruise')).toBe(false)
    expect(hasUserShow('lng')).toBe(false)
    expect(warn).toHaveBeenCalledTimes(3)
    expect(getPendingLegacyShows()).toBeUndefined() // nothing salvageable is left to carry
  })

  it.each([[undefined], [null], [[]], ['x'], [{}]])('ignores %j', async (raw) => {
    const { ls } = installStorage()
    await importLegacyAuthoredShows(raw, isShip)
    expect(getPendingLegacyShows()).toBeUndefined()
    expect(ls.setItem).not.toHaveBeenCalled()
  })

  it('keeps the legacy copy pending while storage fails, and finishes on a later import', async () => {
    const { ls } = installStorage()
    ls.setItem.mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    const raw = { cruise: desk('cruise') }
    await importLegacyAuthoredShows(raw, isShip)
    expect(hasUserShow('cruise')).toBe(true) // plays from memory
    expect(getPendingLegacyShows()).toBe(raw)

    const data = new Map<string, string>()
    ls.setItem.mockImplementation((k: string, v: string) => void data.set(k, v)) // storage works again
    await importLegacyAuthoredShows(raw, isShip) // e.g. the next load of the same save
    expect(getPendingLegacyShows()).toBeUndefined()
    expect(Object.keys(JSON.parse(data.get(USER_SHOWS_KEY)!))).toEqual(['cruise'])
  })

  it('saveUserShow waits for a running import instead of racing it', async () => {
    const { data } = installStorage()
    const imported = importLegacyAuthoredShows({ tanker: desk('tanker') }, isShip)
    expect(await saveUserShow('cruise', cruiseDraft().show)).toBe(true)
    await imported
    expect(Object.keys(JSON.parse(data.get(USER_SHOWS_KEY)!)).sort()).toEqual(['cruise', 'tanker'])
  })
})
