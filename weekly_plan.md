# harborglow — Weekly Plan

## Today's focus
**2026-05-10 — New Idea mode.** Implement the multiview viewport-local history stack (Alt A architecture from 2026-04-19 research). Drop the CameraPreset type + 6-preset registry + dropdown. Add per-viewport `history: CameraTransform[]` + `pinned: CameraTransform[]` stacks in `MultiviewSystem.tsx`, back/forward arrows + 📌 pin button in viewport chrome, Shift+1–6 pinned-view recall. Use `<View>` from `@react-three/drei`. Touch `src/scenes/MultiviewSystem.tsx` and `src/systems/cameraSystem.ts` only. ~90–120 LOC net change. 

## Ideas
<!--
Write ideas here during the week as they come to you.
Routine prioritizes these over generated ideas.
Format: - [ ] Short description (optional: more context on next line indented)
Routine will mark picked items as "[in progress — YYYY-MM-DD]".
-->
- [x] Music/event sync timeline — done 2026-05-10 (cinematicSystem.ts + sequencerSystem.ts wired at crane + tugboat paths; LyricsDisplay setTimeout-free)
- [ ] Ship blueprint visual differentiation: give each of the 8 ship types a distinct procedural silhouette distinguishable at LOD2 (impostor-box distance). Update src/blueprints/ per type + ProceduralShip renderer. Full-day.
- [ ] ESLint flat config migration + Vitest baseline: migrate .eslintrc.json → eslint.config.js (ESLint v9 flat format), update lint scripts, add Vitest with a minimal smoke test for sequencerSystem.ts. Resolves backlog "No test runner" + unblocks npm run lint in clean environments. Half-day.

## Backlog
<!--
Unfinished items, known bugs, deferred ideas.
Routine maintains this automatically — you can add items too.
-->
- [ ] Dead-code prune: `src/scenes/ControlBooth{,Example,Integration,Optimized,Swappable,WithMonitorSystem}.tsx` — only one is active; others are historical forks.
- [ ] Root-level codemod scripts (`fix_components.cjs`, `fix_deps.cjs`, `fix_hologram.cjs`, `fix_let_const.cjs`, `fix_lightshow.cjs`, `fix_lint.cjs`) appear to be one-shot post-refactor tools — either move to `scripts/` or delete.
- [ ] No test runner wired in package.json — vitest setup is a future hygiene task.
- [ ] deploy.py: password hardcoded in plaintext (line 45); recursive call uses outer `sftp` var — fix before any real deploy.
- [ ] introMusicSystem awaits AI-generated MP3 assets (`./audio/clear_harbor_glow_intro.mp3`, `./audio/clear_harbor_glow_loop.mp3`) — procedural fallback active; MiniMax generation pending (lyrics + production notes in `intro_song.md`).
- [ ] God-rays WGSL compute shader staged at `shaders/god-rays-compute.wgsl` — not wired into PostProcessing pipeline; future WebGPU integration task.
- [ ] LightShow.tsx has 4 `setTimeout(() => setPowerOnProgress(0.1), X)` power-on delays — could be migrated to sequencerSystem.schedule() for tighter beat-sync in a future pass.

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
- 2026-05-10 — Music/event sync timeline: `cinematicSystem.ts` (53 LOC) + `sequencerSystem.ts` (143 LOC) created; `triggerUpgradeCinematic()` wired at crane path (UpgradeMenu.tsx:65) and tugboat-win path (MainScene.tsx:336); LyricsDisplay.tsx + audioVisualSync.ts both setTimeout-free. Multi-day idea fully landed.
- 2026-05-03 (PR #18) — 4 circular-dep warnings resolved: `eventSystem` barrel-export cycle fixed via refactor of `dynamicEventSystem.ts` + `timeSystem.ts`; affects OnDockRail, DistantShipQueue, techSystem, MainScene.
- 2026-05-03 — Ship blueprints: Island Hopper ferry, North Star trawler, Horizon Deep research vessel added to `ships.json` (ea1390e; kimi-cli swarm, 3 iterations, build PASS).
- 2026-05-03 — `sequencerSystem.ts` skeleton (143 LOC): Transport-locked scheduler with `schedule` / `scheduleAt` / `seekTo` / `cancel` / `clearAll`. `musicSystem.triggerClimax` now uses `transport.scheduleOnce`. `audioVisualSync` Transport-state guard added (d612c5b, Copilot).
- 2026-05-03 — `introMusicSystem.ts` + `introLyrics.ts`: title anthem system with MiniMax MP3 detection + procedural fallback, wired into `MainMenu` + `App` screen transitions (f214de0).
- 2026-04-26 — HEARTBEAT.md refreshed (PR #10 pipeline hygiene pass; HEARTBEAT now shows Apr 19 2026, 0 TODOs).
- 2026-04-26 — TODO/FIXME count confirmed at 0 (crane interactivity stub resolved in physics tuning work).
- 2026-04-19 — Crane-to-ship attachment tuning: 150ms bind-interpolation, delta-corrected sway decay, framerate-independent damping, twistlock cable lockout (PR #8 area).
- 2026-04-19 — Multiview camera dashboard: preset state + monitor quick-swap UI (PR #9, Copilot). NOTE: superseded by Alt A research — viewport-local history stack is today's 2026-05-10 focus.
- 2026-04-13 — PR #5 merged: hook dependency cleanup, let→const pass.
- 2026-04-06 — PR #4 merged: R3F hooks-outside-Canvas fix, crane jib constants extracted.
- 2026-03 — PR #3 merged: large-component split. PR #2 merged: fullscreen canvas + booth immersion.

## Last run
<!-- Routine writes summary here each run. Overwrites previous. -->
Date: 2026-05-10
Mode: New Idea
Focus: Multiview viewport-local history stack (Alt A — per-viewport history[] + pinned[], back/forward + 📌 pin, Shift+1–6 recall). MultiviewSystem.tsx + cameraSystem.ts only.
Outcome: (fill in at end of day)
