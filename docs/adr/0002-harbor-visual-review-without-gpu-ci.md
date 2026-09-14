# ADR 0002 — Harbor visual review without a GPU CI runner

- **Status:** Accepted (interim — superseded when a WebGPU still lands in CI)
- **Date:** 2026-09-14
- **Deciders:** HarborGlow graphics / foundation track
- **Related:** [`docs/RENDERER.md`](../RENDERER.md) (Canvas surface, Screenshot readback), [`e2e/visual.spec.ts`](../../e2e/visual.spec.ts), [`e2e/webgpu-probe.spec.ts`](../../e2e/webgpu-probe.spec.ts), follow-on to closed #199 / #204 workstream B, [ADR 0001](./0001-webgpu-tsl-vs-glsl-first.md)

## Context

HarborGlow is WebGPU-required (#194). The `e2e-visual` job runs headless Chromium on SwiftShader, which exposes no WebGPU adapter, so the app correctly hard-fails to the fatal overlay. Every harbor pixel test in `e2e/visual.spec.ts` was `test.skip(true, …)` with no recorded decision, so water / bloom / light-rig regressions had no gate at all — not automated and not human.

The capture side is now in place: the swapchain is configured `RENDER_ATTACHMENT | COPY_SRC`, and `readScreenshotPixelsAsync` / `window.harborglowDebug.captureCanvasPng()` read a presented frame back as RGBA8 on a real WebGPU session. What is missing is a runner with a GPU. The two options (`dawn.node` headless, or a GPU-labelled runner — larger GitHub GPU runner, Azure GPU VM, BrowserStack) have different cost and maintenance profiles and need an owner decision; the issue asks that exactly one be picked, in its own PR.

## Decision

Until a WebGPU harbor still runs in CI:

1. **Human visual review is mandatory** for any PR touching `src/scenes/**`, `src/shaders/**`, or `src/rendering/**`. The PR description must include at least one still of the **dock + water + one lit rig** taken on a real WebGPU browser (Chrome/Edge 113+), before and after when the change is visual. Preferred capture: open `/?screenshot=1`, then in DevTools `await harborglowDebug.captureCanvasPng()` and save the `dataUrl`; an OS screenshot is acceptable.
2. **The reviewer checks the still**, not just the diff. A missing still on a matching PR is a requested change, not a nit.
3. `e2e/visual.spec.ts` stays skipped, but the skip message **cites this ADR** instead of skipping silently.
4. `e2e/webgpu-probe.spec.ts` (SwiftShader → fatal overlay) keeps running in `e2e-visual`; it guards the no-WebGL rule, not pixels.
5. `?renderer=webgl` is **not** reintroduced to get a GL harbor into CI.

## Consequences

- Visual regressions are caught only as well as reviewers look. This is weaker than a baseline diff, and is accepted as a stopgap.
- No CI cost or new infra until the runner decision is made.
- Exit criteria (supersede this ADR): one `e2e-visual`-path-filtered job renders the harbor on WebGPU (`dawn.node` **or** a GPU runner — one, not both), compares a single dock + water + lit rig still with a tolerance, keeps the SwiftShader overlay spec, and uploads the still on failure. Then unskip `e2e/visual.spec.ts` and mark this ADR `Superseded`.

## Non-goals

- Pixel-perfect baselines for every camera mode.
- A WebGL/R3F restore (later wave, ADR 0001).
