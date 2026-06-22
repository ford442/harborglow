# harborglow — Weekly Plan

## Today's focus
**2026-06-21 — Fix First (resolved same-day), then User Idea mode.** Routine audit caught `main` with a broken production build: the 2026-06-15 Jules "modularize massive files" merge (PR #96, commit `bb3e993`) left `src/components/UpgradeMenu.tsx` with duplicate block-scoped declarations (`glow` declared twice, `currentVersion` declared twice, plus a dead unreachable `if (!currentShip)` null-check left over from before the file was split into `UpgradeMenu`/`UpgradeMenuInner`). `tsc` has been failing on `main` since that merge — confirmed `HEAD == main` at audit time. Fixed directly in this routine run (14 lines removed), verified via clean `tsc`, `vite build`, `npm run lint` (0 errors), and `vitest run` (100/100 passing). Pushed to `claude/kind-galileo-hsuqqa` with a draft PR opened for review/merge to `main`.

With the foundation solid again, today's dispatch (kimi-cli + GitHub issue draft) targets the two open Ideas: **continuing per-band light-show choreography** for the remaining 9 ship types (kimi-cli, `src/systems/lightShows/*`), and **drafting the per-ship cinematic cutaway plans** idea as a decoupled GitHub issue for Copilot (`cinematicSystem.ts` / `cameraSystem.ts` / `CameraPreset.ts` — no file overlap with kimi-cli's lightShows work).

## Ideas
<!--
Write ideas here during the week as they come to you.
Routine prioritizes these over generated ideas.
Format: - [ ] Short description (optional: more context on next line indented)
Routine will mark picked items as "[in progress — YYYY-MM-DD]".
-->
- [x] Music/event sync timeline — done 2026-05-10 (cinematicSystem.ts + sequencerSystem.ts wired at crane + tugboat paths; LyricsDisplay setTimeout-free)
- [x] Ship blueprint visual differentiation — done 2026-06-06 (commit 63bb8da): `Lod2Impostor` in `ProceduralShip.tsx` now has a `FEATURE_COLORS` table, `GLOWING_FEATURES` set, profile-driven `tintHullColor()`, and geometry variety (cylinders for funnel/tank, mast cylinders). All 11 ships distinguishable at LOD2. Carried 2026-05-24 → in-progress 2026-05-31 → confirmed landed 2026-06-14.
- [x] ESLint flat config migration + Vitest baseline — done 2026-05-17 (PR #22: eslint.config.js + Vitest smoke tests; npm run lint + npm test both wired)
- [in progress — 2026-06-21] Per-band light-show choreography (`claude_contributions.md` §1): give each of the 11 ship-type bands a hand-felt light-cue schedule (`LightCue[]` — beat/pattern/color/intensity) instead of one shared beat-intensity curve. Engine hook in `lightingSystem.ts` + `src/systems/lightShows/`; LNG + Oil Tanker landed 2026-06-15 (see Done). Today's slice (kimi-cli): author the remaining 9 ship tables (cruise, container, bulk, roro, research, droneship, ferry, trawler, horizon) following the same pattern, matched to genre/BPM in `src/systems/music/musicTracks.ts`, registered in `lightShowRegistry` (`src/systems/lightShows/index.ts`).
- [x] Repo hygiene: `.playwright-mcp/*` debug artifacts + tracked `dist/*` files + `_legacy` ControlBooth forks + root `fix_*.cjs` codemods — done 2026-06-15 via issue #92 / PR #93 (Copilot). Confirmed clean at 2026-06-21 audit: `.playwright-mcp/` and `src/_legacy/` no longer exist, no tracked `dist/*` files, 6 codemods archived to `scripts/archive/`.
- [ ] Per-ship cinematic cutaway plans (`claude_contributions.md` §3): expand `cinematicSystem.ts`'s shared upgrade-cinematic beat-script (beat 0/4/12/24/32) into per-ship `schedule()` plans matched to each band's genre + BPM (`src/systems/music/musicTracks.ts`) and flattering camera shots (`cameraSystem.ts` / `src/types/CameraPreset.ts`) — e.g. low hero angle on the Oil Tanker's hull, high orbit on the Mega Cruise Liner. [spun into GitHub issue draft 2026-06-21 for Copilot — see dispatch]

## Backlog
<!--
Unfinished items, known bugs, deferred ideas.
Routine maintains this automatically — you can add items too.
-->
- [ ] God-rays WGSL compute shader staged at `shaders/god-rays-compute.wgsl` — not wired into PostProcessing pipeline; future WebGPU integration task. Still unwired as of 2026-06-21 audit, no related commits this week.
- [ ] New one-shot codemods at repo root from the 2026-06-15 GLB-loader work (`fix_glb_loader.cjs`, `fix_glb_loader_2.cjs`) — same pattern as the `fix_*.cjs` batch archived to `scripts/archive/` last week. Archive or delete.
- [ ] GLB model loader scaffold added but unwired: `useShipModel()` in `src/scenes/ProceduralShip.tsx` (from commit `bb3e993`) drafts a `.glb`-based attachment-point mapping for cruise/container/tanker, but it's dead code — never called, no `.glb` assets exist under `public/models/`, `useGLTF` import unused. Either wire it in with real assets or strip the stub. Relates to the long-standing CLAUDE.md TODO ("Ship models are procedural primitives").
- [ ] **SECURITY — decision needed from Noah**: PR #90 removed hardcoded credentials (SFTP password, deploy token) from HEAD, but they remain in this **public** repo's git history. K2/Kimi stress-test recommends: (1) rotate both credentials immediately regardless of anything else, (2) then decide whether to rewrite git history (`git-filter-repo`, force-push, GitHub support ticket to purge caches/old-PR refs — disruptive, invalidates all open PRs/clones) vs. accept the exposure as already-public and rely on rotation alone. This is a destructive, repo-wide operation requiring Noah's explicit go-ahead — not something to hand to an autonomous agent. **Still unresolved as of 2026-06-21 — no rotation evidence found, carrying forward a second week.**

## Research notes — multiview camera dashboard (2026-04-19)
Architecture decision locked after running C-prompts:
- **Approach: Alt A — Viewport-Local History Stack** (K2 recommendation, adopted). IMPLEMENTED 2026-05-17.
  Drop the CameraPreset type + 6-preset registry + dropdown. Instead: per-viewport `history: CameraTransform[]` + `pinned: CameraTransform[]`. Back/forward arrows + 📌 pin button in viewport chrome. Shift+1–6 recalls pinned views (avoids training-mode key conflict).
  Files touched: `src/scenes/MultiviewSystem.tsx`, `src/store/useGameStore.ts` (CameraTransform type + pushViewportHistory + pinViewportCamera).
- **Render path:** use `<View>` from `@react-three/drei` (confirmed by Grok). Do not roll a custom scissor loop.
- **Four traps to avoid** (Gemini):
  1. Zustand selector invalidation in `useFrame` — use `useGameStore.getState()` transiently, not a reactive selector.
  2. `gl.setScissorTest` leak on Suspense abort — wrap multiview render loop in try/finally.
  3. Raycaster single-camera assumption — `useThree(({ camera })` defaults to primary camera; each viewport must project from its own.
  4. CameraMode type collision — `CameraTransform` must not compete with the existing `CameraMode` union.
- **Stack is safe at current pins** (Grok); r162 removes `WebGLMultipleRenderTargets`, drei 10+ is React 19 only — do not upgrade mid-feature.

## Done
<!--
Completed items, routine archives here with date.
Prune occasionally when this gets long.
-->
- 2026-06-21 — **Build-break fix**: `main` had a broken production build since the 2026-06-15 Jules modularization merge (PR #96, `bb3e993`) — `src/components/UpgradeMenu.tsx` had duplicate block-scoped `glow`/`currentVersion` declarations plus a dead unreachable `if (!currentShip)` block left over from the `UpgradeMenu`/`UpgradeMenuInner` split. `tsc` failed for 6 days before this routine caught it via a fresh build (the error was masked locally by a missing `node_modules` re-install on past sessions). Fixed (14 lines removed), verified clean `tsc` + `vite build` + `lint` (0 errors) + `vitest` (100/100).
- 2026-06-21 — GitHub issue #89 (WebGL2 fallback renderer) confirmed closed/completed 2026-06-15: `src/rendering/createRenderer.ts` now provides a `webgpu`/`webgl` renderer switch (WebGPURenderer with WebGL2 fallback). One pre-existing lint nit remains (`@ts-ignore` vs `@ts-expect-error` at line 45) — left as-is; swapping to `@ts-expect-error` actually breaks `tsc` in the current dependency state (TS2578, directive unused), so it's not a safe one-line fix. Noted in Backlog only if it resurfaces.
- 2026-06-21 — Repo hygiene confirmed landed (issue #92 / PR #93, merged 2026-06-15): `.playwright-mcp/` and `src/_legacy/` both absent, no tracked `dist/*`, original 6 `fix_*.cjs` codemods archived to `scripts/archive/`. (Two *new* one-shot codemods from the GLB-loader work are back in root — see Backlog.)
- 2026-06-14 — **Security fix**: removed `deploy_old.py` (dead Paramiko/SFTP script with hardcoded plaintext password) and stripped the hardcoded `DEPLOY_TOKEN` default from `deploy.py` (now env-var only, `os.environ.get("DEPLOY_TOKEN")`). AGENTS.md deployment/security/testing sections updated to match. **Action still needed from Noah**: rotate both the removed SFTP password and the `storage.noahcohn.com` deploy token — both were exposed in this public repo's history.
- 2026-06-14 — Ship blueprint visual differentiation (commit 63bb8da, ~2026-06-06): `Lod2Impostor` renderer enhancement landed — `FEATURE_COLORS` table, `GLOWING_FEATURES`, profile-driven `tintHullColor()`, geometry variety (cylinders/masts). All 11 ships distinguishable at LOD2. Multi-week idea (2026-05-24 → 2026-05-31 → done) fully closed.
- 2026-06-14 — Intro title-anthem MP3 assets landed (commit 8ac0f1b, 2026-06-07): `clear_harbor_glow_intro.mp3` + `clear_harbor_glow_loop.mp3` (~4.9MB each) added to `public/audio/`; `introMusicSystem` MP3-detection path now active (procedural fallback no longer primary). Closes the long-pending MiniMax-asset backlog item.
- 2026-06-14 — LightShow power-on `setTimeout`/`setPowerOnProgress` migration: resolved/superseded — pattern no longer present anywhere in `src/` (refactored away during the Jun 1–13 ad-hoc sprint below). Closes the post-PR #26 backlog item.
- 2026-06-14 — (routine archival, ad-hoc sprint Jun 1–13, not routine-driven) Large feature push across multiple "codespace" commits + PR #88: Crane AutoPilot enhancements, Crane Dashboard + new 3D Control Monitor (`CraneControlMonitor3D`), new Dock Walk mode (walkable dock environment, `DockWalkEnvironment`, `DockWalkHUD`, `Player` additions), MainMenu changelog modal, `HarborAmbiance`, `ParticleBurst3D`, `SpectatorTitleCard`, `MagicalInstallFlash`, Tugboat refinements. PR #88 fixed a Rules-of-Hooks crash in `UpgradeMenu`/`useCompletionGlow` introduced during the sprint. `claude_contributions.md` (creative-authorship vision, issue #86) also added 2026-05-31.
- 2026-05-31 — (routine archival) Tugboat expansion sprint (PRs #66–#71, all Copilot): unified keyboard controls with twin-prop RPM system; fleet ships made pushable/towable by tug; TugboatSoundSystem (engine thrum, VHF radio, night-watch motif, event stingers); tugboat progression rewards wired (stats, upgrades, persistence); spectator drone towing cinematics; tugboat training modules + help prompts. All merged to main.
- 2026-05-24 — (routine archival) Multiview viewport-local history stack (Alt A): `CameraTransform` type in store, `history[]` + `pinned[]` + `historyIndex` per viewport, back/forward nav + 📌 pin button + Shift+1–6 recall fully implemented in `MultiviewSystem.tsx`. Landed between 2026-05-10 and 2026-05-24.
- 2026-05-17 — ESLint flat config (PR #22): `.eslintrc.json` → `eslint.config.js` (ESLint v9), Vitest added with sequencerSystem smoke test. `npm run lint` + `npm test` both wired.
- 2026-05-17 — Large component decomposition (PR #26): musicSystem, ControlBooth, TrainingMode split into modular subcomponents; LightShow.tsx extracted into modular light rig components.
- 2026-05-17 — ControlBooth forks archived to `src/_legacy/` (PR #30, Copilot); tsconfig updated to exclude _legacy/.
- 2026-05-10 — Music/event sync timeline: `cinematicSystem.ts` (53 LOC) + `sequencerSystem.ts` (143 LOC) created; `triggerUpgradeCinematic()` wired at crane path (UpgradeMenu.tsx:65) and tugboat-win path (MainScene.tsx:336); LyricsDisplay.tsx + audioVisualSync.ts both setTimeout-free. Multi-day idea fully landed.
- 2026-05-03 (PR #18) — 4 circular-dep warnings resolved: `eventSystem` barrel-export cycle fixed via refactor of `dynamicEventSystem.ts` + `timeSystem.ts`; affects OnDockRail, DistantShipQueue, techSystem, MainScene.
- 2026-05-03 — Ship blueprints: Island Hopper ferry, North Star trawler, Horizon Deep research vessel added to `ships.json` (ea1390e; kimi-cli swarm, 3 iterations, build PASS).
- 2026-05-03 — `sequencerSystem.ts` skeleton (143 LOC): Transport-locked scheduler with `schedule` / `scheduleAt` / `seekTo` / `cancel` / `clearAll`. `musicSystem.triggerClimax` now uses `transport.scheduleOnce`. `audioVisualSync` Transport-state guard added (d612c5b, Copilot).
- 2026-05-03 — `introMusicSystem.ts` + `introLyrics.ts`: title anthem system with MiniMax MP3 detection + procedural fallback, wired into `MainMenu` + `App` screen transitions (f214de0).
- 2026-04-26 — HEARTBEAT.md refreshed (PR #10 pipeline hygiene pass; HEARTBEAT now shows Apr 19 2026, 0 TODOs).
- 2026-04-26 — TODO/FIXME count confirmed at 0 (crane interactivity stub resolved in physics tuning work).
- 2026-04-19 — Crane-to-ship attachment tuning: 150ms bind-interpolation, delta-corrected sway decay, framerate-independent damping, twistlock cable lockout (PR #8 area).
- 2026-04-19 — Multiview camera dashboard: preset state + monitor quick-swap UI (PR #9, Copilot). Superseded by Alt A (implemented 2026-05-17).
- 2026-04-13 — PR #5 merged: hook dependency cleanup, let→const pass.
- 2026-04-06 — PR #4 merged: R3F hooks-outside-Canvas fix, crane jib constants extracted.
- 2026-03 — PR #3 merged: large-component split. PR #2 merged: fullscreen canvas + booth immersion.

## Last run
<!-- Routine writes summary here each run. Overwrites previous. -->
Date: 2026-06-21
Mode: Fix First (resolved same-day during this routine run) → User Idea for today's dispatch
Focus: Fixed a 6-day-old broken production build on `main` (duplicate declarations in UpgradeMenu.tsx from the 2026-06-15 Jules modularization merge). Then dispatched today's AI-tool work toward the two open Ideas: kimi-cli continues per-band light-show choreography (9 remaining ships), GitHub issue drafted for per-ship cinematic cutaway plans (decoupled files, for Copilot).
Side work this run: reconciled repo-hygiene backlog item + issue #89 (WebGL2 fallback renderer) to Done — both confirmed landed 2026-06-15; flagged two new unarchived `fix_glb_loader*.cjs` codemods and an unwired GLB-loader scaffold (`useShipModel` in ProceduralShip.tsx) as new backlog items; SECURITY credential-rotation decision still unresolved, carried forward a second week.
Note: no recent_chats/conversation_search access in this session (same gap as 2026-06-14) — Step 1 cross-session sweep skipped both weeks running; reconciliation based on repo state + GitHub issues/PRs only. Container started with no node_modules installed — ran `npm install` fresh, which is what surfaced the real build error (a prior session may have been masking it by not rebuilding from a clean install).
Outcome: Build/lint/tests all green again on `claude/kind-galileo-hsuqqa`, draft PR #97 opened. Today's dispatch (kimi-cli + issue draft + chat-model prompts + Jules template) below.

Follow-up same-day (whole-stack verification pass, dispatch Section E run directly in-session): bundle/build hygiene check + WebGPU/WebGL2 renderer (issue #89) runtime verification.
- Bundle hygiene: `npm run build:analyze` + full `npm run build` both clean, no rollup warnings. `vendor-3d`/`vendor-audio` manual chunks intact; `WebGPURenderer` confirmed lazy-split into its own ~290KB chunk (only fetched when the WebGPU path is taken) despite not being explicitly listed in `manualChunks` — dynamic-import boundary in `createRenderer.ts` is working as designed. `build:wasm` no-ops gracefully when Emscripten isn't installed (this container), not a regression.
- Renderer runtime verification: **no browser/GPU automation tool available in this session** (confirmed via ToolSearch, same gap noted in earlier renderer work) — could not visually confirm in a real browser. Traced the async Canvas/gl lifecycle statically instead and found a real bug: `WebGPUWarning.tsx` is mounted as a `<Canvas>` sibling and reads `rendererState.ts`'s placeholder defaults (`activeBackend: 'webgl'`) before `RendererDiagnosticsMonitor`'s effect (gated on the async `WebGPURenderer.init()`) reports the real backend — so the "WebGL2 renderer active" banner falsely flashed on every page load, even with WebGPU available and preferred. Fixed with an `initialized` flag (`RendererDiagnostics`, `rendererState.ts`, `RendererDiagnosticsMonitor.tsx`, `WebGPUWarning.tsx`) gating the false-positive branch. Verified via `tsc`/`build`/`lint`/`vitest` (all still green) — the visual fix itself is unverified in-browser; added to PR #97's test plan for Noah to confirm.
- Limitation disclosed per CLAUDE.md rather than claimed: this is static/type-level verification, not a substitute for an actual browser smoke-test.
