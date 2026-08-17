# Rendering

WebGPU is required at canvas boot. Probe fail → blocking overlay; no `WebGLRenderer` rescue.

See [`docs/RENDERER.md`](../../docs/RENDERER.md). GPU image helpers (histogram, downsample, blur, reduce) live in `gpuChores/` and must not absorb ocean FFT or god-rays. They adopt the probed device and never call `requestDevice()` after a failed probe.

WebGL/R3F fallback is deferred.
