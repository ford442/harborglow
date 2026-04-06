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
    server: {
        host: true,
        port: 5173
    },
    build: {
        minify: 'terser',
        sourcemap: mode === 'development',
        target: 'es2020',
        // Chunk size warnings (1.3MB gzipped = ~4MB uncompressed)
        chunkSizeWarningLimit: 4000,
        rollupOptions: {
            output: {
                // Manual chunk splitting - only split non-React libraries
                manualChunks: {
                    // 3D libraries only - no React deps
                    'vendor-3d': ['three', '@react-three/fiber', '@react-three/drei', '@react-three/rapier', '@react-three/postprocessing'],
                    // Audio only
                    'vendor-audio': ['tone'],
                    // Note: React, React-DOM, Leva, and Zustand stay in main bundle
                    // to avoid __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED error
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
    },
}))
