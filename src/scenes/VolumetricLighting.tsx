import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '../store/useGameStore'

// =============================================================================
// VOLUMETRIC LIGHTING SYSTEM - HarborGlow
// True volumetric fog with ray marching, god rays, and light scattering
// =============================================================================

interface VolumetricLightProps {
  position: [number, number, number]
  target?: [number, number, number]
  color: string
  intensity: number
  angle?: number
  distance?: number
  decay?: number
  type: 'spot' | 'point' | 'directional'
}

// Volumetric fog uniforms - removed unused interface

// Ray marching configuration
const MAX_STEPS = 64
const MAX_DISTANCE = 100.0
const STEP_SIZE = MAX_DISTANCE / MAX_STEPS

// Mie scattering phase function
const miePhaseFunction = `
  float miePhase(float cosTheta, float g) {
    float g2 = g * g;
    float denom = 1.0 + g2 - 2.0 * g * cosTheta;
    return (1.0 - g2) / (4.0 * 3.14159 * pow(denom, 1.5));
  }
`

// Rayleigh scattering phase function
const rayleighPhaseFunction = `
  float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * 3.14159)) * (1.0 + cosTheta * cosTheta);
  }
`

// Volume density function (fog)
const volumeDensity = `
  float getDensity(vec3 pos, float timeOfDay) {
    // Base fog density varies by height
    float heightFog = exp(-pos.y * 0.1);
    
    // Time of day variation
    float timeMultiplier = 1.0;
    if (timeOfDay < 6.0 || timeOfDay > 18.0) {
      // Night - thicker fog
      timeMultiplier = 1.5;
    } else if (timeOfDay > 8.0 && timeOfDay < 16.0) {
      // Day - thinner fog
      timeMultiplier = 0.6;
    }
    
    // Add some noise variation
    float noise = sin(pos.x * 0.1) * sin(pos.y * 0.1) * sin(pos.z * 0.1) * 0.1 + 0.9;
    
    return 0.02 * heightFog * timeMultiplier * noise;
  }
`

// Light contribution calculation
const lightContribution = `
  struct Light {
    vec3 position;
    vec3 color;
    float intensity;
    int type; // 0 = point, 1 = spot, 2 = directional
    vec3 direction;
    float angle;
  };
  
  float getLightAttenuation(Light light, vec3 pos) {
    if (light.type == 0) {
      // Point light
      float dist = length(light.position - pos);
      return light.intensity / (1.0 + dist * dist * 0.01);
    } else if (light.type == 1) {
      // Spot light
      vec3 toLight = light.position - pos;
      float dist = length(toLight);
      toLight = normalize(toLight);
      
      float spotAngle = dot(-toLight, light.direction);
      float spotAtten = smoothstep(cos(light.angle), cos(light.angle * 0.8), spotAngle);
      
      return light.intensity * spotAtten / (1.0 + dist * dist * 0.01);
    } else {
      // Directional light (sun)
      return light.intensity;
    }
  }
  
  vec3 getLightContribution(Light light, vec3 pos, vec3 viewDir, float g) {
    vec3 toLight = light.type == 2 ? -light.direction : normalize(light.position - pos);
    float cosTheta = dot(viewDir, toLight);
    
    float phase = miePhase(cosTheta, g);
    float atten = getLightAttenuation(light, pos);
    
    return light.color * phase * atten;
  }
`

// Shadow sampling (simplified)
const shadowSampling = `
  float sampleShadow(vec3 pos, vec3 lightPos) {
    // Simplified shadow - just check height for ground shadow
    if (pos.y < -2.0) return 0.0;
    
    // Add some soft shadow from crane
    vec3 cranePos = vec3(0.0, 10.0, 5.0);
    float craneDist = length(pos.xz - cranePos.xz);
    if (craneDist < 3.0 && pos.y < cranePos.y) {
      return 1.0 - smoothstep(0.0, 3.0, craneDist);
    }
    
    return 1.0;
  }
`

interface VolumetricFogProps {
  lights: VolumetricLightProps[]
}

export default function VolumetricLighting({ lights }: VolumetricFogProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { camera } = useThree()
  
  const timeOfDay = useGameStore(state => state.timeOfDay)
  const weather = useGameStore(state => state.weather)
  
  // Calculate sun direction based on time
  const sunDirection = useMemo(() => {
    const angle = ((timeOfDay - 6) / 12) * Math.PI // 6am to 6pm
    return new THREE.Vector3(
      Math.cos(angle) * 0.5,
      Math.sin(angle),
      0.3
    ).normalize()
  }, [timeOfDay])
  
  // Sun color based on time
  const sunColor = useMemo(() => {
    if (timeOfDay < 6 || timeOfDay > 20) {
      return new THREE.Color('#1a3a5c') // Night - blue moonlight
    } else if (timeOfDay < 8 || timeOfDay > 18) {
      return new THREE.Color('#ffaa44') // Golden hour
    } else if (timeOfDay < 10 || timeOfDay > 16) {
      return new THREE.Color('#ffdd88') // Warm daylight
    } else {
      return new THREE.Color('#ffffee') // Noon - white
    }
  }, [timeOfDay])
  
  // Fog color based on time and weather
  const fogColor = useMemo(() => {
    if (weather === 'fog') {
      return new THREE.Color('#888899')
    } else if (weather === 'storm') {
      return new THREE.Color('#223344')
    } else if (timeOfDay < 6 || timeOfDay > 20) {
      return new THREE.Color('#0a1520')
    } else if (timeOfDay < 8 || timeOfDay > 18) {
      return new THREE.Color('#2a2015')
    } else {
      return new THREE.Color('#4a5560')
    }
  }, [timeOfDay, weather])
  
  // Prepare light data for shader
  const lightData = useMemo(() => {
    const positions: THREE.Vector3[] = []
    const colors: THREE.Color[] = []
    const intensities: number[] = []
    const types: number[] = []
    const directions: THREE.Vector3[] = []
    const angles: number[] = []
    
    lights.forEach(light => {
      positions.push(new THREE.Vector3(...light.position))
      colors.push(new THREE.Color(light.color))
      intensities.push(light.intensity)
      types.push(light.type === 'point' ? 0 : light.type === 'spot' ? 1 : 2)
      
      if (light.target) {
        const dir = new THREE.Vector3(...light.target).sub(new THREE.Vector3(...light.position)).normalize()
        directions.push(dir)
      } else {
        directions.push(new THREE.Vector3(0, -1, 0))
      }
      
      angles.push(light.angle || Math.PI / 6)
    })
    
    // Add sun as directional light
    positions.push(new THREE.Vector3(0, 100, 0))
    colors.push(sunColor)
    intensities.push(timeOfDay > 6 && timeOfDay < 18 ? 1.0 : 0.2)
    types.push(2)
    directions.push(sunDirection)
    angles.push(0)
    
    return { positions, colors, intensities, types, directions, angles }
  }, [lights, sunColor, sunDirection, timeOfDay])
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCameraPos: { value: new THREE.Vector3() },
    uFogColor: { value: fogColor },
    uFogDensity: { value: weather === 'fog' ? 0.05 : weather === 'storm' ? 0.03 : 0.015 },
    uLightPositions: { value: lightData.positions },
    uLightColors: { value: lightData.colors },
    uLightIntensities: { value: lightData.intensities },
    uLightTypes: { value: lightData.types },
    uLightDirections: { value: lightData.directions },
    uLightAngles: { value: lightData.angles },
    uNumLights: { value: lightData.positions.length },
    uScatterCoeff: { value: 0.8 },
    uAbsorption: { value: 0.1 },
    uAnisotropy: { value: 0.3 },
    uTimeOfDay: { value: timeOfDay },
    uSunDirection: { value: sunDirection },
    uSunColor: { value: sunColor }
  }), [fogColor, lightData, timeOfDay, sunDirection, sunColor, weather])
  
  // Vertex shader - full screen quad
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vRayOrigin;
    varying vec3 vRayDir;
    
    uniform vec3 uCameraPos;
    
    void main() {
      vUv = uv;
      
      // Calculate ray direction for this pixel
      vec4 clipPos = vec4(position.xy * 2.0 - 1.0, 1.0, 1.0);
      vec4 worldPos = inverse(projectionMatrix) * clipPos;
      worldPos = inverse(modelViewMatrix) * vec4(worldPos.xyz / worldPos.w, 1.0);
      
      vRayOrigin = uCameraPos;
      vRayDir = normalize(worldPos.xyz - uCameraPos);
      
      gl_Position = vec4(position.xy * 2.0 - 1.0, 0.0, 1.0);
    }
  `
  
  // Fragment shader with ray marching
  const fragmentShader = `
    uniform float uTime;
    uniform vec3 uCameraPos;
    uniform vec3 uFogColor;
    uniform float uFogDensity;
    uniform vec3 uLightPositions[16];
    uniform vec3 uLightColors[16];
    uniform float uLightIntensities[16];
    uniform int uLightTypes[16];
    uniform vec3 uLightDirections[16];
    uniform float uLightAngles[16];
    uniform int uNumLights;
    uniform float uScatterCoeff;
    uniform float uAbsorption;
    uniform float uAnisotropy;
    uniform float uTimeOfDay;
    uniform vec3 uSunDirection;
    uniform vec3 uSunColor;
    
    varying vec2 vUv;
    varying vec3 vRayOrigin;
    varying vec3 vRayDir;
    
    ${miePhaseFunction}
    ${rayleighPhaseFunction}
    ${volumeDensity}
    ${lightContribution}
    ${shadowSampling}
    
    void main() {
      vec3 rayOrigin = vRayOrigin;
      vec3 rayDir = vRayDir;
      
      // Ray marching setup
      float stepSize = ${STEP_SIZE.toFixed(3)};
      vec3 accumColor = vec3(0.0);
      float transmittance = 1.0;
      
      // Start slightly away from camera to avoid artifacts
      float t = 0.5;
      
      for (int i = 0; i < ${MAX_STEPS}; i++) {
        vec3 pos = rayOrigin + rayDir * t;
        
        // Get density at this position
        float density = getDensity(pos, uTimeOfDay);
        
        if (density > 0.001) {
          // Calculate scattering
          vec3 scattering = vec3(0.0);
          
          for (int j = 0; j < 16; j++) {
            if (j >= uNumLights) break;
            
            Light light;
            light.position = uLightPositions[j];
            light.color = uLightColors[j];
            light.intensity = uLightIntensities[j];
            light.type = uLightTypes[j];
            light.direction = uLightDirections[j];
            light.angle = uLightAngles[j];
            
            vec3 lightContrib = getLightContribution(light, pos, rayDir, uAnisotropy);
            float shadow = sampleShadow(pos, light.position);
            
            scattering += lightContrib * shadow;
          }
          
          // Add ambient scattering
          float ambientScatter = rayleighPhase(dot(rayDir, uSunDirection));
          scattering += uSunColor * ambientScatter * 0.1;
          
          // Beer-Lambert law
          float extinction = uAbsorption + uScatterCoeff;
          float sampleTransmittance = exp(-density * stepSize * extinction);
          
          // Accumulate color
          accumColor += transmittance * scattering * density * stepSize * uScatterCoeff;
          transmittance *= sampleTransmittance;
          
          // Early exit if fully occluded
          if (transmittance < 0.01) break;
        }
        
        t += stepSize;
        if (t > ${MAX_DISTANCE.toFixed(1)}) break;
      }
      
      // Blend with fog color
      vec3 finalColor = accumColor + uFogColor * (1.0 - transmittance) * 0.3;
      
      // Output with alpha based on density
      float alpha = (1.0 - transmittance) * 0.8;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uCameraPos.value.copy(camera.position)
    }
  })
  
  return (
    <mesh ref={meshRef} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Individual volumetric light cone for spotlights
export function VolumetricLightCone({ 
  position, 
  target, 
  color, 
  intensity, 
  angle = Math.PI / 6,
  distance = 50 
}: VolumetricLightProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const direction = useMemo(() => {
    if (target) {
      return new THREE.Vector3(...target).sub(new THREE.Vector3(...position)).normalize()
    }
    return new THREE.Vector3(0, -1, 0)
  }, [position, target])
  
  const rotation = useMemo(() => {
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), direction)
    return new THREE.Euler().setFromQuaternion(quaternion)
  }, [direction])
  
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uIntensity: { value: intensity },
    uDistance: { value: distance },
    uTime: { value: 0 }
  }), [color, intensity, distance])
  
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vLocalPos;
    
    void main() {
      vUv = uv;
      vLocalPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  
  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uDistance;
    uniform float uTime;
    
    varying vec2 vUv;
    varying vec3 vLocalPos;
    
    void main() {
      // Cone shape - fade at edges
      float radialDist = length(vLocalPos.xz);
      float heightFactor = 1.0 - (vUv.y * 0.8);
      float coneWidth = heightFactor * 0.5;
      
      float edgeFade = 1.0 - smoothstep(coneWidth * 0.7, coneWidth, radialDist);
      
      // Distance fade
      float distFade = 1.0 - smoothstep(0.0, uDistance, -vLocalPos.y * uDistance);
      
      // Animated dust particles
      float dust = 0.0;
      for (int i = 0; i < 5; i++) {
        float fi = float(i);
        vec2 dustPos = vLocalPos.xz * (1.0 + fi * 0.2) + uTime * (0.1 + fi * 0.05);
        dust += sin(dustPos.x * 10.0) * sin(dustPos.y * 10.0) * 0.1;
      }
      
      float alpha = edgeFade * distFade * uIntensity * (0.8 + dust);
      
      gl_FragColor = vec4(uColor, alpha * 0.3);
    }
  `
  
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
    >
      <coneGeometry args={[Math.tan(angle) * distance, distance, 32, 1, true]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// God rays from bright lights
export function GodRays({ 
  lightPosition, 
  lightColor, 
  intensity = 1.0,
  numRays = 8 
}: { 
  lightPosition: [number, number, number]
  lightColor: string
  intensity?: number
  numRays?: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  
  const rays = useMemo(() => {
    return Array.from({ length: numRays }, (_, i) => {
      const angle = (i / numRays) * Math.PI * 2
      const length = 20 + Math.random() * 30
      const width = 0.5 + Math.random() * 1.5
      return { angle, length, width }
    })
  }, [numRays])
  
  return (
    <group ref={groupRef} position={lightPosition}>
      {rays.map((ray, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(ray.angle) * ray.length * 0.5,
            Math.sin(ray.angle * 0.3) * 5,
            Math.sin(ray.angle) * ray.length * 0.5
          ]}
          rotation={[0, -ray.angle, Math.PI / 2]}
        >
          <planeGeometry args={[ray.width, ray.length]} />
          <meshBasicMaterial
            color={lightColor}
            transparent
            opacity={0.1 * intensity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// Ship volumetric glow for upgraded ships
export function ShipVolumetricGlow({ 
  position, 
  radius = 10,
  intensity = 0.5,
  color = '#ffaa44'
}: { 
  position: [number, number, number]
  radius?: number
  intensity?: number
  color?: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) },
    uIntensity: { value: intensity },
    uTime: { value: 0 }
  }), [color, intensity])
  
  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  
  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uTime;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      // Fresnel-like effect
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);
      
      // Pulsing glow
      float pulse = 0.8 + sin(uTime * 2.0) * 0.2;
      
      float alpha = fresnel * uIntensity * pulse;
      
      gl_FragColor = vec4(uColor, alpha * 0.5);
    }
  `
  
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  )
}
