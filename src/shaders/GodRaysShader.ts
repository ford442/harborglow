import * as THREE from 'three'

// =============================================================================
// GOD RAYS SHADER — screen-space radial blur toward sun/moon
// GLSL ShaderPass for EffectComposer (WebGL2 + WebGPU compatibility layer)
// =============================================================================

export interface GodRaysShaderUniforms {
  tDiffuse: { value: THREE.Texture | null }
  tDepth: { value: THREE.Texture | null }
  uLightPos: { value: THREE.Vector2 }
  uExposure: { value: number }
  uDecay: { value: number }
  uDensity: { value: number }
  uWeight: { value: number }
  uSamples: { value: number }
  uEnabled: { value: number }
}

export const GodRaysShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tDepth: { value: null as THREE.Texture | null },
    uLightPos: { value: new THREE.Vector2(0.5, 0.5) },
    uExposure: { value: 0.35 },
    uDecay: { value: 0.96 },
    uDensity: { value: 0.92 },
    uWeight: { value: 0.12 },
    uSamples: { value: 32 },
    uEnabled: { value: 1 },
  } satisfies GodRaysShaderUniforms,
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 uLightPos;
    uniform float uExposure;
    uniform float uDecay;
    uniform float uDensity;
    uniform float uWeight;
    uniform int uSamples;
    uniform float uEnabled;

    const int MAX_SAMPLES = 64;

    void main() {
      vec4 baseColor = texture2D(tDiffuse, vUv);
      if (uEnabled < 0.5) {
        gl_FragColor = baseColor;
        return;
      }

      vec2 texCoord = vUv;
      vec2 deltaTexCoord = (texCoord - uLightPos) * uDensity / float(uSamples);
      float centerDepth = texture2D(tDepth, texCoord).r;

      float illuminationDecay = 1.0;
      vec3 godRayColor = vec3(0.0);

      for (int i = 0; i < MAX_SAMPLES; i++) {
        if (i >= uSamples) break;
        texCoord -= deltaTexCoord;
        vec3 sampleColor = texture2D(tDiffuse, texCoord).rgb;
        float sampleDepth = texture2D(tDepth, texCoord).r;

        // Depth occlusion: hulls closer than the background block the shaft
        float occlusion = smoothstep(0.002, 0.018, sampleDepth - centerDepth);

        // Bright-source gate (sky / sun disc / moon)
        float luminance = dot(sampleColor, vec3(0.299, 0.587, 0.114));
        float bright = smoothstep(0.42, 0.88, luminance);

        sampleColor *= occlusion * bright;
        sampleColor *= illuminationDecay * uWeight;
        godRayColor += sampleColor;
        illuminationDecay *= uDecay;
      }

      gl_FragColor = vec4(baseColor.rgb + godRayColor * uExposure, baseColor.a);
    }
  `,
}
