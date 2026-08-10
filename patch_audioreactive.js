import fs from 'fs'
let code = fs.readFileSync('src/scenes/AudioReactiveLightShow.tsx', 'utf8')

code = code.replace(
  `import { Html } from '@react-three/drei'`,
  `import { Html } from '@react-three/drei'
import { buildRGBMatrixMaterial, buildGodRayMaterial } from '../shaders/lightShowNodes'`
)

// AudioReactiveLight component
code = code.replace(
  `  const flareId = \`show-\${shipId}-\${rigKey}\`
  const colorRef = useRef(new THREE.Color())`,
  `  const flareId = \`show-\${shipId}-\${rigKey}\`
  const material = useMemo(() => buildRGBMatrixMaterial(color), [color])`
)

code = code.replace(
  `    const baseColor = getShipColor(response.hueShift, colorRef.current)
    const drive = computeRigMusicDrive(response.intensity, musicStateRef.current, delta)
    musicStateRef.current = drive.state
    powerRef.current = drive.emissive

    const material = meshRef.current.material as THREE.MeshStandardMaterial
    material.emissiveIntensity = drive.emissive * (0.75 + seed * 0.2)
    material.emissive.copy(baseColor)

    lightRef.current.intensity = drive.light * 2
    lightRef.current.color.copy(baseColor)`,
  `    const drive = computeRigMusicDrive(response.intensity, musicStateRef.current, delta)
    musicStateRef.current = drive.state
    powerRef.current = drive.emissive

    const mat = material as any
    if (mat.userData.uBass) mat.userData.uBass.value = audioData.bass
    if (mat.userData.uBeat) mat.userData.uBeat.value = audioData.beat ? 1 : 0
    if (mat.userData.uMid) mat.userData.uMid.value = audioData.mid
    if (mat.userData.uTreble) mat.userData.uTreble.value = audioData.treble
    
    // We still update intensity on the material itself if needed, but TSL handles emissive now
    mat.emissiveIntensity = drive.emissive * (0.75 + seed * 0.2)

    lightRef.current.intensity = drive.light * 2`
)

code = code.replace(
  `      <mesh ref={meshRef} geometry={geometry} position={[0, housing.h * 0.35, housing.d * 0.35]}>
        <meshStandardMaterial
          color={0x111111}
          emissive={color}
          emissiveIntensity={0.5}
          toneMapped={false}
          roughness={0.2}
          metalness={0.15}
        />
      </mesh>`,
  `      <mesh ref={meshRef} geometry={geometry} position={[0, housing.h * 0.35, housing.d * 0.35]} material={material} />`
)

// AudioReactiveGodRay component
code = code.replace(
  `// 8.2: Audio-Reactive God Rays with shader uniforms
function AudioReactiveGodRay({ position, color }: { position: [number, number, number], color: string }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { audioData } = useAudioVisualSync()
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uBaseIntensity: { value: 0.5 },
    uAudioBass: { value: 0 },
    uAudioMid: { value: 0 },
    uAudioEnvelope: { value: 0 },
    uAudioBeat: { value: 0 }
  }), [color])
  
  useFrame((state) => {
    if (!materialRef.current) return
    
    const mat = materialRef.current
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uAudioBass.value = audioData.bass
    mat.uniforms.uAudioMid.value = audioData.mid
    mat.uniforms.uAudioEnvelope.value = audioData.envelope
    mat.uniforms.uAudioBeat.value = audioData.beat ? audioData.beatIntensity : 0
  })
  
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <coneGeometry args={[2, 20, 32, 1, true]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={\`
          varying vec2 vUv;
          varying float vHeight;
          void main() {
            vUv = uv;
            vHeight = position.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        \`}
        fragmentShader={\`
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uBaseIntensity;
          uniform float uAudioBass;
          uniform float uAudioMid;
          uniform float uAudioEnvelope;
          uniform float uAudioBeat;
          
          varying vec2 vUv;
          varying float vHeight;
          
          void main() {
            // Base fade from bottom to top
            float alpha = (1.0 - vUv.y) * uBaseIntensity;
            
            // Audio-reactive intensity
            float audioBoost = uAudioBass * 0.5 + uAudioMid * 0.3;
            alpha *= (1.0 + audioBoost);
            
            // Beat flash
            if (uAudioBeat > 0.5) {
              alpha *= 1.5;
            }
            
            // Animated shimmer synced to envelope
            float shimmer = 0.8 + 0.2 * sin(uTime * 3.0 + vUv.y * 8.0 + uAudioEnvelope * 5.0);
            alpha *= shimmer;
            
            // Color temperature shift based on mid frequencies
            vec3 finalColor = uColor;
            if (uAudioMid > 0.5) {
              finalColor = mix(finalColor, vec3(1.0, 0.9, 0.7), uAudioMid * 0.3);
            }
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        \`}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}`,
  `// 8.2: Audio-Reactive God Rays with shader uniforms
function AudioReactiveGodRay({ position, color }: { position: [number, number, number], color: string }) {
  const { audioData } = useAudioVisualSync()
  const material = useMemo(() => buildGodRayMaterial(color), [color])
  
  useFrame((state) => {
    if (!material) return
    const mat = material as any
    if (mat.userData.uAudioBass) mat.userData.uAudioBass.value = audioData.bass
    if (mat.userData.uAudioMid) mat.userData.uAudioMid.value = audioData.mid
    if (mat.userData.uAudioEnvelope) mat.userData.uAudioEnvelope.value = audioData.envelope
    if (mat.userData.uAudioBeat) mat.userData.uAudioBeat.value = audioData.beat ? audioData.beatIntensity : 0
  })
  
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <coneGeometry args={[2, 20, 32, 1, true]} />
    </mesh>
  )
}`
)

fs.writeFileSync('src/scenes/AudioReactiveLightShow.tsx', code)
