// Rolldown `codeSplitting.groups` for the production build, imported by
// vite.config.ts. Lives in its own module so src/test/__tests__/viteChunkGroups.test.ts
// can check every package in the R3F dependency closure against the same list
// the build uses. See AGENTS.md "Chunk groups and boot".

export const codeSplittingGroups = [
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
    // The R3F ecosystem's transitive deps MUST be grouped here with
    // three/fiber/drei. With includeDependenciesRecursively: false,
    // anything left ungrouped (three-stdlib's GLTFLoader, troika-three-text,
    // fflate, suspend-react, ...) is emitted into whichever app chunk first
    // reaches it (MainScene, or a chunk of its own), and vendor-3d-core
    // (drei) imports it back. That chunk cycle evaluates
    // `GLTFLoader extends Loader` before `Loader` exists and the production
    // build dies at boot with "Class extends value undefined is not a
    // constructor or null" (main, 2026-09-27 → 2026-10-04). The list is the
    // runtime `dependencies` closure of @react-three/fiber 9.7,
    // @react-three/drei 10.7, three-stdlib 2.36 and troika-three-text 0.52,
    // minus react/react-dom/scheduler (vendor-react), zustand and
    // use-sync-external-store (shared with the store, stay in the main graph)
    // and @react-three/rapier (its own group below).
    {
        name: 'vendor-3d-core',
        test: new RegExp(
            `node_modules[\\\\/](${[
                'three',
                'three-stdlib',
                'three-mesh-bvh',
                '@react-three[\\\\/](fiber|drei)',
                '@babel[\\\\/]runtime',
                '@mediapipe',
                '@monogrid',
                '@use-gesture',
                'base64-js',
                'bidi-js',
                'buffer',
                'camera-controls',
                'detect-gpu',
                'draco3d',
                'fflate',
                'glsl-noise',
                'hls\\.js',
                'its-fine',
                'maath',
                'meshline',
                'potpack',
                'react-use-measure',
                'stats-gl',
                'stats\\.js',
                'suspend-react',
                'troika-three-text',
                'troika-three-utils',
                'troika-worker-utils',
                'tunnel-rat',
                'utility-types',
                'webgl-sdf-generator',
            ].join('|')})[\\\\/]`,
        ),
        priority: 30,
    },
    {
        name: 'vendor-3d-rapier',
        test: /node_modules[\\/](@react-three[\\/]rapier|@dimforge[\\/]rapier)/,
        priority: 20,
    },
]
