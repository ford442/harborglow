import InteractiveWater from './InteractiveWater'

// =============================================================================
// WATER COMPONENT - HarborGlow Interactive Edition
// Full physics-based water with buoyancy, wakes, and splashes
// =============================================================================

interface WaterProps {
    isNight?: boolean
}

export default function Water({ isNight = true }: WaterProps) {
    return <InteractiveWater isNight={isNight} />
}
