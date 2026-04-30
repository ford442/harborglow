# HarborGlow Audio Assets — Generation Guide

## Tool: MiniMax Audio Music 2.5

Use the following prompts to generate the intro title anthem for HarborGlow.

---

## Track 1: `clear_harbor_glow_intro.mp3` — Full Title Anthem

**Purpose:** Plays on the Main Menu and loops. High-energy 140 BPM hands-up euro-trance with HarborGlow-themed vocals.

### Style / Music Description (paste into MiniMax style field)

```
140 BPM, C major, hands-up trance, euro-trance. Uplifting, euphoric.
Punchy Roland TR-909 kick drum, tight layered claps, big reverberant tom fills.
Massive detuned supersaw lead (7-9 voices), white-noise risers, filter sweeps,
warm pluck arps (1/16th note pattern, sidechained).

Verse texture: subtle acoustic guitar strums (stereo spread), warm analog-style
pads (Juno-style slow attack), filtered drums.

Vocal production: heavily processed with stereo delay (1/8th dotted), massive
plate reverb (4s tail), subtle auto-tune for hard-trance precision.

Drop structure: explosive hard-dance energy, nostalgic 2000s festival trance
vibe, high-fidelity mix. Sidechain compression pumping on every quarter note.
Pulsedriver-era hard trance influence. Call-and-response vocal hook.

Mood: neon harbor, digital sunrise, crane lights on water, awakening.
```

### Lyrics (paste into MiniMax lyrics field)

```
[Atmospheric Intro]
[Filtered supersaws and rising drums]
Harborglow…
Awakening…
(whispered, reverb tail 4s)

[Verse 1]
[Clean folk-trance acoustic feel, warm pads]
I can see Harborglow now, the static's gone
I can see all the barriers in my way
Gone are the dark clouds that had me blind
It's gonna be a bright, bright Harborglow day
Bright, bright Harborglow day

[Verse 2]
[Beat picks up, pluck arps enter]
Oh yes I can make it now, the lag is gone
All of the bad loops have disappeared
Here is that waveform I've been praying for
It's gonna be a bright, bright Harborglow day

[Pre-Chorus Build]
[Snare rolls accelerate, white noise risers, filter opens]
Look all around — there's nothing but neon skies
Look dead ahead — there's nothing but glowing tides

[Heavy Trance Drop]
[Massive supersaw hook, pumping sidechain bass]
It's gonna be a bright bright Harborglow day!
(Yeah! Everybody now!)
Bright bright — bright bright — whoa-oh!
Harborglow day!
It's gonna be a bright bright Harborglow day
It's gonna be a bright bright Harborglow day
It's gonna be a bright bright Harborglow day
Bright bright — bright bright — whoa!
Harborglow day!

[Bridge / Breakdown]
[Half-time beat, emotional glowing pads, massive reverb]
In the harbor's glow we come alive
Shaders pulse while the beat collides
From the code we rise, we rise into light
Harborglow calling — take flight tonight

[Final Massive Build]
[Maximum energy risers]
I can see clearly now…
It's gonna be a bright bright Harborglow day
Bright sunshiny… neon day!

[Final Drop]
[Explosive energy]
It's gonna be a bright bright Harborglow day!
(Yeah! Everybody now!)
Bright bright — bright bright — whoa-oh!
Harborglow day!

[Outro]
[Fading beats, echoing vocals]
Harborglow…
Forever glow…
(Bright bright… bright bright…)
Harborglow day…
(reverb tail to silence)
```

### Export Settings
- **Format:** MP3, 44.1 kHz stereo, 320 kbps (or highest available)
- **Length:** Target 60–90 seconds (MiniMax typically generates ~60s; extend via loop)
- **Tempo:** 140 BPM (classic hands-up sweet spot)
- **Key:** C major

---

## Track 2: `clear_harbor_glow_loop.mp3` — Instrumental Loading Loop

**Purpose:** Plays during the Loading screen. Stripped of vocals, high-energy instrumental loop.

### Style / Music Description (paste into MiniMax style field)

```
140 BPM, C major, instrumental hands-up trance, euro-trance. Uplifting, euphoric.
Punchy Roland TR-909 kick drum, tight layered claps, rolling closed hi-hats,
big reverberant tom fills. Massive detuned supersaw lead (7-9 voices),
white-noise risers, filter sweeps, warm pluck arps (1/16th note pattern,
sidechained). No vocals. Explosive hard-dance energy, nostalgic 2000s
festival trance vibe, high-fidelity mix. Sidechain compression pumping on
every quarter note. Systems-booting energy.
```

### Lyrics (paste into MiniMax lyrics field)

```
[Intro]
(Instrumental build-up with sweeping pads and rising FX)

[Build]
(Snare roll accelerating)
(Pitch risers)
(Filter slowly opening on supersaw)

[Drop]
(Instrumental Supersaw Anthem Melody)
(Heavy off-beat bassline bouncing)
(Massive stadium trance lead)
(Explosive hard-dance energy)

[Breakdown — minimal]
(Sweeping pads only)

[Drop]
(Full instrumental energy)
```

### Export Settings
- **Format:** MP3, 44.1 kHz stereo, 320 kbps
- **Length:** Target 30–45 seconds, designed to loop seamlessly
- **Tempo:** 140 BPM
- **Key:** C major

---

## Post-Generation Checklist

1. **Verify tempo** is exactly 140 BPM using a DAW or BPM detector.
2. **Normalize** both tracks to similar perceived loudness (LUFS ~-10 to -8).
3. **Check loop points** for `clear_harbor_glow_loop.mp3` — the start and end should align on a bar boundary for gapless looping.
4. **Place files** in this directory (`public/audio/`).
5. **Run `npm run build`** to ensure the files are copied to `dist/audio/`.

---

## Fallback Behavior

If these assets are missing, `IntroMusicSystem` will automatically fall back to a procedural Tone.js synth approximation. The game will function, but the audio quality will be significantly less polished.
