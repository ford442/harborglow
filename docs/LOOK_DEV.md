# Harbor Look Dev (Visual Polish)

Live tuning for surfaces, flares, rigs, crane lighting, and post FX while the game runs.

## Opening controls

1. Start the game (`npm run dev`).
2. Expand the Leva panel (**Harbor Controls**, bottom-right).
3. Open the **Visual Polish** folder (expanded by default when MainScene loads).

## Sub-folders

| Folder | What it affects |
|--------|-----------------|
| **Surfaces** | Dock wood/metal PBR (`HarborPBRMaterials.ts`) — wetness, roughness, rust, puddles |
| **Flares & Glow** | Lens flares, bloom boost, installed rig emissive |
| **Light Rigs** | Spark density, beat pulse, color temperature on LED rigs |
| **Crane & Cable** | Cab/work-light sheen, metal wear, cable tension glow |
| **Global** | Env-map intensity on harbor materials, film grain, volumetric god-ray density |

## Persistence

Values save to `localStorage` key `harborglow.lookdev.v1`. Use **Reset Visual Polish** to restore defaults and refresh slider bindings.

## Architecture

- **Single source of truth:** `src/utils/lookDevControls.ts` — module globals read in `useFrame` (no Zustand).
- **Leva hook:** `src/hooks/useVisualPolishControls.ts` — mounted once in `MainScene.tsx`.
- **Flares:** `lightFlareSettings.ts` delegates to look-dev (replaces the old standalone Light Flares folder).

Existing folders (**Cinematic**, **Harbor Ambiance**, **Renderer Backend**, etc.) are unchanged.

## Quick demo

1. Set Leva **Weather** → `rain` (or wait for rain).
2. **Visual Polish → Surfaces → Surface Wetness** — dock deck and fenders get wetter/darker in real time.
3. **Visual Polish → Global → God Ray Density** — night dock light shafts brighten/dim.
4. Fully upgrade a ship, then tweak **Rig Emissive Boost** and **Flare Intensity** during the light show.

Works on both WebGPU and WebGL2 (`?renderer=webgl`); materials update uniforms every frame on both backends.
