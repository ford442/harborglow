# Deploy pipeline exercise: subpath + COOP/COEP probe (2026-09-21)

This records an end-to-end exercise of the static-deploy pipeline described in
`AGENTS.md` → **Deployment**: build `dist/`, serve it from a non-root subpath
(not the accidental-root-relative case), toggle the COOP/COEP headers the WASM
audio engine needs, and capture what actually resolves. It closes GitHub issue
#233 §4 and §6 (see also `docs/systems/AUDIO.md` → Hosting, which this doesn't
duplicate).

Two other fixes landed alongside this probe and are summarized at the bottom:
the duplicate intro/loop MP3 (§4) and the silent `AudioRuntime` fallback (§6).

## Method

`npm ci` (438 packages) in a container without Emscripten on `PATH`, then:

```bash
ALLOW_MISSING_EMSDK=1 npm run build
```

This is the repo's own supported path for a missing toolchain (`cpp/build.sh`
`--allow-missing-emsdk`), **not** the bare `npx tsc && npx vite build`
fallback — it still runs `check:wasm` (validated the 4 committed WASM
artifacts byte-for-byte, did not rebuild them), `models:verify`, `tsc`,
`vite build`, and `check:bundle`. Stated explicitly per the task instructions:
**the C++ → WASM rebuild itself did not run**; the probe exercises the WASM
binaries already committed to `public/wasm/`. Output `dist/` is 12 MB (down
from ~15.85 MB before the duplicate-MP3 fix).

`dist/` was then served by a small Node `http` server
(not checked in — it lived in the session scratchpad) that:
- prefixes every route with `/some/nested/path/` (three levels deep, so
  nothing can resolve by accident of sitting at `/`),
- sets `Content-Type` from a real extension→MIME table (in particular
  `application/wasm` for `.wasm`, `model/gltf-binary` for `.glb`,
  `audio/mpeg` for `.mp3`),
- optionally sends `Cross-Origin-Opener-Policy: same-origin` +
  `Cross-Origin-Embedder-Policy: require-corp` on every response.

A Playwright script (Chromium, `/opt/pw-browsers/chromium`) loaded
`http://127.0.0.1:<port>/some/nested/path/`, read `crossOriginIsolated`,
`fetch()`-checked one file from each asset class, then called
`window.harborglowAudioRuntime.resume()` (the same entry point
`App.tsx`'s user-gesture handler and `startGame()` use) and read back
`.status` / `.isSharedWasmActive`.

## Results

| Check | Without COOP/COEP | With COOP/COEP |
| --- | --- | --- |
| `crossOriginIsolated` | **`false`** | **`true`** |
| `wasm/harborglow_audio_shared.wasm` | 200, `application/wasm` | 200, `application/wasm` |
| `wasm/harborglow_audio_shared_simd.wasm` | 200, `application/wasm` | 200, `application/wasm` |
| `wasm/harborglow_dsp.wasm` | 200, `application/wasm` | 200, `application/wasm` |
| `wasm/harborglow_dsp_simd.wasm` | 200, `application/wasm` | 200, `application/wasm` |
| `models/{cruise_liner,container_vessel,oil_tanker}.glb` | 200, `model/gltf-binary` | 200, `model/gltf-binary` |
| `audio/clear_harbor_glow_intro.mp3` | 200, `audio/mpeg` | 200, `audio/mpeg` |
| `AudioRuntime.status` after `resume()` | **`'fallback'`** | **`'shared-simd'`** |
| `AudioRuntime.isSharedWasmActive` | `false` | **`true`** |

All eight asset checks passed identically in both runs — resolution and MIME
type depend only on `base: './'` + relative URLs (`MODEL_BASE`,
`import.meta.env.BASE_URL`, `new URL('./worklet/…', import.meta.url)`) and on
the probe server serving `.wasm` as `application/wasm`, none of which is
COOP/COEP-gated. Because the probe served from a three-segment nested path
rather than root, **nothing here resolved by accident of a root deployment**
— this is the actual subpath behavior a real `/harborglow/` (or deeper)
deployment gets. `base: './'` holds.

The one thing that *is* gated, exactly as designed, is the audio engine
itself: without the headers `crossOriginIsolated` is `false`, the
`supportsShared` gate in `AudioRuntime.ts` fails, and the runtime takes the
native-fallback path (`status: 'fallback'`, no WASM DSP, no shared-memory
ring). With the headers it genuinely initializes the shared-memory WASM
worklet (`status: 'shared-simd'`) rather than merely reporting a status that
claims to.

## A finding beyond the task's checklist: `console.warn` is stripped in production

The new one-time `console.warn` added to `AudioRuntime.ts` (and the
pre-existing `catch`-block warning next to it) **did not appear in the
browser console during this probe**, in either header configuration.
`vite.config.ts`'s production build sets:

```ts
terserOptions: { compress: { drop_console: true, drop_debugger: true, passes: 2 } }
```

This removes every `console.*` call from the built bundle unconditionally —
confirmed by grepping `dist/assets/*.js` for `console.warn` post-build (zero
matches) despite the warning's string literal surviving as dead data. This is
a **pre-existing, site-wide policy**, not something introduced by this task,
and it applies equally to the `catch`-block warning at `AudioRuntime.ts`
that already shipped — so in production neither warning has ever been
visible in the console, though both work correctly in `npm run dev` (esbuild,
unminified) and both fire in the added Vitest coverage
(`src/systems/__tests__/AudioRuntime.test.ts`).

Practical effect: in the shipped game, `window.harborglowAudioRuntime.status`
(already exposed at the bottom of `AudioRuntime.ts` for exactly this kind of
introspection) is the **only** diagnostic that reaches production — the
console warnings are dev/test-only. That's a reasonable trade for bundle
noise, but it means a host misconfiguration will never show up in an end
user's or a support engineer's console; checking `status` (e.g. via
`window.harborglowAudioRuntime.status` in devtools, or scripted with
Playwright as this probe does) is the only way to detect it in the field.
Not fixed here — changing `drop_console` is a site-wide decision belonging to
whoever owns `vite.config.ts`'s bundle-noise tradeoff, out of scope for this
audio-specific task.

## Fixes landed alongside this probe

**§4 — duplicate shipped audio.** `public/audio/clear_harbor_glow_intro.mp3`
and `clear_harbor_glow_loop.mp3` were byte-identical (sha256 `d6c9d068…`,
4,998,835 bytes each — confirmed independently before touching anything).
`clear_harbor_glow_loop.mp3` is deleted; `introMusicSystem.ts`'s
`LOOP_TRACK_URL` now reads `= INTRO_TRACK_URL` (still a named constant, so
authoring a real distinct loop track is a one-line repoint — see the note
added to `public/audio/README.md`). No re-encoding was done. A new check,
`scripts/check-duplicate-assets.mjs` (`npm run check:duplicate-assets`),
sha256-hashes every file under `public/` and fails on any group of two or
more sharing a hash; it's wired into `scripts/verify.sh` ahead of the
typecheck gate so this can't regrow silently.

**§6 — silent audio degradation.** `AudioRuntime.ts`'s `supportsShared` gate
now calls a one-time `warnFallbackReason()` before falling back, which names
exactly which condition failed (`SharedArrayBuffer`, `Atomics`,
`crossOriginIsolated`, `AudioContext.audioWorklet`, or `AudioWorkletNode` —
whichever are actually false) instead of a generic message. The pre-existing
`catch`-block warning now also states the resulting status. Covered by two
new Vitest cases asserting the specific condition named in each message. See
the "stripped in production" finding above for the caveat on where this
warning is actually visible.

## Verification run in this session

```
npm ci                              # 438 packages
npm run typecheck                   # clean
npx eslint src                      # 0 errors, 32 warnings (react-refresh/only-export-components, pre-existing)
npx vitest run                      # 52 files, 554 tests (552 pre-existing + 2 new AudioRuntime warning tests)
ALLOW_MISSING_EMSDK=1 npm run verify  # all gates green, including the new check-duplicate-assets step
```
