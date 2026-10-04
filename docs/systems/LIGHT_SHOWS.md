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

**Not yet interpreted:** `lengthBeats`, `target` and `easing` are carried but ignored at
play time. `lightingSystem.ts` still resolves cues as a step function (last cue with
`beat <= t mod loopBeats`) and every cue drives the whole rig. Interpreting them is #248/#249.

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
When #249 persists user shows: add an **optional** `GameState` field, and do not bump
`VERSION` until `loadGameState` migrates instead of returning `null`.

## Sharing

Shows travel as `#hgshow=` links or `.hgshow` files — see [SHARE_LINKS.md](SHARE_LINKS.md).
