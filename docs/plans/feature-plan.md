# HarborGlow Technical Feature Plan

> A simulation-focused dockside lighting game with scientific accuracy and cutting-edge rendering.

---

## Current State Assessment

| System | Status | Tech Stack |
|--------|--------|------------|
| 3D Renderer | ✅ WebGL 2.0 | Three.js r163+ |
| WebGPU | ⚠️ Detection only | TSL reserved, not active |
| Water | ✅ Custom GLSL | Simplex noise waves, fake reflections |
| Lighting | ⚠️ Standard | Point lights, fake volumetrics |
| Physics | ✅ Rapier | RigidBody for dock, none for water/ship float |
| Shaders | ⚠️ Basic | God-rays, water - no post-processing |

---

## 🎯 Phase 1: Technical Rendering Foundation

> Goal: Achieve photorealistic harbor simulation through physically-based rendering

### 1.1 WebGPU Migration Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    RENDERING PIPELINE                       │
├─────────────────────────────────────────────────────────────┤
│  WebGPU Path (Primary)        WebGL 2.0 Fallback            │
│  ─────────────────────        ─────────────────             │
│  ┌───────────────┐            ┌───────────────┐             │
│  │ TSL Shaders   │            │ GLSL Shaders  │             │
│  │ (Node-based)  │            │ (Compatible)  │             │
│  └───────┬───────┘            └───────┬───────┘             │
│          │                           │                      │
│  ┌───────▼───────┐            ┌───────▼───────┐             │
│  │ Compute Pipes │            │ CPU Fallback  │             │
│  │ (GPU Physics) │            │ (Rapier)      │             │
│  └───────┬───────┘            └───────┬───────┘             │
│          │                           │                      │
│  ┌───────▼───────────────────────────▼───────┐             │
│  │         Post-Processing Stack              │             │
│  │  Bloom → SSR → Volumetric Fog → Color      │             │
│  └───────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

#### 1.1.1 WebGPU Feature Detection & Graceful Degradation

```typescript
interface RenderCapabilities {
  webgpu: boolean
  computeShaders: boolean
  storageTextures: boolean
  float32Filterable: boolean
  maxTextureDimension: number
}

// Dynamic shader compilation based on capabilities
function buildWaterShader(caps: RenderCapabilities): ShaderProgram {
  if (caps.webgpu && caps.computeShaders) {
    return buildComputeFFTWater()  // GPU FFT wave simulation
  } else if (caps.webgpu) {
    return buildTSLWater()         // TSL node-based water
  } else {
    return buildGLSLWater()        // Current simplex noise fallback
  }
}
```

#### 1.1.2 Compute Shader Workloads (WebGPU)

| Compute Task | Description | Performance Gain |
|--------------|-------------|------------------|
| **FFT Ocean Simulation** | Fast Fourier Transform wave synthesis | 10x vs CPU |
| **Buoyancy Physics** | Ship hull displacement sampling | 50x vs CPU |
| **Particle Systems** | Rain, spray, exhaust, sparks | GPU parallelized |
| **Light Culling** | Clustered forward+ lighting | 1000+ lights feasible |
| **Reflection Probes** | Real-time cubemap updates | Async GPU generation |

### 1.2 Physically-Based Water Rendering

#### 1.2.1 FFT-Based Ocean Simulation

Scientific wave model using Phillips spectrum:

```glsl
// FFT Ocean - Phillips Spectrum
// H(k,t) = (ξr + iξi) * sqrt(Ph(k)) * exp(iω(k)t)
// 
// Where:
//   Ph(k) = A * exp(-1/(k*L)^2) / k^4 * |k·w|^2
//   k = wave vector, L = V^2/g (wind generates waves)
//   ω(k) = sqrt(g*k) - dispersion relation

struct WaveSettings {
  float A;           // Wave scale (0.0001 - 0.01)
  vec2 windDir;      // Normalized wind direction
  float windSpeed;   // Wind speed in m/s (1-30)
  float g;           // Gravity (9.81 m/s²)
  float depth;       // Water depth for shallow waves
};
```

**Implementation Tiers:**

| Tier | Method | Resolution | Use Case |
|------|--------|------------|----------|
| **Cinema** | FFT 256×256 + Tessellation | 65k waves | Screenshots, VR |
| **Quality** | FFT 128×128 + Normal maps | 16k waves | Default gameplay |
| **Balanced** | FFT 64×64 + LOD blending | 4k waves | Mobile/Mid-tier |
| **Low** | Gerstner waves 64 samples | 64 waves | WebGL fallback |

#### 1.2.2 Realistic Reflection System

```
┌─────────────────────────────────────────────┐
│        REFLECTION PIPELINE                  │
├─────────────────────────────────────────────┤
│                                             │
│  Screen-Space Reflections (SSR)             │
│  ├── Ray march in view-space                │
│  ├── Use depth buffer for intersection      │
│  └── Fallback to probe if no hit            │
│                                             │
│  Planar Reflection (for calm water)         │
│  ├── Render scene from reflected camera     │
│  ├── Distort based on wave normals          │
│  └── Blend with SSR based on roughness      │
│                                             │
│  Reflection Probes (cubemaps)               │
│  ├── Static: Dock, cranes, buildings        │
│  ├── Dynamic: Ships (updated when moving)   │
│  └── Blended based on position              │
│                                             │
│  Specular IBL                               │
│  └── Pre-filtered environment map           │
│                                             │
└─────────────────────────────────────────────┘
```

**Water Shader Model:**

```glsl
// Physically-based water BRDF
// F = Fresnel term (Schlick's approximation)
// D = Normal distribution (GGX/Trowbridge-Reitz)
// G = Geometry shadowing (Smith)

vec3 WaterBRDF(vec3 V, vec3 L, vec3 N, float roughness) {
  float NdotV = max(dot(N, V), 0.0);
  float NdotL = max(dot(N, L), 0.0);
  float NdotH = max(dot(N, normalize(V + L)), 0.0);
  float VdotH = max(dot(V, normalize(V + L)), 0.0);
  
  vec3 F0 = vec3(0.02);  // Water F0 (IOR = 1.33)
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - VdotH, 5.0);
  
  float D = GGX(NdotH, roughness);
  float G = SmithGGX(NdotV, NdotL, roughness);
  
  return (F * D * G) / (4.0 * NdotV * NdotL + 0.001);
}
```

### 1.3 Scientific Ship Physics

#### 1.3.1 Buoyancy Simulation

```typescript
interface HullGeometry {
  // Pre-calculated from ship mesh
  displacementSamples: Float32Array  // Volume at each height
  centerOfBuoyancy: Vector3[]        // CB at each draft
  waterplaneArea: Float32Array       // Stability calculation
  metacentricHeight: number          // GM - stability indicator
}

class BuoyancySystem {
  // Sample water height at hull points using FFT texture
  calculateBuoyancyForces(ship: Ship, waterHeightField: Texture): Forces {
    // 1. Sample water height at multiple hull points
    // 2. Calculate submerged volume per sample
    // 3. Sum to get total buoyancy force
    // 4. Calculate center of buoyancy
    // 5. Return force and torque
  }
  
  // Wave-induced forces
  calculateWaveForces(ship: Ship, waveSpectrum: WaveSpectrum): Forces {
    // Froude-Krylov forces (pressure integration)
    // Diffraction forces (hull shape interaction)
    // Radiation forces (hull motion creates waves)
  }
}
```

**Ship Motion Equations:**

```
Surge (x):  m·ü + d·u̇ + k·u = F_wave + F_propeller
Sway (y):   m·v̈ + d·v̇ + k·v = F_wind + F_current  
Heave (z):  m·ẅ + ρgA_w·w = F_buoyancy - mg
Roll (φ):   I_x·φ̈ + GM·φ = M_wave
Pitch (θ):  I_y·θ̈ + GM_L·θ = M_wave
Yaw (ψ):    I_z·ψ̈ + d·ψ̇ = M_rudder

Where:
  m = ship mass (displacement tonnage)
  ρ = water density (1025 kg/m³ seawater)
  A_w = waterplane area
  GM = metacentric height (stability)
  I = moments of inertia
```

#### 1.3.2 Mooring Line Physics

```typescript
interface MooringLine {
  attachmentPoint: Vector3  // On ship
  bollardPosition: Vector3  // On dock
  length: number            // Total line length
  diameter: number          // Rope/cable diameter
  stiffness: number         // Axial stiffness (EA)
  massPerMeter: number      // For catenary calculation
}

// Catenary equation: y = a·cosh(x/a) - a
// where a = horizontal tension / (mass density * gravity)
class MooringSystem {
  calculateLineShape(line: MooringLine, shipPos: Vector3): Curve {
    // Solve catenary with seabed contact
    // Handle slack vs taut conditions
    // Calculate restoring forces on ship
  }
}
```

### 1.4 Lighting & Atmosphere

#### 1.4.1 Physically-Based Light Sources

| Light Type | Physics Model | Implementation |
|------------|---------------|----------------|
| **Dock Sodium** | Blackbody 2700K + sodium doublet | Emission spectrum texture |
| **Ship Navigation** | Red (port) 620nm, Green (starboard) 525nm | Monochromatic point lights |
| **Crane Flood** | Metal halide 4000K + IES profile | Photometric web texture |
| **Deck Lights** | LED array spectrum | Measured SPD data |
| **Bioluminescence** | Blue-green emission | Volumetric glow + particles |

```glsl
// Accurate blackbody radiation
vec3 Blackbody(float T) {
  // Planck's law approximation for visible spectrum
  // T in Kelvin (1000K - 10000K)
  float x = 1.0 / (T * 0.0001);
  vec3 color;
  color.r = 3.2406 * x - 0.4989;
  color.g = -0.9689 * x + 1.8758;
  color.b = 0.0557 * x - 0.2040;
  return clamp(color, 0.0, 1.0);
}
```

#### 1.4.2 Volumetric Lighting

```
┌─────────────────────────────────────────────┐
│      VOLUMETRIC LIGHTING PIPELINE           │
├─────────────────────────────────────────────┤
│                                             │
│  1. Light Scattering (Rayleigh + Mie)       │
│     ├── Rayleigh: small particles (air)     │
│     │   β ~ 1/λ⁴ (blue scattering)          │
│     └── Mie: large particles (fog, spray)   │
│         β ~ 1/λ⁰ (white/gray)               │
│                                             │
│  2. Fog Volumes                               │
│     ├── Height fog (exponential)            │
│     │   density = base * exp(-height/H)     │
│     ├── Volumetric fog (3D texture)         │
│     └── Local fog patches (particles)       │
│                                             │
│  3. Light Shafts (God Rays)                 │
│     ├── Radial blur from light source       │
│     ├── Occlusion-based intensity           │
│     └── Volumetric shadow maps              │
│                                             │
└─────────────────────────────────────────────┘
```

#### 1.4.3 Realistic Night Vision

```glsl
// Scotopic (rod) vs Photopic (cone) vision
// Mesopic interpolation for harbor lighting levels

vec3 MesopicToneMapping(vec3 color, float luminance) {
  // CIE 1924 photopic luminous efficiency
  float V_photopic = dot(color, vec3(0.2126, 0.7152, 0.0722));
  
  // CIE 1951 scotopic luminous efficiency (blue shift)
  float V_scotopic = dot(color, vec3(0.0016, 0.0600, 0.5898));
  
  // Mesopic range: 0.001 - 3 cd/m²
  float mesopic = smoothstep(0.001, 3.0, luminance);
  
  // Interpolate spectral sensitivity
  float V_eff = mix(V_scotopic, V_photopic, mesopic);
  
  // Apply Purkinje shift (blue appears brighter at night)
  vec3 purkinje = mix(vec3(0.3, 0.5, 1.0), vec3(1.0), mesopic);
  
  return color * purkinje * (V_eff / V_photopic);
}
```

### 1.5 Post-Processing Stack

```
┌─────────────────────────────────────────────┐
│      POST-PROCESSING PIPELINE               │
├─────────────────────────────────────────────┤
│                                             │
│  Input: HDR Scene Buffer (16-bit float)     │
│                                             │
│  1. Bloom (Downsample → Blur → Upsample)    │
│     ├── Threshold: 1.0 (HDR)                │
│     ├── Intensity: 0.5                      │
│     └── Dirt mask for camera imperfections  │
│                                             │
│  2. Screen-Space Reflections                │
│     ├── Hi-Z trace for performance          │
│     ├── Roughness-aware blur                │
│     └── Fallback to SSR probe               │
│                                             │
│  3. Volumetric Fog                          │
│     ├── Froxel integration (64 slices)      │
│     ├── Scattering LUT for sun/moon         │
│     └── Local lights injection              │
│                                             │
│  4. Depth of Field                          │
│     ├── Circle of confusion from depth      │
│     ├── Bokeh shape (hexagonal blades)      │
│     └── Focus on crane hook/ship deck       │
│                                             │
│  5. Tone Mapping                            │
│     ├── AgX (filmic, HDR-friendly)          │
│     └── Auto-exposure (histogram-based)     │
│                                             │
│  6. Color Grading                           │
│     ├── LUT (cold harbor night feel)        │
│     ├── Channel mixer (lift/gamma/gain)     │
│     └── Split toning (shadows/teal)         │
│                                             │
│  7. Film Grain & Vignette                   │
│     ├── Blue noise grain (subtle)           │
│     └── Vignette (draws eye to center)      │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🌧️ Phase 2: Weather & Environment Simulation

### 2.1 Weather System Architecture

```typescript
interface WeatherState {
  // Precipitation
  precipitationType: 'none' | 'rain' | 'snow' | 'sleet'
  precipitationIntensity: number  // mm/hour
  dropletSize: number             // μm - affects sound/vis
  
  // Wind
  windSpeed: number      // m/s at 10m height
  windGusts: number      // Peak gust speed
  windDirection: number  // degrees from north
  windVariation: number  // degrees of variation
  
  // Atmosphere
  temperature: number    // °C - affects buoyancy, fog
  humidity: number       // % - affects visibility
  pressure: number       // hPa - weather changes
  visibility: number     // km - fog/haze
  
  // Sea State
  waveHeight: number     // Significant wave height (m)
  wavePeriod: number     // Peak period (s)
  waveDirection: number  // degrees
  swell: SwellState      // Separate swell system
}
```

### 2.2 Rain Rendering

| Component | Technique | Detail Level |
|-----------|-----------|--------------|
| **Rain Drops** | GPU particle system | 100k drops, collision with surfaces |
| **Splashes** | Decal system on water/deck | Ripple + splash sprite |
| **Streaks** | Motion-blurred lines | Camera-relative velocity |
| **Wet Surfaces** | Roughness reduction | Puddles with reflection |
| **Sound** | Procedural rain | Intensity-based mixing |

```glsl
// Rain splash ripple on water
float RainRipple(vec2 uv, float time, float intensity) {
  float ripple = 0.0;
  for (int i = 0; i < NUM_RAIN_DROPS; i++) {
    vec2 dropPos = random2D(float(i));
    float dist = length(uv - dropPos);
    float wave = sin(dist * 30.0 - time * 5.0) * exp(-dist * 3.0);
    ripple += wave * smoothstep(0.5, 0.0, dist);
  }
  return ripple * intensity;
}
```

### 2.3 Fog & Atmospheric Effects

```
┌─────────────────────────────────────────────┐
│         FOG SYSTEM                          │
├─────────────────────────────────────────────┤
│                                             │
│  Harbor Fog (Radiation Fog)                 │
│  ├── Forms at night when water > air temp   │
│  ├── Density based on temperature delta     │
│  └── Height-limited (10-30m)                │
│                                             │
│  Sea Spray (Mechanical Fog)                 │
│  ├── Generated by wave breaking             │
│  ├── More intense in high winds             │
│  └── Visible over ship bows                 │
│                                             │
│  Exhaust Plumes                             │n│  ├── Ships have diesel generators           │
│  ├── Heat shimmer distortion                │
│  └── Lit by deck lights at night            │
│                                             │
│  Light Pillars                              │
│  ├── Ice crystal reflection (cold nights)   │
│  └── Vertical beams above lights            │
│  Sun Dogs (Parhelia)                        │
│  ├── Ice crystal refraction of sunlight     │
│  ├── Bright spots ~22° from the sun         │
│  └── Appears in cold clear arctic conditions│
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🎮 Phase 3: Crane Control Room

### 3.1 Control Room Environment

```
┌─────────────────────────────────────────────────────────────┐
│           CRANE CONTROL ROOM v1.0                           │
│                   [Night Shift]                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────────────────────────────────┐      │
│   │                                                 │      │
│   │    WINDOW VIEW - Panoramic Harbor               │      │
│   │    ┌───────────────────────────────────────┐   │      │
│   │    │  ╭─────╮                              │   │      │
│   │    │  │ 🚢  │  Ship at Dock 3              │   │      │
│   │    │  ╰─────╯                              │   │      │
│   │    │        ╔═══════════════╗              │   │      │
│   │    │        ║     🏗️       ║  Crane       │   │      │
│   │    │        ╚═══════════════╝              │   │      │
│   │    │  ~~~~ Water with reflections ~~~~     │   │      │
│   │    └───────────────────────────────────────┘   │      │
│   │                                                 │      │
│   └─────────────────────────────────────────────────┘      │
│                                                             │
│   MONITOR WALL (Left)         OPERATOR CONSOLE (Center)     │
│   ┌─────┬─────┬─────┐         ┌──────────────────────┐     │
│   │CAM-1│CAM-2│CAM-3│         │  ┌──────┐ ┌──────┐   │     │
│   │Dock │Crane│Ship │         │  │JOY-1 │ │JOY-2 │   │     │
│   │Wide │Over │Deck │         │  │      │ │      │   │     │
│   └─────┴─────┴─────┘         │  └──────┘ └──────┘   │     │
│   ┌─────┬─────┬─────┐         │  [GRAB] [RELEASE]    │     │
│   │CAM-4│CAM-5│CAM-6│         │  [MODE: PRECISE]     │     │
│   │North│South│Under│         │                      │     │
│   │Dock │Dock │Water│         │  Ship: HMS GLACIER   │     │
│   └─────┴─────┴─────┘         │  Progress: 5/8 ⬜⬜⬜│     │
│                               └──────────────────────┘     │
│                                                             │
│   STATUS PANEL (Right)                                      │
│   ┌────────────────┐                                        │
│   │ Wind: 12 kts NW│                                        │
│   │ Temp: 8°C      │                                        │
│   │ Visibility: 2km│                                        │
│   │ Next Ship: T+2h                                        │
│   └────────────────┘                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Multi-Camera System

| Camera | Position | Lens | Purpose |
|--------|----------|------|---------|
| **CAM-01** | Control Room Window | 24mm wide | Situational awareness |
| **CAM-02** | Crane boom tip | 50mm | Overhead installation view |
| **CAM-03** | Ship bridge | 35mm | Deck perspective |
| **CAM-04** | Dock north tower | 18mm ultra-wide | Approach monitoring |
| **CAM-05** | Dock south tower | 18mm ultra-wide | Departure monitoring |
| **CAM-06** | Underwater (ROV) | 28mm | Hull inspection |
| **CAM-07** | Drone (follow) | Variable | Dynamic crane following |
| **CAM-08** | Crane cab interior | 40mm | Immersion view |

**Camera Features:**
- PTZ (Pan-Tilt-Zoom) controls from console
- Auto-tracking mode (follows hook/ship)
- Preset positions (dock positions, ship types)
- Night vision / thermal overlay toggle
- Picture-in-picture mode

---

## 🌍 Phase 4: Global Expansion (Future)

### 4.1 Location Roster

| Location | Environment | Unique Features |
|----------|-------------|-----------------|
| **Norwegian Fjords** | Steep cliffs, cold water | Northern lights, midnight sun, orcas |
| **Singapore Harbor** | Tropical, busy | Bioluminescent plankton, container traffic |
| **Antarctic Station** | Ice, extreme cold | Icebergs, penguins, aurora, icebreakers |
| **North Sea Oil Rig** | Industrial offshore | Helicopter ops, supply ships, storms |
| **Panama Canal** | Tropical, locks | Lock system, freshwater, mules |
| **Dubai Marina** | Modern, desert | Skyline reflections, heat haze, luxury |
| **Alaskan Fishing** | Wilderness, wildlife | Salmon runs, bears, fishing fleets |

### 4.2 Ship Types by Region

```
┌─────────────────────────────────────────────┐
│           GLOBAL SHIP ROSTER                │
├─────────────────────────────────────────────┤
│                                             │
│  Polar Class                                │
│  ├── Icebreaker (red hull, powerful)        │
│  ├── Research vessel (equipment decks)      │
│  └── Cruise ship (polar expedition)         │
│                                             │
│  Container Variants                         │
│  ├── Ultra Large (24,000 TEU)               │
│  ├── Refrigerated (reefer containers)       │
│  └── Military (flat-top, vehicles)          │
│                                             │
│  Tanker Variants                            │
│  ├── LNG carrier (spherical tanks)          │
│  ├── Chemical (multiple small tanks)        │
│  └── Bunker (fuel for other ships)          │
│                                             │
│  Special Purpose                            │
│  ├── Heavy lift (crane ships)               │
│  ├── Cable layer (spools on deck)           │
│  ├── Dredger (pumps, discharge)             │
│  └── Floating drydock (submersible)         │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.3 Satellite & Equipment System

```typescript
interface SatelliteCoverage {
  name: string           // "Sentinel-2", "Landsat-9"
  resolution: number     // meters per pixel
  revisitTime: number    // hours
  bands: string[]        // ["RGB", "NIR", "SAR"]
  
  // Gameplay effects
  providesWeather: boolean
  revealsIcebergs: boolean
  detectsOilSpills: boolean
}

interface HarborEquipment {
  // Unlockable upgrades
  tugboats: number       // Assist ship docking
  pilotBoats: number     // Guide ships through channels
  icebreakerSupport: boolean
  helicopterPad: boolean // Fast crew transport
  automatedCranes: number // AI-assisted loading
}
```

---

## 🔬 Technical Implementation Notes

### Performance Targets

| Platform | Resolution | FPS | Quality Tier |
|----------|------------|-----|--------------|
| Desktop (WebGPU) | 1440p | 60 | Cinema |
| Desktop (WebGL) | 1080p | 60 | Quality |
| Laptop | 1080p | 30 | Balanced |
| Mobile | 720p | 30 | Low |

### Shader Complexity Budget

```
Per-frame shader cost (WebGPU):
├── Water FFT + normals:     0.5ms
├── SSR trace:               1.0ms
├── Volumetric fog:          0.8ms
├── Lighting (clustered):    0.5ms
├── Post-processing:         1.2ms
└── Total GPU time:          4.0ms target (16ms @ 60fps)
```

### Asset Pipeline

```
Ship Models (GLB):
├── LOD0: 50k tris (cinema shots)
├── LOD1: 15k tris (default view)
├── LOD2: 5k tris  (distance)
└── LOD3: 1k tris  (far background)

Textures:
├── Albedo: 2K (compressed BC7)
├── Normal: 2K (BC5)
├── Rough/Metal/AO: 1K (packed BC7)
└── Emission: 1K (BC6H for HDR)
```

---

## 📋 Priority Summary

### Immediate (Week 1-2)
1. ✅ WebGPU detection → active TSL shader usage
2. ✅ Upgrade water to FFT-based simulation
3. ✅ Implement SSR + reflection probes
4. ✅ Add post-processing stack

### Short-term (Week 3-6)
5. Buoyancy physics for ship floating
6. PBR lighting system with IES profiles
7. Weather system (rain, fog, wind)
8. Crane control room environment

### Medium-term (Week 7-12)
9. Multi-camera CCTV system
10. Mooring line physics
11. First new location (Norwegian Fjords)
12. Advanced ship types

### Long-term (Month 4+)
13. Global satellite system
14. Multiple locations with unique wildlife
15. Full career progression
16. Multiplayer crane operations

---

*Last Updated: March 2026*
*Focus: Scientific accuracy meets visual splendor*
