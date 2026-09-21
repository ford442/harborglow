# Claude (Opus) Contributions to HarborGlow

*What an Opus-class model could eventually bring to the harbor — beyond writing code.*

HarborGlow is, at heart, a **content game**: ships, light shows, bands, lyrics, and
cinematic cutaways are the product. The code is the stage; the show is the point.
That makes it an unusually good fit for a creative model. The mechanics already exist
and are well-structured — every ship is data, every light show is data, every
cutaway is a beat-locked schedule. Opus can author *into those slots* rather than
rewrite the engine.

This document sketches what "Cloud Opus" could deliver as a **creative collaborator**,
mapped onto the systems that already exist so each idea is one step from real.

---

## 1. Light Show Sequences

**Where it plugs in:** `src/systems/lightingSystem.ts` (`startHarborShow`,
`triggerClimax`), `src/systems/audioVisualSync.ts` (beat/FFT data), and the
node materials in `src/shaders/lightShowNodes.ts`.

Today a ship's light show is driven generically off beat intensity. Opus could
author **per-band choreography** — a show that *understands the genre*:

- **Cryogenic Pulse** (LNG, "Ambient / Cryogenic Techno") → slow cyan breathing,
  long fades, frost-blue strobes only on the drop.
- **Industrial Flames** (tanker, "Dubstep / Industrial") → hard amber/red snaps
  locked to the wobble, blackouts between phrases for contrast.
- **The Deck Dancers** (cruise, "Orchestral Pop Symphony") → warm sweeping
  chase patterns that crest with the choir.

Concretely, Opus authors a small **light-cue schedule** — the same shape as the
lyric/cinematic data already in the repo:

```ts
// e.g. src/systems/lightShows/lngShow.ts
export const lngLightShow: LightCue[] = [
  { beat: 0,  pattern: 'breathe', color: '#1ad6ff', intensity: 0.4 },
  { beat: 8,  pattern: 'sweep',   color: '#7af0ff', intensity: 0.7 },
  { beat: 24, pattern: 'strobe',  color: '#ffffff', intensity: 1.0 }, // climax
]
```

The engine stays generic; Opus fills the choreography. **Eleven ships × distinct
genres = eleven hand-felt shows** instead of one reused curve.

---

## 2. Ship Designs

**Where it plugs in:** `src/blueprints/ships.json` (validated by
`src/types/ShipBlueprint.ts` — `BlueprintPart`, approved geometry types,
`attachmentPoints`, `Lod2Data`).

Ships are already **fully data-driven**: a silhouette is a list of primitive parts
plus attachment points. This is exactly the kind of structured, constrained creative
space Opus is good at. It can propose **new vessels as valid blueprint JSON**:

- A **hospital ship**, **icebreaker**, or **sail-training tall ship** — each as
  parts + attachment points that satisfy the existing schema (so they "just load").
- **Attachment-point design with intent**: place light rigs where they read well
  on the silhouette and where the crane can plausibly reach them — a spatial-design
  judgment, not just code.
- **LOD2 feature planning**: which details survive at distance (`Lod2Feature`) so a
  ship still reads as *itself* when it's an impostor.

Because the schema is strict, Opus output is **self-validating**: if it parses
against `ShipBlueprint`, it renders. The model designs; the type system guarantees.

---

## 3. Cutaway & Cinematic Sequence Planning

**Where it plugs in:** `src/systems/cinematicSystem.ts`
(`triggerUpgradeCinematic`), driven by `sequencerSystem.schedule(beat, …)`, with
camera targets in `src/systems/cameraSystem.ts` and presets in
`src/types/CameraPreset.ts`.

The upgrade cinematic is currently **one shared beat-script** for every ship:

```
beat 0  → music + harbor show start
beat 4  → spotlight pulse
beat 12 → cut to spectator drone
beat 24 → climax
beat 32 → hide band name
```

This is precisely a **director's shot list**, and shot lists are creative work.
Opus could author **per-ship cutaway plans** — the same `schedule(beat, action)`
vocabulary, but composed for the music:

- Time the **camera cut to the drone** to land on the bass drop, not a fixed beat 12.
- Choose **shots that flatter each silhouette** — low hero angle on a tanker's hull,
  high orbit on a cruise liner's tiers, a slow push on a research vessel.
- Plan **rhythm**: when to hold, when to cut, when to go wide for the climax —
  matched to each band's genre and BPM (`bpmMap` in `music/MusicSystem.ts`).

Same engine, same primitives — but every ship gets its **own cinematic edit**.

---

## 4. Lyrics & Band Identity

**Where it plugs in:** `src/systems/music/lyrics.ts` (`LyricEntry[]`, beat-timed),
`src/systems/music/musicTracks.ts` (`BandInfo` — name + genre).

The game already has a charming fiction: each ship type is a **band** with a name
and genre (Neon Freight Crew, Iron Ore Orchestra, The Saltwater Crew…). Opus is a
natural fit to **deepen and extend this world**:

- Write **beat-synced lyrics** (`{ time, text }`) in each band's voice and genre —
  a sea shanty reads nothing like cryogenic techno.
- Invent **new bands** for new ships (§2), each with a coherent name, genre, and
  lyrical tone, so a new vessel arrives with a *whole identity*, not just geometry.
- Maintain **tonal consistency** across the roster as it grows — a creative-director
  role the codebase has no other home for.

---

## 5. Harbor Events & Mission Narrative

**Where it plugs in:** `src/systems/harborEventSystem.ts`, `eventSystem/`,
`commsSystem.ts`, `dynamicEventSystem.ts`, and the storm-rescue flow
(`StormSystem.ts`, `DistressedShip.tsx`, `MissionHUD.tsx`).

Beyond the spectacle, Opus can write the **texture of a living harbor**:

- **Radio comms / distress chatter** for `commsSystem.ts` — flavor lines that make
  a whale migration, ship fire, or navy visit feel authored rather than triggered.
- **New mission scenarios** as data + a short beat plan, reusing the storm-rescue
  scaffolding (objective, timer, failure conditions, reward).
- **Event copy and notifications** (`hud/DynamicEventNotifier.tsx`) that carry a
  consistent salty, neon-noir voice.

---

## 6. The Through-Line

What ties these together: HarborGlow's best systems are **content-shaped slots**
backed by **strict types and a beat clock**. That is the ideal interface for a
creative model —

- **Constrained** enough that output is valid by construction (`ShipBlueprint`,
  `LyricEntry`, `LightCue`, `schedule(beat, …)`).
- **Expressive** enough that taste matters — *which* color, *which* shot, *which*
  word on *which* beat.

So "Cloud Opus" doesn't have to mean cloud infrastructure. The most valuable thing
an Opus model brings to this game is **authorship**: it can fill every creative slot
the engine already exposes — light shows, ships, cutaways, bands, lyrics, events —
and keep all eleven-plus ships feeling hand-crafted as the roster grows.

The engineers built the instrument. Opus can help play it.

---

*Light up the night, one ship at a time.* 🌊✨
