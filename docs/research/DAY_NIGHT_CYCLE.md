# Day/Night Cycle Research - HarborGlow Bay
## Real SF Bay Area Marine Layer & Sun Color Temperature

---

## 1. San Francisco Bay Marine Layer Patterns

### Real Meteorological Behavior
The marine layer is a unique meteorological phenomenon affecting San Francisco Bay Area ports:

| Time | Marine Layer State | Cause |
|------|-------------------|-------|
| **Night (10pm-6am)** | Thickest fog | Radiational cooling, temperature inversion |
| **Pre-Dawn (4am-6am)** | Maximum density | Coolest air temperatures, ground moisture |
| **Sunrise (6am-7am)** | Beginning to lift | Solar heating starts breaking inversion |
| **Mid-Morning (8am-10am)** | Rapid burn-off | Surface heating, turbulent mixing |
| **Midday (11am-3pm)** | Clearest | Strongest heating, broken inversion |
| **Golden Hour (5pm-7pm)** | Return begins | Cooling starts, inversion rebuilds |
| **Evening (7pm-10pm)** | Rolling back in | Cold air drainage from Pacific |

### Seasonal Variation (SF Bay Specific)
- **Winter (Dec/Jan):** Maximum fog occurrence (15%+ frequency)
- **Summer (Jun/Jul):** Minimum fog (near 0% at inland stations)
- **"May Gray" / "June Gloom":** Persistent marine layer in early summer
- **Outer Coast vs. Inland:** 10km difference = completely different fog regimes

### Scientific Source
*"At all three locations in the San Francisco Bay area (San Francisco, Alameda, and Moffet Field), fog occurrences are near 0% during summer months and reach their maxima in December and January. The complex topography in the San Francisco Bay area most likely contributes to the high winter fog maxima."*
— UC San Diego Scripps Institution of Oceanography, 1995

---

## 2. Sun Color Temperature Throughout Day

### Measured Kelvin Values

| Time | Color Temperature | Visual Character |
|------|------------------|------------------|
| **Pre-Dawn** | 1000-2000K | Deep orange-red |
| **Sunrise** | 1850-2000K | Warm orange, long shadows |
| **Golden Hour** | 2000-3000K | Warm gold, soft shadows |
| **Mid-Morning** | 3500-4400K | Warm white |
| **Midday** | 5300-5500K | Neutral white, harsh shadows |
| **Overcast** | 6400-7500K | Cool blue-white |
| **Blue Hour** | 8000-10000K | Deep blue |

### Atmospheric Effects
- **Rayleigh scattering:** Shorter blue wavelengths scatter more at midday
- **Mie scattering:** Larger particles (fog, dust) scatter warmer colors
- **Optical air mass:** Thicker atmosphere at sunrise/sunset = redder light
- **Humidity:** Higher moisture = paler sky (6500K) vs. dry air (20000K+)

### Photography Reference
- Daylight film balanced for 5500K
- Golden hour = ~3000K
- Tungsten indoor = ~3200K
- Candle flame = ~1800K

---

## 3. Moon Phases & Effects

### Bioluminescence Connection
Real ocean bioluminescence (dinoflagellates like *Lingulodinium polyedrum*) responds to:
- **Dark nights (new moon):** Maximum visibility of bioluminescence
- **Full moon:** Bioluminescence washed out by moonlight
- **Tidal effects:** Spring tides (full/new moon) = more mixing = more bioluminescence

### Implementation Notes
- Moon phase affects tide height (+/- 10-15%)
- Darker nights = more visible glowing effects
- Full moon = silver/blue night lighting

---

## 4. Wildlife Behavior by Time

### Real California Marine Wildlife Patterns

| Time | Wildlife Activity |
|------|-------------------|
| **Dawn (6am)** | Whale breaching peak, dolphin pods feeding |
| **Morning** | Sea lions haul out, birds active |
| **Midday** | Birds soar on thermals, sharks patrol deeper |
| **Sunset** | Whale songs peak, plankton rises |
| **Night** | Bioluminescent blooms, night-feeding fish |

### Game Integration
- Trigger whale migration events at dawn
- Sea lion haul-outs most active mid-morning
- Plankton blooms peak at night

---

## 5. Port Operations by Time

### Real Container Terminal Patterns
- **6am-10am:** Peak truck traffic (delivery window)
- **11am-3pm:** Maximum crane productivity
- **5pm-7pm:** Shift change, handover period
- **Night:** Reduced staffing, automated systems

### Navy/Security Patterns
- **Sunset:** Fleet Week vessels arrive for liberty
- **Night:** Suspicious vessel monitoring increases

---

## 6. Implementation: 6 Distinct Phases

### Phase 1: Pre-Dawn (4:00-6:00)
- **Fog:** Maximum density (0.035-0.05)
- **Sun:** Below horizon, sky deep blue-purple
- **Color temp:** 1000-2000K
- **Wildlife:** Whales beginning to breach
- **Gameplay:** Quiet, mysterious atmosphere

### Phase 2: Sunrise (6:00-8:00)
- **Fog:** Beginning to lift (0.025-0.035)
- **Sun:** Low orange disc, long shadows
- **Color temp:** 1850-3000K
- **Wildlife:** Peak whale activity, dolphin pods
- **Gameplay:** Dramatic lighting, fog rays

### Phase 3: Mid-Morning (8:00-11:00)
- **Fog:** Rapidly burning off (0.015-0.025)
- **Sun:** Rising, warmer tones
- **Color temp:** 3500-4400K
- **Wildlife:** Sea lions haul out, birds active
- **Gameplay:** Clear operations visibility

### Phase 4: Midday (11:00-16:00)
- **Fog:** Minimum (0.005-0.015)
- **Sun:** High overhead, harsh shadows
- **Color temp:** 5300-5500K
- **Wildlife:** Heat haze, sharks in deep water
- **Gameplay:** Maximum visibility, heat shimmer

### Phase 5: Golden Hour (16:00-19:00)
- **Fog:** Beginning to return (0.02-0.03)
- **Sun:** Low golden light, long shadows
- **Color temp:** 3000-2000K (shifting)
- **Wildlife:** Navy vessels arrive, whale songs
- **Gameplay:** Most cinematic views, silhouettes

### Phase 6: Night (19:00-4:00)
- **Fog:** Thickening (0.03-0.045)
- **Sun:** Moonlit, star visibility
- **Color temp:** 8000-10000K (moonlight)
- **Wildlife:** Bioluminescence peaks
- **Gameplay:** Neon lights pop, underwater glow

---

## 7. Technical Implementation

### Accelerated Time
- **Default:** 1 real minute = 20 game minutes
- **Full cycle:** 72 real minutes per game day
- **Configurable:** Leva slider 1x to 60x

### Smooth Transitions
- Interpolate between phase values
- Use smoothstep for natural easing
- Per-frame updates for sun position

### Fog Density Curve
```
fogDensity = baseFog + marineLayer * timeFactor
night/dawn: 0.045 (thick)
midday: 0.015 (thin)
golden hour: 0.025 (moderate)
```

### Color Temperature Interpolation
- Convert Kelvin to RGB using standard algorithms
- Interpolate between phase color targets
- Apply to directional light and ambient

---

## Sources

1. **UC San Diego Scripps** - "Variability of Marine Fog Along the California Coast" (1995)
2. **NOAA JetStream** - Marine Layer Educational Resource
3. **Gigahertz-Optik** - Color Temperature Measurement Standards
4. **Lee Filters** - Colour Temperature Calculator
5. **JCLGL LED** - Sunlight Color Temperature by Time of Day

---

*Research compiled for HarborGlow day/night cycle implementation.*
