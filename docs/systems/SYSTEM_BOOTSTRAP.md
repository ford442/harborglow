# System Bootstrap Lifecycle

MainScene previously called ~13 singleton `.update()` methods directly inside `useFrame`. That pattern made ordering implicit, offered no start/stop contract, and forced every new ambient system to edit `MainScene.tsx`.

The bootstrap layer centralizes registration, tick order, and mode-aware pausing.

## Entry points

| Module | Role |
|--------|------|
| `src/systems/bootstrap/SystemRegistry.ts` | Registry singleton (`systemRegistry`) with `register`, `startAll`, `stopAll`, `pauseGroup`, `tick` |
| `src/systems/bootstrap/mainSceneSystems.ts` | Registers all living-harbor systems with explicit `order` |
| `src/systems/bootstrap/modeLifecycle.ts` | `syncSystemModeLifecycle` + `useMainSceneSystemBootstrap` hook |
| `src/scenes/MainScene.tsx` | Calls `useMainSceneSystemBootstrap()` once and `systemRegistry.tick(...)` from `useFrame` |

## Tick order table

Lower `order` runs first. Gaps leave room for insertions.

| order | id | groups | notes |
|------:|----|--------|-------|
| 10 | `time` | `core` | Accelerated day/night |
| 20 | `traffic` | `traffic` | NPC ship queue / deadlines |
| 30 | `lighting` | `core` | Beat-synced dock lighting |
| 40 | `weather` | `core` | Weather state machine |
| 50 | `sway` | `crane` | Crane hook pendulum physics |
| 55 | `crane-b` | `crane` | NPC Crane B for multi-crane training (`shouldTick` gated) |
| 60 | `wildlife` | `ambient` | Whales, dolphins, sharks |
| 70 | `ambient-marine-life` | `ambient` | Density-driven schools / particles |
| 80 | `sea-events` | `ambient` | Milky seas, meteor shower, etc. |
| 90 | `harbor-events` | `harbor-events` | Tariffs, labor actions, arrivals |
| 100 | `dynamic-events` | `harbor-events` | Scripted harbor story beats |
| 110 | `experimental-tech` | `harbor-events` | Booth-tier experimental upgrades |
| 120 | `waves` | `core` | FFT ocean + physics sync |
| 130 | `storm` | `storm` | Tugboat / emergency training storms |

## System groups & mode pausing

| Group | Paused when |
|-------|-------------|
| `core` | Never (time, lighting, weather, waves always run) |
| `traffic` | `gameMode === 'training'` |
| `crane` | `operationMode !== 'crane'` |
| `ambient` | `gameMode === 'training'` |
| `harbor-events` | Training mode **or** `activeMission.status === 'active'` |
| `storm` | Not in tugboat mode and not emergency crane training |

`storm` also defines a `shouldTick` guard so updates only run when tugboat helm or emergency training is active, even if the group is resumed.

Storm **duration** start/stop (`stormSystem.start(180)` etc.) remains in MainScene's tugboat-mode `useEffect` — the registry only gates per-frame `update` calls.

## Adding a new system

1. Implement your singleton in `src/systems/` with an `update(dt, …)` method (and optional `start`/`stop` if it owns timers or subscriptions).
2. Register it in `mainSceneSystems.ts` with a unique `id`, an `order` between neighbors, and a `groups` entry if it should pause off-mode.
3. If it needs per-frame context beyond `delta`, extend `FrameContext` in `types.ts` and populate it in `buildFrameContext`.
4. Add a row to the table above (this file).
5. Extend `syncSystemModeLifecycle` if the new system needs mode-specific pause rules.

Example:

```ts
systemRegistry.register({
    id: 'my-ambient-system',
    order: 85,
    groups: ['ambient'],
    update: (dt) => myAmbientSystem.update(dt),
    start: () => myAmbientSystem.start(),
    stop: () => myAmbientSystem.stop(),
})
```

## Testing

```bash
npm test -- src/systems/bootstrap
```

`SystemRegistry.test.ts` covers tick ordering, duplicate-id rejection, and start/stop idempotency. `modeLifecycle.test.ts` covers group pause rules for operation/training/mission transitions.

## Out of scope

Rewriting individual system internals; gameplay logic that is not a singleton tick (e.g. tugboat win checks) stays in `MainScene` `useFrame` or dedicated hooks.
