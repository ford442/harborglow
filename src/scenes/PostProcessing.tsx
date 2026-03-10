import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'
import { AudioAnalysisData } from '../systems/audioVisualSync'

// =============================================================================
// POLISHED POST-PROCESSING STACK
// Enhanced bloom, refined LUTs, cohesive night harbor aesthetic
// =============================================================================

interface PostProcessingProps {
  enabled?: boolean
  audioData?: AudioAnalysisData
}

// Refined quality configs for wet industrial harbor look
const QUALITY_CONFIGS = {
  low: {
    bloom: { intensity: 1.2, threshold: 0.5, radius: 0.5 },
    vignette: 0.35,
    chromaticAberration: 0.0,
    filmGrain: 0.015,
    contrast: 1.05,
    dof: false,
    ssao: false
  },
  medium: {
    bloom: { intensity: 1.8, threshold: 0.4, radius: 0.6 },
    vignette: 0.45,
    chromaticAberration: 0.0008,
    filmGrain: 0.025,
    contrast: 1.1,
    dof: true,
    ssao: false
  },
  high: {
    bloom: { intensity: 2.4, threshold: 0.35, radius: 0.75 },
    vignette: 0.55,
    chromaticAberration: 0.0015,
    filmGrain: 0.035,
    contrast: 1.15,
    dof: true,
    ssao: true
  },
  cinema: {
    bloom: { intensity: 3.0, threshold: 0.28, radius: 0.9 },
    vignette: 0.65,
    chromaticAberration: 0.0025,
    filmGrain: 0.045,
    contrast: 1.2,
    dof: true,
    ssao: true
  }
}

// Refined LUTs for wet industrial harbor aesthetic
const COLOR_LUTS = {
  dawn: {
    brightness: 0.92,
    contrast: 1.08,
    saturation: 0.85,
    warmth: 0.25,
    tint: [0.05, 0.03, 0.0] as [number, number, number],
    shadows: [0.04, 0.04, 0.08] as [number, number, number],
    highlights: [1.0, 0.92, 0.75] as [number, number, number],
    bloomTint: '#ffcc80'
  },
  day: {
    brightness: 1.02,
    contrast: 1.02,
    saturation: 0.95,
    warmth: 0.08,
    tint: [0.0, 0.0, 0.0] as [number, number, number],
    shadows: [0.08, 0.09, 0.12] as [number, number, number],
    highlights: [1.0, 0.98, 0.95] as [number, number, number],
    bloomTint: '#ffffff'
  },
  golden: {
    brightness: 0.97,
    contrast: 1.12,
    saturation: 1.05,
    warmth: 0.42,
    tint: [0.15, 0.08, 0.0] as [number, number, number],
    shadows: [0.12, 0.08, 0.04] as [number, number, number],
    highlights: [1.0, 0.88, 0.65] as [number, number, number],
    bloomTint: '#ffaa60'
  },
  blueHour: {
    brightness: 0.88,
    contrast: 1.15,
    saturation: 0.88,
    warmth: -0.15,
    tint: [0.0, 0.03, 0.12] as [number, number, number],
    shadows: [0.02, 0.03, 0.06] as [number, number, number],
    highlights: [0.72, 0.82, 1.0] as [number, number, number],
    bloomTint: '#80c0ff'
  },
  night: {
    brightness: 0.85,
    contrast: 1.18,
    saturation: 0.82,
    warmth: -0.25,
    tint: [0.0, 0.02, 0.06] as [number, number, number],
    shadows: [0.01, 0.02, 0.04] as [number, number, number],
    highlights: [0.65, 0.75, 0.92] as [number, number, number],
    bloomTint: '#60a0ff'
  }
}

export default function PostProcessing({ enabled = true, audioData }: PostProcessingProps) {
  const { scene, camera, gl, size } = useThree()
  
  const qualityPreset = useGameStore(state => state.qualityPreset)
  const isNight = useGameStore(state => state.isNight)
  const timeOfDay = useGameStore(state => state.timeOfDay)
  const bpm = useGameStore(state => state.bpm)
  const ships = useGameStore(state => state.ships)
  const currentShipId = useGameStore(state => state.currentShipId)
  
  const config = QUALITY_CONFIGS[qualityPreset]
  const currentShip = ships.find(s => s.id === currentShipId)
  
  // Check for light show activity
  const lightShowActive = useMemo(() => ships.some(s => s.version === '2.0'), [ships])
  
  // Determine time-based LUT
  const getTimeLUT = useCallback(() => {
    if (timeOfDay >= 5 && timeOfDay < 8) return COLOR_LUTS.dawn
    if (timeOfDay >= 8 && timeOfDay < 17) return COLOR_LUTS.day
    if (timeOfDay >= 17 && timeOfDay < 20) return COLOR_LUTS.golden
    if (timeOfDay >= 20 && timeOfDay < 22) return COLOR_LUTS.blueHour
    return COLOR_LUTS.night
  }, [timeOfDay])
  
  // Composer refs
  const composerRef = useRef<any>(null)
  const bloomPassRef = useRef<any>(null)
  const colorPassRef = useRef<any>(null)
  
  // Initialize post-processing
  useEffect(() => {
    if (!enabled) return
    
    let isMounted = true
    let composer: any = null
    
    const init = async () => {
      try {
        const [
          { EffectComposer },
          { RenderPass },
          { UnrealBloomPass },
          { ShaderPass }
        ] = await Promise.all([
          import('three/examples/jsm/postprocessing/EffectComposer.js'),
          import('three/examples/jsm/postprocessing/RenderPass.js'),
          import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
          import('three/examples/jsm/postprocessing/ShaderPass.js')
        ])
        
        if (!isMounted) return
        
        composer = new EffectComposer(gl)
        composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        
        // Render pass
        composer.addPass(new RenderPass(scene, camera))
        
        // Bloom pass
        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(size.width, size.height),
          config.bloom.intensity,
          0.5,
          config.bloom.threshold
        )
        composer.addPass(bloomPass)
        bloomPassRef.current = bloomPass
        
        // Color grading pass (5.1 Cinematic Color Grading)
        const colorGradingShader = createColorGradingShader(getTimeLUT(), config)
        const colorPass = new ShaderPass(colorGradingShader)
        composer.addPass(colorPass)
        colorPassRef.current = colorPass
        
        // SSAO pass (5.2 Depth-Based Effects - if enabled)
        if (config.ssao) {
          const ssaoPass = createSSAOPass(scene, camera, size)
          if (ssaoPass) composer.addPass(ssaoPass)
        }
        
        composerRef.current = composer
        
      } catch (error) {
        console.warn('Post-processing init failed:', error)
      }
    }
    
    init()
    
    return () => {
      isMounted = false
      composer?.dispose()
    }
  }, [enabled, gl, scene, camera, size, config.bloom.intensity, config.bloom.threshold, config.ssao])
  
  // Update color grading based on time
  useEffect(() => {
    if (colorPassRef.current) {
      const lut = getTimeLUT()
      colorPassRef.current.uniforms.uBrightness.value = lut.brightness
      colorPassRef.current.uniforms.uContrast.value = lut.contrast
      colorPassRef.current.uniforms.uSaturation.value = lut.saturation
      colorPassRef.current.uniforms.uWarmth.value = lut.warmth
      colorPassRef.current.uniforms.uTint.value.set(...lut.tint)
      colorPassRef.current.uniforms.uShadows.value.set(...lut.shadows)
      colorPassRef.current.uniforms.uHighlights.value.set(...lut.highlights)
    }
  }, [getTimeLUT, timeOfDay])
  
  // Beat-reactive bloom and effects
  const beatRef = useRef({ intensity: 1, lastBeat: 0, pulse: 0 })
  
  useFrame((state) => {
    if (!composerRef.current || !enabled) return
    
    const time = state.clock.elapsedTime
    const beatDuration = 60 / bpm
    const beatNum = Math.floor(time / beatDuration)
    
    // Beat pulse detection
    if (beatNum !== beatRef.current.lastBeat && lightShowActive) {
      beatRef.current.intensity = 1.4
      beatRef.current.pulse = 1.0
      beatRef.current.lastBeat = beatNum
    } else {
      beatRef.current.intensity = THREE.MathUtils.lerp(beatRef.current.intensity, 1.0, 0.08)
      beatRef.current.pulse = THREE.MathUtils.lerp(beatRef.current.pulse, 0.0, 0.15)
    }
    
    // Update bloom
    if (bloomPassRef.current) {
      const baseIntensity = config.bloom.intensity * (isNight ? 1.3 : 0.9)
      // PHASE 8: Audio-reactive bloom boost
      const audioBoost = audioData ? audioData.bass * 0.5 + audioData.envelope * 0.3 : 0
      bloomPassRef.current.strength = baseIntensity * beatRef.current.intensity * (1 + audioBoost)
      
      // PHASE 8: Modulate bloom threshold with audio envelope
      if (audioData) {
        const baseThreshold = config.bloom.threshold
        // Lower threshold during high energy = more bloom
        bloomPassRef.current.threshold = baseThreshold - audioData.energy * 0.1
      }
    }
    
    // Update color pass uniforms for animated effects
    if (colorPassRef.current) {
      colorPassRef.current.uniforms.uTime.value = time
      colorPassRef.current.uniforms.uBeatPulse.value = beatRef.current.pulse
      
      // Update DOF focus if enabled
      if (currentShip && config.dof) {
        const shipPos = new THREE.Vector3(...currentShip.position)
        const distance = camera.position.distanceTo(shipPos)
        colorPassRef.current.uniforms.uFocusDistance.value = distance
      }
    }
    
    // Render
    try {
      composerRef.current.render()
    } catch (e) {
      // Silent fail
    }
  })
  
  return null
}

// 5.1 Cinematic Color Grading Shader
function createColorGradingShader(lut: typeof COLOR_LUTS.day, config: typeof QUALITY_CONFIGS.high) {
  return {
    uniforms: {
      tDiffuse: { value: null },
      uBrightness: { value: lut.brightness },
      uContrast: { value: lut.contrast },
      uSaturation: { value: lut.saturation },
      uWarmth: { value: lut.warmth },
      uTint: { value: new THREE.Vector3(...lut.tint) },
      uShadows: { value: new THREE.Vector3(...lut.shadows) },
      uHighlights: { value: new THREE.Vector3(...lut.highlights) },
      uVignette: { value: config.vignette },
      uChromaticAberration: { value: config.chromaticAberration },
      uFilmGrain: { value: config.filmGrain },
      uTime: { value: 0 },
      uBeatPulse: { value: 0 },
      uFocusDistance: { value: 10 },
      uDofEnabled: { value: config.dof ? 1 : 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uBrightness;
      uniform float uContrast;
      uniform float uSaturation;
      uniform float uWarmth;
      uniform vec3 uTint;
      uniform vec3 uShadows;
      uniform vec3 uHighlights;
      uniform float uVignette;
      uniform float uChromaticAberration;
      uniform float uFilmGrain;
      uniform float uTime;
      uniform float uBeatPulse;
      uniform float uFocusDistance;
      uniform float uDofEnabled;
      varying vec2 vUv;
      
      // ACES Filmic Tone Mapping
      vec3 acesFilmic(vec3 x) {
        float a = 2.51;
        float b = 0.03;
        float c = 2.43;
        float d = 0.59;
        float e = 0.14;
        return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
      }
      
      // Contrast adjustment
      vec3 adjustContrast(vec3 color, float contrast) {
        return (color - 0.5) * contrast + 0.5;
      }
      
      // Saturation adjustment
      vec3 adjustSaturation(vec3 color, float saturation) {
        float gray = dot(color, vec3(0.299, 0.587, 0.114));
        return mix(vec3(gray), color, saturation);
      }
      
      // Warmth adjustment
      vec3 adjustWarmth(vec3 color, float warmth) {
        vec3 warm = vec3(1.0, 0.9, 0.8);
        vec3 cool = vec3(0.9, 0.95, 1.0);
        vec3 tint = mix(cool, warm, warmth * 0.5 + 0.5);
        return color * tint;
      }
      
      // Shadow/Highlight adjustment
      vec3 adjustShadowsHighlights(vec3 color, vec3 shadows, vec3 highlights) {
        float luma = dot(color, vec3(0.299, 0.587, 0.114));
        vec3 shadowTint = mix(vec3(1.0), shadows, 1.0 - smoothstep(0.0, 0.3, luma));
        vec3 highlightTint = mix(vec3(1.0), highlights, smoothstep(0.7, 1.0, luma));
        return color * shadowTint * highlightTint;
      }
      
      // Film grain
      float random(vec2 co) {
        return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        vec2 uv = vUv;
        
        // 5.3 Chromatic Aberration
        vec2 center = uv - 0.5;
        float dist = length(center);
        vec2 direction = normalize(center);
        vec2 caOffset = direction * uChromaticAberration * dist * (1.0 + uBeatPulse * 0.5);
        
        float r = texture2D(tDiffuse, uv + caOffset).r;
        float g = texture2D(tDiffuse, uv).g;
        float b = texture2D(tDiffuse, uv - caOffset).b;
        vec3 color = vec3(r, g, b);
        
        // Apply color grading
        color = adjustShadowsHighlights(color, uShadows, uHighlights);
        color = adjustWarmth(color, uWarmth);
        color = adjustSaturation(color, uSaturation);
        color = adjustContrast(color, uContrast);
        color *= uBrightness;
        
        // ACES tone mapping
        color = acesFilmic(color);
        
        // 5.1 Vignette
        float vignette = 1.0 - dist * uVignette * (0.8 + uBeatPulse * 0.3);
        color *= vignette;
        
        // 5.1 Film Grain
        float grain = random(uv + uTime * 0.01);
        color += (grain - 0.5) * uFilmGrain * (1.0 + uBeatPulse * 0.5);
        
        // Color tint
        color += uTint * 0.1;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
  }
}

// 5.2 SSAO Pass (Screen Space Ambient Occlusion)
// Note: Full SSAO requires proper depth texture setup with MRT (Multiple Render Targets)
// This is a placeholder - the color grading pass provides most of the cinematic look
function createSSAOPass(_scene: THREE.Scene, _camera: THREE.Camera, _size: { width: number, height: number }) {
  // SSAO implementation would require:
  // 1. Depth texture from render pass
  // 2. Normal reconstruction or G-buffer
  // 3. Multi-pass blur for noise reduction
  // For now, we rely on the color grading and vignette for depth perception
  return null
}

// Screen Effects toggle hook
export function useScreenEffects() {
  const [retroMode, setRetroMode] = useState(false)
  const [lensDirt, setLensDirt] = useState(true)
  
  return {
    retroMode,
    setRetroMode,
    lensDirt,
    setLensDirt
  }
}
