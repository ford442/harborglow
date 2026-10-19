# Light Shows (data model)

Slice 1 of the Light Show Director epic (#236). Data only: no rendering or save change.

## Files

| File | Role |
|---|---|
| `src/systems/lightShows/<ship>.ts` | Authored V1 cue lists — the **factory presets** |
| `src/systems/lightShows/types.ts` | `LightCue` (= `LightCueV1`), `LightCueV2`, `LightShowV2`, `RigGroupId`, `LightCueEasing` |
| `src/systems/lightShows/migrate.ts` | `migrateShowV1toV2()` — pure, deterministic |
| `src/systems/lightShows/index.ts` | `lightShowRegistry` (V1) and `lightShowRegistryV2`, migrated once at module load |
| `src/systems/lightShows/rigGroups.ts` | Attachment point → rig group mapping, `getRigGroups(shipType)` |
| `src/schemas/lightShow.ts` | valibot `parseLightShow()` for untrusted input. **Lazy-load only** (`await import(...)`) |

## V1 → V2 mapping

| V2 field | From V1 |
|---|---|
| `id` | `` `${showId}:${index}` `` (deterministic, never random) |
| `beat`, `pattern`, `color`, `intensity` | copied unchanged (`'#rrggbb'`, 0..1) |
| `lengthBeats` | next cue's `beat - beat`; the last cue runs to `loopBeats` |
| `target` | `'all'` |
| `easing` | `'step'` |
| show `loopBeats` | `32` (the upgrade-cinematic cycle) |
| show `seed` | omitted (reserved for #235) |

**Play time:** a cue is active while the playhead sits in `[beat, beat + lengthBeats)`.
`easing` shapes that cue's intensity (`step` stays flat). Cue `target` selects
which attachment points emit GPU particles — see [PARTICLES.md](PARTICLES.md).
The rig's color follows the one active cue. `'all'` keeps every point. A gap
falls back to the last cue that has started, which matches the tiled factory presets.

## Perform

During a harbor show, pads `1`–`5`, a crane-joystick threshold crossing, and tug-throttle gates fire a cue on the next 1/8 or 1/16. The gesture is `recordHostInput('show.cue', …)`. `applyReplayInput` quantizes from sim time and scores a timing-accuracy plus variety bonus (`economySystem.grantPerformanceBonus`). Weights and the grid live in the Leva folder **Light Show Perform**. The fired sequence is part of `hashSimSnapshot`, so a recorded log replays to the same hash.

## Editor

The booth piano roll and full-screen overlay live in `components/operatorCabin/LightShowDesk.tsx`
(lazy, so they stay out of `menu-eager`). Fork copies a factory show; Save writes
`authoredShows` on the existing v4 save (the field is optional, so the save version
does not change). Ship completion plays that fork. Preview scrubs a private transport
on the `'audio'` clock and does not write the sim or the store, so the canvas is not
re-rendered by the playhead.

## Rig groups

`funnel | bridge | hullStrip | gantry | mast | deck | accent`. An explicit id table is
checked first, then these rules in order; anything unmatched is `accent`:

| Group | Matches |
|---|---|
| funnel | `^funnel`, `Stack$`, `^flare` |
| bridge | `bridge`, `superstructure`, `laboratory`, `^lab` |
| gantry | `crane`, `gantry`, `aFrame`, `loadingArm`, `octagrabber`, `ramp`, `visor` (+ `reliquefaction`, `towingNotch`) |
| mast | `mast`, `dish`, `radar`, `siren`, `sonar`, `cameras` |
| hullStrip | `railing`, `hullWash`, `hatch`, `door`, `balcony`, `barrier` |
| deck | `deck`, `^stack\d`, `hold`, `pool`, `container`, `tank`, `lifeboat` |

The full per-ship mapping is snapshotted in `rigGroups.test.ts`; a new blueprint id
appears there as a reviewable diff. A show may target a group a hull lacks — that
imports fine and is a play-time no-op (decided in #249).

## Save rule

Saves hold no light-show data today. `loadGameState()` returns `null` on **any**
version mismatch, so bumping `VERSION` in `storage_manager.ts` wipes every save.
`authoredShows` is an optional v4 field (forked shows keyed by ship type). Missing
on older v4 saves, and `loadGameState` still accepts those. Do not bump `VERSION`
until `loadGameState` migrates instead of returning `null`. Loaded shows go through
the lazy `parseLightShow` schema.

## Sharing

Shows travel as `#hgshow=` links or `.hgshow` files — see [SHARE_LINKS.md](SHARE_LINKS.md).
