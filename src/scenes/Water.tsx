import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface WaterProps {
  windStrength?: number
}

/**
 * Water — animated ocean plane with vertex displacement simulating waves.
 * Uses a custom ShaderMaterial for rolling waves + reflection shimmer.
 * Performance: single large plane, wave animation in vertex shader via time uniform.
 */
export default function Water({ windStrength = 3 }: WaterProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Wave / reflection shader
  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uWindStrength: { value: windStrength },
        uDeepColor: { value: new THREE.Color('#001830') },
        uShallowColor: { value: new THREE.Color('#003366') },
        uFoamColor: { value: new THREE.Color('#aaccee') },
        uLightDir: { value: new THREE.Vector3(-0.4, 0.8, 0.4).normalize() },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uWindStrength;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vHeight;

        // Simple multi-octave wave
        float wave(vec2 pos, float freq, float speed, float amp) {
          return sin(pos.x * freq + uTime * speed) * cos(pos.y * freq * 0.7 + uTime * speed * 0.8) * amp;
        }

        void main() {
          vec3 pos = position;
          float wind = uWindStrength * 0.05;
          pos.y += wave(pos.xz, 0.08, 0.6, wind * 3.0)
                 + wave(pos.xz, 0.15, 1.1, wind * 1.5)
                 + wave(pos.xz, 0.30, 1.8, wind * 0.6);
          vHeight = pos.y;
          vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

          // Approximate normal
          float eps = 1.0;
          float hL = wave(pos.xz - vec2(eps, 0.0), 0.08, 0.6, wind * 3.0);
          float hR = wave(pos.xz + vec2(eps, 0.0), 0.08, 0.6, wind * 3.0);
          float hD = wave(pos.xz - vec2(0.0, eps), 0.08, 0.6, wind * 3.0);
          float hU = wave(pos.xz + vec2(0.0, eps), 0.08, 0.6, wind * 3.0);
          vNormal = normalize(vec3(hL - hR, 2.0, hD - hU));
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uFoamColor;
        uniform vec3 uLightDir;
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        varying float vHeight;

        void main() {
          // Depth-based colour blend
          float depth = clamp(vHeight * 4.0 + 0.5, 0.0, 1.0);
          vec3 waterColor = mix(uDeepColor, uShallowColor, depth);

          // Simple diffuse + specular
          float diff = max(dot(vNormal, uLightDir), 0.0);
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 halfV = normalize(uLightDir + viewDir);
          float spec = pow(max(dot(vNormal, halfV), 0.0), 64.0) * 0.6;

          // Foam on crests
          float foam = smoothstep(0.12, 0.22, vHeight) * 0.4;
          vec3 color = mix(waterColor, uFoamColor, foam);
          color += diff * 0.15 + spec;

          // Reflection of harbour lights
          float reflStrength = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0) * 0.5;
          color += vec3(0.0, 0.3, 0.6) * reflStrength;

          gl_FragColor = vec4(color, 0.88);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
    }),
    [] // We update windStrength via uniform each frame
  )

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      materialRef.current.uniforms.uWindStrength.value = windStrength
    }
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI * 0.01, 0, 0]}
      position={[0, -1, 0]}
      receiveShadow
    >
      <planeGeometry args={[600, 600, 128, 128]} />
      <shaderMaterial ref={materialRef} args={[shaderArgs]} />
    </mesh>
  )
}
