import { useRef, useMemo } from 'react'
import { Mesh } from 'three'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// =============================================================================
// WATER COMPONENT
// Animated water surface with reflections and night/day variants
// =============================================================================

interface WaterProps {
    isNight?: boolean
}

export default function Water({ isNight = true }: WaterProps) {
    const meshRef = useRef<Mesh>(null)
    const materialRef = useRef<THREE.ShaderMaterial>(null)

    // Custom shader for water animation
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColorDeep: { value: new THREE.Color(isNight ? '#001133' : '#004466') },
        uColorSurface: { value: new THREE.Color(isNight ? '#003355' : '#006699') },
        uColorHighlight: { value: new THREE.Color(isNight ? '#00aaff' : '#88ccff') },
        uReflectivity: { value: isNight ? 0.8 : 0.4 }
    }), [isNight])

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
        }
    })

    const vertexShader = `
        uniform float uTime;
        varying vec2 vUv;
        varying float vElevation;
        varying vec3 vNormal;
        varying vec3 vPosition;

        // Simplex noise function
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

        void main() {
            vUv = uv;
            vPosition = position;
            
            // Multi-layered wave animation
            float elevation = 0.0;
            
            // Large slow waves
            elevation += snoise(position.xy * 0.05 + uTime * 0.3) * 0.5;
            
            // Medium waves
            elevation += snoise(position.xy * 0.1 + uTime * 0.5) * 0.25;
            
            // Small ripples
            elevation += snoise(position.xy * 0.3 + uTime * 0.8) * 0.1;
            
            // Tiny sparkles
            elevation += snoise(position.xy * 0.8 + uTime * 1.2) * 0.05;
            
            vElevation = elevation;
            
            // Calculate normal from height
            float delta = 0.1;
            float hL = snoise((position.xy + vec2(-delta, 0.0)) * 0.1 + uTime * 0.5);
            float hR = snoise((position.xy + vec2(delta, 0.0)) * 0.1 + uTime * 0.5);
            float hD = snoise((position.xy + vec2(0.0, -delta)) * 0.1 + uTime * 0.5);
            float hU = snoise((position.xy + vec2(0.0, delta)) * 0.1 + uTime * 0.5);
            
            vec3 normal = normalize(vec3(hL - hR, hD - hU, 2.0 * delta));
            vNormal = normal;
            
            vec3 newPosition = position + vec3(0.0, 0.0, elevation);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `

    const fragmentShader = `
        uniform vec3 uColorDeep;
        uniform vec3 uColorSurface;
        uniform vec3 uColorHighlight;
        uniform float uReflectivity;
        uniform float uTime;
        
        varying float vElevation;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
            // Mix colors based on elevation
            float mixStrength = (vElevation + 0.5) * 0.8;
            vec3 color = mix(uColorDeep, uColorSurface, mixStrength);
            
            // Add highlights on wave peaks
            float highlight = smoothstep(0.3, 0.5, vElevation);
            color = mix(color, uColorHighlight, highlight * 0.5);
            
            // Add sparkle effect
            float sparkle = sin(vPosition.x * 20.0 + uTime * 2.0) * sin(vPosition.y * 20.0 + uTime * 1.5);
            sparkle = smoothstep(0.9, 1.0, sparkle);
            color += vec3(sparkle * 0.3);
            
            // Fake reflection (simple fresnel)
            vec3 viewDirection = normalize(cameraPosition - vPosition);
            float fresnel = dot(viewDirection, vec3(0.0, 0.0, 1.0));
            fresnel = pow(1.0 - abs(fresnel), 3.0);
            color = mix(color, vec3(1.0), fresnel * uReflectivity * 0.3);
            
            // Add subtle foam at wave crests
            float foam = smoothstep(0.4, 0.5, vElevation);
            color = mix(color, vec3(1.0), foam * 0.2);
            
            gl_FragColor = vec4(color, 0.85);
        }
    `

    return (
        <mesh 
            ref={meshRef} 
            position={[0, -2.5, 0]} 
            rotation={[-Math.PI / 2, 0, 0]}
        >
            <planeGeometry args={[200, 200, 128, 128]} />
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
