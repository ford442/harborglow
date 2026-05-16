import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useShaderTime, weatheringShader } from './LightRigAnimations'

export function FogEffect() {
  const fogRef = useRef<THREE.Mesh>(null)
  const timeRef = useShaderTime()

  // Memoize uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), [])

  // Update time uniform
  useFrame(() => {
    if (fogRef.current) {
      const material = fogRef.current.material as THREE.ShaderMaterial
      if (material.uniforms?.uTime) {
        material.uniforms.uTime.value = timeRef.current
      }
    }
  })

  return (
    <mesh ref={fogRef} position={[0, 10, 0]}>
      <boxGeometry args={[200, 50, 200]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexShader={`
          varying vec3 vWorldPos;
          void main() {
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          varying vec3 vWorldPos;

          ${weatheringShader.functions}

          void main() {
            float noise = fbm(vWorldPos.xz * 0.05 + uTime * 0.1);
            float density = 0.02 + noise * 0.03;
            gl_FragColor = vec4(0.9, 0.95, 1.0, density);
          }
        `}
        uniforms={uniforms}
      />
    </mesh>
  )
}
