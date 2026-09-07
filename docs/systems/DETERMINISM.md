# Deterministic simulation core

HarborGlow's living harbor is a **seeded, fixed-step simulation**. Time and
entropy are injected through `SimContext`; they are not read from the wall
clock or `Math.random()` inside sim systems.

This is the contract that makes replays, headless balance tests, and
input-log multiplayer (#183) possible. Store ownership stays in
[STORE.md](../STORE.md). Tick registration stays in
[SYSTEM_BOOTSTRAP.md](./SYSTEM_BOOTSTRAP.md).

## SimContext

```ts
interface SimContext {
  rng: Rng          // xoshiro128** (Blackman & Vigna 2018)
  simTime: number   // seconds since seed, advanced only by the scheduler
  dt: number        // always 1/60
  tick: number      // ordinal since reset
  alpha: number     // leftover accumulator / dt for interpolated rendering
}
```

Access from sim code via `getSim()`, `simRandom()`, and `simNowMs()`
(`src/systems/sim/`). Never call `Math.random`, `Date.now`, or
`performance.now` in `src/systems/**` unless the file is allowlisted
(audio, WebRTC RTT, FPS meters).

### RNG

`Rng` is **xoshiro128\*\*** with splitmix32 seeding from a single uint32.
Same seed ⇒ same `nextUint32()` stream. Unit tests freeze a known vector
for seed `42`.

## Fixed-step scheduler

`simScheduler` (`FixedStepScheduler`) lives under `src/systems/sim/` and is
driven from `MainScene` `useFrame`:

1. Accumulate render `delta` (clamped).
2. While accumulator ≥ `SIM_DT` (1/60 s), increment `tick` / `simTime` and
   call `systemRegistry.tick(SIM_DT, ctx)`.
3. Expose `alpha` for render interpolation.

Storm escalation, waves, economy-adjacent traffic, and wildlife therefore
do not change with monitor refresh rate.

The `high`-tier FFT ocean rides on the same contract: its spectrum is seeded
through `Rng.fork()` (which does not advance the sim RNG) and its transform
cadence is driven by accumulated `SIM_DT`, so enabling it cannot change the sim
hash. See [OCEAN_FFT.md](./OCEAN_FFT.md#determinism).

## Replay file

```json
{ "version": 1, "seed": 42, "dt": 0.016666..., "inputs": [{ "tick": 12, "action": "storm.start", "payload": { "duration": 180 } }] }
```

Leva folder **Determinism**: seed, reset, record (writes
`localStorage['harborglow.replay']`), replay stored session.

A replay is kilobytes. Shared-harbor WebRTC sends this artifact on the
reliable `sim` channel (`hello`) plus live `input` packets — not per-entity
transforms.

## Headless harness

```ts
import { runHeadlessTicks } from '../systems/sim'
runHeadlessTicks(42, 10_000, 60) // → FNV-1a hash of the core snapshot
```

`npm test` includes `src/systems/sim/__tests__/determinism.harness.test.ts`:
same seed is byte-identical; 30 / 60 / 144 Hz frames produce the same hash
after 10,000 sim ticks (core groups: time, weather, lighting, waves, storm).
Spawn-heavy traffic / wildlife / harbor events are covered by the shorter
same-seed identity run.

## Converted systems

Storm, waves, time, moon, weather, traffic, wildlife, harbor events,
dynamic events, ship spawner, lighting-show clocks.

Cosmetic particle / menu jitter in `src/scenes/**` may keep `Math.random()`.

## #183

Host and spectator share `{ seed, replay }` on wire protocol **v2**. Each
side runs the same fixed-step core (`simScheduler.reset(seed)` then
`applyReplayInput` for the log and live inputs). Render interpolates with
`SimContext.alpha`.

Packets (msgpack `WireEnvelope.v === 2`) on a reliable ordered `sim`
channel:

- `hello` — `{ seed, tick, replay }` on join and after desync
- `input` — `{ tick, action, payload }` (host authority: crane axes, spawn,
  install, storm start/stop)
- `hash` — `{ tick, fnv }` from `hashSimSnapshot` about once a second
- `resync` — spectator asks for a new `hello`
- `ping` / `pong` / `chat` — stay on the `chat` channel

On FNV mismatch the spectator logs the desync and requests `hello`. It does
**not** rubber-band hulls or apply `NetworkSyncState` transform patches.

`multiplayerSystem.ts` is transport (presence, signalling, chat, attach).
Do not replicate foam, wildlife, or traffic meshes at 10 Hz. Cosmetic
`Math.random()` in `src/scenes/**` stays local. Music starts from the local
store (install completion) with Tone transport offset from `simTime`.

Creating a shared harbor reseeds the sim. TURN / production
`VITE_SIGNAL_URL` is a follow-up; local default remains `localhost:8787`.
