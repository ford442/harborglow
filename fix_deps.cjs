const fs = require('fs');

// LoadingScreen.tsx
let lsContent = fs.readFileSync('src/components/LoadingScreen.tsx', 'utf8');
lsContent = lsContent.replace(
  /\}, \[\]\)/g,
  `}, [stages])`
);
fs.writeFileSync('src/components/LoadingScreen.tsx', lsContent);

// ShipStatusPanel.tsx
let statusContent = fs.readFileSync('src/components/hud/ShipStatusPanel.tsx', 'utf8');
statusContent = statusContent.replace(
  /  \}, \[installedUpgrades, ship\]\)/g,
  `  }, [ship])`
);
fs.writeFileSync('src/components/hud/ShipStatusPanel.tsx', statusContent);

// ProceduralShip.tsx
let psContent = fs.readFileSync('src/scenes/ProceduralShip.tsx', 'utf8');
psContent = psContent.replace(
  /  \}, \[length, width, height, type, version\]\)/g,
  `  }, [length, width, height, type])`
);
fs.writeFileSync('src/scenes/ProceduralShip.tsx', psContent);

// Ship.tsx
let shipContent = fs.readFileSync('src/scenes/Ship.tsx', 'utf8');
shipContent = shipContent.replace(
  /  \}, \[ship\.length, ship\.width, ship\.height, ship\.type, ship\.version, progress\]\)/g,
  `  }, [ship.length, ship.width, ship.height, ship.type, ship.version, progress, isUpgraded])`
);
fs.writeFileSync('src/scenes/Ship.tsx', shipContent);

// UnderwaterCamera.tsx
let underwaterContent = fs.readFileSync('src/scenes/UnderwaterCamera.tsx', 'utf8');
underwaterContent = underwaterContent.replace(
  /  \}, \[waterColor, intensity, lightIntensity, shipUpgradeProgress\]\)/g,
  `  }, [waterColor])`
);
fs.writeFileSync('src/scenes/UnderwaterCamera.tsx', underwaterContent);
