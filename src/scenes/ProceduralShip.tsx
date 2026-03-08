import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { getBlueprint, BlueprintPart } from '../types/ShipBlueprint';

interface ProceduralShipProps {
  blueprintId: string;
  version?: string;  // Ship version for tracking/upgrading
  position?: [number, number, number];
  rotation?: [number, number, number];
  children?: React.ReactNode;
}

// Primitive component factory
const PrimitivePart = ({ part }: { part: BlueprintPart }) => {
  const materialProps = part.material || {};
  
  const geometry = useMemo(() => {
    switch (part.type) {
      case 'cylinder':
        return new THREE.CylinderGeometry(part.size[0] / 2, part.size[1] / 2, part.size[2], 16);
      case 'cone':
        return new THREE.ConeGeometry(part.size[0] / 2, part.size[2], 16);
      case 'box':
      default:
        return new THREE.BoxGeometry(part.size[0], part.size[1], part.size[2]);
    }
  }, [part.type, part.size]);

  return (
    <mesh
      geometry={geometry}
      position={part.position}
      rotation={part.rotation}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={materialProps.color || '#ffffff'}
        emissive={materialProps.emissive}
        metalness={materialProps.metalness ?? 0.3}
        roughness={materialProps.roughness ?? 0.5}
      />
    </mesh>
  );
};

export const ProceduralShip = ({ blueprintId, version, position = [0, 0, 0], rotation = [0, 0, 0], children }: ProceduralShipProps) => {
  const groupRef = useRef<THREE.Group>(null);
  // Include version in deps to force re-render on ship upgrade
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const blueprint = useMemo(() => getBlueprint(blueprintId), [blueprintId, version]);

  if (!blueprint) {
    console.error(`❌ Blueprint not found: ${blueprintId}`);
    return null;
  }

  console.log(`🚢 Procedural ship loaded from blueprint: ${blueprint.name}`);

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={[blueprint.scale, blueprint.scale, blueprint.scale]}
    >
      {blueprint.parts.map((part) => (
        <PrimitivePart key={part.id} part={part} />
      ))}
      
      {children}
    </group>
  );
};

export default ProceduralShip;
