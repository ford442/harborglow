import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense } from 'react'
import { Leva } from 'leva'
import MainScene from './scenes/MainScene'
import HUD from './components/HUD'

function App() {
    return (
        <>
            <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
                <Suspense fallback={null}>
                    <Physics>
                        <MainScene />
                    </Physics>
                </Suspense>
            </Canvas>
            <HUD />
            <Leva />
        </>
    )
}

export default App