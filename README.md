# HarborGlow 🚢✨

HarborGlow — a satisfying crane-operator + boat-light-upgrade game with three signature vessel types, synchronized music, and spectacular light shows.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![WebGPU](https://img.shields.io/badge/WebGPU-enabled-green.svg)

## 🎮 Gameplay

Spawn different ship types, use the crane to install glowing light rigs, and enjoy synchronized music + lyrics when fully upgraded.

### The Three Vessels

| Ship | Name | Music Style | Light Show |
|------|------|-------------|------------|
| 🚢 **Mega Cruise Liner** | *Ocean Symphony* | Orchestral + Choir Synth | Multi-deck balcony LEDs, giant funnel array, water-curtain stern |
| ⬛ **Ultra Container Vessel** | *Neon Stack* | Future Bass / Techno | 20+ container stacks, full LED billboard sides |
| ⛽ **VLCC Oil Tanker** | *Flame Runner* | Dubstep / Industrial | Flare stack fire-effect, hull wash lighting |

### Ship Details

#### 1. Mega Cruise Liner ("Ocean Symphony")
Tall, multi-deck cruise ship with balconies everywhere and a giant funnel array.

- **Music**: Orchestral + choir synth (PolySynth + lush reverb)
- **Band**: The Deck Dancers
- **Lyrics**: *"We sail through the night… lights ignite… HarborGlow!"*
- **Upgrade Points**: 8 balcony rails + giant funnel + water-curtain stern
- **Light Colors**: Warm white, sunset amber, aqua blue

#### 2. Ultra Large Container Vessel ("Neon Stack")
Long flat deck with 20+ container stacks in varying heights and colors.

- **Music**: Heavy techno / future bass (FM synth + membrane)
- **Band**: Neon Freight Crew
- **Lyrics**: *"Stack it high… light the sky… move that freight all night!"*
- **Upgrade Points**: 5 stack tops + 3 mast arrays + 2 LED billboard sides
- **Light Colors**: Neon green, electric blue, magenta

#### 3. VLCC Oil Tanker ("Flame Runner")
Massive bulbous bow tanker with central superstructure and flare stack.

- **Music**: Gritty industrial / dubstep (Metal synth + noise)
- **Band**: Industrial Flames
- **Lyrics**: *"Black gold flows… fire glows… we own these glowing seas!"*
- **Upgrade Points**: Flare stack + 4 deck rails + 3 hull wash lights
- **Light Colors**: Fire orange, warning red, industrial amber

## 🕹️ Controls

### Ship Spawning
- **Spawn Cruise** - Spawn a Mega Cruise Liner
- **Spawn Container** - Spawn an Ultra Container Vessel
- **Spawn Tanker** - Spawn a VLCC Oil Tanker

### Leva Panel Controls
| Control | Range | Description |
|---------|-------|-------------|
| Current Ship Type | dropdown | Select active ship for upgrades |
| Music BPM | 60-200 | Adjust music tempo |
| Lyrics Size | 12-72 | Size of on-screen lyrics |
| Light Intensity | 0.1-5.0 | Brightness of installed lights |
| Time of Day | 0-24 | Change day/night cycle |
| Fog Density | 0-0.1 | Atmospheric fog thickness |
| Camera Mode | orbit/crane | Switch camera perspective |

### Upgrade Installation
1. Select a ship from the dropdown
2. Click "Install [part]" buttons in the bottom-right menu
3. Watch the crane pick up and place each light rig
4. When all upgrades are installed, music starts automatically!

### Spectator Drone Mode
After fully upgrading a ship:
1. Band name is revealed with cinematic
2. Music begins playing with synchronized lyrics
3. Camera auto-switches to "Spectator Drone" orbiting the vessel for 10 seconds
4. All installed lights pulse to the beat

## 🎵 Music System

Each ship type has a unique Tone.js audio setup:

- **Cruise**: PolySynth with sawtooth wave → Chorus → Reverb
- **Container**: FM synth + MembraneSynth kick + MetalSynth hats
- **Tanker**: MetalSynth + NoiseSynth + LFO-filtered sub bass

Lyrics are synchronized to the Transport position and displayed above each ship.

## 📸 Screenshots

*Add GIFs here when available*

### Placeholder Screenshots Section
```
screenshots/
├── cruise-liner-lights.gif    # Ocean Symphony with all lights
├── container-stacks.gif       # Neon Stack LED billboard
├── tanker-flame.gif           # Flame Runner flare stack
├── crane-operation.gif        # Installing lights with crane
└── spectator-drone.gif        # Auto-camera orbit
```

To add screenshots:
1. Run `npm run dev` and position camera
2. Use screen recording to capture gameplay
3. Convert to GIF and place in `screenshots/` folder
4. Update this section with actual image links

## 🏗️ Architecture

### Tech Stack
- **WebGPU** - Next-gen graphics rendering
- **React Three Fiber** - React renderer for Three.js
- **Rapier** - Physics engine for crane interactions
- **Zustand** - State management
- **Tone.js** - Audio synthesis and sequencing
- **Leva** - In-game debug controls

### File Structure
```
src/
├── components/
│   ├── HUD.tsx              # Main HUD container
│   ├── LyricsDisplay.tsx    # Synchronized lyrics overlay
│   ├── ShipSpawner.tsx      # Ship spawn buttons
│   └── UpgradeMenu.tsx      # Upgrade installation UI
├── scenes/
│   ├── MainScene.tsx        # Scene composition + spectator drone
│   ├── Ship.tsx             # All three ship types with lights
│   ├── Crane.tsx            # Animated dock crane
│   ├── Dock.tsx             # Night dock with volumetric lights
│   └── Water.tsx            # Animated shader water
├── store/
│   └── useGameStore.ts      # Zustand game state
└── systems/
    ├── musicSystem.ts       # Tone.js music + lyrics
    └── shipSpawner.ts       # Ship factory with attachment points
```

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Prerequisites
- Node.js 18+
- Browser with WebGPU support (Chrome 113+, Edge 113+)

## 📝 TODO / Future Enhancements

### Models
- [ ] Replace primitives with GLB models:
  - [ ] `cruise_liner.glb` from Sketchfab
  - [ ] `container_vessel.glb` from Sketchfab
  - [ ] `oil_tanker.glb` from Sketchfab
- [ ] Add animated waterline foam
- [ ] Add crane rope physics constraints

### Features
- [ ] Multiplayer crane battles
- [ ] Ship naming by players
- [ ] Export light show as video
- [ ] VR mode for crane operation
- [ ] Mobile touch controls

### Audio
- [ ] Import custom audio files
- [ ] Procedural music generation
- [ ] Voice synthesis for lyrics

## 🎨 Credits

- Built with [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- Audio powered by [Tone.js](https://tonejs.github.io/)
- Physics by [Rapier](https://rapier.rs/)
- UI controls by [Leva](https://github.com/pmndrs/leva)

## 📄 License

MIT License - feel free to use this code for your own projects!

---

*HarborGlow — Light up the night, one ship at a time.* 🌊✨
