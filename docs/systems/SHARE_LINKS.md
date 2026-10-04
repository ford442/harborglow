# Share links & `.hgshow` files

Epic #236, slice 5. A light show (plus an optional recorded performance) travels as a URL
fragment or a downloadable file. Opening either boots straight into spectator playback.
There is no server and no gallery.

## Document

```ts
ShowDocument = {
  v: 1,
  shipType: ShipType,
  trackId: string,              // == shipType today (music is keyed by ShipType)
  loopBeats: number,
  cues: LightCueV2[],           // validated by parseLightShow (src/schemas/lightShow.ts)
  inputLog?: InputLogEntry[],   // optional performance (src/systems/sim/replay.ts)
  sim?: { seed, dt, ticks, hash } // required iff inputLog; hash = hashSimSnapshot() at `ticks`
}
```

## Wire format

`"HGSH" | version byte (1) | deflate-raw(msgpack(doc))` — `src/systems/share/showCodec.ts`.

- **Link:** `#hgshow=<base64url(bytes)>` when the whole fragment is <= 8192 chars
  (`SHARE_FRAGMENT_MAX`). Every factory preset fits.
- **File:** otherwise the same bytes download as `<shipType>.hgshow`.
- Opened files go through the same decoder (main menu → *Open .hgshow*).
- Compression is the native `CompressionStream` (Chrome 113+, already required).

## Validation (untrusted input)

`src/schemas/showDocument.ts` (valibot, lazy-loaded). `decodeShow` throws only
`ShowDecodeError`. Limits: 1 MB inflated (decompression bombs), 2048 cues, 20000 inputs,
30 min of ticks. `inputLog` actions must be in the whitelist of `applyReplayInput`; ticks
non-decreasing and <= `sim.ticks`; strict objects (no extra keys).

## Playback

`startSharedPlayback` (`playSharedShow.ts`): loads the replay (or `reset(1)` and spawns the
ship), installs the cues through `lightingSystem.setShowOverride`, starts the track, and
uses a persistent spectator camera. The "Click to watch" splash is the user gesture that
lets audio start.

- **Final-hash check:** with a performance, `MainScene` holds the sim at `sim.ticks`,
  compares `hashSimSnapshot()` with `sim.hash`, and the HUD badge shows verified / mismatch.
- **Never writes the viewer's save.** `sharedPlaybackState.active` makes `scheduleSave` a
  no-op, and playback avoids `resetGame()` (which calls `clearSave()`). *Exit* reloads.

## Recording a shareable performance

A performance is only replayable from `reset(seed)`, so it is included only when the
recording began at tick 0 (`simScheduler.recordingStartTick === 0`). Otherwise the share
exports the show alone.

## Caveats

- The hash covers the core sim only (not lighting) until #235 adds per-system hashes.
- `lengthBeats` / `target` / `easing` are carried but not interpreted (see LIGHT_SHOWS.md).
- Headless CI has no WebGPU, so the scene itself can't boot in e2e; playback is covered by
  the unit tests, the menu-level flow by `e2e/share-link.spec.ts`.
