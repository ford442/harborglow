import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

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
        target: 'esnext',
        // Warn when any chunk exceeds ~1 MB raw (~300 KB gzip for typical JS).
        chunkSizeWarningLimit: 1000,
        modulePreload: false,
        rolldownOptions: {
            onwarn(warning, warn) {
                if (warning.code === 'MISSING_EXPORT' || warning.code === 'UNRESOLVED_IMPORT') {
                    throw new Error(`[rollup ${warning.code}] ${warning.message}`)
                }
                warn(warning)
            },
            output: {
                // Chunk groups, matched by resolved module path (not bare specifier), so
                // deep imports like 'react-dom/client' or 'three/examples/jsm/...' land in
                // the intended chunk instead of being swept into whichever chunk's static
                // dependency walk found them first (which put react inside vendor-3d and
                // forced the whole 3D bundle to load before the app could render).
                // rolldown picks the group with the highest `priority`, so the ordering
                // the old manualChunks relied on is expressed as descending priorities.
                // Leva and Zustand stay in the main bundle.
                codeSplitting: {
                    // Only claim modules the group regex matches; the default (true) drags a
                    // matched module's dependencies in too, e.g. three.core.js into the webgpu chunk.
                    includeDependenciesRecursively: false,
                    groups: [
                        // React/ReactDOM/Scheduler: own chunk, kept out of vendor-3d, to
                        // avoid __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED errors.
                        {
                            name: 'vendor-react',
                            test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                            priority: 60,
                        },
                        // The WebGPU/TSL seam MUST outrank the generic `node_modules/three/`
                        // group, otherwise three.webgpu / three.tsl (whose resolved ids also
                        // contain `node_modules/three/`) get absorbed into vendor-3d-core
                        // and vendor-3d-webgpu is never emitted (breaking the bundle budget).
                        {
                            name: 'vendor-3d-webgpu',
                            test: /three\.webgpu|Three\.WebGPU|three\.tsl|Three\.TSL|node_modules[\\/]three[\\/]src[\\/]nodes[\\/]/,
                            priority: 50,
                        },
                        // TSL display addons (bloom/ssr) outrank core so they land here.
                        {
                            name: 'vendor-3d-post',
                            test: /examples[\\/]jsm[\\/]tsl[\\/]|addons[\\/]tsl[\\/]/,
                            priority: 40,
                        },
                        {
                            name: 'vendor-3d-core',
                            test: /node_modules[\\/](three[\\/]|@react-three[\\/](fiber|drei))/,
                            priority: 30,
                        },
                        {
                            name: 'vendor-3d-rapier',
                            test: /node_modules[\\/](@react-three[\\/]rapier|@dimforge[\\/]rapier)/,
                            priority: 20,
                        },
                    ],
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
        ],
        exclude: ['@react-three/rapier'], // Heavy, lazy load instead
        // three's WebGPU modules (crawled via the lazy WebGPURenderer import) use
        // top-level await, which the dev optimizer's default target rejects. Match
        // the production build target so `vite dev` can prebundle them.
        rolldownOptions: {
            transform: { target: 'esnext' },
        },
    },
    test: {
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
        setupFiles: ['./src/test/setup.ts'],
    },
}))
