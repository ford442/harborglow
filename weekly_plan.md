# harborglow — Weekly Plan

## Today's focus
**2026-04-26 — User Idea mode.** Expand the procedural ship blueprint set with three new vessels: a passenger ferry, a fishing trawler, and a research vessel. The blueprint pipeline (ships.json + ShipBlueprint.ts + ProceduralShip.tsx) is clean and well-understood; only 3 ships exist against a system designed for variety. More blueprints stress-test upgrade-point generation, per-ship music mapping, and the living-fleet departure/return cycle simultaneously.

## Ideas
<!--
Write ideas here during the week as they come to you.
Routine prioritizes these over generated ideas.
Format: - [ ] Short description (optional: more context on next line indented)
Routine will mark picked items as "[in progress — YYYY-MM-DD]".
-->
- [in progress — 2026-04-26] Expand procedural ship blueprint set: ferry, fishing trawler, research vessel (half-to-full day). Blueprints pipeline exists but only 3 ships; more variety stresses upgrade-point generation and music-per-ship mapping.
- [ ] Music/event sync timeline: explicit sequencer wiring Tone.js Transport to cinematic triggers (spotlight hits, lyric reveals, camera cuts). Would replace ad-hoc setTimeouts in `audioVisualSync.ts` and friends. Multi-day.

## Backlog
<!--
Unfinished items, known bugs, deferred ideas.
Routine maintains this automatically — you can add items too.
-->
- [ ] Dead-code prune: `src/scenes/ControlBooth{,Example,Integration,Optimized,Swappable,WithMonitorSystem}.tsx` — only one is active; others are historical forks.
- [ ] Root-level codemod scripts (`fix_components.cjs`, `fix_deps.cjs`, `fix_hologram.cjs`, `fix_let_const.cjs`, `fix_lightshow.cjs`, `fix_lint.cjs`) appear to be one-shot post-refactor tools — either move to `scripts/` or delete.
- [ ] 4 circular-dep warnings: `harborEventSystem` reexport through `eventSystem/index.ts` affects OnDockRail, DistantShipQueue, techSystem, MainScene — resolve the barrel-export cycle.
- [ ] No test runner wired in package.json — vitest setup is a future hygiene task.
- [ ] deploy.py: password hardcoded in plaintext (line 45); recursive call uses outer `sftp` var — fix before any real deploy.

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
- 2026-04-26 — HEARTBEAT.md refreshed (PR #10 pipeline hygiene pass; HEARTBEAT now shows Apr 19 2026, 0 TODOs).
- 2026-04-26 — TODO/FIXME count confirmed at 0 (crane interactivity stub resolved in physics tuning work).
- 2026-04-19 — Crane-to-ship attachment tuning: 150ms bind-interpolation, delta-corrected sway decay, framerate-independent damping, twistlock cable lockout (PR #8 area).
- 2026-04-19 — Multiview camera dashboard: preset state + monitor quick-swap UI (PR #9, Copilot).
- 2026-04-13 — PR #5 merged: hook dependency cleanup, let→const pass.
- 2026-04-06 — PR #4 merged: R3F hooks-outside-Canvas fix, crane jib constants extracted.
- 2026-03 — PR #3 merged: large-component split. PR #2 merged: fullscreen canvas + booth immersion.

## Last run
<!-- Routine writes summary here each run. Overwrites previous. -->
Date: 2026-04-26
Mode: User Idea
Focus: Expand procedural ship blueprint set — passenger ferry, fishing trawler, research vessel added to ships.json
Outcome: (fill in at end of day)
