# harborglow — Weekly Plan

## Today's focus
**2026-04-19 — New Idea mode.** Tune crane-to-ship physics attachment: eliminate snap-to jitter when a payload binds to an attachment point, tame rope/cable oscillation after release, and make joint stiffness/damping framerate-independent. Top Active focus area per PROJECT CONTEXT and has received zero direct work in the last 3 PRs.

## Ideas
<!--
Write ideas here during the week as they come to you.
Routine prioritizes these over generated ideas.
Format: - [ ] Short description (optional: more context on next line indented)
Routine will mark picked items as "[in progress — YYYY-MM-DD]".
-->
- [ ] Expand procedural ship blueprint set: ferry, fishing trawler, research vessel (half-to-full day). Blueprints pipeline exists but only 3 ships; more variety stresses upgrade-point generation and music-per-ship mapping.
- [ ] Music/event sync timeline: explicit sequencer wiring Tone.js Transport to cinematic triggers (spotlight hits, lyric reveals, camera cuts). Would replace ad-hoc setTimeouts in `audioVisualSync.ts` and friends. Multi-day.

## Backlog
<!--
Unfinished items, known bugs, deferred ideas.
Routine maintains this automatically — you can add items too.
-->
- [ ] HEARTBEAT.md is stale (dated Mar 8, 2026) — rewrite after today's build-run.
- [ ] Dead-code prune: `src/scenes/ControlBooth{,Example,Integration,Optimized,Swappable,WithMonitorSystem}.tsx` — only one is active; others are historical forks.
- [ ] Root-level codemod scripts (`fix_components.cjs`, `fix_deps.cjs`, `fix_hologram.cjs`, `fix_let_const.cjs`, `fix_lightshow.cjs`, `fix_lint.cjs`) appear to be one-shot post-refactor tools — either move to `scripts/` or delete.
- [ ] Only 1 TODO/FIXME left per HEARTBEAT ("crane interactivity") — confirm and close out.
- [ ] No test runner wired in package.json (confirmed by K2/Jules analysis) — vitest setup is a future hygiene task.

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
- 2026-04-13 — PR #5 merged: hook dependency cleanup, let→const pass.
- 2026-04-06 — PR #4 merged: R3F hooks-outside-Canvas fix, crane jib constants extracted.
- 2026-03 — PR #3 merged: large-component split. PR #2 merged: fullscreen canvas + booth immersion.

## Last run
<!-- Routine writes summary here each run. Overwrites previous. -->
Date: 2026-04-19
Mode: New Idea (weekly_plan.md did not exist; Ideas empty)
Focus: Crane-to-ship physics attachment tuning (jitter, oscillation, framerate-independent joints)
Outcome: All 4 symptoms addressed — 150ms bind-interpolation (AttachmentSystemManager), delta-corrected cable sway decay (CraneCable), framerate-independent damping (swaySystem), twistlock cable lockout (CraneCable + Crane). Build/heartbeat clean.
