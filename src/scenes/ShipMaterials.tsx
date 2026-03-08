import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore';

// =============================================================================
// PBR MATERIAL SYSTEM - HarborGlow
// Comprehensive material layers with weathering and dynamic wetness
// =============================================================================

interface MaterialLayerProps {
  baseColor: string;
  weatheringLevel?: number; // 0-1
  wetness?: number; // 0-1
  isWaterline?: boolean;
}

// Procedural noise function for weathering
const weatheringShader = {
  functions: `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
  `
};

// Hull Paint Material with Clear Coat
export function HullPaintMaterial({ 
  baseColor = '#0a2540',
  weatheringLevel = 0.3,
  wetness = 0,
  isWaterline = false
}: MaterialLayerProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const weather = useGameStore(state => state.weather);
  
  const dynamicWetness = weather === 'rain' ? 0.8 : weather === 'storm' ? 1.0 : wetness;
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBaseColor: { value: new THREE.Color(baseColor) },
    uRustColor: { value: new THREE.Color('#8B4513') },
    uSaltColor: { value: new THREE.Color('#FFFFFF') },
    uOilColor: { value: new THREE.Color('#1a1a1a') },
    uWeathering: { value: weatheringLevel },
    uWetness: { value: dynamicWetness },
    uRustAmount: { value: 0.4 },
    uSaltAmount: { value: isWaterline ? 0.6 : 0.2 },
    uIsWaterline: { value: isWaterline }
  }), [baseColor, weatheringLevel, dynamicWetness, isWaterline]);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });
  
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  
  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform vec3 uRustColor;
    uniform vec3 uSaltColor;
    uniform vec3 uOilColor;
    uniform float uWeathering;
    uniform float uWetness;
    uniform float uRustAmount;
    uniform float uSaltAmount;
    uniform bool uIsWaterline;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    ${weatheringShader.functions}
    
    void main() {
      vec2 uv = vUv;
      vec3 color = uBaseColor;
      
      // Rust pattern
      float rustNoise = fbm(uv * 3.0);
      float rustStreaks = fbm(vec2(uv.x * 0.5, uv.y * 10.0));
      float rust = smoothstep(0.3, 0.7, rustNoise * rustStreaks) * uRustAmount * uWeathering;
      color = mix(color, uRustColor, rust);
      
      // Salt deposits
      float waterlineY = 0.3;
      float saltDist = uv.y - waterlineY;
      float salt = 0.0;
      if (saltDist <= 0.0) {
        float saltNoise = snoise(uv * 8.0);
        salt = smoothstep(0.4, 0.6, saltNoise) * uSaltAmount * smoothstep(0.0, -0.2, saltDist);
      }
      color = mix(color, uSaltColor, salt * 0.3);
      
      // Paint peeling
      float peelNoise = fbm(uv * 4.0);
      float peelEdges = fbm(uv * 8.0 + 100.0);
      float peeling = smoothstep(0.5, 0.7, peelNoise) * smoothstep(0.3, 0.5, peelEdges) * uWeathering * 0.5;
      vec3 primerColor = uBaseColor * 0.7;
      color = mix(color, primerColor, peeling * 0.5);
      
      // Oil stains
      float oilNoise = fbm(uv * 2.0);
      float oil = smoothstep(0.4, 0.6, oilNoise) * 0.3 * uWeathering * 0.4;
      color = mix(color, uOilColor, oil);
      
      // Wetness darkens
      float wetFactor = 1.0 - (snoise(uv * 20.0) * 0.5 + 0.5) * uWetness * 0.3;
      color *= wetFactor;
      
      // Fresnel for clear coat
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
      
      vec3 finalColor = color + vec3(fresnel * 0.1);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;
  
  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
    />
  );
}

// Rusted Metal Material
export function RustedMetalMaterial({ 
  weatheringLevel = 0.7 
}: { weatheringLevel?: number }) {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWeathering: { value: weatheringLevel },
    uBaseRust: { value: new THREE.Color('#8B4513') },
    uDeepRust: { value: new THREE.Color('#5D2906') },
    uOxidized: { value: new THREE.Color('#A0522D') }
  }), [weatheringLevel]);
  
  const fragmentShader = `
    uniform float uTime;
    uniform float uWeathering;
    uniform vec3 uBaseRust;
    uniform vec3 uDeepRust;
    uniform vec3 uOxidized;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    
    ${weatheringShader.functions}
    
    void main() {
      float noise = fbm(vUv * 4.0);
      float detail = snoise(vUv * 20.0);
      
      vec3 color = mix(uBaseRust, uDeepRust, noise);
      color = mix(color, uOxidized, detail * 0.3);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  
  return (
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={`
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={fragmentShader}
    />
  );
}

// Non-Slip Deck Material
export function DeckMaterial({ 
  wetness = 0,
  color = '#444444'
}: { wetness?: number; color?: string }) {
  const weather = useGameStore(state => state.weather);
  const dynamicWetness = weather === 'rain' ? 0.9 : weather === 'storm' ? 1.0 : wetness;
  
  const uniforms = useMemo(() => ({
    uBaseColor: { value: new THREE.Color(color) },
    uWetness: { value: dynamicWetness }
  }), [color, dynamicWetness]);
  
  const fragmentShader = `
    uniform vec3 uBaseColor;
    uniform float uWetness;
    varying vec2 vUv;
    
    void main() {
      float x = fract(vUv.x * 20.0);
      float y = fract(vUv.y * 20.0);
      float diamond = abs(x - 0.5) + abs(y - 0.5);
      float pattern = smoothstep(0.3, 0.5, diamond);
      
      vec3 color = uBaseColor * (0.8 + pattern * 0.4);
      color *= 1.0 - uWetness * 0.3;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  
  return (
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={fragmentShader}
    />
  );
}

// Glass Window Material
export function GlassMaterial({ 
  emissive = false,
  emissiveColor = '#ffee88'
}: { emissive?: boolean; emissiveColor?: string }) {
  const uniforms = useMemo(() => ({
    uEmissive: { value: emissive },
    uEmissiveColor: { value: new THREE.Color(emissiveColor) },
    uTime: { value: 0 }
  }), [emissive, emissiveColor]);
  
  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });
  
  return (
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={`
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vViewDir = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        uniform bool uEmissive;
        uniform vec3 uEmissiveColor;
        uniform float uTime;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.0);
          vec3 reflection = vec3(0.1, 0.15, 0.2) * fresnel;
          vec3 emission = uEmissive ? uEmissiveColor * (0.5 + sin(uTime * 2.0) * 0.1) : vec3(0.0);
          vec3 color = reflection + emission * (1.0 - fresnel);
          gl_FragColor = vec4(color, 0.9);
        }
      `}
      transparent
    />
  );
}

// Rubber Fendering Material
export function RubberMaterial({ 
  weatheringLevel = 0.4 
}: { weatheringLevel?: number }) {
  const uniforms = useMemo(() => ({
    uBaseColor: { value: new THREE.Color('#1a1a1a') },
    uWearColor: { value: new THREE.Color('#333333') },
    uWeathering: { value: weatheringLevel }
  }), [weatheringLevel]);
  
  const fragmentShader = `
    uniform vec3 uBaseColor;
    uniform vec3 uWearColor;
    uniform float uWeathering;
    varying vec2 vUv;
    
    ${weatheringShader.functions}
    
    void main() {
      float noise = snoise(vUv * 10.0);
      float wear = smoothstep(0.3, 0.7, noise) * uWeathering;
      vec3 color = mix(uBaseColor, uWearColor, wear);
      gl_FragColor = vec4(color, 0.9);
    }
  `;
  
  return (
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={fragmentShader}
      transparent
    />
  );
}

// Waterline Staining Effect
export function WaterlineStainMaterial() {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uStainColor: { value: new THREE.Color('#2F4F4F') },
    uWaterColor: { value: new THREE.Color('#1a3a4a') }
  }), []);
  
  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });
  
  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uStainColor;
    uniform vec3 uWaterColor;
    varying vec2 vUv;
    
    ${weatheringShader.functions}
    
    void main() {
      float waterline = 0.35;
      float dist = vUv.y - waterline;
      
      if (dist > 0.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
      }
      
      float flow = fbm(vec2(vUv.x * 5.0, vUv.y * 10.0 - uTime * 0.1));
      float stain = smoothstep(0.0, 0.3, -dist) * flow;
      
      float algae = snoise(vUv * 15.0) * smoothstep(-0.1, 0.1, dist);
      
      vec3 color = mix(uStainColor, uWaterColor, stain);
      color = mix(color, vec3(0.2, 0.4, 0.2), algae * 0.3);
      
      gl_FragColor = vec4(color, stain * 0.8);
    }
  `;
  
  return (
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={fragmentShader}
      transparent
      depthWrite={false}
    />
  );
}

// Splash Zone Material
export function SplashZoneMaterial() {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBaseColor: { value: new THREE.Color('#1a3a4a') }
  }), []);
  
  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });
  
  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uBaseColor;
    varying vec2 vUv;
    
    void main() {
      float splash1 = sin(vUv.x * 20.0 + uTime * 3.0) * sin(vUv.y * 30.0);
      float splash2 = sin(vUv.x * 15.0 - uTime * 2.0) * sin(vUv.y * 25.0 + 1.0);
      float wetness = 0.7 + (splash1 + splash2) * 0.1;
      vec3 color = uBaseColor * wetness;
      gl_FragColor = vec4(color, 0.7);
    }
  `;
  
  return (
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={fragmentShader}
      transparent
    />
  );
}

// Material presets
export const ShipMaterials = {
  hull: HullPaintMaterial,
  rustedMetal: RustedMetalMaterial,
  deck: DeckMaterial,
  glass: GlassMaterial,
  rubber: RubberMaterial,
  waterline: WaterlineStainMaterial,
  splashZone: SplashZoneMaterial
};

export default ShipMaterials;
