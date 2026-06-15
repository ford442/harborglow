# harborglow — Weekly Plan

## Today's focus
**2026-06-14 — New Idea mode.** Per-band light-show choreography: replace the single shared beat-intensity light curve (`lightingSystem.ts` `startHarborShow`/`triggerClimax`, consumed via `audioVisualSync.ts`) with a per-ship `LightCue[]` schedule mechanism, per `claude_contributions.md` §1. Today's slice: add the cue-schedule type + a `src/systems/lightShows/` directory + a dispatch hook in `lightingSystem.ts` that looks up a ship's cue table by `ShipType` and falls back to the current generic curve when absent, then author the first 2 cue tables as proof of concept — LNG ("Ambient/Cryogenic Techno": slow cyan breathing, frost-blue strobe on the drop) and Oil Tanker ("Dubstep/Industrial": hard amber/red snaps locked to the wobble, blackout between phrases). Multi-day overall; remaining 9 ships are follow-up work.

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
- [in progress — 2026-06-14] Per-band light-show choreography (`claude_contributions.md` §1): give each of the 11 ship-type bands a hand-felt light-cue schedule (`LightCue[]` — beat/pattern/color/intensity) instead of one shared beat-intensity curve. Engine hook in `lightingSystem.ts` + new `src/systems/lightShows/`; start with LNG (cyan breathing) and Oil Tanker (amber/red snaps), expand to remaining 9 ships in follow-up sessions.
- [ ] Repo hygiene: 34 `.playwright-mcp/*` debug artifacts (console logs, page dumps, screenshots from the Apr 19 / May 11 / Jun 5 sessions) and 7 tracked `dist/*` files are committed despite both being scratch/build output (`dist` is already in `.gitignore`). Tighten `.gitignore` (add `.playwright-mcp/`), `git rm --cached` the tracked dist files, and purge the debug artifacts.
- [ ] Per-ship cinematic cutaway plans (`claude_contributions.md` §3): expand `cinematicSystem.ts`'s shared upgrade-cinematic beat-script (beat 0/4/12/24/32) into per-ship `schedule()` plans matched to each band's genre + BPM (`music/musicTracks.ts`) and flattering camera shots (`cameraSystem.ts` / `CameraPreset.ts`) — e.g. low hero angle on the Oil Tanker's hull, high orbit on the Mega Cruise Liner.

## Backlog
<!--
Unfinished items, known bugs, deferred ideas.
Routine maintains this automatically — you can add items too.
-->
- [ ] ControlBooth forks archived to `src/_legacy/` (PR #30) — decision pending: permanently delete or document as reference. Forks are excluded from tsconfig but still in repo.
- [ ] Root-level codemod scripts (`fix_components.cjs`, `fix_deps.cjs`, `fix_hologram.cjs`, `fix_let_const.cjs`, `fix_lightshow.cjs`, `fix_lint.cjs`) — one-shot post-refactor tools; move to `scripts/` or delete.
- [ ] God-rays WGSL compute shader staged at `shaders/god-rays-compute.wgsl` — not wired into PostProcessing pipeline; future WebGPU integration task.
- [ ] GitHub issue #89 (open, unassigned, created 2026-06-09): WebGL2 fallback renderer for dev/debugging/agent-assisted porting. Deferred — overlaps with today's lightShows work (lightShowNodes.ts is WebGPU/TSL-specific).
- [x] ControlBooth forks (`src/_legacy/`) + codemod scripts (`fix_*.cjs`) + `.playwright-mcp/`/`dist/*` debris — superseded by issue #92 / PR #93 (Copilot, in progress 2026-06-15): decision made (delete `_legacy`, archive `fix_*.cjs` to `scripts/archive/`, untrack `.playwright-mcp/` + `dist/*`). Verified file inventory via Gemini Pro expansion + direct repo check.
- [ ] **SECURITY — decision needed from Noah**: PR #90 removed hardcoded credentials (SFTP password, deploy token) from HEAD, but they remain in this **public** repo's git history. K2/Kimi stress-test recommends: (1) rotate both credentials immediately regardless of anything else, (2) then decide whether to rewrite git history (`git-filter-repo`, force-push, GitHub support ticket to purge caches/old-PR refs — disruptive, invalidates all open PRs/clones) vs. accept the exposure as already-public and rely on rotation alone. This is a destructive, repo-wide operation requiring Noah's explicit go-ahead — not something to hand to an autonomous agent.

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
Date: 2026-06-14
Mode: New Idea (Ideas section was exhausted — all 3 prior items done/landed)
Focus: Per-band light-show choreography (LightCue[] schedules per claude_contributions.md §1) — engine hook in lightingSystem.ts + src/systems/lightShows/, starting with LNG + Oil Tanker.
Side work this run: security fix (removed deploy_old.py + hardcoded DEPLOY_TOKEN; AGENTS.md updated), reconciled 4 backlog items to Done (Lod2Impostor, intro MP3 assets, LightShow setTimeout migration), confirmed heartbeat green (build + 95/95 tests pass, 0 TODO/FIXME).
Note: no recent_chats/conversation_search access in this session — Step 1 cross-session sweep skipped; reconciliation based on repo state only. 2026-06-07 routine cycle appears to have been skipped (gap between 2026-05-31 and 2026-06-14 entries).
Outcome: (fill in at end of day)
