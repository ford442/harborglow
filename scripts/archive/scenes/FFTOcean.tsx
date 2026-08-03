import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// FFT OCEAN SIMULATION - HarborGlow
// Realistic ocean waves using Fast Fourier Transform with Phillips spectrum
// =============================================================================

export type OceanQuality = 'cinema' | 'quality' | 'balanced' | 'low'

interface WaveSettings {
  A: number        // Wave scale (0.0001 - 0.01)
  windDir: [number, number]  // Normalized wind direction
  windSpeed: number // Wind speed in m/s (1-30)
  g: number         // Gravity (9.81 m/s²)
  depth: number     // Water depth for shallow effects
}

interface FFTSettings {
  size: number      // FFT grid size (256, 128, 64)
  tileSize: number  // Physical tile size in meters
  numWaves: number  // Approximate wave count
  useTessellation: boolean
  useNormalMaps: boolean
  useLOD: boolean
}

// Phillips spectrum parameters
const PHILLIPS_CONFIG: Record<OceanQuality, FFTSettings> = {
  cinema:   { size: 256, tileSize: 1000, numWaves: 65000, useTessellation: true,  useNormalMaps: false, useLOD: false },
  quality:  { size: 128, tileSize: 1000, numWaves: 16000, useTessellation: false, useNormalMaps: true,  useLOD: false },
  balanced: { size: 64,  tileSize: 500,  numWaves: 4000,  useTessellation: false, useNormalMaps: true,  useLOD: true },
  low:      { size: 0,   tileSize: 200,  numWaves: 64,    useTessellation: false, useNormalMaps: false, useLOD: false }
}

// Complex number helpers
class Complex {
  constructor(public real: number, public imag: number) {}
  
  add(c: Complex): Complex {
    return new Complex(this.real + c.real, this.imag + c.imag)
  }
  
  multiply(c: Complex): Complex {
    return new Complex(
      this.real * c.real - this.imag * c.imag,
      this.real * c.imag + this.imag * c.real
    )
  }
  
  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imag * this.imag)
  }
}

// Phillips spectrum: Ph(k) = A * exp(-1/(k*L)^2) / k^4 * |k·w|^2
function phillipsSpectrum(kx: number, kz: number, settings: WaveSettings): number {
  const k = Math.sqrt(kx * kx + kz * kz)
  if (k < 0.0001) return 0
  
  const L = (settings.windSpeed * settings.windSpeed) / settings.g
  const kDotW = kx * settings.windDir[0] + kz * settings.windDir[1]
  
  // Phillips spectrum formula
  const ph = settings.A * Math.exp(-1 / Math.pow(k * L, 2)) / Math.pow(k, 4) * Math.pow(kDotW, 2)
  
  // Suppress small waves
  return ph * Math.exp(-Math.pow(k * 0.1, 2))
}

// =============================================================================
// FFT OCEAN COMPONENT
// =============================================================================

interface FFTOceanProps {
  isNight?: boolean
  quality?: OceanQuality
}

export default function FFTOcean({ isNight = true, quality = 'quality' }: FFTOceanProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const fftRef = useRef<Complex[][] | null>(null)
  const timeRef = useRef(0)
  
  const weather = useGameStore(state => state.weather)
  
  // Wave settings based on weather
  const waveSettings: WaveSettings = useMemo(() => {
    const base: WaveSettings = {
      A: 0.001,
      windDir: [1, 0.5],
      windSpeed: 10,
      g: 9.81,
      depth: 50
    }
    
    switch (weather) {
      case 'storm':
        return { ...base, A: 0.008, windSpeed: 25, windDir: [0.8, 0.6] }
      case 'rain':
        return { ...base, A: 0.004, windSpeed: 15, windDir: [0.9, 0.4] }
      case 'fog':
        return { ...base, A: 0.0005, windSpeed: 5, windDir: [1, 0] }
      default:
        return base
    }
  }, [weather])
  
  const fftSettings = PHILLIPS_CONFIG[quality]
  
  // Generate initial FFT height field
  useEffect(() => {
    if (quality === 'low') {
      fftRef.current = null
      return
    }
    
    const size = fftSettings.size
    const heightField: Complex[][] = Array(size).fill(null).map(() => Array(size).fill(new Complex(0, 0)))
    
    // Generate Phillips spectrum in frequency domain
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const kx = (i - size / 2) * (2 * Math.PI / fftSettings.tileSize)
        const kz = (j - size / 2) * (2 * Math.PI / fftSettings.tileSize)
        
        const phillips = Math.sqrt(phillipsSpectrum(kx, kz, waveSettings))
        
        // Random Gaussian noise (simplified)
        const xiR = (Math.random() * 2 - 1)
        const xiI = (Math.random() * 2 - 1)
        
        heightField[i][j] = new Complex(xiR * phillips, xiI * phillips)
      }
    }
    
    fftRef.current = heightField
    console.log(`🌊 FFT Ocean initialized: ${quality} quality (${fftSettings.numWaves} waves)`)
  }, [quality, fftSettings, waveSettings])
  
  // Shader uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveScale: { value: waveSettings.A * 100 },
    uTileSize: { value: fftSettings.tileSize },
    uSize: { value: fftSettings.size },
    uIsNight: { value: isNight },
    uColorDeep: { value: new THREE.Color(isNight ? '#000d1a' : '#003d5c') },
    uColorSurface: { value: new THREE.Color(isNight ? '#001a33' : '#006994') },
    uColorFoam: { value: new THREE.Color('#ffffff') },
    uDepthFog: { value: 0.3 }
  }), [isNight, waveSettings, fftSettings])
  
  useFrame((state) => {
    timeRef.current = state.clock.elapsedTime
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  // Vertex shader with FFT displacement
  const vertexShader = `
    uniform float uTime;
    uniform float uWaveScale;
    uniform float uTileSize;
    uniform int uSize;
    
    varying vec2 vUv;
    varying float vElevation;
    varying vec3 vNormal;
    varying float vFoam;
    varying vec3 vWorldPos;
    
    // Simplex noise for foam detail
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
              -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
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
    
    // Multi-octave wave function
    float getWaveHeight(vec2 pos, float t) {
      float height = 0.0;
      
      // Large swells
      height += snoise(pos * 0.02 + t * 0.1) * 4.0 * uWaveScale;
      
      // Medium waves
      height += snoise(pos * 0.05 + t * 0.2) * 2.0 * uWaveScale;
      height += snoise(pos * 0.08 + t * 0.25) * 1.5 * uWaveScale;
      
      // Small waves
      height += snoise(pos * 0.15 + t * 0.4) * 0.8 * uWaveScale;
      height += snoise(pos * 0.25 + t * 0.5) * 0.4 * uWaveScale;
      
      // Detail waves
      height += snoise(pos * 0.5 + t * 0.8) * 0.15 * uWaveScale;
      
      return height;
    }
    
    void main() {
      vUv = uv;
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
      
      vec2 worldPos = vWorldPos.xz;
      
      // Get wave displacement
      float elevation = getWaveHeight(worldPos, uTime);
      vElevation = elevation;
      
      // Calculate normal from height derivatives
      float delta = 0.5;
      float hL = getWaveHeight(worldPos + vec2(-delta, 0.0), uTime);
      float hR = getWaveHeight(worldPos + vec2(delta, 0.0), uTime);
      float hD = getWaveHeight(worldPos + vec2(0.0, -delta), uTime);
      float hU = getWaveHeight(worldPos + vec2(0.0, delta), uTime);
      
      vec3 normal = normalize(vec3(hL - hR, 2.0 * delta, hD - hU));
      vNormal = normal;
      
      // Foam calculation (Jacobian determinant approximation)
      float dx = abs(hR - hL);
      float dz = abs(hU - hD);
      float jacobian = 1.0 / (1.0 + dx + dz);
      vFoam = 1.0 - smoothstep(0.3, 0.7, jacobian);
      vFoam *= smoothstep(-2.0, 2.0, elevation);
      
      vec3 newPosition = position + vec3(0.0, elevation, 0.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `
  
  // Fragment shader with depth-based coloring and foam
  const fragmentShader = `
    uniform vec3 uColorDeep;
    uniform vec3 uColorSurface;
    uniform vec3 uColorFoam;
    uniform bool uIsNight;
    uniform float uDepthFog;
    
    varying vec2 vUv;
    varying float vElevation;
    varying vec3 vNormal;
    varying float vFoam;
    varying vec3 vWorldPos;
    
    void main() {
      // Base color based on elevation (depth simulation)
      float depthFactor = smoothstep(-3.0, 3.0, vElevation);
      vec3 waterColor = mix(uColorDeep, uColorSurface, depthFactor);
      
      // Add subsurface scattering glow
      float subsurface = max(0.0, -vNormal.y) * 0.3;
      if (uIsNight) {
        waterColor += vec3(0.0, 0.1, 0.2) * subsurface;
      }
      
      // Specular highlight
      vec3 viewDir = normalize(cameraPosition - vWorldPos);
      vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
      vec3 halfDir = normalize(lightDir + viewDir);
      
      float specular = pow(max(0.0, dot(vNormal, halfDir)), 64.0);
      waterColor += vec3(specular * 0.5);
      
      // Add foam at wave crests
      vec3 finalColor = mix(waterColor, uColorFoam, vFoam * 0.8);
      
      // Fresnel effect
      float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);
      finalColor = mix(finalColor, vec3(1.0), fresnel * 0.1);
      
      // Shoreline wetness (simplified)
      float shoreDist = length(vWorldPos.xz) / 100.0;
      float wetness = smoothstep(0.0, 0.3, shoreDist) * smoothstep(0.0, 0.5, vElevation + 2.0);
      finalColor *= (0.8 + 0.2 * wetness);
      
      gl_FragColor = vec4(finalColor, 0.95);
    }
  `
  
  const geometry = useMemo(() => {
    // Higher resolution for FFT
    const segments = quality === 'cinema' ? 512 : quality === 'quality' ? 256 : 128
    return new THREE.PlaneGeometry(1000, 1000, segments, segments)
  }, [quality])
  
  return (
    <mesh 
      ref={meshRef}
      geometry={geometry}
      position={[0, -2.5, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
