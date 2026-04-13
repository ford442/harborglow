const fs = require('fs');

// src/scenes/UpgradeCelebration.tsx - line 195:9
let ucContent = fs.readFileSync('src/scenes/UpgradeCelebration.tsx', 'utf8');
ucContent = ucContent.replace(/let allParticles: Particle\[\] = \[\]/, 'const allParticles: Particle[] = []');
fs.writeFileSync('src/scenes/UpgradeCelebration.tsx', ucContent);

// src/systems/ambientSoundSystem.ts - line 322:5
let assContent = fs.readFileSync('src/systems/ambientSoundSystem.ts', 'utf8');
assContent = assContent.replace(/let foghornInterval = setInterval/, 'const foghornInterval = setInterval');
fs.writeFileSync('src/systems/ambientSoundSystem.ts', assContent);

// src/systems/craneSoundSystem.ts - line 43:5
let cssContent = fs.readFileSync('src/systems/craneSoundSystem.ts', 'utf8');
cssContent = cssContent.replace(/let craneState = useGameStore\.getState\(\)\.cranes\[craneId\]/, 'const craneState = useGameStore.getState().cranes[craneId]');
fs.writeFileSync('src/systems/craneSoundSystem.ts', cssContent);

// src/systems/dynamicEventSystem.ts - lines 483:9, 484:9, 485:9
let desContent = fs.readFileSync('src/systems/dynamicEventSystem.ts', 'utf8');
desContent = desContent.replace(/let combinedLighting = \[\]/, 'const combinedLighting: any[] = []');
desContent = desContent.replace(/let combinedCrane = \[\]/, 'const combinedCrane: any[] = []');
desContent = desContent.replace(/let combinedShips = \[\]/, 'const combinedShips: any[] = []');
fs.writeFileSync('src/systems/dynamicEventSystem.ts', desContent);

// src/systems/timeSystem.ts - lines 419:13, 420:13
let tsContent = fs.readFileSync('src/systems/timeSystem.ts', 'utf8');
tsContent = tsContent.replace(/let phaseStart = 0/, 'const phaseStart = 0');
tsContent = tsContent.replace(/let phaseEnd = 24/, 'const phaseEnd = 24');
fs.writeFileSync('src/systems/timeSystem.ts', tsContent);
