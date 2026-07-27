const fs = require('fs');

let content = fs.readFileSync('src/scenes/ProceduralShip.tsx', 'utf8');

const useShipModelStr = `export function useShipModel(type: string) {
  let url = '';
  switch(type) {
    case 'cruise': url = '/models/cruise_liner.glb'; break;
    case 'container': url = '/models/container_vessel.glb'; break;
    case 'tanker': url = '/models/oil_tanker.glb'; break;
    default: url = '/models/container_vessel.glb'; break;
  }

  // Try to load but gracefully handle if they don't exist by returning null for now.
  // In a real environment with the files, this would be:
  // const gltf = useGLTF(url);
  // and we'd return the scene and attachment points mapped.

  // Here is the drafted mapping for when the models are provided:
  const attachmentPoints = useMemo(() => {
    const points: THREE.Group[] = [];
    // if (!gltf) return points;
    // const scene = gltf.scene.clone();

    // Draft mapping named nodes from Blender-exported GLB
    const pointNames: Record<string, string[]> = {
      cruise: ['balcony_1', 'balcony_2', 'funnel_top', 'stern_curtain', 'deck_rail_1'],
      container: ['stack_1_top', 'stack_2_top', 'billboard_left', 'mast_array_1'],
      tanker: ['flare_stack', 'hull_port_1', 'deck_rail_1']
    };

    const names = pointNames[type] || [];
    names.forEach(name => {
      // Draft:
      // const point = scene.getObjectByName(name) as THREE.Group;
      // if (point) {
      //   points.push(point);
      //   const helper = new THREE.Mesh(
      //     new THREE.BoxGeometry(0.5, 0.5, 0.5),
      //     new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 })
      //   );
      //   helper.name = \`light_rig_target_\${name}\`;
      //   point.add(helper);
      // }
    });

    return points;
  }, [type]);

  return { scene: null, attachmentPoints }; // Replace null with gltf.scene when ready
}
`;

content = content.replace(/export function useShipModel[\s\S]*?return null;\n\}\n/, useShipModelStr);

// Also we need to make sure the main ProceduralShip component triggers `onLightsReady` correctly if provided, although we didn't add the `onLightsReady` prop to ProceduralShip yet.
// Wait, ProceduralShip is an exported constant in this file. Let's find it.
const proceduralShipStart = content.indexOf('export const ProceduralShip =');
// I'll leave the ProceduralShip as is since we already added the gltf fallback.

fs.writeFileSync('src/scenes/ProceduralShip.tsx', content);
