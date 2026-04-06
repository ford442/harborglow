# Moon Phase System - HarborGlow Bay

Realistic lunar cycle simulation with visual and gameplay effects tied to 8 distinct moon phases.

## Overview

The moon system simulates a complete 29.53-day lunar cycle with accurate phase transitions, tide effects, and visual lighting changes. Each phase offers unique gameplay opportunities and atmospheric conditions.

## The 8 Moon Phases

| Phase | Icon | Illumination | Key Effects |
|-------|------|--------------|-------------|
| **New Moon** | 🌑 | 0% | Max bioluminescence, spring high tides, dark skies |
| **Waxing Crescent** | 🌒 | 25% | Strong plankton glow, moderate tides |
| **First Quarter** | 🌓 | 50% | Neap tides, balanced conditions |
| **Waxing Gibbous** | 🌔 | 75% | Bright nights, rising tides, active wildlife |
| **Full Moon** | 🌕 | 100% | Max wildlife visibility, spring tides, god rays |
| **Waning Gibbous** | 🌖 | 75% | Diminishing light, still excellent visibility |
| **Last Quarter** | 🌗 | 50% | Neap tides, returning darkness |
| **Waning Crescent** | 🌘 | 25% | Strong bioluminescence return |

## Visual Effects by Phase

### New Moon
- **Water**: Maximum bioluminescent bloom response
- **Sky**: Pitch black, stars highly visible
- **Fog**: Thicker without moonlight to burn it off
- **Ship Lights**: Appear dramatically brighter
- **Underwater**: Maximum plankton glow, limited visibility

### Full Moon
- **Water**: Cool silver reflections, clear visibility
- **Sky**: Bright blue-silver illumination
- **God Rays**: Maximum moonlight shafts underwater
- **Wildlife**: Whales and dolphins more visible
- **Ship Lights**: Less dramatic against bright background

### Quarter Phases (First/Last)
- **Water**: Balanced visibility
- **Tides**: Neap tides (lowest tidal range)
- **Atmosphere**: Neutral lighting conditions

## Gameplay Effects

### Tide System
- **Spring Tides** (New/Full Moon): ±0.5m water level change
- **Neap Tides** (Quarter phases): ±0.2m water level change
- Affects ship clearance and dock accessibility

### Bioluminescence
- **New Moon**: 1.5x intensity - spectacular plankton displays
- **Full Moon**: 0.4x intensity - barely visible
- Affects underwater camera aesthetics and visibility

### Wildlife Activity
- **Full Moon**: 1.0x (maximum visibility)
- **New Moon**: 0.8x (reduced visibility)
- Affects whale/dolphin spawn rates and breaching behavior

### Ship Light Shows
- **Dark Phases** (New/Crescent): Lights appear 40% brighter
- **Bright Phases** (Full/Gibbous): Lights compete with moonlight

## Technical Implementation

### Moon Position Calculation
```typescript
// Moon rises ~50 minutes later each day
const moonOffset = (day * 50 / 60) % 24
const moonHour = (hour + 24 - moonOffset) % 24
```

### Phase Determination
```typescript
const phaseIndex = Math.floor((lunarDay % 29.53) / (29.53 / 8))
```

### Tide Height Formula
```typescript
// Spring tides at new (0) and full (14.75) moon
const tideHeight = Math.sin((lunarDay / 29.53) * Math.PI * 2)
```

## Leva Controls

Access via **Moon System** folder in debug panel:

- **Moon Phase**: Override to any of 8 phases
- **Moon Brightness**: 0-2x multiplier
- **Tide Strength**: 0-3x multiplier (for dramatic effects)
- **Jump to Next Phase**: Quick cycle through phases
- **Clear Override**: Return to natural cycle

## Operator Status Panel

The Moon Phase indicator appears in the Operator Status Panel showing:
- Current phase icon and name
- Tide level bar (high/low indicator)
- Active effects badges (Bio+, Wildlife+, Neap)

## Camera-Specific Effects

### Multiview Mode
- All camera feeds show consistent moon lighting
- Underwater cam shows bioluminescence changes
- Drone cam captures moon reflections on water

### Immersive Cab Mode
- First-person view from crane cab
- Moonlight affects cab interior shadows
- Tide changes visible on water level

### Underwater Camera
- God ray intensity varies by moon phase
- Bioluminescence blooms during dark phases
- Visibility changes with moonlight penetration

## Testing Checklist

### Phase Cycling
- [ ] Jump to each of 8 phases
- [ ] Verify icon updates in Status Panel
- [ ] Check tide bar changes
- [ ] Confirm effect badges appear

### Visual Verification
- [ ] New Moon: Very dark, bright ship lights
- [ ] Full Moon: Bright silver lighting, clear visibility
- [ ] Tide animation smooth between phases
- [ ] Water level changes ±0.5m

### Gameplay Effects
- [ ] Bioluminescence visible on dark phases
- [ ] Wildlife more active on Full Moon
- [ ] Ship lights dominate on New Moon
- [ ] God rays visible underwater on bright phases

### Performance
- [ ] Frame rate stable during phase transitions
- [ ] No memory leaks from subscriptions
- [ ] Smooth tide interpolation (60fps)

## Cinematic Opportunities

Each phase offers unique screenshot opportunities:

- **New Moon**: Bioluminescent wake trails, dark silhouettes
- **Waxing Crescent**: Growing moon over port cranes
- **First Quarter**: Balanced exposure, dramatic shadows
- **Waxing Gibbous**: Almost-full moon with blue glow
- **Full Moon**: Maximum detail, silver water reflections
- **Waning Gibbous**: Moon setting over horizon
- **Last Quarter**: Side-lit cranes, long shadows
- **Waning Crescent**: Fading moon, returning stars

## Future Enhancements

- Lunar eclipses (rare events with red moon lighting)
- Super moons (closer orbit = larger moon visual)
- Moon halos (ice crystal atmospheric effects)
- Earthshine (dark side glow on crescent phases)
