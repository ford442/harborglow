const fs = require('fs');
let content = fs.readFileSync('src/scenes/LightShow.tsx', 'utf8');

content = content.replace(
  /  \}, \[installed\]\)/g,
  `  }, [installed, installProgress, onInstallComplete, position])`
);

content = content.replace(
  /  \}, \[\]\)/g, // This might be too broad, but let's check
  `  }, [position])`
);

fs.writeFileSync('src/scenes/LightShow.tsx', content);
