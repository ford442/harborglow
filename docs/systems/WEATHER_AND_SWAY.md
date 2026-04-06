# Weather & Sway System

Realistic crane sway physics integrated with dynamic weather conditions for HarborGlow Bay.

## Overview

The Weather & Sway system creates a dynamic, challenging crane operation experience where environmental conditions meaningfully affect gameplay. Wind gusts feel natural and unpredictable, while skilled players can learn to anticipate and counter them.

## Weather Types

| Weather | Icon | Sway Effect | Gust Frequency | Visual Difficulty |
|---------|------|-------------|----------------|-------------------|
| **Clear** | ✨ | Baseline (1.0x) | Rare (2/min) | None |
| **Golden Hour** | 🌅 | Slight reduction (0.9x) | Rare (2/min) | Minimal |
| **Fog** | 🌫️ | Increased (1.2x) | Moderate (3/min) | High (40%) |
| **Rain** | 🌧️ | Moderate increase (1.4x) | Frequent (5/min) | Medium (25%) |
| **Storm** | ⛈️ | High increase (2.0x) | Very frequent (12/min) | Very High (50%) |

## Wind Gust System

### Natural Gust Patterns

Gusts use noise-based generation for organic, non-random feeling:

```
Attack Phase (0-30%): Smooth ramp up to peak
Sustain Phase (30-90%): Natural variation with noise
Release Phase (90-100%): Smooth fade out
```

### Gust Characteristics

- **Duration**: 0.8s to 4.0s (configurable)
- **Strength**: Varies by weather type (0.15 to 0.8 intensity)
- **Direction**: Slight variation from base wind direction
- **Timing**: Noise-based intervals (not pure random)

### Gust Feedback

When a strong gust hits:
- 💨 **UI Warning**: "WIND GUST! HOLD POSITION!" flashes in red
- 📊 **Stability Bar**: Pulses red during gust
- 🔊 **Audio**: Rising whoosh sound (scaling with intensity)
- 📷 **Hook Cam**: Visible shake and motion blur
- 🎮 **Gameplay**: Increased sway, harder to maintain position

## Crane Physics Model

### Pendulum Physics

The crane hook/spreader behaves as a damped pendulum:

```
θ'' = -(g/L)sin(θ) - damping·θ' + external_torque
```

Where:
- `θ` = angle from vertical
- `g` = gravity (9.81 m/s²)
- `L` = cable length (varies with tension)
- `damping` = air resistance + friction
- `external_torque` = wind + ship motion + trolley inertia

### Environmental Forces

1. **Wind Force**: Base wind + gusts (directional)
2. **Ship Motion**: Rocking based on tide and waves
3. **Trolley Inertia**: Momentum from crane movements
4. **Load Weight**: Heavier loads = more inertia

## Skill Mechanics

### Counter-Steering (Player Damping)

Skilled players can reduce sway by:
- Moving trolley in **opposite direction** of sway
- Timing movements with sway oscillation
- Using small, controlled inputs during gusts

**Reward**: 
- 5% stability bonus per successful counter
- "Sway Master!" combo for sustained skill
- Better Installation Performance Rating

### Sway Penalties

| Sway Level | Installation Speed | Can Install? | Rating Impact |
|------------|-------------------|--------------|---------------|
| Stable (<10%) | +20% bonus | Yes | S-rank possible |
| Moderate (10-30%) | Normal | Yes | A-rank max |
| High (30-50%) | -15% slower | Yes | B-rank max |
| Dangerous (50-70%) | -40% slower | Yes | C-rank max |
| Critical (>70%) | -70% slower | Risky | D-rank |
| Extreme (>80%) | N/A | No | Fail |

## Visual Feedback

### Cable/Rope Tension

| Tension | Color | Meaning |
|---------|-------|---------|
| <50% | 🟢 Green | Safe, stable |
| 50-70% | 🟡 Yellow | Caution, moderate load |
| 70-85% | 🟠 Orange | Danger, high stress |
| >85% | 🔴 Red | Critical, near limit |

### Camera Effects

- **Rain/Fog**: Droplets on lens, reduced visibility
- **High Sway**: Motion blur on hook-cam
- **Gusts**: Sudden camera shake with recovery
- **Storm**: All effects combined with lightning flashes

## Leva Controls

### Sway System Folder

- **Base Damping**: 0.5-2.0 (how fast sway settles)
- **Load Weight Mult**: 0.5-3.0 (container mass effect)
- **Gust Multiplier**: 0-3.0 (gust strength scaling)
- **Gust Frequency**: 0.1-3.0 (gusts per minute multiplier)
- **Gust Duration Min/Max**: 0.2-8.0s (gust length range)
- **Show Debug**: Visualizes force vectors

### Weather Folder

- **Force Weather**: Override to any weather type
- **Clear Weather Override**: Return to natural cycle

## Testing Steps

### 1. Baseline Testing (Clear Weather)
```
1. Set weather to "Clear"
2. Spawn a container ship
3. Move trolley back and forth
4. Observe: Light, predictable sway
5. Practice: Counter-steering to dampen
```

### 2. Gust Testing
```
1. Set weather to "Storm"
2. Increase Gust Frequency to 3.0
3. Watch for: Frequent gust warnings
4. Practice: Holding position during gusts
5. Try: Counter-steering into gusts
```

### 3. Skill Testing
```
1. Set Sway System → Base Damping to 0.8
2. Set weather to "Rain"
3. Attempt: Install upgrades
4. Observe: Slower progress due to sway
5. Master: Perfect counter-steering for S-rank
```

### 4. Extreme Testing
```
1. Set weather to "Storm"
2. Set Gust Multiplier to 3.0
3. Attempt: Installation during strong gust
4. Verify: Cannot install when sway >80%
5. Observe: Red warning flash on screen
```

## Integration Points

### With Weather System
- Weather type → Gust profile mapping
- Wind speed → Base sway force
- Wind direction → Gust direction

### With Installation System
- Sway magnitude → Installation speed
- Tension level → Safety limits
- Gust warning → Pause install option

### With Music System
- Calm weather → Normal BPM (128)
- Storm/gusts → Increased BPM (140+)
- Gust warning → Audio cue

### With Camera System
- Sway level → Hook-cam shake
- Weather → Particle effects (rain, spray)
- Gusts → Temporary blur effect

## Performance Notes

- Physics capped at 20ms delta time for stability
- Noise functions use simple math (no heavy libraries)
- Gust history limited to 10 entries
- Debug visualization disabled by default
- All calculations use object pooling (no GC pressure)

## Future Enhancements

- [ ] Wind audio with spatial positioning
- [ ] Lightning strikes affecting crane electronics
- [ ] Ice buildup on cables in arctic mode
- [ ] Dust storms reducing visibility
- [ ] Rainbow after rain clears

## Troubleshooting

**Sway feels too chaotic:**
- Increase Base Damping (1.2-1.5)
- Reduce Gust Multiplier (0.5-0.8)
- Check Load Weight isn't excessive

**Gusts not noticeable:**
- Set weather to Storm
- Increase Gust Frequency
- Enable Show Debug to see forces

**Installation too hard:**
- Clear weather recommended for beginners
- Practice counter-steering in Clear first
- Use lower Load Weight Multiplier
