# Phase 9: Physical Attachment Points + Satisfying Installation Feedback

## Overview
Implemented a comprehensive attachment point system that makes installing light rigs feel precise, tactile, and rewarding with clear visual guidance and satisfying feedback.

## Features Implemented

### 1. Attachment Point System
- **Distance-based visibility**: Points only highlight when crane is within 15m (configurable)
- **Floating distance indicator**: Shows meters to attachment point with snap zone warnings
- **Color-coded by rig type**:
  - RGB Matrix: Cyan (#00d4ff)
  - Projector: Purple (#a855f7)
  - Emergency Strobe: Red (#ff4444)
  - LED Strip: Yellow (#ffcc00)
  - Searchlight: White (#ffffff)
- **State-based visual feedback**:
  - `available`: Pulsing orb with distance indicator
  - `hovered`: Brighter glow with faster pulse
  - `snapping`: Snap zone indicator with directional arrows
  - `installing`: Progress ring with LOCKED flash
  - `installed`: Persistent point light

### 2. Dynamic Cable System
- **TubeGeometry cable**: Realistic curved cable from trolley to hook
- **Catenary physics**: Natural sag based on tension
- **Tension visualization**:
  - Green (low): < 0.3 tension
  - Yellow (medium): 0.3-0.6 tension
  - Orange (high): 0.6-0.8 tension
  - Red (critical): > 0.8 tension
- **Wind reaction**: Cable sways in wind when tension is low
- **Glow effect**: High tension adds emissive glow

### 3. Installation Feedback
- **Audio feedback** using Tone.js:
  - Mechanical "clunk" on install start
  - Musical chord based on rig type
  - Sparkle sound effect
  - Celebration fanfare for fully upgraded ships
- **Screen effects**:
  - Screen shake (scaled by ship size)
  - Green flash overlay
  - "LOCKED" text pop-up
  - Progress ring during installation
- **Particle burst**: 3D sparks, confetti, and smoke at install location
- **Shockwave ring**: Expanding ring effect
- **Full upgrade celebration**:
  - "SHIP FULLY UPGRADED!" banner
  - Auto camera orbit (integration point)
  - Light explosion effect
  - Music swell

### 4. Leva Controls
Located in "Attachment System" folder:
- `Show Attachments`: Toggle attachment point visibility
- `Attachment Range`: 5-50m visibility range
- `Snap Radius`: 1-10m snap zone size
- `Snap Strength`: 0-1 magnetic pull strength
- `Cable Visibility`: Show/hide crane cable

## New Files Created

### Components
- `src/components/ParticleBurst3D.tsx` - 3D particle effects
- `src/components/InstallationFeedback.tsx` - Screen effects and overlays
- `src/components/AttachmentSystemManager.tsx` - Central manager

### Hooks
- `src/hooks/useScreenShake.ts` - Screen shake effect hook

### Updated Files
- `src/scenes/AttachmentPoint.tsx` - Enhanced with distance indicators
- `src/scenes/Crane.tsx` - Cable visibility toggle
- `src/scenes/Ship.tsx` - Show distance indicators
- `src/scenes/MainScene.tsx` - Leva controls for cable
- `src/systems/attachmentSystem.ts` - Added showCable config

## Testing Steps

### 1. Test Attachment Points
1. Spawn any ship type
2. Move crane within 15m of attachment points
3. Verify distance indicator appears
4. Check color coding matches rig type

### 2. Test Snap Zones
1. Move crane within 5m of attachment point
2. Verify "SNAP ZONE" text appears
3. Check directional arrows point to attachment
4. Verify snap sound plays

### 3. Test Installation
1. Align crane with attachment point
2. Engage twistlock (E key)
3. Lower to install distance (< 2m)
4. Verify:
   - Progress ring appears
   - Mechanical sound plays
   - Screen shake occurs
   - "LOCKED" text flashes
   - Particle burst spawns
   - Green screen flash

### 4. Test Full Upgrade Celebration
1. Install all rigs on a ship
2. Verify celebration overlay appears
3. Check fanfare sound plays
4. Confirm "SHIP FULLY UPGRADED!" banner shows

### 5. Test Leva Controls
1. Open Leva panel
2. Toggle "Show Attachments" - points should hide/show
3. Adjust "Attachment Range" - visibility distance changes
4. Adjust "Snap Radius" - snap zone size changes
5. Toggle "Cable Visibility" - cable shows/hides

## Ship Type Attachment Points
- **Cruise**: Funnel, balconies, mast, pool deck
- **Container**: Container stacks, crane rails, bridge
- **Tanker**: Flare stack, rail lights, bridge
- **Bulk**: Cargo hatches, deck cranes
- **LNG**: Membrane tanks, superstructure
- **RoRo**: Vehicle ramps, deck lighting
- **Research**: Lab equipment, sonar, crane
- **Drone Ship**: Landing platform, thruster bays

## Performance Considerations
- Distance culling: Points invisible beyond 2x visibility range
- LOD support: Points hidden at medium+ LOD
- Particle pooling: Particles auto-cleanup after animation
- Efficient updates: useMemo for distance calculations
