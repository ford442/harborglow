import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

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
    // Ensure .wasm files in public/ are served with the correct MIME type
    assetsInclude: ['**/*.wasm'],
    server: {
        host: true,
        port: 5173
    },
    build: {
        minify: 'terser',
        sourcemap: mode === 'development',
        // esnext required for top-level await inside three/examples/jsm WebGPURenderer and related WGSL modules.
        // The WebGL2 debug fallback path does not exercise this code.
        target: 'esnext',
        // Chunk size warnings (1.3MB gzipped = ~4MB uncompressed)
        chunkSizeWarningLimit: 4000,
        rollupOptions: {
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
                    // 3D libraries, including their deep submodule imports (e.g.
                    // three/examples/jsm/*) which a bare 'three' specifier wouldn't catch,
                    // and the standalone 'postprocessing' package @react-three/postprocessing
                    // wraps.
                    if (
                        id.includes('node_modules/three/') ||
                        id.includes('node_modules/@react-three/') ||
                        id.includes('node_modules/postprocessing/')
                    ) {
                        return 'vendor-3d'
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
