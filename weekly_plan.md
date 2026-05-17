# harborglow — Weekly Plan

## Today's focus
**2026-05-17 — User Idea mode.** Ship blueprint visual differentiation: give each of the 11 ship types a distinct procedural silhouette distinguishable at LOD2 (impostor-box distance). Two-phase work:  
1. Expand `ImpostorMesh` + `LODShip` in `src/systems/performanceSystem.tsx` — widen the type union from 3 to 11 ship types, assign each a distinct emissive color and hull aspect ratio.  
2. Add per-type `*Details` components in `src/scenes/ProceduralShip.tsx` for the 8 types that currently only have JSON blueprint parts (bulk, lng, roro, research, droneship, ferry, trawler, horizon).  
Touch `src/systems/performanceSystem.tsx`, `src/scenes/ProceduralShip.tsx`, and `src/blueprints/ships.json` only. Full-day.

## Ideas
<!--
Write ideas here during the week as they come to you.
Routine prioritizes these over generated ideas.
Format: - [ ] Short description (optional: more context on next line indented)
Routine will mark picked items as "[in progress — YYYY-MM-DD]".
-->
- [x] Music/event sync timeline — done 2026-05-10 (cinematicSystem.ts + sequencerSystem.ts wired at crane + tugboat paths; LyricsDisplay setTimeout-free)
- [in progress — 2026-05-17] Ship blueprint visual differentiation: give each of the 8 ship types a distinct procedural silhouette distinguishable at LOD2 (impostor-box distance). Update src/blueprints/ per type + ProceduralShip renderer. Full-day.
- [x] ESLint flat config migration + Vitest baseline — done 2026-05-10 via PR #22 (eslint.config.js flat format, Vitest smoke test for sequencerSystem.ts)

## Backlog
<!--
Unfinished items, known bugs, deferred ideas.
Routine maintains this automatically — you can add items too.
-->
- [ ] Dead-code prune: `src/scenes/ControlBooth{,Example,Integration,Optimized,Swappable,WithMonitorSystem}.tsx` — only `ControlBooth.tsx` is imported by MainScene; the other 5 are historical forks. PR #26 added `src/scenes/controlBooth/` module; the root-level forks are now fully redundant.
- [ ] Root-level codemod scripts (`fix_components.cjs`, `fix_deps.cjs`, `fix_hologram.cjs`, `fix_let_const.cjs`, `fix_lightshow.cjs`, `fix_lint.cjs`) appear to be one-shot post-refactor tools — either move to `scripts/` or delete.
- [ ] deploy.py: password hardcoded in plaintext (line 45); recursive call uses outer `sftp` var — fix before any real deploy.
- [ ] introMusicSystem awaits AI-generated MP3 assets (`./audio/clear_harbor_glow_intro.mp3`, `./audio/clear_harbor_glow_loop.mp3`) — procedural fallback active; MiniMax generation pending (lyrics + production notes in `intro_song.md`).
- [ ] God-rays WGSL compute shader staged at `shaders/god-rays-compute.wgsl` — not wired into PostProcessing pipeline; future WebGPU integration task.
- [ ] LightShow.tsx has 4 `setTimeout(() => setPowerOnProgress(0.1), X)` power-on delays — could be migrated to sequencerSystem.schedule() for tighter beat-sync in a future pass.
- [ ] `dist/` folder committed in PR #26 (9c2ee78, 88bad00) — should be in .gitignore or cleaned from history; bloats repo with binary build artifacts.
- [ ] REFACTORING_GUIDE.md and REFACTORING_SUMMARY.md committed to repo root (PR #26) — consider moving to `docs/` or removing post-refactor.

## Research notes — multiview camera dashboard (2026-04-19)
Architecture decision locked after running C-prompts:
- **Approach: Alt A — Viewport-Local History Stack** (K2 recommendation, adopted).
  Drop the CameraPreset type + 6-preset registry + dropdown. Instead: per-viewport `history: CameraTransform[]` + `pinned: CameraTransform[]`. Back/forward arrows + 📌 pin button in viewport chrome. Shift+1–6 recalls pinned views (avoids training-mode key conflict).
  Files to touch: `src/scenes/MultiviewSystem.tsx`, `src/systems/cameraSystem.ts` only. ~90–120 LOC.
- **Render path:** use `<View>` from `@react-three/drei` (confirmed by Grok). Do not roll a custom scissor loop.
- **Four traps to avoid** (Gemini):
  1. Zustand selector invalidation in `useFrame` — use `useGameStore.getState()` transiently, not a reactive selector.
  2. `gl.setScissorTest` leak on Suspense abort — wrap multiview render loop in try/finally.
  3. Raycaster single-camera assumption — `useThree(({ camera })` defaults to primary camera; each viewport must project from its own.
  4. CameraMode type collision — `CameraTransform` must not compete with the existing `CameraMode` union.
- **Stack is safe at current pins** (Grok); r162 removes `WebGLMultipleRenderTargets`, drei 10+ is React 19 only — do not upgrade mid-feature.
- Copilot handoff revised to reflect Alt A approach (see session transcript 2026-04-19).

## Done
<!--
Completed items, routine archives here with date.
Prune occasionally when this gets long.
-->
- 2026-05-16 — PR #26: Phase 2 refactoring — musicSystem decomposed to `src/systems/music/` (MusicSystem.ts, lyrics.ts, musicSynthChains.ts, musicTracks.ts, index.ts); ControlBooth → `src/scenes/controlBooth/` module; TrainingMode → `src/components/training/` module; LightShow → `src/scenes/lightRigs/` module (FogEffect, LightRigAnimations, LightRigTypes, SparkEffect).
- 2026-05-10 — Multiview viewport-local history stack (Alt A): per-viewport `history: CameraTransform[]` + `pinned: CameraTransform[]` stacks, back/forward arrows + 📌 pin button in viewport chrome, Shift+1–6 pinned-view recall. `CameraTransform` type added to store (distinct from `CameraMode`). MultiviewSystem.tsx full impl, cameraSystem.ts updated.
- 2026-05-10 — ESLint flat config migration + Vitest baseline (PR #22): migrated `.eslintrc.json` → `eslint.config.js` (ESLint v9 flat format), updated lint scripts, added Vitest smoke test for `sequencerSystem.ts`. Resolves backlog "No test runner."
- 2026-05-10 — Music/event sync timeline: `cinematicSystem.ts` (53 LOC) + `sequencerSystem.ts` (143 LOC) created; `triggerUpgradeCinematic()` wired at crane path (UpgradeMenu.tsx:65) and tugboat-win path (MainScene.tsx:336); LyricsDisplay.tsx + audioVisualSync.ts both setTimeout-free. Multi-day idea fully landed.
- 2026-05-03 (PR #18) — 4 circular-dep warnings resolved: `eventSystem` barrel-export cycle fixed via refactor of `dynamicEventSystem.ts` + `timeSystem.ts`; affects OnDockRail, DistantShipQueue, techSystem, MainScene.
- 2026-05-03 — Ship blueprints: Island Hopper ferry, North Star trawler, Horizon Deep research vessel added to `ships.json` (ea1390e; kimi-cli swarm, 3 iterations, build PASS).
- 2026-05-03 — `sequencerSystem.ts` skeleton (143 LOC): Transport-locked scheduler with `schedule` / `scheduleAt` / `seekTo` / `cancel` / `clearAll`. `musicSystem.triggerClimax` now uses `transport.scheduleOnce`. `audioVisualSync` Transport-state guard added (d612c5b, Copilot).
- 2026-05-03 — `introMusicSystem.ts` + `introLyrics.ts`: title anthem system with MiniMax MP3 detection + procedural fallback, wired into `MainMenu` + `App` screen transitions (f214de0).
- 2026-04-26 — HEARTBEAT.md refreshed (PR #10 pipeline hygiene pass; HEARTBEAT now shows Apr 19 2026, 0 TODOs).
- 2026-04-26 — TODO/FIXME count confirmed at 0 (crane interactivity stub resolved in physics tuning work).
- 2026-04-19 — Crane-to-ship attachment tuning: 150ms bind-interpolation, delta-corrected sway decay, framerate-independent damping, twistlock cable lockout (PR #8 area).
- 2026-04-19 — Multiview camera dashboard: preset state + monitor quick-swap UI (PR #9, Copilot). NOTE: superseded by Alt A research — viewport-local history stack landed 2026-05-10.
- 2026-04-13 — PR #5 merged: hook dependency cleanup, let→const pass.
- 2026-04-06 — PR #4 merged: R3F hooks-outside-Canvas fix, crane jib constants extracted.
- 2026-03 — PR #3 merged: large-component split. PR #2 merged: fullscreen canvas + booth immersion.

## Last run
<!-- Routine writes summary here each run. Overwrites previous. -->
Date: 2026-05-17
Mode: User Idea
Focus: Ship blueprint visual differentiation — expand ImpostorMesh/LODShip in performanceSystem.tsx from 3 to 11 ship types + add *Details components in ProceduralShip.tsx for 8 blueprint-only types.
Outcome: (fill in at end of day)
