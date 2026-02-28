# ⚓ HarborGlow

> A satisfying crane-operator + boat-light-upgrade 3D browser game.

## Tech Stack

| Tool | Purpose |
|------|---------|
| **Vite 6** | Dev server + bundler |
| **React 19 + TypeScript** | UI framework |
| **Three.js (WebGPU)** | 3D rendering via `three/webgpu` |
| **@react-three/fiber** | React renderer for Three.js |
| **@react-three/drei** | Helpers (OrbitControls, Stars, …) |
| **@react-three/rapier** | Physics (crane cables, container sway) |
| **Zustand** | Game state management |
| **TailwindCSS** | Styling |
| **Leva** | Runtime debug panel |
| **Tone.js** | Procedural music synthesis |

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 — **Chrome 121+ or Edge 121+ recommended** for full WebGPU support.

## Controls

| Key | Action |
|-----|--------|
| `← →` | Rotate crane |
| `↑ ↓` | Move trolley along jib |
| `W / S` | Lower / raise hook |
| Mouse drag | Orbit camera (God Mode) |

## Game Flow

1. **Spawn a Ship** — click a ship type in the HUD panel (top-left)
2. **Wait for Docking** — the ship animates in and docks (3 seconds)
3. **Upgrade Workshop** opens — select an upgrade (start with **RGB Matrix**)
4. **Click "Install via Crane"** — crane picks up the panel and installs it
5. **Light Show begins** — music starts, RGB panels pulse to the beat, lyrics appear

## Folder Structure

```
harborglow/
├── src/
│   ├── components/       # UI panels (HUD, UpgradeMenu, CraneControls, …)
│   ├── scenes/           # MainScene, Water, Crane, Ship, Dock
│   ├── systems/          # physicsSystem, lightingSystem, musicSystem
│   ├── store/            # useGameStore.ts (Zustand)
│   ├── shaders/          # TSL light-show shader nodes
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── models/           # Drop .glb files here for GLTF ships
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

## Adding GLTF Models

1. Export your ship/crane model as `.glb` from Blender, Maya, etc.
2. Copy the `.glb` file to `public/models/cruise_liner.glb`
3. In `src/scenes/Ship.tsx`, replace the primitive meshes with:

```tsx
import { useGLTF } from '@react-three/drei'

const { scene } = useGLTF('/models/cruise_liner.glb')
return <primitive object={scene} />
```

## Leva Debug Panel

Click the **⚙** panel (top-right) to tweak:
- **Scene › Wind (m/s)** — affects wave height and hook sway
- **Scene › Ambient** — overall light level
- **Crane › Crane Speed** — crane movement sensitivity

## Next Steps

- [ ] Add GLTF models for ships and crane
- [ ] Implement full Rapier rope-constraint crane cable
- [ ] Hook-cam follows hook physics in real-time
- [ ] Add more ship types and music tracks
- [ ] Persist upgrades with localStorage
- [ ] Multiplayer via WebRTC
