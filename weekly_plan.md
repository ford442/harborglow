# harborglow — Weekly Plan

## Today's focus
**2026-07-05 — User Idea mode.** Foundation is solid this week: fresh `npm install` + `npm run typecheck` = **0 errors**, `vitest run` = **172/172** (up from 154 — new cutaway + light-show suites). The recurring two-week build-break vector is **closed**: the CI typecheck+test gate landed (commit `da00fe9`, `.github/workflows/ci.yml` runs `npm run typecheck` + `npm run test` on PR and push to `main`). Not Fix First.

Both prior open Ideas closed this week via kimi-cli/codespace commits:
- **Per-ship cinematic cutaways — fully landed.** All 9 remaining ships (container, bulk, lng, roro, research, droneship, ferry, trawler, horizon) authored + registered in `cutawayRegistry` + `cutaways.test.ts` expanded (codespace `2ccc015`, on top of the engine+2-ship `21e1dfe`). A committed `.swarm-state.md` confirms kimi-cli ran last week's dispatch to completion. Idea checked off.
- **Planned Copilot follow-up (`CraneWelcomeHandler`) shipped** inside a large look-dev/visual-polish push (codespace `30fc388`: `CraneWelcomeHandler.tsx`, `LightFlare`/`LightFlareSystem`, `CraneMaterials`, `HarborPBRMaterials`, `CraneDetails`, `useVisualPolishControls`, `LOOK_DEV.md`/`RENDERER.md`).

With cutaways landed, today advances the flagship Idea: **Wildlife & Scenic Coastal Ecosystem — Phase 1 (Foundation).** **SCOPE CORRECTION:** the spec says "create `src/systems/wildlifeSystem.ts`" but that file **already exists** (15KB `WildlifeSystem` class: humpback whale / great white / bottlenose dolphin / bioluminescent plankton, behavior states, pod spawning; wired into `MainScene`, `seaEventsSystem`, `HarborEventSystem`, `dynamicEventSystem`; rendered by `src/scenes/Wildlife.tsx`). The store has `wildlife: WildlifeEntity[]` + add/remove/update actions and a `WildlifeType` union — but **no** `season` / `wildlifeDensity` / `enableMarineLife` fields. Today's slice is therefore an **extension, not a greenfield build**: add the three store fields, a `WILDLIFE_PROFILES` season/time-of-day/weather multiplier table, and ambient Phase-1 species (Moon Jelly, fish schools, night plankton glow) layered onto — not replacing — the existing event-driven fauna, plus a Leva toggle/density slider. kimi-cli main event. Copilot issue is decoupled: wire the staged `shaders/god-rays-compute.wgsl` into `PostProcessing.tsx` (no store / MainScene / wildlife overlap).

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
- [x] Per-band light-show choreography (`claude_contributions.md` §1) — **done 2026-06-28**: all 11 ship-type bands now have hand-authored `LightCue[]` schedules in `src/systems/lightShows/` (cruise, container, tanker, bulk, lng, roro, research, droneship, ferry, trawler, horizon), all registered in `lightShowRegistry` with a `SHIP_BPM` table, plus `lightShows.test.ts`. LNG + Oil Tanker proof-of-concept landed 2026-06-15 (PR #95); remaining 9 authored via kimi-cli (codespace commit `f5034bc`). Carried 2026-06-14 → in-progress 2026-06-21 → confirmed landed 2026-06-28.
- [x] Repo hygiene: `.playwright-mcp/*` debug artifacts + tracked `dist/*` files + `_legacy` ControlBooth forks + root `fix_*.cjs` codemods — done 2026-06-15 via issue #92 / PR #93 (Copilot). Confirmed clean at 2026-06-21 audit: `.playwright-mcp/` and `src/_legacy/` no longer exist, no tracked `dist/*` files, 6 codemods archived to `scripts/archive/`.
- [x] Per-ship cinematic cutaway plans (`claude_contributions.md` §3) — **done 2026-07-05**: all 11 ships now have authored `CutawayPlan`s in `src/systems/cutaways/` registered in `cutawayRegistry`, with expanded `cutaways.test.ts`. Engine + tanker/cruise landed 2026-06-28 (codespace `21e1dfe`); remaining 9 (container, bulk, lng, roro, research, droneship, ferry, trawler, horizon) authored via kimi-cli (codespace `2ccc015`, `.swarm-state.md` confirms the swarm run). Carried 2026-06-21 → in-progress 2026-06-28 → confirmed landed 2026-07-05.
- [in progress — 2026-07-05] Wildlife & Scenic Coastal Ecosystem system (season/weather/time-aware marine life + above-water fauna). Full technical data + phased graphical plan documented in weekly_plan.md §"Wildlife & Scenic Coastal Ecosystem". **Note:** `src/systems/wildlifeSystem.ts` + `src/scenes/Wildlife.tsx` + store `wildlife[]`/`WildlifeType` already exist (event-driven whales/shark/dolphin/plankton) — Phase 1 is an *extension* (add `season`/`wildlifeDensity`/`enableMarineLife` store fields + `WILDLIFE_PROFILES` table + ambient Moon Jelly / fish schools / night plankton), not a greenfield build. Cutaways landed → this is now the sole open Idea and today's focus.

## Backlog
<!--
Unfinished items, known bugs, deferred ideas.
Routine maintains this automatically — you can add items too.
-->
- [ ] Leftover light-show stub files: `src/systems/lightShows/lngShow.ts` (37 B) + `tankerShow.ts` (43 B) are now just re-export redirects (`export { lngLightShow } from './lng'`) left behind when the proof-of-concept files were renamed to `lng.ts`/`tanker.ts`. Confirmed unreferenced anywhere in `src/` (grep clean). Delete both + drop the matching re-exports from `lightShows/index.ts`. Trivial cleanup. (New 2026-06-28.)
- [x] ~~Build broke in the same file two weeks running (`UpgradeMenu.tsx`); need a `tsc` gate~~ — **RESOLVED 2026-07-05** (commit `da00fe9`): `.github/workflows/ci.yml` now runs `npm run typecheck` (`tsc --noEmit`) + `npm run test` on every PR and push to `main`. Deliberately omits the Emscripten/WASM build step (no-ops without Emscripten). This closes the recurring codespace-commit-breaks-`main` vector. Note: push-to-`main` CI is post-hoc (reports red after the fact, doesn't block direct pushes) — only PR CI blocks a merge, so ad-hoc `codespace` pushes to `main` can still land red; the gate's real value is on PRs.
- [ ] God-rays WGSL compute shader staged at `shaders/god-rays-compute.wgsl` (4.5 KB) — still not wired into `PostProcessing.tsx` (confirmed 2026-07-05). **→ today's decoupled Copilot issue.** Note `30fc388` recently rewrote `PostProcessing.tsx` (+16/-…) and added `LightFlareSystem`, so integrate against that fresh version.
- [ ] Repo-root debris still tracked: one-shot codemods `fix_glb_loader.cjs` + `fix_glb_loader_2.cjs` (from 2026-06-15 GLB-loader work — same pattern as the `fix_*.cjs` batch archived to `scripts/archive/`), **plus** a committed `.swarm-state.md` (kimi-cli progress notes — useful for resume but shouldn't be committed to `main`; add to `.gitignore` or move under `scripts/`). Archive/delete the codemods; decide `.swarm-state.md` policy. (Updated 2026-07-05.)
- [ ] GLB model loader scaffold added but unwired: `useShipModel()` in `src/scenes/ProceduralShip.tsx` (from commit `bb3e993`) drafts a `.glb`-based attachment-point mapping for cruise/container/tanker, but it's dead code — never called, no `.glb` assets exist under `public/models/` (confirmed absent again 2026-06-28), `useGLTF` import unused. Either wire it in with real assets or strip the stub. Relates to the long-standing CLAUDE.md TODO ("Ship models are procedural primitives").
- [ ] Persistent lint error: `createRenderer.ts:45` uses `@ts-ignore` where ESLint's `ban-ts-comment` wants `@ts-expect-error`, but swapping breaks `tsc` (TS2578 — directive unused in the current dep state). This is the **only** error in `npm run lint` (37 warnings otherwise), so the lint step exits 1. Revisit if a dep bump changes the underlying `tsc` behavior. (Documented 2026-06-21, confirmed still the case 2026-06-28.)
- [ ] **SECURITY — decision needed from Noah**: PR #90 removed hardcoded credentials (SFTP password, deploy token) from HEAD, but they remain in this **public** repo's git history. K2/Kimi stress-test recommends: (1) rotate both credentials immediately regardless of anything else, (2) then decide whether to rewrite git history (`git-filter-repo`, force-push, GitHub support ticket to purge caches/old-PR refs — disruptive, invalidates all open PRs/clones) vs. accept the exposure as already-public and rely on rotation alone. This is a destructive, repo-wide operation requiring Noah's explicit go-ahead — not something to hand to an autonomous agent. **Still unresolved as of 2026-07-05 — carrying forward a FOURTH week. Noah: rotation (item 1) is a 2-minute action and blocks nothing else — please do it regardless of the history-rewrite decision.**

## Wildlife & Scenic Coastal Ecosystem (New Major Feature)

**Status**: Phase 1 IN PROGRESS — 2026-07-05 (cinematic cutaways landed; this is now the active flagship Idea)  
**Priority**: High  
**Reality check (2026-07-05)**: `src/systems/wildlifeSystem.ts` (15KB `WildlifeSystem` class), `src/scenes/Wildlife.tsx`, and store `wildlife: WildlifeEntity[]` + `WildlifeType` (`humpback_whale`/`great_white_shark`/`bottlenose_dolphin`/`bioluminescent_plankton`) **already exist** and are wired into `MainScene`, `seaEventsSystem`, `HarborEventSystem`, `dynamicEventSystem`. The existing system is **event-driven** (spawned by sea/harbor events). Phase 1 below must be built as an **ambient/seasonal layer on top of it** — the store has NO `season`/`wildlifeDensity`/`enableMarineLife` yet, and the Phase-1 species (Moon Jelly, fish schools) are NOT in the existing `WildlifeType` union. Do not rewrite the existing class; extend it.  
**Goal**: Make scenic vistas and wildlife a core part of the HarborGlow experience. Players should feel they are operating a crane inside a living, breathing Northern California coastal ecosystem.

### Core Principles
- Wildlife must feel **alive and respectful** of real Pacific coast ecology (not cartoonish).
- Behavior and spawning driven by **season + time of day + weather + storm intensity** (all already partially in the store).
- **Music-reactive** where it makes sense (bioluminescence pulsing to the beat, fish schooling tighter during intense light shows).
- Purely visual/immersive layer — does **not** change core crane/upgrade/music loop, only enhances satisfaction of watching the finished ship.
- Performance-first: instanced + particle systems, heavy LOD/culling using existing quality preset system.

### Technical Wildlife Data (Northern California Coast)

#### Seasonal Profiles (Primary Driver)
| Season     | Underwater Highlights                              | Surface / Above-Water Highlights                     | Visibility & Vibe Notes                     | Music Synergy                     |
|------------|----------------------------------------------------|-------------------------------------------------------|---------------------------------------------|-----------------------------------|
| **Spring** (Mar–May) | Gray whale northbound migration, increasing fish schools, early jelly blooms | Migratory seabirds returning, coastal wildflowers on hills (if terrain added) | Fresh marine layer, good whale sightings    | Hopeful, building energy          |
| **Summer** (Jun–Aug) | Peak Moon Jelly + Sea Nettle blooms, dense anchovy/sardine schools | High dolphin & seabird activity, calm seas           | Classic clear CA days, maximal surface life | Vibrant, playful, peak glow       |
| **Fall**   (Sep–Nov) | Gray whale southbound migration peak, lingering jellies | Golden coastal light, more whale breaches visible    | Warm ambers, dramatic silhouettes           | Warm, cinematic, emotional        |
| **Winter** (Dec–Feb) | Clearer water on calm days, hardy fish deeper     | Stormier, hardy gulls/cormorants, occasional orcas   | Dramatic weather, stark beauty              | Moody, powerful, introspective    |

#### Time-of-Day Modifiers
- **Dawn / Dusk** — Highest marine mammal surface activity (breaches, spouts, dolphin pods)
- **Day** — Best bird activity + surface fish schools visible
- **Night** — Bioluminescence emphasis (jellyfish bells + plankton glow stronger). Many fish school deeper or become less active.

#### Weather Modifiers (already partially wired)
- **Calm / Clear** — Maximum wildlife activity & visibility
- **Marine Layer / Fog** — Reduced long-distance sightings, beautiful volumetric god-ray moments
- **Storm / Rain** — Birds shelter, fish go deeper, dramatic wave interactions (already have storm ripples). Whale spouts can still be dramatic in lightning.

#### Prioritized Species List (Implementation Order)

**Phase 1 — Foundation (Particles + Instanced)**
1. **Moon Jellyfish** (`Aurelia aurita`) — Soft pulsing bell, gentle drift, subtle bioluminescence
2. **Fish Schools** (Northern Anchovy / Pacific Sardine / Rockfish) — Classic schooling behavior, scale sparkle with caustics
3. **Plankton / Bioluminescent particles** — Night-time glow layers

**Phase 2 — Charismatic Megafauna**
4. **Gray Whale** — Slow majestic passes, occasional breach or spout (iconic CA species)
5. **Seabirds** (Western Gull, Brown Pelican, Double-crested Cormorant) — Flocks + occasional diving

**Phase 3 — Medium Priority**
6. Sea Nettle jellyfish (more colorful, stinging look but we keep it beautiful)
7. Common / Bottlenose Dolphin pods
8. Harbor Seal / California Sea Lion (surface or hauled on buoys if we add simple geometry)

**Phase 4 — Later Polish**
- Humpback whales (more acrobatic)
- Orcas (rare, high-impact)
- Rays, sea turtles, occasional shark silhouette
- Coastal flora (if/when we expand land vistas): coastal sage, cypress, wildflowers, kelp beds near shore

### Graphical Implementation Roadmap

**Phase 1 (Immediate)**
- New `src/systems/wildlifeSystem.ts` singleton (pattern like `WaveSystem`)
- `WILDLIFE_PROFILES` data table in TypeScript (season/weather/time multipliers)
- Basic instanced jellyfish + fish school system using existing `Water` caustics/god-rays
- Spawning logic driven by current store values (`season`, `timeOfDay`, `weather`, `stormIntensity`)
- Toggle + density slider in Leva

**Phase 2**
- Simple animated whale entity (sine-wave body + tail, or lightweight GLB)
- Seabird flock system (instanced + simple flight paths)
- Music pulse reactivity (bioluminescence intensity + school tightness)

**Phase 3**
- Camera-aware spawning (more activity when spectator drone or underwater cam is active)
- Seasonal visual variants (slightly different jelly colors, whale barnacle coverage, etc.)
- Optional: light rigs or ship glow subtly "attract" more wildlife (eco fantasy)

**Phase 4 (Future)**
- Expanded coastal terrain with flora (wildflowers, grasses) that also shift seasonally
- Interaction hooks (crane movement or bright lights can cause temporary wildlife reactions)

### Integration Points (Already Exist)
- `useGameStore` — add `season`, `wildlifeDensity`, `enableMarineLife`
- `useMusicPulse` hook (already used in Water)
- `spectator` + `ship-water` camera modes
- `UnderwaterEffects` + Deep Cam panel
- Quality preset LOD system (already in Water.tsx)
- Leva panel (easy to extend)

### Success Metrics (Visual)
- Player can sit in Underwater Deep Cam for 30–60 seconds and feel immersed in a living bay
- Spectator drone orbits feel richer because wildlife occasionally enters frame
- Different seasons/weather produce noticeably different "vibe" without changing the core ships

**Next Immediate Actions**
- [ ] Add `season` + `wildlifeDensity` + `enableMarineLife` to Zustand store
- [ ] Create `src/systems/wildlifeSystem.ts` skeleton + data profiles
- [ ] Wire basic Moon Jelly + fish school spawner into `MainScene.tsx`
- [ ] Add Leva controls + toggle in HUD
- [ ] First visual pass in Underwater cam (even if crude)

This becomes the new flagship Idea once the remaining cinematic cutaways are finished.

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
- 2026-07-05 — **Per-ship cinematic cutaways fully landed** (Idea closed): all 11 ships have authored `CutawayPlan`s in `src/systems/cutaways/` registered in `cutawayRegistry`; `cutaways.test.ts` expanded (13 test files / 172 tests pass total). The 9 remaining ships (container, bulk, lng, roro, research, droneship, ferry, trawler, horizon) were authored by kimi-cli (codespace `2ccc015`; committed `.swarm-state.md` documents the swarm iterations) on top of the 2026-06-28 engine + tanker/cruise (`21e1dfe`). Multi-week idea (2026-06-21 → 06-28 → done) closed.
- 2026-07-05 — **CI typecheck/test gate landed** (commit `da00fe9`): `.github/workflows/ci.yml` runs `npm run typecheck` + `npm run test` on PR and push to `main`. Directly resolves the "`UpgradeMenu.tsx` broke the build two weeks running / need a `tsc` gate" backlog item. Verified this run: fresh `npm install` → `typecheck` 0 errors, `vitest` 172/172 — first routine run in three weeks that did **not** surface a masked build break.
- 2026-07-05 — **Look-dev / visual-polish push landed** (codespace `30fc388`): new `CraneWelcomeHandler.tsx` (this was the planned 2026-06-28 Copilot follow-up #3 — shipped via codespace instead), `LightFlare.tsx` + `LightFlareSystem.tsx`, `CraneMaterials.ts`, `HarborPBRMaterials.ts`, `CraneDetails.tsx`, `useVisualPolishControls.ts`, plus `docs/LOOK_DEV.md` + `docs/RENDERER.md`; substantial edits to `Crane.tsx`/`Dock.tsx`/`AudioReactiveLightShow.tsx`/`PostProcessing.tsx`. Large ad-hoc visual sprint, not routine-driven.
- 2026-06-28 — **Build-break fix #2** (commit `ad3bd6d`): `UpgradeMenu.tsx` referenced `glow` at line 392 but the `const glow = useCompletionGlow()` hook call had been dropped (regression after last week's de-dup fix, via a `codespace` commit) — `useCompletionGlow` imported but never called, `tsc` failing with `TS2304`. Restored the unconditional hook call. Verified: `tsc` clean, `vite build` clean, `vitest` 154/154; `npm run lint` = 1 pre-existing error (`createRenderer.ts:45`, see Backlog). Pushed to `claude/eager-hawking-wmnjzu`, draft PR opened. Note: masked again by stale `node_modules` — only a fresh `npm install` surfaced it. **Same file, two weeks running** → flagged a `tsc`-gate/CI hygiene item in Backlog.
- 2026-06-28 — **Per-band light-show choreography fully landed** (idea closed): all 11 ships have authored `LightCue[]` schedules in `src/systems/lightShows/`, registered in `lightShowRegistry` + `SHIP_BPM`, with `lightShows.test.ts`. 9 remaining ships authored via kimi-cli (codespace commit `f5034bc`) on top of the 2026-06-15 LNG/Tanker proof of concept (PR #95). Multi-week idea (2026-06-14 → 06-21 → done) closed.
- 2026-06-28 — **Cutaway engine + 2 proof-of-concept ships landed** (codespace commit `21e1dfe`): `cinematicSystem.ts` refactored to drive `getCutawayPlan(shipType)` against `src/systems/cutaways/` (`CutawayCue`/`CutawayAction`/`CutawayPlan` types, `DEFAULT_CUTAWAY_PLAN` fallback, `cutawayRegistry`, `cutaways.test.ts`). `tanker` + `cruise` authored; 9 ships still on default → today's kimi-cli slice (Idea now [in progress]).
- 2026-06-28 — PR #99 (crane-mode starter contract objective) merged 2026-06-22: `CraneContract` state + `CraneObjectiveHUD`; also fixed missing imports in `store/slices/slice1.ts` (`scheduleSave`/`reputationSystem`/`loadGameState`/`isCameraPresetId`) that threw `ReferenceError` at runtime under `@ts-nocheck`. Follow-up #3 (first-step nudge / `CraneWelcomeHandler`) → today's Copilot issue.
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
Date: 2026-07-05
Mode: User Idea (foundation solid — first non-Fix-First run in 3 weeks)
Focus: Wildlife & Scenic Coastal Ecosystem — Phase 1 (Foundation). Scoped as an **extension** of the already-existing `wildlifeSystem.ts` (15KB) + `Wildlife.tsx` + store `wildlife[]`/`WildlifeType`, NOT a greenfield build: add `season`/`wildlifeDensity`/`enableMarineLife` store fields + `WILDLIFE_PROFILES` season/time/weather table + ambient Moon Jelly / fish schools / night plankton, layered onto existing event-driven fauna. kimi-cli main event.
Reconciliation: **both prior open Ideas closed.** Per-ship cutaways → fully landed (all 11 ships, kimi-cli codespace `2ccc015`; `.swarm-state.md` confirms swarm ran) → Done + Idea [x]. CI `tsc`/test gate landed (`da00fe9`, `.github/workflows/ci.yml`) → resolves the recurring build-break backlog item → Done. Look-dev/visual-polish push (`30fc388`) incl. `CraneWelcomeHandler.tsx` (= last week's planned Copilot follow-up, shipped via codespace) → Done. Wildlife Idea moved to [in progress]. Build verified green: fresh `npm install` → `typecheck` 0 errors, `vitest` 172/172 — no masked break this week (the CI gate is working).
Carried backlog: light-show stub redirects (`lngShow.ts`/`tankerShow.ts`) still present; root codemods `fix_glb_loader.cjs` ×2 still present (+ a committed root `.swarm-state.md` now too — new cleanup nit); god-rays WGSL still unwired (→ today's Copilot issue); GLB loader stub; `createRenderer.ts:45` lint error; SECURITY credential rotation UNRESOLVED a 4th week.
Note: no `recent_chats`/`conversation_search` access again (4 runs running) — Step 1 cross-session sweep skipped; reconciliation from repo state + GitHub (0 open issues, 0 open PRs).
Outcome: weekly_plan.md updated (2 Ideas closed, 1 → in-progress, CI item resolved, Done + Last run refreshed). Dispatch below: kimi-cli Wildlife Phase-1 + decoupled god-rays Copilot issue + 3 chat prompts + Copilot handoff + Jules template + Claude Code whole-stack + 2 review prompts.
