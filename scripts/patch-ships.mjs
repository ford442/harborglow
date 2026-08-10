import fs from 'node:fs';

const file = 'src/blueprints/ships.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const targets = ['bulk', 'roro', 'research', 'droneship', 'ferry', 'trawler', 'horizon'];

for (const ship of data.ships) {
  if (targets.includes(ship.id)) {
    if (!ship.model) {
      ship.model = {
        url: `./models/${ship.id}.glb`,
        scale: 1,
        yOffset: 0
      };
    }
    
    // Add socket map
    const socketMap = {};
    let hpIndex = 1;
    for (const attachId of ship.attachmentPoints) {
      const socketName = `Empty_HP_${hpIndex.toString().padStart(2, '0')}`;
      socketMap[socketName] = attachId;
      hpIndex++;
    }
    ship.model.attachmentSocketMap = socketMap;
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
