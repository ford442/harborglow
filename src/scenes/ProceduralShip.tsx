import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useEnvironment, Environment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { getBlueprint, BlueprintPart } from '../types/ShipBlueprint';
import { useGameStore } from '../store/useGameStore';

interface ProceduralShipProps {
  blueprintId: string;
  version?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  children?: React.ReactNode;
}

// Enhanced PBR Material component with weathering and wetness
const PBRPart = ({ part, shipDefaults, shipType }: { part: BlueprintPart; shipDefaults: { metalness: number; roughness: number; envMapIntensity: number }; shipType: string }) => {
  const materialProps = part.material || {};
  const weather = useGameStore(state => state.weather);
  
  const geometry = useMemo(() => {
    switch (part.type) {
      case 'cylinder':
        return new THREE.CylinderGeometry(part.size[0] / 2, part.size[1] / 2, part.size[2], 32);
      case 'cone':
        return new THREE.ConeGeometry(part.size[0] / 2, part.size[2], 32);
      case 'box':
      default:
        return new THREE.BoxGeometry(part.size[0], part.size[1], part.size[2], 1, 1, 1);
    }
  }, [part.type, part.size]);

  const metalness = materialProps.metalness ?? shipDefaults.metalness;
  const roughness = materialProps.roughness ?? shipDefaults.roughness;
  const envMapIntensity = materialProps.envMapIntensity ?? shipDefaults.envMapIntensity;
  
  // Dynamic wetness based on weather
  const wetness = weather === 'rain' ? 0.7 : weather === 'storm' ? 0.9 : 0;
  
  // Determine material type based on part ID
  const isWindow = part.id.toLowerCase().includes('window') || part.id.toLowerCase().includes('glass');
  const isDeck = part.id.toLowerCase().includes('deck') || part.id.toLowerCase().includes('floor');
  const isHull = part.id.toLowerCase().includes('hull') || part.id.toLowerCase().includes('bow');
  const isMetal = part.id.toLowerCase().includes('crane') || part.id.toLowerCase().includes('pipe');
  
  // Calculate weathering level based on ship type
  const weatheringLevel = shipType === 'container' ? 0.5 : shipType === 'tanker' ? 0.6 : 0.3;

  return (
    <mesh
      geometry={geometry}
      position={part.position}
      rotation={part.rotation}
      castShadow={part.castShadow !== false}
      receiveShadow={part.receiveShadow !== false}
    >
      {isWindow ? (
        <meshStandardMaterial
          color={materialProps.color || '#223344'}
          emissive={materialProps.emissive || '#000000'}
          emissiveIntensity={materialProps.emissive ? 1.5 : 0}
          metalness={0.9}
          roughness={0.05}
          envMapIntensity={1.5}
          transparent
          opacity={0.9}
        />
      ) : isDeck ? (
        <meshStandardMaterial
          color={materialProps.color || '#444444'}
          roughness={0.7 - wetness * 0.3}
          metalness={0.2}
          envMapIntensity={envMapIntensity}
        />
      ) : isMetal ? (
        <meshStandardMaterial
          color={materialProps.color || '#888888'}
          roughness={0.5 + weatheringLevel * 0.3}
          metalness={0.7}
          envMapIntensity={envMapIntensity}
        />
      ) : isHull ? (
        <meshStandardMaterial
          color={materialProps.color || '#0a2540'}
          roughness={0.3 + weatheringLevel * 0.3 - wetness * 0.2}
          metalness={0.4}
          envMapIntensity={envMapIntensity}
        />
      ) : (
        <meshStandardMaterial
          color={materialProps.color || '#ffffff'}
          emissive={materialProps.emissive || '#000000'}
          emissiveIntensity={materialProps.emissive ? 1.5 : 0}
          metalness={metalness}
          roughness={roughness}
          envMapIntensity={envMapIntensity}
          dithering={true}
        />
      )}
    </mesh>
  );
};

// Cruise Liner Details
const CruiseLinerDetails = ({ shipLength, shipWidth }: { shipLength: number; shipWidth: number }) => {
  const [lightsOn, setLightsOn] = useState(0);
  const smokeRef = useRef<THREE.Points>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLightsOn(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  useFrame((state) => {
    if (smokeRef.current) {
      const positions = smokeRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.02;
        positions[i] += Math.sin(state.clock.elapsedTime + i) * 0.01;
        if (positions[i + 1] > 15) positions[i + 1] = 8;
      }
      smokeRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  const numDecks = 6;
  
  return (
    <group>
      {Array.from({ length: numDecks }, (_, i) => {
        const y = 3 + i * 2.5;
        const width = shipWidth * (1 - i * 0.05);
        const length = shipLength * (1 - i * 0.03);
        
        return (
          <group key={`deck-${i}`}>
            <mesh position={[0, y, 0]}>
              <boxGeometry args={[length, 0.3, width]} />
              <meshStandardMaterial color={i === numDecks - 1 ? '#8B4513' : '#f5f5f5'} roughness={0.6} />
            </mesh>
            {Array.from({ length: Math.floor(length / 2) }, (_, j) => (
              <mesh key={`rail-${i}-${j}`} position={[-length/2 + j * 2 + 1, y + 0.8, width/2 + 0.1]}>
                <boxGeometry args={[0.1, 1.2, 0.05]} />
                <meshStandardMaterial color='#c0c0c0' metalness={0.8} roughness={0.2} />
              </mesh>
            ))}
            {i < lightsOn + 2 && Array.from({ length: Math.floor(length / 3) }, (_, j) => (
              <mesh key={`window-${i}-${j}`} position={[-length/2 + j * 3 + 1.5, y + 0.5, width/2 + 0.05]}>
                <boxGeometry args={[0.8, 0.6, 0.05]} />
                <meshStandardMaterial color='#ffee88' emissive='#ffaa44' emissiveIntensity={0.8 + Math.random() * 0.4} />
              </mesh>
            ))}
          </group>
        );
      })}
      
      {Array.from({ length: 8 }, (_, i) => (
        <group key={`lifeboat-${i}`} position={[-shipLength/2 + i * shipLength/7 + 3, 5, shipWidth/2 + 0.5]}>
          <mesh>
            <capsuleGeometry args={[0.6, 2, 4, 8]} />
            <meshStandardMaterial color='#ff6600' roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.8, -0.5]} rotation={[0, 0, Math.PI/4]}>
            <cylinderGeometry args={[0.05, 0.05, 1.5]} />
            <meshStandardMaterial color='#ffffff' metalness={0.8} />
          </mesh>
        </group>
      ))}
      
      <group position={[shipLength/4, 12, 0]}>
        <mesh>
          <cylinderGeometry args={[1.5, 2, 6, 32]} />
          <meshStandardMaterial color='#cc0000' roughness={0.5} />
        </mesh>
        <mesh position={[0, 3.5, 0]}>
          <cylinderGeometry args={[1.8, 1.5, 1, 32]} />
          <meshStandardMaterial color='#333333' />
        </mesh>
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[2.05, 2.05, 0.8, 32]} />
          <meshStandardMaterial color='#111111' />
        </mesh>
        <points ref={smokeRef} position={[0, 4, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={30}
              array={new Float32Array(Array.from({ length: 90 }, (_, i) => {
                if (i % 3 === 0) return (Math.random() - 0.5) * 2;
                if (i % 3 === 1) return Math.random() * 7;
                return (Math.random() - 0.5) * 2;
              }))}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial size={0.8} color='#666666' transparent opacity={0.4} />
        </points>
      </group>
      
      <mesh position={[0, 16.5, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[8, 12]} />
        <meshStandardMaterial color='#44aaff' roughness={0.1} metalness={0.3} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 16.55, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[7.5, 11.5]} />
        <meshStandardMaterial color='#88ccff' emissive='#00aaff' emissiveIntensity={0.3} transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

// Container Vessel Details
const ContainerVesselDetails = ({ shipLength, shipWidth }: { shipLength: number; shipWidth: number }) => {
  const containerColors = ['#c41e3a', '#1e488f', '#f4d03f', '#27ae60', '#e67e22', '#8e44ad'];
  
  return (
    <group>
      {Array.from({ length: 12 }, (_, row) =>
        Array.from({ length: 6 }, (_, stack) => {
          const stackHeight = 3 + Math.floor(Math.random() * 5);
          return Array.from({ length: stackHeight }, (_, level) => {
            const color = containerColors[Math.floor(Math.random() * containerColors.length)];
            const weathering = Math.random() > 0.7 ? '#666666' : color;
            
            return (
              <mesh 
                key={`container-${row}-${stack}-${level}`}
                position={[
                  -shipLength/2 + row * (shipLength/11) + 2,
                  3 + level * 2.6,
                  -shipWidth/3 + stack * (shipWidth/6)
                ]}
              >
                <boxGeometry args={[6, 2.5, 2.5]} />
                <meshStandardMaterial color={weathering} roughness={0.7} metalness={0.2} />
              </mesh>
            );
          });
        })
      )}
      
      <mesh position={[0, 8, shipWidth/2 + 1]}>
        <boxGeometry args={[shipLength * 0.8, 0.5, 0.5]} />
        <meshStandardMaterial color='#ff6600' metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 8, -shipWidth/2 - 1]}>
        <boxGeometry args={[shipLength * 0.8, 0.5, 0.5]} />
        <meshStandardMaterial color='#ff6600' metalness={0.6} roughness={0.4} />
      </mesh>
      
      <group position={[-shipLength/3, 12, 0]}>
        <mesh>
          <boxGeometry args={[10, 8, shipWidth * 0.6]} />
          <meshStandardMaterial color='#ffffff' roughness={0.5} />
        </mesh>
        <mesh position={[0, 2, shipWidth * 0.31]}>
          <boxGeometry args={[8, 2, 0.1]} />
          <meshStandardMaterial color='#223344' metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 6, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 4]} />
          <meshStandardMaterial color='#cccccc' metalness={0.8} />
        </mesh>
        <mesh position={[0, 8, 0]} rotation={[Math.PI/4, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 0.3, 32]} />
          <meshStandardMaterial color='#ffffff' />
        </mesh>
      </group>
      
      <mesh position={[shipLength/2 - 5, 2, shipWidth/4]}>
        <torusGeometry args={[0.3, 0.1, 8, 16]} />
        <meshStandardMaterial color='#444444' metalness={0.9} roughness={0.6} />
      </mesh>
      <mesh position={[shipLength/2 - 5, 1, shipWidth/4]}>
        <torusGeometry args={[0.3, 0.1, 8, 16]} />
        <meshStandardMaterial color='#444444' metalness={0.9} roughness={0.6} />
      </mesh>
      
      <mesh position={[shipLength/2 - 2, 4, 0]} rotation={[0, 0, -Math.PI/2]}>
        <coneGeometry args={[3, 6, 32]} />
        <meshStandardMaterial color='#cc3333' roughness={0.6} />
      </mesh>
      
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={`rust-${i}`} position={[(Math.random() - 0.5) * shipLength * 0.8, 2 + Math.random() * 4, (Math.random() > 0.5 ? 1 : -1) * (shipWidth/2 + 0.1)]}>
          <planeGeometry args={[2 + Math.random() * 3, 1 + Math.random() * 2]} />
          <meshStandardMaterial color='#8b4513' transparent opacity={0.4 + Math.random() * 0.3} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

// Oil Tanker Details
const OilTankerDetails = ({ shipLength, shipWidth }: { shipLength: number; shipWidth: number }) => {
  return (
    <group>
      {Array.from({ length: 6 }, (_, i) => (
        <group key={`tank-${i}`} position={[-shipLength/2 + i * shipLength/5 + 8, 5, 0]}>
          <mesh rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[shipWidth/2.5, shipWidth/2.5, shipLength/6, 32]} />
            <meshStandardMaterial color='#e74c3c' roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[-shipLength/12, 0, 0]}>
            <sphereGeometry args={[shipWidth/2.5, 32, 16, 0, Math.PI * 2, 0, Math.PI/2]} />
            <meshStandardMaterial color='#c0392b' roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[shipLength/12, 0, 0]} rotation={[0, Math.PI, 0]}>
            <sphereGeometry args={[shipWidth/2.5, 32, 16, 0, Math.PI * 2, 0, Math.PI/2]} />
            <meshStandardMaterial color='#c0392b' roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[0, shipWidth/2.5 + 0.3, 0]}>
            <boxGeometry args={[shipLength/6, 0.2, 1]} />
            <meshStandardMaterial color='#f39c12' metalness={0.7} />
          </mesh>
          {Array.from({ length: 5 }, (_, j) => (
            <mesh key={`rail-${i}-${j}`} position={[-shipLength/12 + j * shipLength/30, shipWidth/2.5 + 1, shipWidth/2.5 - 0.5]}>
              <cylinderGeometry args={[0.05, 0.05, 1]} />
              <meshStandardMaterial color='#ffffff' />
            </mesh>
          ))}
        </group>
      ))}
      
      <group>
        <mesh position={[0, 3, shipWidth/3]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.4, 0.4, shipLength * 0.8, 16]} />
          <meshStandardMaterial color='#95a5a6' metalness={0.8} roughness={0.3} />
        </mesh>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={`pipe-${i}`} position={[-shipLength/3 + i * shipLength/6, 3, 0]} rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, shipWidth * 0.6, 16]} />
            <meshStandardMaterial color='#7f8c8d' metalness={0.8} />
          </mesh>
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <group key={`valve-${i}`} position={[-shipLength/3 + i * shipLength/7, 4, shipWidth/3]}>
            <mesh>
              <torusGeometry args={[0.6, 0.1, 8, 16]} />
              <meshStandardMaterial color='#e74c3c' />
            </mesh>
            <mesh rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 1.2]} />
              <meshStandardMaterial color='#c0392b' />
            </mesh>
          </group>
        ))}
      </group>
      
      <group position={[-shipLength/3, 14, 0]}>
        <mesh>
          <cylinderGeometry args={[8, 8, 0.5, 32]} />
          <meshStandardMaterial color='#34495e' roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <ringGeometry args={[6, 6.5, 32]} />
          <meshStandardMaterial color='#f1c40f' emissive='#f39c12' emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <boxGeometry args={[4, 0.8, 0.1]} />
          <meshStandardMaterial color='#f1c40f' />
        </mesh>
        <mesh position={[-1.5, 0.26, 0]}>
          <boxGeometry args={[0.8, 3, 0.1]} />
          <meshStandardMaterial color='#f1c40f' />
        </mesh>
        <mesh position={[1.5, 0.26, 0]}>
          <boxGeometry args={[0.8, 3, 0.1]} />
          <meshStandardMaterial color='#f1c40f' />
        </mesh>
      </group>
      
      <mesh position={[shipLength/2 - 5, 3, 0]} rotation={[0, 0, -Math.PI/6]}>
        <boxGeometry args={[8, 4, shipWidth * 0.8]} />
        <meshStandardMaterial color='#2c3e50' roughness={0.6} />
      </mesh>
      
      {Array.from({ length: 8 }, (_, i) => (
        <group key={`warning-${i}`} position={[-shipLength/2 + 10 + i * shipLength/8, 4, shipWidth/2.5 + 0.1]}>
          <mesh>
            <boxGeometry args={[2, 1, 0.05]} />
            <meshStandardMaterial color='#f1c40f' />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[1.5, 0.15, 0.05]} />
            <meshStandardMaterial color='#000000' />
          </mesh>
        </group>
      ))}
      
      <group position={[-shipLength/3, 10, 0]}>
        <mesh>
          <boxGeometry args={[12, 6, shipWidth * 0.5]} />
          <meshStandardMaterial color='#ecf0f1' />
        </mesh>
        <mesh position={[0, 1, shipWidth * 0.26]}>
          <boxGeometry args={[10, 2, 0.1]} />
          <meshStandardMaterial color='#2c3e50' metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
};

// Main Procedural Ship Component
export const ProceduralShip = ({ 
  blueprintId, 
  version, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  children 
}: ProceduralShipProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const blueprint = useMemo(() => getBlueprint(blueprintId), [blueprintId, version]);
  
  const envMap = useEnvironment(blueprint?.envMap 
    ? { files: `/envmaps/${blueprint.envMap}.hdr` }
    : { preset: 'sunset' }
  );

  if (!blueprint) {
    console.error(`❌ Blueprint not found: ${blueprintId}`);
    return null;
  }

  const shipDefaults = {
    metalness: blueprint.metalness ?? 0.6,
    roughness: blueprint.roughness ?? 0.4,
    envMapIntensity: envMap ? 1.0 : 0.0
  };

  const shipLength = blueprint.parts.find(p => p.type === 'box')?.size[0] || 50;
  const shipWidth = blueprint.parts.find(p => p.type === 'box')?.size[2] || 10;

  console.log(`🚢 Enhanced PBR ship loaded: ${blueprint.name}`);
  console.log(`   ID: ${blueprint.id}, Metalness: ${shipDefaults.metalness}, Roughness: ${shipDefaults.roughness}`);

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={[blueprint.scale, blueprint.scale, blueprint.scale]}
    >
      <Environment map={envMap} />
      {blueprint.parts.map((part) => (
        <PBRPart key={part.id} part={part} shipDefaults={shipDefaults} shipType={blueprint.id} />
      ))}
      {blueprint.id === 'cruise' && <CruiseLinerDetails shipLength={shipLength} shipWidth={shipWidth} />}
      {blueprint.id === 'container' && <ContainerVesselDetails shipLength={shipLength} shipWidth={shipWidth} />}
      {blueprint.id === 'tanker' && <OilTankerDetails shipLength={shipLength} shipWidth={shipWidth} />}
      {children}
    </group>
  );
};

export default ProceduralShip;
