# Show export

Slice 6 of the Light Show Director epic (#236).

**Save poster** reads the swapchain with `readScreenshotPixelsAsync` (COPY_SRC) and downloads a PNG. The same function is `harborglowDebug.captureCanvasPng()`, available in every session.

**Export MP4** records 30 seconds at 1920×1080, 60 fps:

- Video: `canvas.captureStream(60)` → `VideoEncoder`
- Audio: `AudioRuntime.openExportTap()` (`MediaStreamAudioDestinationNode` on the master gain) → `AudioEncoder`
- Each video frame `i` and its audio packet are stamped `i / 60` seconds, so an onset lands within one frame
- The muxer is mediabunny, loaded with `import()` from `src/systems/export/showMuxer.ts`. The `show-export` chunk is outside `game-initial`

**Export offline** steps the fixed-step scheduler by exactly `1/60` s per captured frame (`exportFrameDelta`) and reads those frames with `readScreenshotPixelsAsync`. Slow GPUs still produce a 60 fps file. Audio packets use the same timestamps.
