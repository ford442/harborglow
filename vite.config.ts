import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// WebGPU does not require special Vite flags — the browser handles it natively.
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Exclude three/webgpu from pre-bundling since it uses top-level await
    exclude: ['three/webgpu'],
  },
  build: {
    target: 'esnext', // needed for top-level await used by WebGPU renderer
  },
})
