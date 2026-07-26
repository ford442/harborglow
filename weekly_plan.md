# harborglow — Weekly Plan

## Today's focus
**2026-07-26 — FIX FIRST (P0).** `npm run typecheck` = 0 errors, `npm run lint` = **0 errors** (42 warnings), `npm run smoke:dev-transform` = **green** (last week's #114 dev-500 is genuinely fixed — mainScene split into modules, PR #136/`a10e5db`) — **but CI has been RED on `main` for 6 days** and `npm test` fails locally. GitHub Actions run on `main` HEAD (`87b32a4`) shows: Type-check ✓, Lint ✓, **Test ✗**, then **Dev-transform smoke = skipped, Production build = skipped** — the two gates the plan built last week never run because the `Test` step short-circuits ahead of them.

**Root cause (reproduced this run):** `vitest run` = **3 suites fail to collect / 250 tests pass (18 files, 3 failed)**. The 3 broken suites — `src/store/__tests__/coreActions.test.ts`, `acousticHandshake.test.ts`, `salvageContracts.test.ts` — import the Zustand store (→ audio/music systems → `import * as Tone from 'tone'`) but **do not** `vi.mock('tone')`. Every *passing* suite that touches audio (`sequencerSystem`, `tugboatSoundSystem`, `cavitationSystem`, …) declares a `vi.mock('tone', () => …)` factory; there is **no global test setup** mocking tone, so any suite that forgets it loads real tone. The committed `package-lock.json` pins **`tone@14.9.17`**, whose ESM `build/esm/index.js` re-exports `from "./core/Global"` (extensionless), which vitest's resolver rejects → `Cannot find module '…/tone/build/esm/core/Global'`. `npm ci` on CI resolves the identical pinned version → identical red. This is the same class of masked break the plan keeps catching, one layer up: `tsc`/`lint`/`smoke` are all green while the test job rots.

**Today's focus (Fix First, primary):** make `npm test` green and stop a test failure from masking the build/smoke gates. (1) **Systemic tone stub** — add a shared vitest test-setup (`test.setupFiles`) or `test.alias` mapping `tone` → a lightweight stub so *any* store-importing suite is immune, rather than sprinkling `vi.mock('tone')` into three files (whack-a-mole invites recurrence the moment a fourth suite imports the store). Verify all 18 suites collect and 250+ tests pass. (2) Prove the full CI chain runs green locally: `typecheck` → `lint` → `test` → `smoke:dev-transform` → `vite build`. **Ideas is exhausted** (the one open Idea, fireboat #122, landed via PR #135), which would normally trigger New Idea mode — but Fix First overrides: a 6-day-red `main` is the foundation, and the plan does not pick new work on a cracked base. kimi-cli is the main event, scoped to `vite.config.ts` + a new `src/test/` setup module + the 3 test files. Copilot issue B is fully decoupled from vitest/test wiring: **CI job restructuring** so `smoke:dev-transform` and `Production build` run even when `Test` fails (independent jobs / `if: always()` on a `needs`-parallel matrix), so a collapsed test job can never again hide a real build break. Zero file overlap with the kimi-cli fix.

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
- [x] **New vessel class end-to-end (Fireboat) — done 2026-07-26** (was issue #122, the top open User Idea). Landed via PR #135 / commit `55367ec` "Add fireboat ship type through full authoring pipeline" — full pipeline (blueprint geometry + attachment points, Tone.js track, `LightCue[]`, `CutawayPlan`, seasonal fit). Carried 2026-07-12 (appended) → 2026-07-19 (not picked, Fix First #114 overrode) → landed. **Ideas section is now exhausted** — next non-Fix-First run is New Idea mode.
- [x] **Crane-to-ship attachment feel pass — done 2026-07-19** (was last week's Copilot issue B). Landed via codespace `b4ec030` (bundled into PR #125): `AttachmentSystemManager.tsx` (+321/-101), `swaySystem.ts` (+131), `craneSoundSystem.ts` (+22), `attachmentSystem.ts` (+25), new `useScreenShake.ts`, new `src/utils/physicsMath.ts` (+46) with `physicsMath.test.ts` (74 lines). Magnetic snap guidance + lock feedback (screen-shake hook) + sway settling landed. Carried 2026-07-12 → done. Note: shipped via codespace, not Copilot.

## Backlog
<!--
Unfinished items, known bugs, deferred ideas.
Routine maintains this automatically — you can add items too.
-->
- [ ] **P0 — TODAY'S FIX (CI red 6 days):** `npm test` fails 3 store suites at collection (`coreActions`, `acousticHandshake`, `salvageContracts`) — they import the store → audio systems → real `tone@14.9.17`, whose ESM does an extensionless `export … from "./core/Global"` vitest can't resolve. They omit the `vi.mock('tone')` that all passing audio suites use; there is no global test-setup tone stub. CI `Test` step red on `main` HEAD `87b32a4` → **`smoke:dev-transform` + `Production build` steps SKIPPED** (masked behind the failed test job). Being fixed this run via kimi-cli (systemic tone stub via `test.setupFiles`/alias). (New 2026-07-26; reproduced local + confirmed via Actions API.)
- [ ] **P0-adjacent — CI job ordering hardening (= today's Copilot issue B):** `.github/workflows/ci.yml` runs `Test` before `Dev-transform smoke` + `Production build` in one sequential job, so a test-collection failure short-circuits and *hides* whether the build/smoke gates pass. Split into parallel jobs (or `if: always()` after `needs`) so build + smoke always report. Decoupled from the vitest fix. (New 2026-07-26.)
- [ ] **NEW REALITY — old `cursor` issues #114–#124 all CLOSED; `ford442` filed a fresh structured backlog #142–#149 on 2026-07-23.** Current open issues (7): **#142** GLB ship asset pipeline (wire `useShipModel`, 3 hero vessels; supersedes the GLB-stub item below); **#143** harden WebGL/WebGPU context creation + post-process options (`createRenderer.ts` asymmetric options, no central `configureRendererDefaults`); **#145** type-safe domain store (remove `@ts-nocheck` from `slices/slice1.ts`+`slice2.ts`, kill duplicate `store/types.ts`, single save path, domain-named slices) — **note the `Test` break traces through exactly these untyped slices**; **#146** unify dual currency (`money` vs `economySystem.harborCredits` — install rewards don't persist); **#147** complete C++→WASM DSP pipeline (real binary, `wasmDSP.init()` at boot, `WaveSystem` batch); **#148** progression epic (shop UI + training 5–7 + 2nd mission — partly landed already, see Done); **#149** decompose `MainSceneHelpers.tsx` (still ~1528 LOC after the PR #136 split) + system bootstrap lifecycle. These are `ford442`-authored but read as automated-audit issues — treat as a **structured backlog, not hand-written user Ideas**. Post-Fix-First sequencing: **#145 (typed store) is the natural next foundation pick** — it removes the `@ts-nocheck` that let the test break hide, and unblocks #146/#148. (New 2026-07-26.)
- [ ] Leftover light-show stub files: `src/systems/lightShows/lngShow.ts` (37 B) + `tankerShow.ts` (43 B) are now just re-export redirects (`export { lngLightShow } from './lng'`) left behind when the proof-of-concept files were renamed to `lng.ts`/`tanker.ts`. Confirmed unreferenced anywhere in `src/` (grep clean). Delete both + drop the matching re-exports from `lightShows/index.ts`. Trivial cleanup. (New 2026-06-28.)
- [x] ~~Build broke in the same file two weeks running (`UpgradeMenu.tsx`); need a `tsc` gate~~ — **RESOLVED 2026-07-05** (commit `da00fe9`): `.github/workflows/ci.yml` now runs `npm run typecheck` (`tsc --noEmit`) + `npm run test` on every PR and push to `main`. Deliberately omits the Emscripten/WASM build step (no-ops without Emscripten). This closes the recurring codespace-commit-breaks-`main` vector. Note: push-to-`main` CI is post-hoc (reports red after the fact, doesn't block direct pushes) — only PR CI blocks a merge, so ad-hoc `codespace` pushes to `main` can still land red; the gate's real value is on PRs.
- [ ] God-rays WGSL compute shader `shaders/god-rays-compute.wgsl` (4.5 KB) is now **orphaned/superseded** — a GLSL screen-space `ShaderPass` (`src/shaders/GodRaysShader.ts`) shipped instead via PR #110 (`31f2841`) and is wired into `PostProcessing.tsx` (depth-texture driven, Leva-controlled exposure/decay/density/weight/samples). The `.wgsl` file is referenced nowhere in `src/` (grep clean 2026-07-12). Decision for Noah: delete the orphaned `.wgsl`, or keep it as a future WebGPU-compute-path reference and document it as such. (Was "wire it into PostProcessing" — that intent is fulfilled by the GLSL path.)
- [ ] Repo-root debris still tracked: one-shot codemods `fix_glb_loader.cjs` + `fix_glb_loader_2.cjs` (from 2026-06-15 GLB-loader work — same pattern as the `fix_*.cjs` batch archived to `scripts/archive/`), **plus** `.swarm-state.md` (now 21 KB — kimi-cli progress notes through the wildlife Phase-4 run; useful for resume but re-committed to `main` again this week). Archive/delete the codemods; **decide `.swarm-state.md` policy — recommend adding to `.gitignore`** since it's regenerated every swarm run and keeps landing on `main`. (Updated 2026-07-12; recurring.) **NEW 2026-07-19:** also a tracked **`stats.html`** (972 KB) at repo root — a stale `rollup-plugin-visualizer` output committed back at PR #42, regenerated by every `npm run build:analyze`. Delete it and add `stats.html` to `.gitignore` (the analyzer writes it fresh on demand).
- [ ] GLB model loader — `useShipModel()` stub (`bb3e993`) partly addressed: PR #133 (`cfa1246`) landed a "GLB ship model pipeline with procedural fallback" and `scripts/generate-ship-glb.mjs` now exists, but the full hero-vessel authoring pass is now formally tracked as **issue #142** (wire `useShipModel`, author 3 hero models, keep procedural LOD fallback). Fold this backlog line into #142; still verify no dead `useGLTF` path remains if #142 stalls.
- [x] ~~Persistent lint error: `createRenderer.ts:45` `@ts-ignore` vs `ban-ts-comment`~~ — **RESOLVED (confirmed 2026-07-26):** `createRenderer.ts` no longer contains any `@ts-ignore`/`@ts-expect-error`; `npm run lint` now exits **0 errors** (42 warnings, all `react-refresh/only-export-components`). The ban-ts-comment lint gate (PR #138) is green. Documented 2026-06-21 → resolved.
- [ ] **SECURITY — decision needed from Noah**: PR #90 removed hardcoded credentials (SFTP password, deploy token) from HEAD, but they remain in this **public** repo's git history. K2/Kimi stress-test recommends: (1) rotate both credentials immediately regardless of anything else, (2) then decide whether to rewrite git history (`git-filter-repo`, force-push, GitHub support ticket to purge caches/old-PR refs — disruptive, invalidates all open PRs/clones) vs. accept the exposure as already-public and rely on rotation alone. This is a destructive, repo-wide operation requiring Noah's explicit go-ahead — not something to hand to an autonomous agent. **Still unresolved as of 2026-07-26 — carrying forward a SEVENTH week. Noah: rotation (item 1) is a 2-minute action and blocks nothing else — please do it regardless of the history-rewrite decision.**

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
- 2026-07-26 — **Last week's Fix First (#114) landed:** the dev-500 `LevaControlsConfig` duplicate is gone. `MainSceneHelpers.tsx` was split into focused modules (PR #136 / `a10e5db`: `levaControls.ts`, `nightLighting.tsx`, `shipFleet.tsx`, `spectatorCamera.tsx`, `underwaterEffects.tsx`, `types.ts`, `index.ts`); `LevaControlsConfig` now declared once in `mainScene/types.ts`, re-exported; `mainScene/__tests__/MainSceneHelpers.test.ts` asserts no `@ts-nocheck` and single declaration. Verified this run: `npm run smoke:dev-transform` green across all mainScene + store modules; `typecheck` 0 errors; `lint` 0 errors. (The god-module is only *partly* decomposed — `MainSceneHelpers.tsx` is still ~1528 LOC → new issue #149.)
- 2026-07-26 — **Fireboat vessel class landed** (issue #122, the top open User Idea; PR #135 / `55367ec`): full authoring pipeline (blueprint, Tone track, `LightCue[]`, `CutawayPlan`, seasonal fit). Ideas section now exhausted.
- 2026-07-26 — **CI dev-transform smoke gate landed** (last week's Copilot issue B; PR #138 / `bc3dbe1` "ci: enforce ban-ts-comment and broaden dev-transform smoke gate"): `scripts/smoke-dev-transform.mjs` + `smoke:dev-transform`/`test:dev-transform` npm scripts + a CI step that runs the Babel dev transform over scene/store modules. Also flipped the `ban-ts-comment` lint from red→green (createRenderer.ts fixed). Caveat surfaced this run: the smoke + production-build CI steps sit *after* `Test` in one sequential job, so a red test job skips them (→ today's Copilot issue B, round 2).
- 2026-07-26 — **Feature flurry via `cursor`/codespace PRs #132–#137** (structured backlog #114–#124 execution): #132 Harbor Shop UI (`43f5a14`), #133 GLB ship pipeline + procedural fallback (`cfa1246`), #134 training modules 5–7 (`8133469`), #137 Playwright WebGL2 visual E2E + CI job (`285caed`). All merged to `main`. (Progression epic #148 and GLB #142 continue this work under the new issue numbering.)
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
Date: 2026-07-26
Mode: **FIX FIRST** — CI red on `main` for 6 days (foundation cracked); overrides New Idea mode (Ideas exhausted).
Focus: **Green `npm test` + stop a test failure from masking build/smoke gates.** GitHub Actions on `main` HEAD `87b32a4`: Type-check ✓, Lint ✓, **Test ✗**, Dev-transform smoke = *skipped*, Production build = *skipped*. Reproduced locally: `vitest run` = 3 suites fail to collect (`store/__tests__/coreActions|acousticHandshake|salvageContracts`), 250 tests pass. Root cause: those suites import the store → audio systems → real `tone@14.9.17` (pinned in lockfile), whose ESM re-exports `from "./core/Global"` extensionless → vitest `Cannot find module`. They omit the `vi.mock('tone')` that every passing audio suite uses; no global test-setup tone stub exists. Fix = systemic tone stub via `test.setupFiles`/alias (not per-file whack-a-mole). kimi-cli main event scoped to `vite.config.ts` + new `src/test/` setup + 3 test files. Decoupled Copilot issue B: restructure `ci.yml` so smoke + production-build run even when `Test` fails (parallel jobs / `if: always()`).
Reconciliation: **last week's Fix First (#114) landed** → Done — dev-500 gone, `MainSceneHelpers.tsx` split into modules (PR #136), `smoke:dev-transform` green. **Fireboat (#122, top open Idea) landed** (PR #135) → Ideas now exhausted. **Copilot issue B from last week (CI dev-transform smoke gate) landed** (PR #138) + `createRenderer.ts` lint error resolved (lint now 0 errors). Feature flurry #132/#133/#134/#137 (shop UI, GLB pipeline, training 5–7, Playwright E2E) merged. **State shift:** old `cursor` issues #114–#124 all CLOSED; `ford442` filed a new structured backlog **#142–#149** on 2026-07-23 (GLB, renderer, typed store, dual-currency, WASM, progression epic, god-module decomp). Test count 223→250 (+3 suites now failing to collect = today's fix).
Carried backlog: **P0 CI-red test break (fixing now)**; CI job-ordering hardening (#B); tracked debris still present — `stats.html` (995 KB), `fix_glb_loader.cjs` ×2, `.swarm-state.md` (24 KB), none in `.gitignore`; orphaned `god-rays-compute.wgsl`; light-show stub redirects (`lngShow.ts`/`tankerShow.ts`); `slices/slice1.ts`+`slice2.ts` still `@ts-nocheck` (#145 — the break traces through these); `MainSceneHelpers.tsx` still ~1528 LOC (#149); dual currency not persisted (#146); WASM DSP still a 121-byte stub (#147); **SECURITY credential rotation UNRESOLVED a 7th week**.
Note: `recent_chats`/`conversation_search` tools absent again (7th run) — Step 1 cross-session sweep skipped; reconciliation from repo state + GitHub Actions/Issues API (7 open issues #142–#149, 0 open PRs, CI red 6 days). Thin cross-session context is a real gap, not hidden.
Outcome: weekly_plan.md updated (Today's focus → Fix First CI-red test break; #114/#122/#116 + feature flurry moved to Done; fireboat Idea [x]; createRenderer lint item [x]; backlog re-baselined to #142–#149; Last run refreshed). Dispatch below: kimi-cli tone-stub fix + decoupled CI job-ordering Copilot issue + 3 chat prompts + Copilot handoff + Jules template + Claude Code whole-stack build/deploy hygiene + 2 review prompts.
