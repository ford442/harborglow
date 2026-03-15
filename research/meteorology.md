# Marine Meteorology Research for HarborGlow

## A Comprehensive Guide to Weather Physics at Sea

---

## 1. The Beaufort Wind Scale: Nature's Intensity Dial

### Overview
The Beaufort Wind Scale is an empirical measure that relates wind speed to observed conditions at sea. Developed by Admiral Sir Francis Beaufort in 1805, it remains the standard for maritime wind description. The scale extends from Force 0 (Calm) to Force 12 (Hurricane), with wind speeds measured at 10 meters above the surface, averaged over 10 minutes.

### Complete Beaufort Scale (Forces 0-12)

| Force | Description | Wind Speed (knots) | Wind Speed (mph) | Wind Speed (km/h) | Probable Wave Height (m) | Max Wave Height (m) | Sea State |
|-------|-------------|-------------------|------------------|-------------------|-------------------------|---------------------|-----------|
| 0 | Calm | <1 | <1 | <1 | 0 | 0 | 0 |
| 1 | Light Air | 1-3 | 1-3 | 1-5 | 0.1 | 0.1 | 1 |
| 2 | Light Breeze | 4-6 | 4-7 | 6-11 | 0.2 | 0.3 | 2 |
| 3 | Gentle Breeze | 7-10 | 8-12 | 12-19 | 0.6 | 1.0 | 3 |
| 4 | Moderate Breeze | 11-16 | 13-18 | 20-28 | 1.0 | 1.5 | 3-4 |
| 5 | Fresh Breeze | 17-21 | 19-24 | 29-38 | 2.0 | 2.5 | 4 |
| 6 | Strong Breeze | 22-27 | 25-31 | 38-49 | 3.0 | 4.0 | 5 |
| 7 | Near Gale | 28-33 | 32-38 | 50-61 | 4.0 | 5.5 | 5-6 |
| 8 | Gale | 34-40 | 39-46 | 62-74 | 5.5 | 7.5 | 6-7 |
| 9 | Strong Gale | 41-47 | 47-54 | 75-88 | 7.0 | 10.0 | 7 |
| 10 | Storm | 48-55 | 55-63 | 89-102 | 9.0 | 12.5 | 8 |
| 11 | Violent Storm | 56-63 | 64-72 | 103-117 | 11.5 | 16.0 | 8 |
| 12 | Hurricane | >63 | >73 | >118 | >14 | -- | 9 |

### Sea State Descriptions

- **Force 0**: Sea like a mirror, smoke rises vertically
- **Force 1**: Scaly ripples, no foam crests
- **Force 2**: Small wavelets, crests glassy, no breaking
- **Force 3**: Large wavelets, crests begin to break, scattered whitecaps
- **Force 4**: Small waves becoming longer, numerous whitecaps
- **Force 5**: Moderate waves, pronounced long form, many whitecaps, some spray
- **Force 6**: Large waves, whitecaps everywhere, extensive foam, more spray
- **Force 7**: Sea heaps up, white foam blown in streaks
- **Force 8**: Moderately high waves, edges of crests break into spindrift
- **Force 9**: High waves, dense foam, sea begins to roll, spray affects visibility
- **Force 10**: Very high waves with overhanging crests, sea surface largely white
- **Force 11**: Exceptionally high waves, medium ships lost to view behind waves
- **Force 12**: Air filled with foam and spray, sea completely white, very poor visibility

### Physics for Game Developers
- **Wave Formation**: Waves need both **fetch** (distance wind blows over water) and **duration** (time wind blows) to reach full height
- **Visual Transition**: The transition from Force 3 to Force 4 is dramatic—this is where whitecaps first appear
- **Nonlinear Progression**: Wave height increases exponentially, not linearly, with wind speed
- **Fetch Effects**: Near land, waves are steeper and smaller than open ocean values

---

## 2. Fog Science: The Ghosts of the Sea

### Types of Marine Fog

#### Radiation Fog (Land-Fog that Creeps Seaward)
- **Formation**: Ground loses heat through radiation on clear, calm nights
- **Requirements**: 
  - Clear skies for maximum radiational cooling
  - Light winds (ideally under 5 knots)
  - Moist, shallow air mass near surface
- **Behavior**: Forms after midnight, densest at sunrise, "burns off" as sun heats surface
- **Restriction**: Cannot form over open water (water cools little from nighttime radiation)
- **Transition**: Sea breezes can carry radiation fog over coastal waters in afternoon

#### Advection Fog (The Coastal Haunter)
- **Formation**: Warm, moist air moves horizontally over colder surface
- **Marine Name**: Sea fog when forming over water
- **Key Mechanism**: Horizontal wind movement (advection) brings warm humid air into contact with cold surfaces
- **Duration**: Can persist for days if wind continues supplying moist air
- **Depth**: Deepens with wind speed up to ~15 knots; stronger winds lift fog into stratus clouds
- **Seasonality**: Most common in spring when sea surface temperatures lag behind warming air

#### Sea Smoke / Steam Fog (Arctic Breath)
- **Formation**: Cold air moves over significantly warmer water
- **Appearance**: Rising wisps like steam over a hot bath
- **Physics**: Warm water evaporates into cold air, which immediately saturates and condenses
- **Conditions**: Air temperature well below water temperature
- **Common Locations**: Polar regions, Great Lakes in late autumn
- **Height**: Very low-level fog, typically affecting surface visibility only

#### Frontal Fog (The Storm Companion)
- **Formation**: Warm, moist air lifted over cold fronts
- **Characteristics**: Dense, long-lasting, often mixed with precipitation
- **Types**:
  - Pre-frontal (warm-front) fog
  - Post-frontal (cold-front) fog
  - Front-passage fog

### Physics for Game Developers
- **Visibility Thresholds**: 
  - Light fog: 1-5 km visibility
  - Moderate fog: 200m - 1 km
  - Dense fog: <200m
- **Color Shifts**: Fog near land takes on yellow/gray tints from aerosols; ocean fog is often whiter
- **Vertical Gradients**: Fog is rarely uniform—thickness varies with height
- **Movement**: Fog doesn't just appear; it rolls in like a slow-moving wall

### Weather Transition Logic
```
Clear Evening → Radiational Cooling → Fog Formation (dawn) → Solar Heating → Dissipation
Warm Air Mass + Cold Water → Advection Fog (can persist days)
Cold Outbreak + Warm Water → Sea Smoke (immediate, localized)
```

---

## 3. Lightning at Sea: The Sky's Spear

### Formation Mechanism
- **Charge Separation**: Storm clouds become negatively charged at base, positive at top
- **Potential Buildup**: Difference between cloud and ground (or sea surface) creates voltage field
- **Stepped Leader**: Negative charge migrates downward in ionized channel
- **Upward Streamer**: Positive charge rises from tall objects (masts, towers)
- **Main Discharge**: Connection creates 100,000+ ampere current flow

### Maritime Strike Statistics
- Ships are prime targets: tallest conductor on vast, flat surface
- Strike frequency increases with:
  - Mast height
  - Metal content
  - Isolation in open water
- Historical losses: Numerous ships lost to lightning-induced fires and electronics failure

### Detection Systems

#### TALOS SFD-1000-N2K (Marine Lightning Detector)
- **Range**: Detects strikes up to 25 nautical miles
- **Integration**: NMEA 2000 compatible, displays on vessel MFD screens
- **Alerts**: 3-tier distance warnings (25nm, 10nm, 5nm)
- **Detection**: Both cloud-to-cloud and cloud-to-ground strikes

#### General Detection Technologies
- **RF Sensors**: Detect electromagnetic pulses from lightning
- **Optical Sensors**: Detect lightning flash intensity
- **Combined Systems**: Triangulate strikes for distance and bearing

### Protection Systems

#### Conventional Protection
| Component | Function | Location |
|-----------|----------|----------|
| Air Terminals (Lightning Rods) | Intercept strikes | Highest points, masts |
| Down Conductors | Channel current | Throughout vessel structure |
| Grounding System | Dissipate to water | Hull connection points |
| Surge Protectors | Protect electronics | Equipment connections |
| Bonding Network | Equipotential connection | All metallic structures |

#### Advanced Systems (DDCE)
- **Technology**: Electromagnetic Charge Compensation Device
- **Mechanism**: Attracts excess negative charges, compensates and drains to ground
- **Effect**: Eliminates upward streamers, preventing lightning channel formation
- **Result**: Prevents strikes in protected area
- **Note**: No system provides 100% protection

### Physics for Game Developers
- **Strike Probability**: Tallest object in render distance has highest strike chance
- **EMP Effects**: Nearby strikes (even misses) can temporarily disrupt electronics
- **Lightning Lure**: Metal ships attract strikes more than wooden vessels
- **The Flash**: Ocean lightning reflects off water surface, creating dramatic doubled effects

### ⚡ "I Didn't Know That" Moment #1
A lightning strike on a ship doesn't just cause damage at the impact point. The electromagnetic pulse from a nearby strike can induce voltages in wiring hundreds of meters away—meaning a strike hitting the water nearby can still fry your navigation systems.

---

## 4. Waterspouts: Tornadoes That Drink the Sea

### Two Distinct Types

#### Fair-Weather Waterspouts (The "Gentle" Giants)
- **Occurrence**: Late spring to early fall, mornings and late afternoons
- **Conditions**: 
  - Fair, relatively calm weather
  - Warm, moist, unstable air
  - Growing cumulus clouds overhead
  - Little wind
- **Formation**: Develops from water surface upward
- **Duration**: 10-20 minutes (rarely up to 1 hour)
- **Wind Speeds**: Typically <45 knots
- **Diameter**: 3-100 meters
- **Movement**: Very little; almost stationary
- **Danger**: Moderate—can damage small craft but rarely life-threatening

**Five-Stage Life Cycle:**
1. **Dark Spot**: Disk formation on water surface
2. **Spiral Pattern**: Visible rotation on surface
3. **Spray Ring**: Circular wall of spray rises
4. **Visible Funnel**: Condensation funnel descends to meet spray
5. **Decay**: Cool rain disrupts warm air supply, spout dissipates

#### Tornadic Waterspouts (The Sea's Fury)
- **Origin**: Either form over water or tornado moves from land to water
- **Association**: Severe thunderstorms, supercells
- **Formation**: Develops downward from storm base (like land tornadoes)
- **Wind Speeds**: Can exceed 200 knots (EF2+ equivalent)
- **Duration**: Up to 30 minutes
- **Diameter**: Up to 100+ meters
- **Accompanied by**: Hail, lightning, large seas
- **Danger**: Extreme—can damage large ships, cause fatalities

### Global Hotspots
- **Florida Keys**: 100-500 per year (capital of waterspouts)
- **Caribbean**: Frequent during summer
- **Great Lakes**: Common in summer
- **Mediterranean**: Increasing threat to offshore wind farms

### Physics for Game Developers
- **Visual Distinction**: Fair-weather spouts are thinner, more translucent; tornadic are dense, dark
- **The Deception**: Fair-weather waterspouts appear near maturity—by the time visible, they're at peak strength
- **No Water Suction**: Waterspouts don't suck water up; the visible column is condensation and spray
- **Dissipation Pattern**: Fair-weather spouts die rapidly when hitting land; tornadic spouts can continue inland

### Navigation Rule
If a waterspout approaches: **Move at 90 degrees to its apparent path**. Never attempt to outrun—move perpendicular to the direction of travel.

### ⚡ "I Didn't Know That" Moment #2
Despite popular belief, waterspouts do NOT suck water up into the cloud. The visible "water column" is actually just condensed water vapor and spray—the ocean isn't being lifted hundreds of meters into the sky. The tornado is essentially a rotating cloud that happens to touch the water.

---

## 5. Extreme Waves: The Draupner Wave and Rogue Physics

### The Draupner Wave: The First Measured Monster
- **Date**: January 1, 1995
- **Location**: Draupner oil platform, North Sea (Norwegian sector)
- **Height**: 25.6 meters (84 feet) from trough to crest
- **Context**: Surrounding waves were only ~10 meters
- **Significance**: First scientifically confirmed measurement of a rogue wave
- **Measurement**: Downward-looking laser device on platform

### Rogue Wave Characteristics
- **Definition**: Wave at least 2x the significant wave height of surrounding sea state
- **Appearance**: "Appear from nowhere"—no gradual build-up visible to observers
- **Shape**: Sharper, steeper crests than normal waves; deeper troughs
- **Duration**: Brief—typically part of a wave packet lasting seconds to minutes

### The Physics: Nonlinear Schrödinger Equations

#### Linear vs Nonlinear Wave Theory
- **Linear Theory**: Waves pass through each other unchanged
- **Nonlinear Reality**: Waves interact, exchange energy, can constructively combine

#### Key Mechanisms

1. **Modulational Instability (Benjamin-Feir Instability)**
   - Uniform wave trains become unstable
   - Energy concentrates into localized regions
   - Creates "breather" solutions—periodic amplification of wave groups

2. **Crossing Sea States**
   - Two wave systems propagating at angles
   - Draupner wave likely resulted from crossing at ~120° angle
   - At large crossing angles, wave breaking no longer limits maximum height
   - Laboratory recreation confirmed 120° crossing creates rogue conditions

3. **Wave-Wave Interactions**
   - Higher-order nonlinear interactions transfer energy
   - Short intense wave groups can reach steepness up to ka = 0.3
   - Solitary wave groups travel faster than surrounding waves

### The Nonlinear Schrödinger Equation
```
i∂ψ/∂t + ∂²ψ/∂x² + β|ψ|²ψ = 0
```
Where:
- ψ = wave envelope (amplitude and phase)
- t = time
- x = spatial coordinate
- β = nonlinear coefficient

This equation describes:
- **Dispersion**: Tendency of waves to spread out
- **Self-focusing**: Nonlinear effect that concentrates energy
- **Balance**: When dispersion and self-focus balance → solitons (stable wave packets)

### Causes of Rogue Waves

| Mechanism | Requirements | Location |
|-----------|--------------|----------|
| Modulational Instability | Deep water, long fetch | Open ocean |
| Crossing Seas | Two wave systems at angle | Storm intersections, changing winds |
| Bottom Topography | Rapid depth change | Continental shelves |
| Current Interaction | Strong opposing current | Gulf Stream, Agulhas Current |
| Wind Gusts | Burst of intense wind | Anywhere |

### Physics for Game Developers
- **The Surprise Factor**: Rogue waves should appear without warning—no visual buildup
- **The Packet**: Extreme waves travel in groups of 2-6 waves, not alone
- **Shape Language**: Sharper crests, deeper troughs than normal waves
- **Breaking Behavior**: In crossing seas, waves can exceed normal breaking height
- **Energy Transfer**: Areas of calm can suddenly become violent as wave energy focuses

### ⚡ "I Didn't Know That" Moment #3
The Draupner wave wasn't just tall—it was the first proof that the "impossible" waves sailors had reported for centuries were real. Before 1995, scientists dismissed rogue waves as sailor exaggerations. The Draupner measurement proved waves could be 2-3x larger than statistical models predicted, forcing complete rewrites of ocean engineering standards.

### ⚡ "I Didn't Know That" Moment #4
Crossing seas at approximately 120° angles create conditions where normal wave breaking limits no longer apply. This means in a "crossing sea" scenario, waves can grow to heights that would normally be physically impossible in unidirectional seas—the ocean's own cheat code for creating monsters.

---

## 6. Tropical Cyclones: The Great Storm Engines

### Saffir-Simpson Hurricane Wind Scale

| Category | Wind Speed (knots) | Wind Speed (mph) | Wind Speed (km/h) | Storm Surge | Damage Level |
|----------|-------------------|------------------|-------------------|-------------|--------------|
| Tropical Depression | <34 | <39 | <62 | -- | Minimal |
| Tropical Storm | 34-63 | 39-73 | 63-118 | -- | Minimal |
| 1 | 64-82 | 74-95 | 119-153 | 4-5 ft | Minimal |
| 2 | 83-95 | 96-110 | 154-177 | 6-8 ft | Moderate |
| 3 | 96-112 | 111-130 | 178-209 | 9-12 ft | Extensive |
| 4 | 113-136 | 131-155 | 210-249 | 13-18 ft | Extreme |
| 5 | >136 | >155 | >249 | >18 ft | Catastrophic |

### Category Characteristics

#### Category 1 (Minimal)
- No real damage to building structures
- Damage to unanchored mobile homes, shrubbery, trees
- Some coastal road flooding, minor pier damage

#### Category 2 (Moderate)
- Some roofing material, door, and window damage
- Considerable damage to vegetation, some trees blown down
- Coastal and low-lying escape routes flood 2-4 hours before center arrival

#### Category 3 (Extensive) - Major Hurricane
- Structural damage to small residences and utility buildings
- Mobile homes destroyed
- Low-lying escape routes cut 3-5 hours before arrival
- Terrain flooded inland 8+ miles

#### Category 4 (Extreme)
- Extensive curtainwall failures, some complete roof failures
- Complete destruction of mobile homes
- Major damage to lower floors near shore
- Massive evacuation required up to 6 miles inland

#### Category 5 (Catastrophic)
- Complete roof failure on many buildings
- Some complete building failures
- Virtually all trees uprooted or snapped
- Massive evacuation required 5-10 miles inland
- Power outages lasting months

### Harbor Evacuation Protocols

#### Warning Timeframes
- **Hurricane Watch**: Conditions possible within 48 hours
- **Hurricane Warning**: Conditions expected within 36 hours
- **Storm Surge Watch**: Possible within 48 hours
- **Storm Surge Warning**: Expected within 36 hours

#### Marine Evacuation Procedures
1. **72 Hours Before**: Small craft should seek protected waters
2. **48 Hours Before**: Prepare vessels, secure loose items, fuel up
3. **36 Hours Before**: All vessels should be secured or evacuated
4. **24 Hours Before**: Complete all preparations; final evacuation orders

#### Storm Surge Considerations
- Surge arrives 3-5 hours before hurricane center
- Low-lying escape routes cut early
- Surge height depends on:
  - Storm intensity
  - Forward speed
  - Angle of approach
  - Coastal bathymetry

### Physics for Game Developers
- **The Eye**: Calm center with partial cloud cover; dramatic contrast to eyewall
- **Eyewall**: Most violent winds, heaviest precipitation
- **Wind Field**: Larger storms can be more dangerous than intense ones—rough seas extend further
- **Right Side**: The "dirty side" (right of direction of motion in Northern Hemisphere) has stronger winds and higher surge
- **Dynamic Fetch**: Area where winds generate waves traveling in same direction as storm—creates largest waves

### ⚡ "I Didn't Know That" Moment #5
A Category 3 hurricane with a large wind field can be more dangerous to mariners than a compact Category 5. The Saffir-Simpson scale only measures maximum sustained wind speed—it doesn't account for storm size. A larger storm creates a much bigger area of rough seas and requires significantly more evasive action to avoid.

---

## 7. Ice Accretion: The Silent Accumulator

### Icing Intensity Scale

| Class | Description | Icing Rate (cm/hour) | PPR Range* |
|-------|-------------|---------------------|------------|
| None | No ice accretion | 0 | <0 |
| Light | Mild accumulation | <0.7 | 0-22.4 |
| Moderate | Significant accumulation | 0.7-2.0 | 22.4-53.3 |
| Heavy | Rapid accumulation | 2.0-4.0 | 53.3-83.0 |
| Extreme | Dangerous accumulation | >4.0 | >83.0 |

*PPR = Accumulation Parameter based on wind speed, air temperature, and sea temperature

### Types of Ship Icing

#### Superstructure Icing (Freezing Spray) - 80% of Cases
- **Source**: Wave-generated sea spray from bow-wave collision
- **Temperature Threshold**: Begins at -2°C to -3°C air temperature
- **Rate Increase**: Becomes severe below -6°C
- **Peak Rate**: Maximum icing occurs around -17°C (then decreases)
- **Requirements**:
  - Air temperature below freezing point of seawater (~-1.7°C)
  - Sea surface temperature below 6°C
  - Sufficient wind/wave action to generate spray

#### Other Icing Types
| Type | Source | Seasonality |
|------|--------|-------------|
| Freezing Rain/Drizzle | Precipitation | Spring/Fall |
| Wet Snow | Precipitation | Winter |
| Supercooled Fog | Atmospheric | Fall/Winter |
| Black Frost | Arctic frost smoke | Polar regions |

### Ice Accretion Rates
- **Light**: <0.7 cm/hour
- **Moderate**: 0.7-2.0 cm/hour
- **Heavy**: 2.0-4.0 cm/hour
- **Extreme**: >4.0 cm/hour (up to 6+ cm/hour in severe conditions)

### Effects on Ship Operations

#### Stability Impact
- **Center of Gravity**: Ice accumulation high on superstructure raises CoG
- **Weight Impact**: Polar ships can accumulate 9%+ of ship weight in ice within 6 hours
- **Roll Risk**: Elevated CoG increases roll angles, risk of capsize
- **Top-Heavy**: Most dangerous for small vessels and fishing boats

#### Operational Effects
| System | Effect |
|--------|--------|
| Decks | Slip hazards, blocked access |
| Rigging | Cable weight, reduced flexibility |
| Antennas | Communication degradation |
| Hatches | Seizing, inability to open/close |
| Winches/Windlass | Mechanical failure |
| Anchors | Frozen in place |

### Risk Factors
- **Ship Size**: Smaller vessels more vulnerable (less freeboard, lower deck height)
- **Heading**: Vessels heading into wind/waves experience more spray
- **Speed**: Higher speed increases spray generation
- **Freeboard**: Lower ships experience more wave wash icing

### Physics for Game Developers
- **Accumulation Visualization**: Ice builds on windward surfaces first
- **Progressive Failure**: Icing starts as aesthetic, becomes gameplay-critical
- **Breaking Point**: Small vessels capsize; large vessels lose maneuverability
- **Removal Mini-game**: De-icing requires crew activity—can't automate
- **Visibility**: Heavy icing on windows/navigation bridges obscures vision

### ⚡ "I Didn't Know That" Moment #6
The worst icing doesn't occur at the coldest temperatures. Ice accretion rates actually peak around -17°C and then DECREASE at colder temperatures. This is because at extreme cold, seawater spray freezes almost instantly in the air, becoming ice pellets that bounce off surfaces rather than sticking. The most dangerous icing occurs in that "sweet spot" of very cold but not arctic-extreme temperatures.

---

## Weather Transition Logic for Game Systems

### Wind Evolution Model
```
Calm → Light Breeze → Breeze → Gale → Storm
     ↓ Pressure gradient increases
     ↓ Fetch and duration accumulate
     ↓ Wave height builds (with time lag)
```

### Fog Formation Logic
```
Evening Clear + Light Wind + Moist Air → Radiation Fog (dawn)
Warm Air Mass + Cold Water Current + Wind → Advection Fog (persistent)
Cold Air Outbreak + Warm Water → Sea Smoke (immediate)
Thunderstorm Approaching → Frontal Fog (with rain)
```

### Storm Lifecycle
```
Tropical Depression → Tropical Storm → Hurricane (intensification)
              ↓
Land Interaction / Cold Water → Weakening
              ↓
Extratropical Transition → Different storm type
```

### Icing Conditions Matrix
```
Air Temp    Wind Speed    Sea State     Icing Risk
--------    ----------    ---------     ----------
-1°C        Light         Calm          None
-3°C        Moderate      Moderate      Light
-6°C        Strong        Rough         Moderate
-10°C       Gale          High          Heavy
-17°C       Storm         Very High     Extreme (peak)
-25°C       Any           Any           Heavy (but decreasing)
```

---

## Summary: Key Physics Principles for Game Implementation

1. **Wind-Wave Lag**: Waves don't instantly match wind speed—there's a time delay based on fetch

2. **Nonlinear Interactions**: Rogue waves, crossing seas, and storm intensification follow nonlinear dynamics—small changes can trigger large effects

3. **Threshold Behaviors**: Weather transitions aren't smooth—fog suddenly envelops, lightning strikes without warning, waves break at critical heights

4. **Energy Concentration**: Whether in wave packets, storm eyes, or charge buildup, energy concentrates in specific zones

5. **Surface Interaction**: The ocean surface is the stage where air masses, temperature gradients, and energy exchanges create visible weather

6. **Feedback Loops**: Icing raises center of gravity → more rolling → more spray → more icing

7. **Scale Differences**: Same phenomenon behaves differently at different scales (fair-weather vs tornadic waterspouts, small vs large hurricanes)

---

## Source Citations

1. Royal Meteorological Society - Beaufort Wind Scale (rmets.org)
2. NOAA National Weather Service - Beaufort Scale Specifications
3. Nautical Almanac - Bowditch American Practical Navigator
4. Climavision - Fog Formation Mechanisms
5. FAA Aviation Weather AC 00-6B - Fog Types and Physics
6. MetService NZ - Physics of Fog
7. TAKO Lightning Protection - Marine Lightning Systems
8. ELNA DDCE Marine - Lightning Protection Technology
9. AGU Journals - Interactions Between Lightning and Ship Traffic
10. NOAA Ocean Today - Waterspout Facts
11. Cruising World - Weathering Waterspouts
12. gCaptain - Waterspout Dangers
13. Chaos Journal (AIP) - Rogue Waves: 30 Years After Draupner
14. Journal of Fluid Mechanics - Recreation of Draupner Wave
15. Physics APS - Exciting Rogue Waves
16. Quanta Magazine - What Causes Giant Rogue Waves
17. NOAA NHC - Saffir-Simpson Hurricane Wind Scale
18. Miami-Dade County - Hurricane Terms and Evacuation
19. Canadian Coast Guard - Ice Navigation Manual
20. NTNU - Modelling of Ship Superstructure Icing
21. NOAA OPC - Operational Forecast System for Superstructure Icing
22. Wind Energy Science - Effects of Wind Farm Wakes on Freezing Sea Spray

---

*Document compiled for HarborGlow game development - March 2025*
