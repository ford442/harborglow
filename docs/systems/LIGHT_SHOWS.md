# Light Shows

Slice 1 of the Light Show Director epic (#236) added the V2 data model; slice 7 (#253)
interprets it at play time, ships three native V2 factory shows and the Harbor Festival.

## Files

| File | Role |
|---|---|
| `src/systems/lightShows/<ship>.ts` | Authored V1 cue lists — the **factory presets** |
| `src/systems/lightShows/{cruiseFinale,fireboatWaterCannon,icebreakerAurora}.ts` | Native V2 factory presets (rig-group targeting, easing), built with `author.ts` |
| `src/systems/lightShows/rigCues.ts` | Play-time resolution of `target` / `lengthBeats` / `easing` per rig group |
| `src/systems/lightShows/showEmitters.ts` | GPU-particle emitter bindings for the native V2 shows (consumed by #248) |
| `src/systems/lightShows/types.ts` | `LightCue` (= `LightCueV1`), `LightCueV2`, `LightShowV2`, `RigGroupId`, `LightCueEasing` |
| `src/systems/lightShows/migrate.ts` | `migrateShowV1toV2()` — pure, deterministic |
| `src/systems/lightShows/index.ts` | `lightShowRegistry` (V1), `authoredShowsV2`, and `lightShowRegistryV2` (native V2 where authored, else migrated once at module load) |
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

A migrated show has only `'all'` cues that tile the loop, so every rig group plays exactly
the V1 step cue (`rigCues.test.ts` checks this at every 1/16 beat for all 13 presets).

## Play time

`lightingSystem.update()` resolves two things from the active show, both at
`t = elapsedBeats mod loopBeats`:

- **Harbor-wide cue** (unchanged step function): the last cue with `beat <= t`, whatever
  it targets. Drives `getBeatPulse()` / `getActiveCue()`, which harbor ambience reads.
- **Per rig group** (`rigCues.ts`): for each of the 7 groups, the latest-starting cue that
  targets that group or `'all'` and whose `[beat, beat + lengthBeats)` window covers `t`.
  When two cues start on the same beat, the one authored later wins. When no cue covers
  the group, it is **inactive** (dark). Easing scales the cue's intensity across its
  length: `step` holds full level; `linear` / `easeIn` / `easeOut` / `easeInOut` swell
  from 0 to full. `getRigGroupState(shipId, group)` returns that state for the ship whose
  show is playing, and `null` for every other ship.

`InstalledRigVisual` maps its `partName` to a group (`rigGroupForAttachmentPoint`) and,
during its own ship's show, drives from that group: it pulses on the cue pulse, its power
scales with the cue level, and its colour is tinted 65% toward the cue colour. An inactive
group idles dim, and a `blackout` cue takes it nearly dark. Rigs on other ships, and the
`AudioReactiveLightShow` rigs, keep the harbor-wide drive.

**Show length:** at least 30 s, rounded up to a whole number of loops at the ship's BPM
(cruise: 32 s; fireboat: 3 loops ≈ 37.9 s; icebreaker: 2 loops ≈ 35.6 s). The end is
checked against sim time in `update()`, not a `setTimeout`, so it replays deterministically.
An imported show (`setShowOverride`) still loops until it is cleared.

## Native V2 factory presets

| Ship | Show | Groups targeted | Emitters (#248) |
|---|---|---|---|
| cruise (120 BPM) | Aurora Glow finale: gold balcony swell → funnel snaps → whole-ship build → white strobe/snap finale | funnel, hullStrip | fireworks on `funnel1/2`, `balcony5/6` |
| fireboat (152 BPM) | Rescue Pulse water-cannon show: red/blue siren mast, cannons arc/hold/fire, foam deck swell | accent (the two water cannons), mast, bridge, hullStrip, deck | water-cannon mist on both cannons, `foamDeck` |
| icebreaker (108 BPM) | Aurora: green curtains rise, teal/violet ripple, ice-white glitter, escort-orange gantry | funnel, mast, deck, bridge, gantry, accent (spoon bow) | ice-crystal glitter on `funnelMain`, `mastArray`, `heliDeck` |

The cruise targets only the groups its blueprint attachment points have. The stern
water-curtain is an upgrade-menu part with no blueprint attachment point, so it renders
no rig. The fireboat's water cannons stay in `accent`, which on that hull means exactly the
two cannons.

**Emitters:** `showEmitters.ts` binds each emitter to an attachment-point id and a beat
window. `getActiveShowEmitters(shipType, beatInLoop, out)` is the query the TSL compute
particle system (#248) will read; until it lands, nothing renders the bindings. They live
outside `LightShowV2`, so share links and the schema are unchanged. The icebreaker anchors
are blueprint parts; they become GLB sockets with no further change once the Yamal GLB
(#203) lands.

## Harbor Festival

`src/systems/eventSystem/harborFestival.ts`, owned by `harborEventSystem.festival`, and a
`harbor_festival` `HarborEvent` while it runs. Player-started only (probability 0): the
HUD button or the Leva **Harbor Events → Harbor Festival** toggle records
`event.festival.start` / `event.festival.stop` through `recordHostInput`, so spectators
and replays run the same festival. The optional payload is `{ setlist: ShipType[] }`; the
default setlist is cruise → fireboat → icebreaker.

Each act runs: spawn the ship and select it → **awaitingRigs** until
`selectIsShipFullyUpgraded` → **playing** (`maybeStartShipMusic`, a no-op if the install
path already started it) until the lighting show for that ship ends → **intermission**
(4 s) → next act. Everything advances on the sim tick (accumulated `dt` and the sim-time
show end). An act whose ship leaves the harbor is counted missed. At the end:
300 HC per show played, +600 HC for the full setlist, +10 reputation per show
(`FESTIVAL_*` constants). `FestivalHUD` shows "Act n/3" through `useSyncExternalStore`.
`harborEventSystem.reset()` (from `resetDeterministicSystems()`) resets it.

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
imports fine and is a play-time no-op: no rig of that group exists to light.

## Save rule

Saves hold no light-show data today. `loadGameState()` returns `null` on **any**
version mismatch, so bumping `VERSION` in `storage_manager.ts` wipes every save.
When #249 persists user shows: add an **optional** `GameState` field, and do not bump
`VERSION` until `loadGameState` migrates instead of returning `null`.

## Sharing

Shows travel as `#hgshow=` links or `.hgshow` files — see [SHARE_LINKS.md](SHARE_LINKS.md).
