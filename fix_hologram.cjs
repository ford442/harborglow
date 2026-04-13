const fs = require('fs');

let content = fs.readFileSync('src/scenes/HolographicUI.tsx', 'utf8');

content = content.replace(
  /if \(!ship\) return null\s+const shipUpgrades = installedUpgrades\.filter\(u => u\.shipId === shipId\)\s+const progress = shipUpgrades\.length \/ \(ship\.attachmentPoints\?\.length \|\| 1\)\s+\/\/ Ship type color\s+const shipColor = ship\.type === 'cruise' \? '#ff6b9d' : \s+ship\.type === 'container' \? '#00d4aa' : '#ff9500'/g,
  `const shipUpgrades = installedUpgrades.filter(u => u.shipId === shipId)
  const progress = shipUpgrades.length / (ship?.attachmentPoints?.length || 1)

  // Ship type color
  const shipColor = ship?.type === 'cruise' ? '#ff6b9d' :
                    ship?.type === 'container' ? '#00d4aa' : '#ff9500'`
);

content = content.replace(
  /useFrame\(\(state\) => \{\s+if \(!groupRef\.current \|\| !wireframeRef\.current\) return\s+const time = state\.clock\.elapsedTime/g,
  `useFrame((state) => {
    if (!groupRef.current || !wireframeRef.current || !ship) return

    const time = state.clock.elapsedTime`
);

content = content.replace(
  /if \(ship\.type === 'cruise'\) \{/g,
  `if (ship?.type === 'cruise') {`
);

content = content.replace(
  /\} else if \(ship\.type === 'container'\) \{/g,
  `} else if (ship?.type === 'container') {`
);

content = content.replace(
  /\}, \[ship\.type\]\)/g,
  `}, [ship?.type])

  if (!ship) return null`
);

fs.writeFileSync('src/scenes/HolographicUI.tsx', content);

// SeaBirds.tsx fix
let seabirdsContent = fs.readFileSync('src/scenes/SeaBirds.tsx', 'utf8');

seabirdsContent = seabirdsContent.replace(
  /case 'flying':\s+\/\/ Gull-like flight pattern - soaring with wing beats\s+const flyRadius =/g,
  `case 'flying': {\n                // Gull-like flight pattern - soaring with wing beats\n                const flyRadius =`
);

seabirdsContent = seabirdsContent.replace(
  /                if \(wingsRef\.current\) \{\n                    const flapSpeed = type === 'tern' \? 15 : 8\n                    const flapAmp = type === 'pelican' \? 0\.3 : 0\.6\n                    wingsRef\.current\.rotation\.z = Math\.sin\(time \* flapSpeed\) \* flapAmp\n                \}\n                break/g,
  `                if (wingsRef.current) {\n                    const flapSpeed = type === 'tern' ? 15 : 8\n                    const flapAmp = type === 'pelican' ? 0.3 : 0.6\n                    wingsRef.current.rotation.z = Math.sin(time * flapSpeed) * flapAmp\n                }\n                break\n            }`
);

seabirdsContent = seabirdsContent.replace(
  /case 'soaring':\s+\/\/ Pelican-style soaring in circles\s+const soarRadius =/g,
  `case 'soaring': {\n                // Pelican-style soaring in circles\n                const soarRadius =`
);

seabirdsContent = seabirdsContent.replace(
  /                if \(wingsRef\.current\) \{\n                    wingsRef\.current\.rotation\.z = Math\.sin\(time \* 2\) \* 0\.1\n                \}\n                break/g,
  `                if (wingsRef.current) {\n                    wingsRef.current.rotation.z = Math.sin(time * 2) * 0.1\n                }\n                break\n            }`
);

seabirdsContent = seabirdsContent.replace(
  /case 'diving':\s+\/\/ Tern-style dive for fish\s+const diveCycle =/g,
  `case 'diving': {\n                // Tern-style dive for fish\n                const diveCycle =`
);

seabirdsContent = seabirdsContent.replace(
  /                if \(wingsRef\.current\) \{\n                    \/\/ Wings swept back in dive\n                    wingsRef\.current\.rotation\.z = Math\.PI \* 0\.4\n                \}\n                break/g,
  `                if (wingsRef.current) {\n                    // Wings swept back in dive\n                    wingsRef.current.rotation.z = Math.PI * 0.4\n                }\n                break\n            }`
);

fs.writeFileSync('src/scenes/SeaBirds.tsx', seabirdsContent);

// cameraSystem.ts fix
let cameraContent = fs.readFileSync('src/systems/cameraSystem.ts', 'utf8');
cameraContent = cameraContent.replace(
  /export function focusOnShip\(shipPosition: \[number, number, number\], duration = 1\.5\) \{[\s\S]*?const \{ camera \} = useThree\(\)[\s\S]*?const startPos = camera\.position\.clone\(\)[\s\S]*?const endPos = new THREE\.Vector3\([\s\S]*?shipPosition\[0\] \+ 30,[\s\S]*?shipPosition\[1\] \+ 20,[\s\S]*?shipPosition\[2\] \+ 30[\s\S]*?\)[\s\S]*?const targetLook = new THREE\.Vector3\(\.\.\.shipPosition\)[\s\S]*?\/\/ This would be called from a useFrame in the component[\s\S]*?return \{ startPos, endPos, targetLook, duration \}\n\}/,
  `export function focusOnShip(shipPosition: [number, number, number], duration = 1.5) {
  // startPos should be computed by the caller
  const endPos = new THREE.Vector3(
    shipPosition[0] + 30,
    shipPosition[1] + 20,
    shipPosition[2] + 30
  )
  const targetLook = new THREE.Vector3(...shipPosition)

  return { endPos, targetLook, duration }
}`
);
fs.writeFileSync('src/systems/cameraSystem.ts', cameraContent);

// soundEffects.ts fix
let soundContent = fs.readFileSync('src/systems/soundEffects.ts', 'utf8');
soundContent = soundContent.replace(
  /case 'tensionWarning':\s+\/\/ Rising pitch based on tension level\s+const baseFreq = 100 \+ \(params\?\.tension \|\| 0\.5\) \* 200\s+tensionSynth\?\.triggerAttackRelease\(baseFreq, '16n', now\)\s+break/g,
  `case 'tensionWarning': {\n      // Rising pitch based on tension level\n      const baseFreq = 100 + (params?.tension || 0.5) * 200\n      tensionSynth?.triggerAttackRelease(baseFreq, '16n', now)\n      break\n    }`
);
fs.writeFileSync('src/systems/soundEffects.ts', soundContent);
