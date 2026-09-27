# HarborGlow Source File Refactoring Guide

## Completed ✅

### 1. LightShow.tsx (1057 → 122 lines)
**Status:** ✅ COMPLETED - 88.4% reduction

**Extracted Modules:**
- `src/scenes/lightRigs/LightRigTypes.tsx` - All light rig components (LED, Moving Head, Laser, Strobe, Neon)
- `src/scenes/lightRigs/LightRigAnimations.ts` - Animation utilities and shader functions
- `src/scenes/lightRigs/SparkEffect.tsx` - Spark effect particle component
- `src/scenes/lightRigs/FogEffect.tsx` - Fog volumetric effect
- `src/scenes/lightRigs/index.ts` - Clean re-exports

**Hook Dependency Fixes:** Fixed 5 useEffect hooks by adding missing dependencies

---

## Recommended Next Steps

### 2. musicSystem.ts (1076 lines)
**Suggested Structure:** Break into 4 files
```
src/systems/music/
├── musicBands.ts          - Band names and info
├── musicLyrics.ts         - Lyrics for each ship type
├── musicSynthChains.ts    - Synth initialization and effect chains
├── musicTransports.ts     - Transport setup for each ship
├── index.ts               - Main MusicSystem class and exports
```

**Key Sections to Extract:**
1. **musicBands.ts** (82 lines)
   - `initializeBandNames()` method
   - `getBandInfo()` accessor
   - Band definitions for all 11 ship types

2. **musicLyrics.ts** (~300 lines)
   - `initializeLyrics()` method
   - Lyrics for all ship types
   - `getCurrentLyric()` and `getLyrics()` accessors

3. **musicSynthChains.ts** (~350 lines)
   - `initializeAudio()` method - synth and effect setup
   - Helper methods for creating effects
   - FX chain definitions

4. **musicTransports.ts** (~200 lines)
   - `initializeTransports()` method
   - Each ship type's transport, melody, bass, etc.
   - `playMusic()`, `stopMusic()`, `stopAllMusic()` methods

5. **index.ts** (Main file - ~150 lines)
   - MusicSystem class orchestrator
   - Public API methods
   - `triggerClimax()`, `dispose()`

**Estimated Result:** ~1076 to ~400 lines (main file)

---

### 3. ControlBooth.tsx (1071 lines)
**Suggested Structure:** Break into 5+ files
```
src/scenes/controlBooth/
├── ControlBoothGeometry.tsx - 3D booth structure/models
├── ControlBoothMaterials.tsx - Material definitions
├── ControlBoothLighting.tsx  - Lighting setup
├── ControlBoothMonitors.tsx  - Monitor integration
├── ControlBooth.tsx           - Main composition
```

**Focus Areas:**
- Extract static geometry and material definitions
- Separate monitor/dashboard integration
- Isolate lighting calculations
- Reduce main component to <300 lines

---

### 4. MainScene.tsx (1608 lines)
**Suggested Structure:** Break into 6+ files
```
src/scenes/
├── MainScene/
│   ├── MainSceneHooks.ts      - Custom hooks (cameras, systems)
│   ├── MainSceneComposition.tsx - Main rendering
│   ├── MainSceneLogic.ts       - Game loop and updates
│   └── index.ts
```

**Focus Areas:**
- Extract system integration hooks
- Separate initial setup from frame loop
- Create dedicated files for each major system integration
- Reduce main component to <400 lines

---

### 5. OperatorCabin.tsx (1387 lines)
**Suggested Structure:** Break into 5+ files
```
src/components/operator-cabin/
├── OperatorCabinLayout.tsx    - Main dashboard layout
├── OperatorCabinControls.tsx  - Control elements
├── OperatorCabinMonitors.tsx  - Monitor/feed components
├── OperatorCabinStyles.ts     - Styling constants
├── index.tsx                  - Main component
```

**Focus Areas:**
- Extract monitor components
- Separate styling from logic
- Modularize control sections
- Reduce main component to <400 lines

---

### 6. TrainingHUD.tsx (1121 lines)
**Suggested Structure:** Break into 4+ files
```
src/components/training/
├── TrainingModuleDisplay.tsx  - Module info rendering
├── TrainingProgressDisplay.tsx - Progress tracking UI
├── TrainingObjectiveList.tsx   - Objectives/tasks
├── TrainingHUD.tsx            - Main container
├── trainingStyles.ts          - Styling
```

**Focus Areas:**
- Extract module display logic
- Separate progress indicators
- Modularize objective components
- Reduce main component to <300 lines

---

### 7. TrainingMode.tsx (1028 lines)
**Suggested Structure:** Break into 4+ files
```
src/components/training/
├── TrainingScenario.tsx       - Individual scenario setup
├── TrainingInstructions.tsx   - Tutorial/instruction display
├── TrainingHubMenu.tsx        - Module selection UI
├── TrainingMode.tsx           - Main orchestrator
```

**Focus Areas:**
- Extract scenario definitions
- Separate instruction rendering
- Modularize hub menu
- Reduce main component to <300 lines

---

### 8. useGameStore.ts (1301 lines)
**Suggested Structure:** Break into slices
```
src/store/
├── useGameStore.ts           - Main store (import & combine slices)
├── slices/
│   ├── gameStateSlice.ts    - Core game state
│   ├── shipSlice.ts         - Ship management
│   ├── cameraSlice.ts       - Camera/view modes
│   ├── uiSlice.ts           - UI state
│   ├── weatherSlice.ts      - Weather/environment
│   ├── economySlice.ts      - Credits/economy
│   ├── trainingSlice.ts     - Training progress
│   └── persistenceSlice.ts  - Save/load logic
```

**Pattern to Follow:** Zustand slice pattern
```typescript
// Each slice exports a state creator function
export const createShipSlice = (set, get) => ({
  ships: [],
  addShip: (ship) => set(state => ({ ships: [...state.ships, ship] })),
  // ... other ship-related state and actions
})

// Main store combines all slices
export const useGameStore = create<GameState>((...args) => ({
  ...createGameStateSlice(...args),
  ...createShipSlice(...args),
  // ... other slices
}))
```

**Benefits:**
- Logical grouping of related state
- Easier to locate and modify specific functionality
- Reduced main store file from 1301 to ~200 lines
- Each slice 100-200 lines

---

## Refactoring Strategy

### Phase 1: Low-Risk Refactoring (Start Here)
1. ✅ **LightShow.tsx** - COMPLETED
2. **musicSystem.ts** - Well-contained, no external state coupling
3. **ControlBooth.tsx** - Mostly self-contained 3D rendering

### Phase 2: Medium-Risk Refactoring
1. **TrainingHUD.tsx** - UI component, limited state coupling
2. **TrainingMode.tsx** - UI component with scenario logic
3. **OperatorCabin.tsx** - UI component with monitor integration

### Phase 3: High-Risk Refactoring (Requires Testing)
1. **MainScene.tsx** - Central orchestrator with many system dependencies
2. **useGameStore.ts** - Core state container, affects all components

---

## Refactoring Checklist Template

For each file refactoring:

- [ ] Create new directory structure
- [ ] Extract data/constants to separate files
- [ ] Extract components to separate files
- [ ] Create index.ts with re-exports
- [ ] Update original file to import from new modules
- [ ] Run `npm run lint` and fix any warnings
- [ ] Run `npm run build` and verify successful build
- [ ] Check bundle size (should be unchanged)
- [ ] Test in browser (visual inspection)
- [ ] Commit with descriptive message

---

## Performance Considerations

### Bundle Impact
- Refactoring into separate files does NOT increase bundle size
- Vite handles code splitting efficiently
- Each module will be tree-shaken if unused

### Runtime Impact
- Zero impact when properly implemented
- Lazy loading can be added if needed for large modules
- Maintain same imports/exports for backward compatibility

### Testing
- No automated test suite exists
- Manual testing: `npm run dev` and verify functionality
- Use `npm run heartbeat` for smoke testing
- Check DevTools for any console errors

---

## Common Patterns to Use

### 1. Re-export Pattern (index.ts)
```typescript
// src/scenes/lightRigs/index.ts
export { LEDStripArray, MovingHeadSpotlight } from './LightRigTypes'
export { SparkEffect } from './SparkEffect'
export { useShaderTime } from './LightRigAnimations'

// Usage in other files
import { LEDStripArray, useShaderTime } from './lightRigs'
```

### 2. Constants Extraction
```typescript
// Extract to separate file
export const LIGHT_CONFIG = {
  LED_COUNT: 24,
  STRIP_LENGTH: 12,
  // ...
}

// Import in component
import { LIGHT_CONFIG } from './lightConfig'
```

### 3. Type Definitions Extraction
```typescript
// types.ts
export interface LightRigProps {
  position: [number, number, number]
  // ...
}

// Component file imports
import { LightRigProps } from './types'
```

---

## Commands Reference

```bash
# Type checking
npm run build

# Linting
npm run lint
npm run lint:fix

# Development
npm run dev

# Bundle analysis
npm run build:analyze

# Smoke test
npm run heartbeat
```

---

## Success Criteria

Each refactored file should:
1. ✅ Reduce main file to <400 lines (or justified exceptions)
2. ✅ Pass `npm run lint` with no new warnings
3. ✅ Pass `npm run build` with same bundle size
4. ✅ Maintain backward compatibility (no breaking changes)
5. ✅ Have clear separation of concerns
6. ✅ Use consistent naming conventions
7. ✅ Include proper TypeScript types

---

## Notes

- All refactoring should maintain existing functionality
- No new dependencies should be added
- Keep ESLint rules as-is (no-explicit-any, no-unused-vars are intentionally off)
- Follow existing code style with inline styles and CSSProperties
- Update this guide as refactoring progresses
