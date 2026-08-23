import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath } from 'node:url'

const isolationHeaders = {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [
        react(),
        // Bundle visualizer for analysis (only in analyze mode)
        mode === 'analyze' && visualizer({
            open: true,
            gzipSize: true,
            brotliSize: true,
        }),
    ].filter(Boolean),
    base: './',
    resolve: {
        // Keep existing Tone-shaped system APIs while running every procedural
        // synth/effect through the WASM AudioWorklet backend.
        alias: {
            tone: fileURLToPath(new URL('./src/systems/audio/toneCompat.ts', import.meta.url)),
        },
    },
    // Ensure .wasm files in public/ are served with the correct MIME type
    assetsInclude: ['**/*.wasm'],
    server: {
        host: true,
        port: 5173,
        headers: isolationHeaders,
    },
    preview: {
        headers: isolationHeaders,
    },
    build: {
        minify: 'terser',
        sourcemap: mode === 'development',
        // esnext required for top-level await inside Three WebGPU and related WGSL modules.
        // The WebGL2 debug fallback path does not exercise this code.
        target: 'esnext',
        // Warn when any chunk exceeds ~1 MB raw (~300 KB gzip for typical JS).
        chunkSizeWarningLimit: 1000,
        modulePreload: false,
        rollupOptions: {
            onwarn(warning, warn) {
                if (warning.code === 'MISSING_EXPORT' || warning.code === 'UNRESOLVED_IMPORT') {
                    throw new Error(`[rollup ${warning.code}] ${warning.message}`)
                }
                warn(warning)
            },
            output: {
                // Manual chunk splitting, matched by resolved module path rather than bare
                // specifier: the object-form of manualChunks only claims whatever a literal
                // specifier resolves to (e.g. 'react-dom' -> react-dom/index.js), so deep
                // imports like 'react-dom/client' or 'three/examples/jsm/...' fell through
                // and got swept into whichever chunk's static dependency walk found them
                // first - putting all of react/react-dom inside vendor-3d and forcing the
                // whole 3D bundle to load eagerly before the app could render anything.
                manualChunks(id) {
                    if (id.includes('node_modules/tone/')) {
                        return 'vendor-audio'
                    }
                    // React/ReactDOM/Scheduler get their own chunk, kept out of vendor-3d,
                    // to avoid __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED errors.
                    if (
                        id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/scheduler/')
                    ) {
                        return 'vendor-react'
                    }
                    // Split vendor-3d along runtime seams. WebGPU/TSL BEFORE the generic
                    // three/ catch-all, or the catch-all absorbs three/webgpu + three/tsl
                    // (both resolve under node_modules/three/) before this seam ever runs.
                    // three/fiber/drei BEFORE rapier so physics WASM does not absorb the
                    // entire Three.js stack.
                    if (
                        id.includes('three.webgpu') ||
                        id.includes('Three.WebGPU') ||
                        id.includes('three.tsl') ||
                        id.includes('Three.TSL') ||
                        id.includes('node_modules/three/src/nodes/')
                    ) {
                        return 'vendor-3d-webgpu'
                    }
                    if (
                        id.includes('node_modules/three/') ||
                        id.includes('node_modules/@react-three/fiber') ||
                        id.includes('node_modules/@react-three/drei')
                    ) {
                        return 'vendor-3d-core'
                    }
                    if (
                        id.includes('node_modules/postprocessing/') ||
                        id.includes('examples/jsm/postprocessing/')
                    ) {
                        return 'vendor-3d-post'
                    }
                    if (
                        id.includes('node_modules/@react-three/rapier') ||
                        id.includes('node_modules/@dimforge/rapier')
                    ) {
                        return 'vendor-3d-rapier'
                    }
                    if (id.includes('node_modules/@react-three/')) {
                        return 'vendor-3d-core'
                    }
                    // Note: Leva and Zustand stay in main bundle.
                },
                // Ensure chunks are named predictably
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name?.split('.') || []
                    const ext = info[info.length - 1]
                    if (/\.(woff2?|ttf|otf)$/.test(assetInfo.name || '')) {
                        return 'assets/fonts/[name][extname]'
                    }
                    if (/\.(png|jpe?g|gif|svg|webp)$/.test(assetInfo.name || '')) {
                        return 'assets/images/[name]-[hash][extname]'
                    }
                    return 'assets/[name]-[hash][extname]'
                },
            },
        },
        // Terser options for better minification
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                passes: 2,
            },
            mangle: {
                safari10: true,
            },
        },
    },
    // Optimize deps for faster dev startup
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'three',
            '@react-three/fiber',
            '@react-three/drei',
            'zustand',
            'tone',
        ],
        exclude: ['@react-three/rapier'], // Heavy, lazy load instead
        // three's WebGPU modules (crawled via the lazy WebGPURenderer import) use
        // top-level await, which the dev optimizer's default target rejects. Match
        // the production build target so `vite dev` can prebundle them.
        esbuildOptions: {
            target: 'esnext',
        },
    },
    test: {
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
        setupFiles: ['./src/test/setup.ts'],
        server: {
            deps: {
                // Tone 14's ESM build uses extensionless relative imports
                // ("./core/Global"), which Node's ESM loader rejects. Inlining
                // routes it through Vite's resolver — the same path the browser
                // build already takes — so store suites that touch the game
                // store (which imports Tone transitively) can load at all.
                inline: ['tone'],
            },
        },
    },
}))
