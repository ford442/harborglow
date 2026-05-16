import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

// =============================================================================
// SHADER MATERIALS AND TEXTURES FOR CONTROL BOOTH
// =============================================================================

// CRT Scanline + Flicker Shader
export const CRTShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uTexture: null,
    uFlickerIntensity: 0.02,
    uScanlineIntensity: 0.15,
    uVignetteIntensity: 0.3,
    uRgbShift: 0.002,
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform sampler2D uTexture;
    uniform float uFlickerIntensity;
    uniform float uScanlineIntensity;
    uniform float uVignetteIntensity;
    uniform float uRgbShift;
    
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      
      float flicker = 1.0 + sin(uTime * 10.0) * uFlickerIntensity * 0.5;
      flicker += sin(uTime * 23.7) * uFlickerIntensity * 0.3;
      
      float r = texture2D(uTexture, uv + vec2(uRgbShift, 0.0)).r;
      float g = texture2D(uTexture, uv).g;
      float b = texture2D(uTexture, uv - vec2(uRgbShift, 0.0)).b;
      
      vec3 color = vec3(r, g, b) * flicker;
      
      float scanline = sin(uv.y * 800.0) * 0.5 + 0.5;
      scanline = pow(scanline, 2.0) * uScanlineIntensity;
      color -= scanline;
      
      float vignette = distance(uv, vec2(0.5));
      vignette = smoothstep(0.3, 0.9, vignette) * uVignetteIntensity;
      color *= (1.0 - vignette);
      
      color.r *= 1.05;
      color.b *= 0.95;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
)

extend({ CRTShaderMaterial })

// Glass distortion shader for window
export const FoggedGlassMaterial = shaderMaterial(
  {
    uTime: 0,
    uFogDensity: 0.3,
    uOpacity: 0.15,
  },
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform float uFogDensity;
    uniform float uOpacity;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      float fog = sin(vUv.x * 20.0 + uTime * 0.1) * cos(vUv.y * 15.0 + uTime * 0.15);
      fog = fog * 0.5 + 0.5;
      fog = pow(fog, 3.0) * uFogDensity;
      
      vec3 color = vec3(0.85, 0.9, 0.95) * (0.9 + fog * 0.2);
      
      gl_FragColor = vec4(color, uOpacity + fog * 0.1);
    }
  `
)

extend({ FoggedGlassMaterial })

// Material factory
export interface ThemeConfig {
  wall: number
  accent: number
  metal: number
}

export const getThemeConfig = (harborTheme: 'industrial' | 'arctic' | 'tropical'): ThemeConfig => {
  switch (harborTheme) {
    case 'arctic':
      return { wall: 0xc5d5e0, accent: 0x00aaff, metal: 0x4a5568 }
    case 'tropical':
      return { wall: 0xd4c4a8, accent: 0xff9500, metal: 0x5a5a5a }
    default:
      return { wall: 0x2a2a35, accent: 0xff6600, metal: 0x3a3a45 }
  }
}

export const createControlBoothMaterials = (harborTheme: 'industrial' | 'arctic' | 'tropical') => {
  const theme = getThemeConfig(harborTheme)
  
  return {
    wall: new THREE.MeshStandardMaterial({
      color: theme.wall,
      metalness: 0.7,
      roughness: 0.6,
      side: THREE.DoubleSide
    }),
    floor: new THREE.MeshStandardMaterial({
      color: 0x1a1a20,
      metalness: 0.5,
      roughness: 0.8,
      side: THREE.DoubleSide
    }),
    metalFrame: new THREE.MeshStandardMaterial({
      color: theme.metal,
      metalness: 0.9,
      roughness: 0.3
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.4
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.05,
      transmission: 0.95,
      thickness: 0.1,
      transparent: true,
      opacity: 0.1,
      envMapIntensity: 1
    }),
    foggedGlass: new THREE.MeshPhysicalMaterial({
      color: 0xe8f4f8,
      metalness: 0.1,
      roughness: 0.2,
      transmission: 0.7,
      thickness: 0.05,
      transparent: true,
      opacity: 0.3,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: theme.accent,
      emissive: theme.accent,
      emissiveIntensity: 0.2,
      metalness: 0.6,
      roughness: 0.4
    }),
    buttonActive: new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.3
    }),
    buttonInactive: new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.5,
      roughness: 0.5
    })
  }
}
