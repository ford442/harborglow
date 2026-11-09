# Light Shows

Slice 1 of the Light Show Director epic (#236) added the V2 data model; slice 7 (#253)
interprets it at play time, ships three native V2 factory shows and the Harbor Festival.

## Files

| File | Role |
|---|---|
| `src/systems/lightShows/<ship>.ts` | Authored V1 cue lists — the **factory presets** |
| `src/systems/lightShows/{cruiseFinale,fireboatWaterCannon,icebreakerAurora}.ts` | Native V2 factory presets (rig-group targeting, easing), built with `author.ts` |
| `src/systems/lightShows/rigCues.ts` | Play-time resolution of `target` / `lengthBeats` / `easing` per rig group |
| `src/systems/lightShows/showEmitters.ts` | GPU-particle emitter bindings for the native V2 shows (played by `showBindingDriver.ts`, #248) |
| `src/systems/lightShows/types.ts` | `LightCue` (= `LightCueV1`), `LightCueV2`, `LightShowV2`, `RigGroupId`, `LightCueEasing` |
| `src/systems/lightShows/migrate.ts` | `migrateShowV1toV2()` — pure, deterministic |
| `src/systems/lightShows/index.ts` | `lightShowRegistry` (V1), `authoredShowsV2`, and `lightShowRegistryV2` (native V2 where authored, else migrated once at module load) |
| `src/systems/lightShows/rigGroups.ts` | Attachment point → rig group mapping, `getRigGroups(shipType)` |
| `src/systems/lightShows/cueEdit.ts` | Piano-roll edits on a `LightShowV2` (fork, place, update). Pure |
| `src/systems/lightShows/perform.ts` / `performLog.ts` | Pad and gesture cues, scored into the sim hash |
| `src/components/operatorCabin/LightShowDesk.tsx` | Lazy booth piano roll and preview overlay. Loads and saves through `userShows.ts`, previews through `lightingSystem.startPreview` |
| `src/schemas/lightShow.ts` | valibot `parseLightShow()` for untrusted input. **Lazy-load only** (`await import(...)`) |
| `src/systems/lightShows/userShows.ts` | **The one store** of player-authored shows, one per ship (own `localStorage` key), used by the cabin desk and the cue editor; `resolveShowForShip()` in `index.ts` = user show ?? factory show. Also `importLegacyAuthoredShows()` (one-time migration of the desk's old save-file store) |
| `src/systems/lightShows/editor/` | Cue editor logic, no React: `editorModel.ts` (pure draft operations + history), `editorSession.ts` (vanilla store + lighting/music side effects), `timelineGeometry.ts` (canvas hit-testing), `shareDraft.ts` |
| `src/components/lightShowEditor/` | The cue editor UI — a `React.lazy` chunk opened from the operator cabin |

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
An imported show (`setShowOverride`) or a preview (`startPreview`) still loops until it is cleared.

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
window. The GPU particle layer (#248, [PARTICLES.md](./PARTICLES.md#factory-show-bindings))
plays them: it derives `beatInLoop` from the sim clock with the same arithmetic as
`update()`, asks `collectActiveShowEmitters(shipType, beatInLoop, out)` which bindings are
live (the allocation-free sibling of `getActiveShowEmitters`, which drops its backing store
every frame), and resolves each `attachmentPoint` to that ship's world pose. A missing id is
skipped with one `console.warn`. They live outside `LightShowV2`, so share links and the
schema are unchanged; a shared/imported show replaces the factory timeline the bindings were
authored against, so it plays none. The icebreaker anchors are blueprint parts; they become
GLB sockets with no further change once the Yamal GLB (#203) lands.

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

## Cue editor

Slice 3 of the epic (#270). In the operator cabin, with a ship selected, **🎛️ Edit show**
opens a full-screen piano roll (a lazy chunk, `LightShowEditor`, with its own cap in
`bundle-budget.json`). It opens on the player's saved show for that ship, or on a fork of
the factory show.

**Timeline.** Rows are the rig groups plus `all`; columns are beats with a bar line every
`BEATS_PER_BAR` (4). Loop length is 16–64 beats (default 32). Groups the hull does not have
(`getRigGroups`) are greyed and hatched; cues there are still allowed and are a play-time
no-op, like any cue for a group a ship lacks.

| Gesture | Effect |
|---|---|
| Click empty | Place the toolbar's cue in the clicked grid cell |
| Drag a cue | Move it (and across rows) |
| Drag a cue's edge | Stretch it (min 1/16 beat, never past the loop) |
| Shift + drag | Copy |
| Click / drag the ruler | Scrub: holds the show at that beat (`lightingSystem.setPreviewBeat`) |
| Space, Ctrl+Z, Ctrl+Shift+Z / Ctrl+Y, Ctrl+S, Delete, Esc | Play/stop, undo, redo, save, delete selection, close |

The toolbar sets pattern, easing, colour (the ship's light colour + the show's colours + a
picker), intensity, length and snap (1/4, 1/8, 1/16 note or free); it also has loop length,
copy bar *a* → *b* (replaces the cues that start in *b*), quantize, undo/redo, **Fork
factory** (undoable reset), **Delete mine** (back to the factory show), **Share** and **Save**.
A drag is one undo step.

**Model** (`editorModel.ts`). Every operation is immutable and deterministic and returns the
*same* object when it changes nothing; each change makes a new show object because
`rigCues` caches per show identity. Invariants after every operation, tighter than
`parseLightShow`: `0 <= beat < loopBeats`, `lengthBeats >= 1/16`, `beat + lengthBeats <= loopBeats`,
`intensity` in 0..1, `#rrggbb` colours, ids `${showId}:${n}` from a counter kept in the draft
(never random, never reused after a delete, restored by undo), cues sorted by beat with
ties in insertion order. History is capped at 100 steps. A cue that would overrun the loop
is *shortened*, not moved; copies are clipped at the loop end.

**State.** The editor's state is a vanilla zustand store (`editorSession.ts`), not
`useGameStore`: dragging cues must not notify the game store or re-render the R3F canvas
(`editorSession.test.ts` counts store notifications over a 1800-tick session: 0). While the
editor is open a capture-phase `keydown` handler stops crane/HUD hotkeys; `keyup` is left
alone so a key held at open time still releases.

**Playing.** *Play* starts the draft with `lightingSystem.startPreview(shipId, shipType, draft)`
(see **Preview API**); edits while playing are pushed live with `setPreviewShow`. It loops until stopped and,
with the ♪ toggle, starts the ship's music (`musicSystem.startMusic`, sim-clocked from beat 0
so it lines up with the lights). The editor refuses to take over a show-link playback.
Scrubbing and playing only *read* sim time, so neither can change the sim hash
(`lightingSystemUserShows.test.ts`).

**Saving.** *Save* writes `Record<ShipType, LightShowV2>` to its own key,
`harborglow:userShows:v1` (see **Save rule**) — the same store the cabin desk saves to. A user show's id is `${shipType}-user`.
`resolveShowForShip(shipType)` returns the user show if there is one; `startHarborShow`
and the per-frame update use it, so every start path (upgrade menu, cinematic, Harbor
Festival, multiplayer) plays the player's show, with the show duration sized to *its* loop.
A share-link override still wins.

**Sharing.** *Share* packs the draft (saved or not) with the normal codec into a
`#hgshow=` link, or a `.hgshow` file when it will not fit — see [SHARE_LINKS.md](SHARE_LINKS.md).

**Known limits.**
- The GPU emitter bindings (`showEmitters.ts`, fireworks/mist/glitter) belong to the *factory*
  timeline: `showPlayhead.ts` reads the factory loop, so a user show changes the lights but
  not the bound particles.
- A user show with a different `loopBeats` changes how long the show lasts, which the Harbor
  Festival waits on. That is local to the player's own harbor; shared playback uses the override.
- Audible preview runs on the sim clock (`musicSystem` hardcodes it), not the `'audio'` transport.
- One user show per ship; no named list or picker.

**Tests.** Logic lives beside the code under `src/systems/lightShows/editor/`; the toolbar
has a server-render smoke test; `e2e/light-show-editor.spec.ts` drives the real app and, like
`show-particles.spec.ts`, skips without a WebGPU adapter (opt in with `PLAYWRIGHT_WEBGPU=1`).
It asserts a cue-specific value: after place → move → stretch → save → close, the funnel plays
the saved cue's colour (via `window.harborglowDebug.lightShow`, screenshot mode only) and the
hull strip does not.

## FX hooks

GPU particles and laser beams (#248, [PARTICLES.md](./PARTICLES.md)) read the active cue
through `lightingSystem.getCueState()` / `getActiveCue()`:

- The `pattern` picks the effect: strobe sparks, snap fireworks, breathe/sweep glitter, and
  laser motion. A ship whose factory show has emitter bindings (cruise, fireboat, icebreaker)
  plays those instead of the pattern look; lasers still follow the pattern.
- `target` limits emission to installed rigs in that group.
- `color` and `intensity` tint and scale it.

There is no `fx` field yet. When slice 3 or 7 adds one, make it optional
(`fx?: EmitterPresetId`), so existing shows and share links stay valid without a version
bump. Play it through `triggerEmitter(cue.fx, { anchorKey }, { color: cue.color })` per
targeted anchor. The pattern-based defaults remain for cues without `fx`.

## Perform

During a harbor show, pads `1`–`5`, a crane-joystick threshold crossing, and tug-throttle gates fire a cue on the next 1/8 or 1/16. The gesture is `recordHostInput('show.cue', …)`. `applyReplayInput` quantizes from sim time and scores a timing-accuracy plus variety bonus (`economySystem.grantPerformanceBonus`). Weights and the grid live in the Leva folder **Light Show Perform**. The fired sequence is part of `hashSimSnapshot`, so a recorded log replays to the same hash. A fired cue overrides the harbor-wide cue; per-rig-group playback stays on the show timeline.

## Desk

The booth piano roll and full-screen overlay live in `components/operatorCabin/LightShowDesk.tsx`
(lazy, so they stay out of `menu-eager`). It edits the **same document** as the cue editor:
it opens on the player's saved show for the ship (`getUserShow`) or a fork of the factory
show, and *Save* calls `saveUserShow` (id `${shipType}-user`), so what is saved in one tool opens in
the other and plays on the ship's upgrade show. A share-link override still wins. Scrub and play
advance a private transport on the `'audio'` clock (`previewClock`) and drive the lights through the
preview API below; they do not write the sim or the game store, so the canvas is not re-rendered
by the playhead.

## Preview API

One preview, on `lightingSystem`, for both tools:

| Call | Effect |
|---|---|
| `startPreview(shipId, shipType, show)` | Play the draft on that ship in place of its saved show, looping until stopped; starts the ship's harbor show so rig groups light. Returns `false` (no change) while a share-link show is installed |
| `setPreviewShow(show)` | Live edits |
| `setPreviewBeat(beat \| null)` | Hold the preview at a beat (scrub), or follow the sim clock. Reads sim time, never writes it |
| `stopPreview()` | Release; ends the show |
| `isPreviewing()` / `getPreviewBeat()` | State |

A ship plays: its preview draft → a share-link override (`setShowOverride`, share links only) →
the player's saved show → the factory show. An empty draft previews dark. `endHarborShow()` clears
the preview, so a reset can never leave one behind. The old desk-only `setPreview` /
`clearPreview` (which lit every ship through a global flag) are gone.

## Save rule

**One store: `userShows.ts`, its own `localStorage` key `harborglow:userShows:v1`, not the game save.**
The desk and the cue editor used to keep separate stores (the desk's `authoredShows` in the v4
save, the editor's own key), reconciled only by a lookup order; unifying them meant choosing, and
the separate key won:

- `loadGameState()` returns `null` on **any** version mismatch, so bumping `VERSION` in
  `storage_manager.ts` wipes every save — and #261 will change that code. Shows in the save would be
  hostage to it; a separate key needs no `VERSION` bump and waits on nothing.
- Shows are authored content, not progress. New Game (`resetGame` → `clearSave`) must not delete them.
- `userShows.ts` is a leaf module (type-only imports, lazy schema, hydrate-on-demand, stable object
  identity, `subscribeUserShows`) that `resolveShowForShip` can read from game-initial without
  pulling in the store. The save would have kept show objects in the zustand store, notified on every
  edit, and serialised on every autosave.

Everything read from that key is untrusted: each entry goes through `parseLightShow()`
(loaded with a dynamic `import()`, only when something is stored), and an entry that fails
— or names an unknown ship — is dropped with one `console.warn`, never thrown. Saving
validates too, waits for hydration and for a running legacy import so it cannot overwrite entries
that have not loaded yet, and falls back to playing from memory when storage is full or blocked.

**Migration (`importLegacyAuthoredShows`).** A save written before the merge carries the desk's
`authoredShows` (id = the ship type). `loadSavedState()` hands it over, and so does `resetGame()`
(reading the save it is about to clear — New Game must not eat shows). Each valid entry becomes the
ship's user show (id `${shipType}-user`); a ship that already has a user show keeps it, since the cue
editor's show already outranked the desk's. Invalid entries are dropped with a warning. Until the
result is written to the user-shows key, `getSerializableState()` keeps emitting the raw legacy
field (`getPendingLegacyShows()`), so an autosave that fires while the lazy schema is still loading —
or while storage is failing — cannot lose them; once persisted, the next save simply omits the field.
`storage_manager.ts` still lists `authoredShows?` on its payload type purely as this legacy read.
The game save otherwise holds no light-show data.

## Sharing

Shows travel as `#hgshow=` links or `.hgshow` files — see [SHARE_LINKS.md](SHARE_LINKS.md).
