# Audio

HarborGlow's audio is an in-tree C++ engine (`cpp/harborglow_audio_engine.cpp`)
compiled to WASM and run inside an AudioWorklet. There is no audio npm
dependency. `tone` was removed (#204 workstream C) and must not come back —
`src/test/__tests__/audioSetup.test.ts` fails on any `tone` import, dependency,
or Vite alias.

## Layers

| Module | Role |
| --- | --- |
| `audio/AudioRuntime.ts` | AudioContext, worklet boot, shared-memory command / analysis rings, native fallback, master mute. `audioRuntime` singleton. |
| `audio/transport.ts` | `BeatTransport`: musical position in quarter-note beats, scheduling, `scheduleSequence` / `scheduleLoop`. `transport` singleton. |
| `audio/voices.ts` | `Instrument` (notes / chords / held notes), `Drone` (sustained tone following game state), `SamplePlayer` (decoded MP3 with a real gain fade), `unlockAudio`, `setMasterMuted`. |

The engine renders every voice into **one bus** with global effects
(`audioRuntime.setEffects` / `setAcousticSpace`). There is no per-voice node
graph: timbre is waveform + envelope + level. SFX must not call `setEffects`
to fake a per-sound filter — it changes everything that is playing.

The engine ABI has no pitch / level update command, so `Drone` re-voices on a
change and throttles to audible steps (¼ semitone, 1 dB). Write a drone's
level once per update, not twice.

## Clocks and determinism

`BeatTransport` derives its position from a clock; it never accumulates timer
callbacks:

- `'sim'` — `getSim().simTime`. Ship music (`MusicSystem.startMusic`) and
  `sequencerSystem` cues. The multiplayer path passes `simTime` as the song
  offset, so every peer lands on the same beat.
- `'audio'` — `AudioContext.currentTime`. Menu music (`introMusicSystem`), which
  plays before the sim runs and owns its own `BeatTransport`.

A 12 ms pump calls `update()` while started, but that only decides *when* due
events fire — the beat they belong to comes from the clock. Repeating events
realign to the next occurrence after a late start, seek, or lag spike instead of
replaying missed steps.

Audio only **reads** sim time. It never ticks the scheduler, draws from the sim
RNG, or writes the store, so it cannot change `hashSimSnapshot`
(`src/systems/sim/__tests__/audioIsolation.test.ts`).

Lyrics (`LyricEntry.time`, `'bars:beats'`) and light-show beat phase
(`audioVisualSync` → `transport.beatPhase()`) are keyed to transport beats.

## Hosting

The shared-memory worklet needs `SharedArrayBuffer`, so pages must be
cross-origin isolated (`COOP: same-origin`, `COEP: require-corp`). Vite dev and
preview set these in `vite.config.ts`. Without isolation `AudioRuntime` falls
back to native oscillators — as of 2026-09-21 this fallback fires a one-time
`console.warn` naming the specific failed condition (`AudioRuntime.ts`,
`warnFallbackReason()`), though that warning — like all `console.*` calls —
is stripped from production builds by `vite.config.ts`'s `drop_console: true`.
`audioRuntime.status` (exposed as `window.harborglowAudioRuntime.status`) is
the diagnostic that actually survives to production. See
`docs/DEPLOY_SUBPATH_PROBE.md` for a measured subpath + COOP/COEP probe.

## Tests

`src/test/setup.ts` replaces the `audioRuntime` singleton with
`FakeAudioRuntime` (`src/test/audioRuntimeMock.ts`), which records `notes`,
`active` voices, and `effects`. The `AudioRuntime` class stays real. For
transport logic, construct `new BeatTransport({ autoPump: false, clocks })`
with a manual clock.
