# HarborGlow Graphical Beauty Upgrade Prompts

A comprehensive collection of prompts to enhance the visual appeal and graphical sophistication of the HarborGlow crane-operator + boat-light-upgrade game.

---

## 1. Water & Ocean Effects

### 1.1 FFT-Based Ocean Simulation

Implement a multi-tiered FFT (Fast Fourier Transform) ocean simulation for the Water.tsx component with the following features:

- Use Phillips spectrum for realistic wave generation: H(k,t) = (ξr + iξi) * sqrt(Ph(k)) * exp(iω(k)t)
- Create 4 quality tiers:
  * Cinema: FFT 256x256 + Tessellation (65k waves) for screenshots/VR
  * Quality: FFT 128x128 + Normal maps (16k waves) - default gameplay
  * Balanced: FFT 64x64 + LOD blending (4k waves) - mobile/mid-tier
  * Low: Gerstner waves 64 samples (64 waves) - WebGL fallback

- Implement dynamic wave parameters:
  * Wave scale (A): 0.0001 - 0.01
  * Wind direction vector (normalized)
  * Wind speed: 1-30 m/s
  * Gravity: 9.81 m/s²
  * Water depth for shallow wave effects

- Add foam generation at wave crests using Jacobian determinant
- Implement shoreline wetness effect where waves meet the dock
- Create realistic water color transitions based on depth and time of day

### 1.2 Advanced Water Rendering

Enhance the water shader in Water.tsx with physically-based rendering:

- Implement a complete water BRDF:
  * Fresnel term using Schlick's approximation
  * GGX/Trowbridge-Reitz normal distribution
  * Geometric shadowing (Smith GGX)
  * Energy-conserving specular

- Add multi-layered reflection system:
  * Screen-Space Reflections (SSR) with view-space ray marching
  * Planar reflection for calm water areas
  * Reflection probes (cubemaps) for dock, cranes, buildings
  * Specular IBL with pre-filtered environment map
  * Blend between reflection sources based on roughness

- Create subsurface scattering for light penetration
- Add caustics projection onto ship hulls and dock
- Implement wave refraction and chromatic aberration
- Add dynamic foam trails behind ships

### 1.3 Interactive Water Response

Make the water react to ships and crane operations:

- Implement buoyancy-based displacement at ship hull contact points
- Add wake trails that persist and fade over time
- Create splash particles when crane drops upgrades near water
- Add ripple propagation from any object touching the water surface
- Implement dynamic wave interference patterns
- Create localized turbulence around moving crane components

---

## 2. Lighting & Atmosphere

### 2.1 Volumetric Lighting System

Implement true volumetric lighting for the dock and ship lights:

- Create volumetric fog that reacts to light sources:
  * God rays from dock spotlights using ray marching
  * Light cones from ship mast lights
  * Ambient volumetric glow from fully-upgraded ships

- Add Light Scattering effects:
  * Mie scattering for spotlights
  * Rayleigh scattering for ambient atmosphere
  * Anisotropic scattering based on view angle

- Implement time-of-day volumetric variations:
  * Morning: soft golden god rays
  * Noon: minimal volumetrics, bright ambient
  * Evening: long dramatic light shafts
  * Night: intense localized volumetrics, dark atmosphere

- Add volumetric shadows from cranes and ships

### 2.2 Dynamic Global Illumination

Create a real-time GI system for light bounce and color bleeding:

- Implement screen-space global illumination (SSGI):
  * Ray-marched short-range bounce lighting
  * Color bleeding from ship lights onto water
  * Dock surface reflecting ship light colors

- Add irradiance volumes for indirect lighting:
  * Place probes around dock and ship areas
  * Blend between probes based on position
  * Update dynamic probes when lights change

- Create emissive light propagation:
  * Upgraded ship lights affecting nearby environment
  * Crane cabin lights casting warm glow
  * Dock lamps creating pools of colored light

### 2.3 Advanced Night Lighting

Transform the night mode into a stunning light show:

- Implement HDR bloom with threshold-based extraction:
  * Multi-pass bloom (downsample, blur, upsample)
  * Anamorphic bloom streaks for bright lights
  * Chromatic aberration in bloom highlights

- Add light flare and glare effects:
  * Lens flare when looking at bright ship lights
  * Starburst patterns around point lights
  * Ghosting artifacts for cinematic feel

- Create dynamic light pulsing synchronized to music BPM:
  * Beat detection driving light intensity
  * Color cycling on RGB upgrade lights
  * Strobe effects during music climaxes

- Implement light reflection on wet surfaces:
  * Puddle reflections on dock after "rain"
  * Wet ship hull reflections
  * Shimmering water surface light reflections

---

## 3. Ship Visuals & Models

### 3.1 Procedural Ship Detailing

Enhance the fallback ship geometries with rich procedural details:

For Cruise Liner:
- Add multiple deck levels with balcony railings
- Create lifeboat arrays along the sides
- Implement funnel with particle smoke effect
- Add pool deck areas with water shimmer
- Create illuminated window patterns that light up progressively

For Container Vessel:
- Stack containers with varied colors and weathering
- Add crane rails and machinery details
- Implement bridge superstructure with windows
- Create anchor chains and bow details
- Add rust and wear decals

For Oil Tanker:
- Create spherical/ cylindrical tank structures
- Add pipeline networks with valve details
- Implement helicopter landing pad
- Create bow wave deflector shapes
- Add warning/safety markings

### 3.2 Ship Surface Materials

Implement PBR materials for all ship surfaces:

- Create material layers:
  * Base paint with clear coat for hull
  * Rusted metal areas with varying oxidation
  * Non-slip deck surfaces
  * Glass windows with reflections
  * Rubber fendering around hull

- Add procedural weathering:
  * Rust streaks flowing down from fittings
  * Salt deposits near waterline
  * Paint peeling and chipping
  * Oil stains and grime

- Implement dynamic wetness:
  * Wet decks during/after rain
  * Waterline staining
  * Splash zones with different roughness

### 3.3 Light Rig Upgrade Visuals

Make the light upgrades visually spectacular:

- Create distinct light rig types:
  * LED strip arrays with individual addressable LEDs
  * Moving head spotlights with beam effects
  * Laser projectors with visible beams through fog
  * Strobe banks for rhythmic flashing
  * Neon/LED tube arrangements

- Implement upgrade installation animation:
  * Crane placing light rigs with cable physics
  * Lights "powering on" with startup sequence
  * Connection sparks and electrical effects
  * Progressive illumination as rigs activate

- Add light rig behaviors:
  * RGB color cycling synchronized to music
  * Beam sweeping patterns
  * Strobe patterns matching beat drops
  * Laser patterns projecting onto water/fog

---

## 4. Particle Effects

### 4.1 Atmospheric Particle System

Create a comprehensive GPU particle system:

- Weather particles:
  * Rain with collision against ships and dock
  * Snow during winter mode
  * Fog/mist banks rolling across water
  * Dust motes in light shafts

- Ambient particles:
  * Fireflies around dock lights at night
  * Seagulls circling in the distance
  * Steam/smoke from ship funnels
  * Sparkles on water surface

- Interactive particles:
  * Splash when crane drops objects
  * Sparks during upgrade installation
  * Smoke from crane motor
  * Water spray from ship movement

### 4.2 Celebration Effects

Add spectacular effects when ships are fully upgraded:

- Fireworks system:
  * Rocket trails launching from dock
  * Burst patterns with physics-based particles
  * Multi-colored explosions with sparkles
  * Smoke trails and afterglow

- Confetti and streamers:
  * Paper confetti falling with air resistance
  * Metallic streamers catching light
  * Color-matched to ship type theme

- Light show finale:
  * All ship lights strobing in sequence
  * Laser beams sweeping across scene
  * Spotlight beams converging on ship
  * Water projection effects

### 4.3 Environmental Effects

Add environmental storytelling through particles:

- Dock atmosphere:
  * Steam rising from vents
  * Dust in work light beams
  * Welding sparks from distant workers
  * Smoke from chimney stacks

- Water effects:
  * Spray from waves hitting dock
  * Mist rising in morning hours
  * Bioluminescent plankton glow at night
  * Oil slick rainbow sheen (for tanker)

- Ship-specific effects:
  * Cruise liner: party streamers, champagne bubbles
  * Container: dust from containers, exhaust fumes
  * Tanker: heat haze, safety flare smoke

---

## 5. Post-Processing Stack

### 5.1 Cinematic Color Grading

Implement a comprehensive color grading pipeline:

- Create LUT-based color grading:
  * Day mode: warm, saturated, high contrast
  * Night mode: cool, moody, crushed blacks
  * Sunrise/sunset: golden hour warmth
  * Storm: desaturated, green-tinted

- Add filmic tone mapping:
  * ACES or Filmic tone mapping
  * Preserve highlight detail
  * Rich shadow detail

- Implement vignette and grain:
  * Subtle vignette focusing on ship
  * Film grain for cinematic texture
  * Chromatic aberration at screen edges

- Create time-of-day color transitions:
  * Smooth 24-hour color cycle
  * Blue hour twilight
  * Golden hour warmth
  * Midnight blue-black

### 5.2 Depth-Based Effects

Add depth-aware post-processing:

- Depth of field:
  * Bokeh shapes for out-of-focus lights
  * Focus on current ship or crane target
  * Smooth focus transitions

- Fog and haze:
  * Exponential height fog
  * Distance-based atmospheric haze
  * Color shifts with distance

- Ambient occlusion:
  * SSAO for contact shadows
  * GTAO for more accurate occlusion
  * Darken ship-to-water contact

### 5.3 Screen Effects

Add screen-space visual effects:

- Lens effects:
  * Lens dirt and dust
  * Water droplets on "camera lens"
  * Light streaks and anamorphic flares

- Distortion effects:
  * Heat haze from ship exhaust
  * Underwater distortion when camera near water
  * Chromatic separation at screen edges

- Retro effects option:
  * Scanlines for arcade feel
  * CRT curvature and phosphor glow
  * VHS tracking artifacts

---

## 6. UI/UX Visual Polish

### 6.1 HUD Design System

Create a cohesive, beautiful HUD:

- Glassmorphism panels:
  * Frosted glass effect with blur
  * Subtle gradient backgrounds
  * Thin border highlights

- Animated UI elements:
  * Smooth progress bar fills
  * Pulsing upgrade indicators
  * Bouncy button interactions
  * Slide-in panel transitions

- Typography hierarchy:
  * Modern sans-serif fonts
  * Glow effects on important text
  * Monospace for data displays
  * Gradient text for headers

- Icon system:
  * Custom ship type icons
  * Animated upgrade icons
  * Music visualization icons
  * Settings gear with rotation

### 6.2 Lyrics Display Enhancement

Transform the lyrics into a visual spectacle:

- Karaoke-style word highlighting:
  * Words glow as they're sung
  * Smooth color transitions
  * Particle burst on key words

- Typography animations:
  * Words scale with emphasis
  * Subtle bounce on beat
  * Gradient color shifts
  * Shadow depth on important lines

- Background effects:
  * Subtle glow behind lyrics
  * Wave distortion matching music
  * Particle field reacting to vocals

- Font styling:
  * Bold, readable display font
  * Glow effect matching ship theme color
  * Outline for readability against any background

### 6.3 Interactive Feedback

Add satisfying feedback for all interactions:

- Button interactions:
  * Scale bounce on press
  * Glow pulse on hover
  * Ripple effect from click point
  * Sound wave visualization

- Upgrade installation:
  * Progress ring around cursor
  * Sparkle trail during installation
  * Success flash on completion
  * Shake effect on error

- Ship spawning:
  * Water splash effect
  * Dock rumble shake
  * Spotlight sweep to new ship
  * Horn sound visualization

---

## 7. Camera & Cinematic Effects

### 7.1 Dynamic Camera System

Expand the camera with cinematic modes:

- Crane view mode:
  * First-person from crane cabin
  * Over-shoulder view of crane hook
  * Top-down operational view
  * Side profile for precision placement

- Ship showcase modes:
  * Low angle dramatic shots
  * Aerial orbit with variable radius
  * Water-level passing shots
  * Through-the-rig light show view

- Music-reactive camera:
  * Subtle zoom on beat drops
  * Rotation speed tied to BPM
  * Shake intensity matching bass
  * Color flash on transitions

### 7.2 Spectator Drone Enhancement

Upgrade the spectator drone to cinematic quality:

- Smooth path generation:
  * Bézier curve paths around ship
  * Variable speed based on interest points
  * Pause and dwell on light shows

- Dynamic framing:
  * Rule of thirds composition
  * Ship always well-framed
  * Water and sky balance

- Transition effects:
  * Motion blur during fast moves
  * Ease-in/ease-out acceleration
  * Seamless loop for continuous viewing

- Interactive elements:
  * Click to focus on specific light rigs
  * Zoom to inspect details
  * Pause and screenshot mode

### 7.3 Transition Effects

Add polish to all scene transitions:

- Camera transitions:
  * Smooth interpolation between modes
  * Motion blur during fast transitions
  * Brief fade to black for major changes

- Time-of-day transitions:
  * Gradual 30-second day/night cycle option
  * Color temperature shifts
  * Light intensity animations

- Ship switch transitions:
  * Pan across water to new ship
  * Spotlight reveals new vessel
  * Water splash marks the moment

---

## 8. Audio-Visual Synchronization

### 8.1 Music Visualization

Create stunning audio-reactive visuals:

- Frequency-based effects:
  * Bass frequencies shake camera subtly
  * Mid frequencies pulse lights
  * High frequencies trigger sparkles

- Waveform visualization:
  * Water surface undulates to music
  * Light intensity follows waveform
  * Particle systems pulse rhythmically

- Beat detection effects:
  * Flash on kick drum
  * Color shift on snare
  * Sparkle burst on cymbal crashes

- Genre-specific visuals:
  * Orchestral: smooth, flowing transitions
  * Techno: sharp, strobe-like effects
  * Dubstep: heavy bass shake, aggressive pulses

### 8.2 Light Show Choreography

Program sophisticated light shows:

- Pre-programmed patterns:
  * Chase sequences across light rigs
  * Wave patterns flowing along ship
  * Strobe patterns matching rhythm
  * Color wipe transitions

- Reactive patterns:
  * Lights respond to specific instruments
  * Melody lights vs rhythm lights
  * Build-up intensity before drops
  * Climax effects on song peaks

- Ship-specific choreography:
  * Cruise: elegant, flowing patterns
  * Container: geometric, precise patterns
  * Tanker: industrial, powerful patterns

### 8.3 Environmental Audio Reactivity

Make the entire environment respond to music:

- Water reaction:
  * Wave height increases with bass
  * Ripple patterns match rhythm
  * Foam generation on beat drops

- Atmospheric effects:
  * Fog density pulses with music
  * Particle speed tied to tempo
  * Light shaft intensity follows melody

- Structural reactions:
  * Dock lights pulse in sequence
  * Crane lights flash on beat
  * Background city lights dance

---

## 9. Special Effects & Polish

### 9.1 Holographic UI Elements

Add futuristic holographic elements:

- Ship status holograms:
  * Floating above each ship
  * Wireframe ship model showing upgrade progress
  * Real-time light rig status
  * Music visualization bars

- Crane targeting HUD:
  * Holographic reticle at target point
  * Distance and angle indicators
  * Upgrade preview ghost
  * Trajectory prediction line

- Control panel holograms:
  * Floating buttons and sliders
  * Hand-tracking interaction (if available)
  * Gesture-based controls

### 9.2 Reflection and Refraction

Maximize reflective surface quality:

- Water reflections:
  * Real-time ship reflections
  * Light reflection on water surface
  * Moon/sun reflection with sparkle

- Window reflections:
  * Ship cabin windows reflect environment
  * Crane cabin interior visible
  * Dock building windows

- Metallic reflections:
  * Ship hull reflections
  * Crane metal shine
  * Container reflections

### 9.3 Weather and Time Effects

Add dynamic environmental conditions:

- Rain system:
  * Droplets on camera lens
  * Ripples on water surface
  * Wet surface reflections
  * Mist and humidity haze

- Storm effects:
  * Lightning flashes with shadows
  * Rough choppy waves
  * Wind-swept rain angles
  * Dark dramatic sky

- Seasonal variations:
  * Winter: snow, ice formations
  * Spring: cherry blossoms, gentle rain
  * Summer: bright sun, heat haze
  * Autumn: falling leaves, golden light

---

## 10. Performance Optimization

### 10.1 LOD System

Implement level-of-detail for all visual elements:

- Ship LODs:
  * Full detail within 50m
  * Medium detail 50-150m
  * Low detail beyond 150m
  * Impostor sprites at extreme distance

- Effect LODs:
  * Full particles near camera
  * Simplified particles at distance
  * Billboard sprites for distant effects

- Shader LODs:
  * Full PBR for close objects
  * Simplified shaders at distance
  * Unlit for far background

### 10.2 Occlusion Culling

Optimize rendering with occlusion:

- Ship interior culling:
  * Don't render hidden deck interiors
  * Cull lights not visible to camera
  * Skip particle systems behind objects

- Dock optimization:
  * Cull dock sections behind ships
  * Skip distant crane details
  * Optimize reflection rendering

---

## Quick Implementation Priority

### Phase 1: Immediate Visual Impact
- Enhanced water shader with reflections
- Bloom and post-processing stack
- Improved ship materials and lighting
- Particle effects for celebrations

### Phase 2: Atmospheric Depth
- Volumetric lighting and fog
- Advanced night lighting
- Weather effects
- Time-of-day transitions

### Phase 3: Polish & Refinement
- Camera system expansion
- UI visual overhaul
- Audio-visual synchronization
- Performance optimization

---

*These prompts are designed to work with the existing HarborGlow architecture using React Three Fiber, Three.js, and TypeScript.*
