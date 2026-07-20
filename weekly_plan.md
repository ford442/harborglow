# harborglow — Weekly Plan

## Today's focus
**2026-07-19 — FIX FIRST (P0).** `npm run typecheck` = 0 errors, `vitest run` = **223/223**, `vite build` = green — **but the game is broken in dev.** `npm run dev` returns **HTTP 500** on the MainScene lazy-load: `Identifier 'LevaControlsConfig' has already been declared. (435:10)`. Confirmed live this run by requesting the module through the Vite dev-transform. This is exactly the class of masked break the plan keeps catching: `tsc` + esbuild (`vite build`) tolerate the duplicate; the Babel dev transform (`@vitejs/plugin-react`) does not. Filed by the `cursor` bot 2026-07-16 as **issue #114 (P0)**, and verified still present in the live tree.

**Root cause (confirmed in `src/scenes/mainScene/MainSceneHelpers.tsx`):** an incomplete auto-modularization codemod left the file with (1) a duplicate type name — `export type LevaControlsConfig = Record<string, any>` at **line 37** AND `interface LevaControlsConfig { … }` at **line 435**; (2) **stub components used in the render path** — `const ShipComponent = () => null` (line 18) is what `ShipWrapper` actually renders at line 346, so **docked ships render nothing** even though the real `Ship`/`ProceduralShip` are imported; (3) stubbed `CAMERA_MODES = {}` (line 24) and no-op crane/ambient sound fns (line 34); (4) the whole file hidden behind `// @ts-nocheck`, which is what let it pass the CI `tsc` gate.

**Today's focus (Fix First, primary):** restore `MainSceneHelpers.tsx` to a working state per #114 — dedupe `LevaControlsConfig`, wire `ShipWrapper` to the real `Ship`/`ProceduralShip`, restore real `CAMERA_MODES` + crane/ambient sound imports, and drop `// @ts-nocheck` (or narrow it), then prove `npm run dev` loads MainScene with no Babel error. **This overrides User Idea mode:** the one open Idea (new vessel class, issue #122) is itself "blocked by #114 (ships visible in scene)" — you cannot validate a new ship renders when *no* ship renders in dev. kimi-cli is the main event, scoped tightly to `MainSceneHelpers.tsx`. Copilot issue B is fully decoupled from that file: **CI hardening — a dev-transform smoke gate** (`.github/workflows/ci.yml` + a `scripts/` smoke script + `package.json`) so a Babel-only break like this can never again pass CI green. Zero source-file overlap with the kimi-cli fix.

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
- [x] Wildlife & Scenic Coastal Ecosystem system (season/weather/time-aware marine life + above-water fauna) — **done 2026-07-12, all 4 phases** (kimi-cli, codespace `c6d4ad3`, `.swarm-state.md` documents 4 iterations). Ambient layer built as an *extension* on top of the pre-existing event-driven `WildlifeSystem`: store fields `season`/`wildlifeDensity`/`enableMarineLife`; `wildlifeProfiles.ts` (`WILDLIFE_PROFILES` season/time/weather table + `getSeasonalColor()` + `getLightAttractionMultiplier()`); `ambientMarineLifeSystem.ts` (Moon Jelly, fish schools, plankton, gray whale, kelp beds; camera-frustum spawning; crane-spreader disturbance; distance LOD); `AmbientMarineLife.tsx` + `SeaBirds.tsx` renderers; Leva "Marine Life" + "Wildlife / Birds" folders. `wildlifeProfiles.test.ts` 28 tests. Carried 2026-07-05 [in progress] → done. **Music-reactivity core principle deferred → today's New-Idea focus.**
- [ ] **New Idea (2026-07-12, appended):** New vessel class end-to-end — add one ship type (candidate: Fireboat / Icebreaker / Sailing Yacht) through the full authoring pipeline now that every registry is mature: blueprint geometry + attachment points, Tone.js track in `musicSystem.ts`, `LightCue[]` in `lightShows/`, `CutawayPlan` in `cutaways/`, seasonal ecosystem fit. Exercises `ShipType` enum → `ProceduralShip` → registries. Scope: multi-day. **Formalized 2026-07-16 as issue #122 (`cursor`), which recommends Fireboat.** NOT picked 2026-07-19: Fix First (#114) overrides, and #122 is itself "blocked by #114 (ships visible in scene)." This is the top User-Idea pick for the *next* non-Fix-First run.
- [x] **Crane-to-ship attachment feel pass — done 2026-07-19** (was last week's Copilot issue B). Landed via codespace `b4ec030` (bundled into PR #125): `AttachmentSystemManager.tsx` (+321/-101), `swaySystem.ts` (+131), `craneSoundSystem.ts` (+22), `attachmentSystem.ts` (+25), new `useScreenShake.ts`, new `src/utils/physicsMath.ts` (+46) with `physicsMath.test.ts` (74 lines). Magnetic snap guidance + lock feedback (screen-shake hook) + sway settling landed. Carried 2026-07-12 → done. Note: shipped via codespace, not Copilot.

## Backlog
<!--
Unfinished items, known bugs, deferred ideas.
Routine maintains this automatically — you can add items too.
-->
- [ ] **P0 — TODAY'S FIX (#114):** `src/scenes/mainScene/MainSceneHelpers.tsx` corrupted by an incomplete auto-modularization codemod — `npm run dev` returns HTTP 500 (`Identifier 'LevaControlsConfig' has already been declared. (435:10)`), `ShipComponent = () => null` stub means docked ships don't render, `CAMERA_MODES = {}` + no-op sound stubs, whole file `@ts-nocheck`. `tsc`/`vite build`/`vitest` all green — masked. Being fixed this run via kimi-cli. (New 2026-07-19; confirmed live.)
- [ ] **NEW REALITY — `cursor` bot filed 11 backlog issues #114–#124 on 2026-07-16** (repo went 0 → 11 open issues). Triage: **#121 (music-reactive wildlife) is DONE — close it** (landed PR #125). **#114 = today's Fix First.** **#122 = the open "new vessel class" Idea** (next non-Fix-First pick). Foundation cluster to sequence after #114: **#116** (strengthen CI — dev-transform smoke; = today's Copilot issue B), **#117** (type Zustand slices, drop `@ts-nocheck` from `slice1/slice2.ts`), **#124** (decompose the 1,514-line `MainSceneHelpers.tsx` god module — do this *after* #114 restores correctness, not before). Feature cluster: **#118** economy shop UI, **#119** GLB ship pipeline (supersedes the GLB-stub backlog item below), **#120** training modules 5–7, **#123** Playwright WebGL visual regression. These issues are `cursor`-authored, not Noah-written — treat as a structured backlog, not as prioritized user Ideas. (New 2026-07-19.)
- [ ] Leftover light-show stub files: `src/systems/lightShows/lngShow.ts` (37 B) + `tankerShow.ts` (43 B) are now just re-export redirects (`export { lngLightShow } from './lng'`) left behind when the proof-of-concept files were renamed to `lng.ts`/`tanker.ts`. Confirmed unreferenced anywhere in `src/` (grep clean). Delete both + drop the matching re-exports from `lightShows/index.ts`. Trivial cleanup. (New 2026-06-28.)
- [x] ~~Build broke in the same file two weeks running (`UpgradeMenu.tsx`); need a `tsc` gate~~ — **RESOLVED 2026-07-05** (commit `da00fe9`): `.github/workflows/ci.yml` now runs `npm run typecheck` (`tsc --noEmit`) + `npm run test` on every PR and push to `main`. Deliberately omits the Emscripten/WASM build step (no-ops without Emscripten). This closes the recurring codespace-commit-breaks-`main` vector. Note: push-to-`main` CI is post-hoc (reports red after the fact, doesn't block direct pushes) — only PR CI blocks a merge, so ad-hoc `codespace` pushes to `main` can still land red; the gate's real value is on PRs.
- [ ] God-rays WGSL compute shader `shaders/god-rays-compute.wgsl` (4.5 KB) is now **orphaned/superseded** — a GLSL screen-space `ShaderPass` (`src/shaders/GodRaysShader.ts`) shipped instead via PR #110 (`31f2841`) and is wired into `PostProcessing.tsx` (depth-texture driven, Leva-controlled exposure/decay/density/weight/samples). The `.wgsl` file is referenced nowhere in `src/` (grep clean 2026-07-12). Decision for Noah: delete the orphaned `.wgsl`, or keep it as a future WebGPU-compute-path reference and document it as such. (Was "wire it into PostProcessing" — that intent is fulfilled by the GLSL path.)
- [ ] Repo-root debris still tracked: one-shot codemods `fix_glb_loader.cjs` + `fix_glb_loader_2.cjs` (from 2026-06-15 GLB-loader work — same pattern as the `fix_*.cjs` batch archived to `scripts/archive/`), **plus** `.swarm-state.md` (now 21 KB — kimi-cli progress notes through the wildlife Phase-4 run; useful for resume but re-committed to `main` again this week). Archive/delete the codemods; **decide `.swarm-state.md` policy — recommend adding to `.gitignore`** since it's regenerated every swarm run and keeps landing on `main`. (Updated 2026-07-12; recurring.) **NEW 2026-07-19:** also a tracked **`stats.html`** (972 KB) at repo root — a stale `rollup-plugin-visualizer` output committed back at PR #42, regenerated by every `npm run build:analyze`. Delete it and add `stats.html` to `.gitignore` (the analyzer writes it fresh on demand).
- [ ] GLB model loader scaffold added but unwired: `useShipModel()` in `src/scenes/ProceduralShip.tsx` (from commit `bb3e993`) drafts a `.glb`-based attachment-point mapping for cruise/container/tanker, but it's dead code — never called, no `.glb` assets exist under `public/models/` (confirmed absent again 2026-06-28), `useGLTF` import unused. Either wire it in with real assets or strip the stub. Relates to the long-standing CLAUDE.md TODO ("Ship models are procedural primitives").
- [ ] Persistent lint error: `createRenderer.ts:45` uses `@ts-ignore` where ESLint's `ban-ts-comment` wants `@ts-expect-error`, but swapping breaks `tsc` (TS2578 — directive unused in the current dep state). This is the **only** error in `npm run lint` (37 warnings otherwise), so the lint step exits 1. Revisit if a dep bump changes the underlying `tsc` behavior. (Documented 2026-06-21, confirmed still the case 2026-06-28.)
- [ ] **SECURITY — decision needed from Noah**: PR #90 removed hardcoded credentials (SFTP password, deploy token) from HEAD, but they remain in this **public** repo's git history. K2/Kimi stress-test recommends: (1) rotate both credentials immediately regardless of anything else, (2) then decide whether to rewrite git history (`git-filter-repo`, force-push, GitHub support ticket to purge caches/old-PR refs — disruptive, invalidates all open PRs/clones) vs. accept the exposure as already-public and rely on rotation alone. This is a destructive, repo-wide operation requiring Noah's explicit go-ahead — not something to hand to an autonomous agent. **Still unresolved as of 2026-07-19 — carrying forward a SIXTH week. Noah: rotation (item 1) is a 2-minute action and blocks nothing else — please do it regardless of the history-rewrite decision.**

## Wildlife & Scenic Coastal Ecosystem (New Major Feature)

**Status**: ✅ **FEATURE-COMPLETE through Phase 4 — 2026-07-12** (kimi-cli, codespace `c6d4ad3`; `.swarm-state.md` = 4 iterations). Ambient layer (jellies/fish/plankton/gray whale/kelp/seabirds) built on top of the pre-existing event-driven `WildlifeSystem`, season/time/weather driven, camera-frustum spawning, crane disturbance, distance LOD, Leva folders. **Remaining unmet piece: beat-level music-reactivity** (the spec's own core principle) → 2026-07-12 New-Idea focus ("Music-reactive wildlife + Bioluminescent Finale").  
**Priority**: Complete (Phases 1–4); music-reactive deepening now separate.  
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
- 2026-07-19 — **Music-reactive wildlife choreography + "Bioluminescent Finale" landed** (last week's kimi-cli focus; closes issue #121): kimi-cli swarm iterations 5–6 (`.swarm-state.md`, 2026-07-13) → codespace `ff8c6a8`, merged to `main` via PR #125 (`c026dfc`). Landed: `wildlifeProfiles.ts` beat helpers `getBeatReactiveMultiplier`/`getFishSchoolCohesionFactor`/`getFinaleConvergenceEnvelope` (+13 tests); `ambientMarineLifeSystem.ts` reads `audioVisualSync.getAudioAnalysisData()` + `lightingSystem.isShowActive()` per-frame, boosts plankton/jelly counts during shows, tightens fish-school cohesion, and adds `finaleState` + `triggerBioluminescentFinale` (attack/hold/release convergence on the finished ship); `AmbientMarineLife.tsx` drops per-frame `useMusicPulse` React state for in-`useFrame` reads, pulses jelly bells + kelp sway to the beat; `cinematicSystem.ts` fires the finale from `triggerUpgradeCinematic`; `SeaBirds.tsx` one-shot scatter-on-show-start; Leva "Beat Reactivity" slider. Verified this run: `typecheck` 0 errors, `vitest` **223/223**, `vite build` green.
- 2026-07-19 — **Crane-to-ship attachment feel pass landed** (last week's Copilot issue B; shipped via codespace `b4ec030`, bundled into PR #125): `AttachmentSystemManager.tsx` (+321/-101), `swaySystem.ts` (+131), `craneSoundSystem.ts` (+22), `attachmentSystem.ts` (+25), new `useScreenShake.ts`, new `src/utils/physicsMath.ts` + `physicsMath.test.ts`. Magnetic snap guidance + lock feedback + sway settling — the #1 stated focus area, first substantive touch since 2026-04-19.
- 2026-07-16 — **`cursor` bot backlog pass**: opened issues #114–#124 (foundation + feature backlog) and PR #113 (`cursor/setup-dev-environment` — `chore(dev): fix Vite dep-optimizer TLA target and document env setup`, commit `27c5339`). Repo issue tracker went 0 → 11 open. (Archival note; #114 = today's Fix First, #121 done, #122 = open Idea.)
- 2026-07-12 — **Wildlife & Scenic Coastal Ecosystem fully landed, Phases 1–4** (flagship Idea closed): kimi-cli ran last week's Phase-1 dispatch to completion and continued through Phase 4 (codespace `c6d4ad3`; `.swarm-state.md` documents 4 iterations). Landed: store fields `season`/`wildlifeDensity`/`enableMarineLife` + `setSeason`/`setWildlifeDensity`/`setEnableMarineLife` (with save/load clamping in `slice1.ts`); `src/systems/wildlifeProfiles.ts` (`WILDLIFE_PROFILES` season/time/weather multiplier table, `getSeasonalColor()`, `getLightAttractionMultiplier()`); `src/systems/ambientMarineLifeSystem.ts` (Moon Jelly, fish schools, plankton, gray whale, kelp beds; camera-frustum spawning; crane-spreader disturbance/drift; distance LOD); `src/scenes/AmbientMarineLife.tsx` (instanced renderers, gated on `enableMarineLife`) + `src/scenes/SeaBirds.tsx`; Leva "Marine Life" + "Wildlife / Birds" folders in `MainSceneHelpers.tsx`. Tests: `wildlifeProfiles.test.ts` 28 tests → suite 200/200. Verified this run: fresh `npm install` → `typecheck` 0 errors, `vitest` 200/200. Multi-week idea (2026-06-… scoped → 2026-07-05 in-progress → done) closed. Note: kimi-cli overshot the scoped Phase-1 slice into Phases 2–4 in one swarm — good outcome, but wider blast radius than dispatched.
- 2026-07-12 — **GLSL god-rays ShaderPass landed** (PR #110, `31f2841`): screen-space radial god-rays `ShaderPass` (`src/shaders/GodRaysShader.ts`, depth-texture driven) wired into `PostProcessing.tsx` with Leva controls (exposure/decay/density/weight/samples). This fulfills the long-standing "god-rays in PostProcessing" backlog intent via GLSL and **supersedes** the staged WGSL compute shader (now orphaned — see Backlog for delete/keep decision).
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
Date: 2026-07-19
Mode: **FIX FIRST** — foundation cracked (dev server broken), overrides the one open User Idea.
Focus: **Restore `MainSceneHelpers.tsx` (issue #114, P0).** `npm run dev` returns HTTP 500 (`Identifier 'LevaControlsConfig' has already been declared. (435:10)`) — duplicate `type`+`interface`; `ShipComponent = () => null` stub renders no ships; `CAMERA_MODES = {}` + no-op sound stubs; file under `@ts-nocheck`. `tsc`/`vite build`/`vitest 223` all green — a masked, dev-only Babel-transform break. Confirmed live this run by driving the Vite dev-transform (HTTP 500). kimi-cli main event scoped to that one file. Decoupled Copilot issue B: CI dev-transform smoke gate (`.github/workflows/ci.yml` + `scripts/` + `package.json`) so this break class can't pass CI green again — zero overlap with the fix.
Reconciliation: **both of last week's units landed** → Done. (1) Music-reactive wildlife + Bioluminescent Finale (kimi-cli swarm iter 5–6, codespace `ff8c6a8`, PR #125) → closes issue #121. (2) Crane attachment feel pass (codespace `b4ec030`, bundled in PR #125; new `physicsMath.ts` + tests) → Ideas item [x]. New this week: **`cursor` bot filed 11 issues #114–#124** (repo 0→11 open) — logged in Backlog as a structured backlog, NOT as prioritized user Ideas. The one genuine open Idea (new vessel class = #122) was NOT picked: Fix First overrides + #122 is blocked by #114. Test count 200→**223** (13 wildlife-reactivity + physicsMath tests).
Carried backlog: **P0 #114 (fixing now)**; light-show stub redirects; root codemods `fix_glb_loader.cjs` ×2 + re-committed `.swarm-state.md` (now 24 KB — recommend `.gitignore`); orphaned `god-rays-compute.wgsl`; GLB loader stub (now superseded by issue #119); `createRenderer.ts:45` lint error (still the only `npm run lint` error, exit 1); `MainSceneHelpers.tsx` is a 1,514-line god module (#124); `slice1/slice2.ts` still `@ts-nocheck` (#117); **SECURITY credential rotation UNRESOLVED a 6th week**.
Note: `recent_chats`/`conversation_search` tools absent again (6th run) — Step 1 cross-session sweep skipped; reconciliation from repo state + GitHub MCP (11 open issues, 0 open PRs). Thin cross-session context is a real gap, not hidden.
Outcome: weekly_plan.md updated (Today's focus → Fix First #114; 2 units moved to Done; #121 to close; crane Idea [x]; #114–#124 logged; Last run refreshed). Dispatch below: kimi-cli #114 restore + decoupled CI-smoke Copilot issue + 3 chat prompts + Copilot handoff + Jules template + Claude Code whole-stack build/deploy hygiene + 2 review prompts.
