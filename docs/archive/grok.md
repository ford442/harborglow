# grok.md — Grok AI Assistant Guide for HarborGlow 🚢✨

> **Read this first.** Your personal AI co-pilot for lighting up the harbor, one ship at a time.

## 🚢 Project Overview
**HarborGlow** is a satisfying crane-operator + boat-light-upgrade game featuring three signature vessel types, synchronized music, spectacular light shows, and immersive WebGPU visuals.

- **Core Loop**: Spawn ships → Use crane to install glowing light rigs → Watch music + lyrics sync when fully upgraded → Enjoy spectator drone cinematic mode
- **Signature Vessels**:
  - 🚢 **Mega Cruise Liner** — *Ocean Symphony* (Orchestral + Choir Synth, multi-deck LEDs, water-curtain stern)
  - ⬛ **Ultra Container Vessel** — *Neon Stack* (Future Bass / Techno, LED billboards, container stacks)
  - ⛽ **VLCC Oil Tanker** — *Flame Runner* (Dubstep / Industrial, flare stack fire effects, hull wash lighting)
- **Key Features**: Crane physics (Rapier), music-reactive lights (Tone.js), day/night cycle, fog, Leva controls, spectator drone orbits

## 🛠️ Technology Stack
- **WebGPU** + React Three Fiber + Three.js (core rendering & shaders)
- **Rapier** (physics for crane interactions & rope simulation)
- **Zustand** (state management)
- **Tone.js** (procedural music synthesis, sequencing, lyrics sync)
- **Leva** (in-game debug controls panel)
- **Vite** + TypeScript + Tailwind
- **Additional**: Custom shaders, music-reactive uniforms, spectator camera system

## 🤖 Grok Guidelines
- **Theme First**: Every interaction should feel like HarborGlow — vibrant, glowing, satisfying, musical. Use ship/ harbor / light / crane metaphors when helpful.
- **WebGPU & Shaders**: Prioritize performant, music-reactive shaders. Think TSL nodes, uniforms driven by Tone.js Transport, beat-synced pulsing lights, water shaders, volumetric dock lights.
- **Crane & Physics**: Respect Rapier constraints. Crane should feel weighty and satisfying. Rope simulation, precise placement of light rigs on attachment points.
- **Music & Sync**: Lyrics must stay perfectly timed to Transport position. Each ship has unique synth architecture (PolySynth, FM+Membrane, Metal+Noise). Support BPM changes, intensity, and beat-reactive light shows.
- **UX & Polish**: Leva panel is the command center. Upgrade menus, ship spawner, spectator drone cinematic transitions. Make every upgrade installation feel rewarding.
- **Performance**: Target 60fps. Watch for shader complexity, instance counts (containers, lights), memory on long sessions. Use offscreen rendering or LOD where smart.
- **Iteration Style**: Rapid prototyping encouraged. Spawn ships, install lights, tweak via Leva, record short cinematic clips. Think in "light show moments".
- **Future Vision**: Multiplayer crane battles, GLB model imports, VR crane mode, video export of light shows, procedural music evolution.

## 🔧 Common Tasks & Priorities
- **Adding/Refining Light Rigs**: Define attachment points per ship, animate crane pickup/placement, add glow materials that react to music.
- **Music System Expansion**: New synth patches per ship, better lyric timing, crossfade between ships, beat detection for light pulses.
- **Camera & Drone Mode**: Improve spectator drone orbits, add cinematic paths, smooth transitions from crane view.
- **UI/Controls**: Enhance Leva integration, add ship-specific upgrade progress, on-screen lyrics styling, BPM/Intensity sliders feel.
- **Visual Effects**: Water shader improvements, fog, time-of-day lighting, particle effects for flares/water curtains, bloom/glow post-processing.
- **Refactoring & Cleanup**: Follow patterns from REFACTORING_GUIDE.md. Keep components modular (Ship.tsx, Crane.tsx, musicSystem.ts).
- **Debugging**: Use stats.html, Leva, browser devtools. Profile shader performance, physics stability, audio timing drift.

## 🎵 Music & Light Philosophy
Each vessel tells a story through light and sound:
- **Ocean Symphony**: Elegant, uplifting, choral — warm whites, ambers, aquas dancing on balconies.
- **Neon Stack**: Energetic, driving techno — electric blues, magentas, greens pulsing across stacked containers.
- **Flame Runner**: Gritty, powerful industrial — fiery oranges, warning reds, dramatic flare stacks.

When all upgrades are installed, the harbor truly glows. The crane rests, the band plays, and the spectator drone captures the magic.

---

**HarborGlow — Light up the night, one ship at a time.** 🌊✨

*Grok is here to help you build the most satisfying light-up harbor experience possible.*