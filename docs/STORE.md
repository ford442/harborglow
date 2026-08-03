# Game Store — Domain Slices & Persistence

All shared game state lives in one Zustand store (`src/store/useGameStore.ts`).
Everything else — scenes, systems, HUD — reads it through selectors and writes it
through actions.

## Layout

```
src/store/
  useGameStore.ts     # create() + composition order + selectors + the ONE save subscription
  gameStoreTypes.ts   # the single canonical type module: GameState, domain types,
                      # defaultState, getSerializableState, scheduleSave
  sliceTypes.ts       # one Pick<GameState, …> per slice + the ownership guard
  harborThemes.ts     # static theme tables
  slices/
    shipsSlice.ts        # fleet lifecycle, upgrades, sail schedule, per-ship music/lyrics
    craneSlice.ts        # kinematics, twistlock/heater, joysticks, contracts, install queue
    cameraSlice.ts       # camera modes, spectator, multiview viewports, dashboard presets
    environmentSlice.ts  # time, season, weather, storm, waves, wildlife, harbor events
    economySlice.ts      # money, reputation, salvage contracts, tugboat upgrade purchases
    opsSlice.ts          # operation mode, missions, training, tugboat ops, comms
    sessionSlice.ts      # resetGame / loadSavedState
    index.ts
```

There is exactly **one** canonical type module. `src/store/types.ts` used to be a
second, drifting copy of the same types — it is gone; import from
`gameStoreTypes` (or from `useGameStore`, which re-exports it).

## Slice ownership is enforced at compile time

Each slice declares its surface in `sliceTypes.ts` as `Pick<GameState, …>`, and
`sliceTypes.ts` ends with:

```ts
type UnownedActions = Exclude<GameStateActionKey, OwnedActionKey>;
const _actionsAllOwned: UnownedActions extends never ? true : UnownedActions = true;
```

Add an action to `GameState` and forget to give it a slice, and the build fails
naming the orphaned key. `GameStateActionKey` is *derived* from `GameState`
(function-valued keys), so nothing has to be hand-maintained in parallel.

Slices contribute **actions only**. Every initial state field comes from
`defaultState`, spread first in `useGameStore`. Because no key is owned twice,
composition order is not behaviourally significant — it is kept stable for
readable diffs.

## Persistence: one write path

`useGameStore.subscribe(...)` in `useGameStore.ts` is the **only** caller of
`scheduleSave`. Actions just `set(...)`.

Slices used to call `scheduleSave({ ...state, ...newState })` themselves *as well
as* the subscription firing — every setter did the work twice, and the answer to
"what actually gets persisted?" was spread across ~33 call sites. Don't
reintroduce that: if a field needs saving, it needs to be in the state, and the
subscription handles the rest.

Saves are debounced 500 ms (`scheduleSave` in `gameStoreTypes.ts`), so a burst of
actions produces one write.

### Persisted vs ephemeral

`getSerializableState()` (`gameStoreTypes.ts`) is the authoritative projection —
if a field is not listed there, it is not saved.

| Persisted | Ephemeral (never saved) |
|---|---|
| Ships, installed upgrades, ship versions, sail/dock schedule | Crane kinematics: spreader pose/rotation, cable depth, load tension, trolley, winch, joysticks, twistlock, `installAttemptStartedAt` |
| `harborCredits` (single Harbor Credits wallet), reputation, economy serialization | Camera transforms, viewport history/pins, focused viewport |
| Booth tier, harbor, quality preset, BPM/lyrics/light settings | Live wildlife entities, active sea events, harbor events |
| Season, wildlife density, marine-life toggle, weather, time of day | In-flight mission state, install queue, spectator sequence |
| Tugboat career stats, upgrades, salvage contracts, wave params | Music playback map, transient installation feedback |

Ephemeral fields are recomputed every frame or every session; restoring them
would resume a half-finished pick or a dead mission on load.

## Install metrics

`installUpgrade(shipId, partName, metrics?)` takes optional measured quality:

```ts
interface InstallMetrics { timeSeconds?: number; swayPercent?: number; damage?: number }
```

`triggerInstallation` (`systems/attachmentSystem.ts`) supplies real values — time
from the twistlock engaging to the install, and live sway magnitude from
`swaySystem`. When a caller does not measure, the fields stay `undefined` and
`reputationSystem.recordInstallation` awards base completion only, rather than
scoring against invented numbers (it previously received a hard-coded
`timeSeconds: 30` / `swayPercent: 0.2`).

## Economy wallet

`harborCredits` is the **one** player-facing currency (Harbor Credits). The legacy
`money` field and the in-memory `economySystem.state.harborCredits` duplicate were
unified in PR #146; v3 saves migrate forward via `storage_manager.ts`. Install
rewards, shop purchases (`HarborShop`), salvage contracts, and mission payouts all
read/write `harborCredits` through `economySlice` actions.

## Adding state

1. Add the field to `GameState` and a value to `defaultState` (`gameStoreTypes.ts`).
2. Add the action to `GameState`, then list it on exactly one slice in `sliceTypes.ts`
   — the build tells you if you forget.
3. Implement the action in that slice. Call `set(...)` only; **never** `scheduleSave`.
4. If it should survive a reload, add it to `getSerializableState` *and* restore it
   in `sessionSlice.loadSavedState`.
