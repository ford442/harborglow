import { useControls } from 'leva'
import { useGameStore } from '../../store/useGameStore'
import { ambientMarineLifeSystem } from '../../systems/ambientMarineLifeSystem'
import { moonSystem, MoonPhaseName } from '../../systems/moonSystem'
import { trafficSystem } from '../../systems/trafficSystem'
import { swaySystem } from '../../systems/swaySystem'
import { weatherSystem, WeatherType } from '../../systems/weatherSystem'
import type { LevaControlsConfig } from './types'

/**
 * Leva debug controls for ambient/world systems: marine life, ship
 * attachment magnetism, the moon/tide cycle, background harbor traffic,
 * crane load sway tuning, and manual weather overrides.
 */
export function useEnvironmentLevaControls(config: LevaControlsConfig) {
    const { season, setSeason, wildlifeDensity, setWildlifeDensity, enableMarineLife, setEnableMarineLife } = config

    useControls({
        // Marine Life folder
        'Enable Marine Life': {
            value: enableMarineLife,
            folder: 'Marine Life',
            onChange: setEnableMarineLife
        },
        'Wildlife Density': {
            value: wildlifeDensity,
            min: 0,
            max: 1,
            step: 0.05,
            folder: 'Marine Life',
            onChange: setWildlifeDensity
        },
        'Beat Reactivity': {
            value: ambientMarineLifeSystem.getBeatReactivity(),
            min: 0,
            max: 1,
            step: 0.05,
            folder: 'Marine Life',
            onChange: (value: number) => {
                ambientMarineLifeSystem.setBeatReactivity(value)
            }
        },
        'Season': {
            value: season,
            options: ['spring', 'summer', 'fall', 'winter'],
            folder: 'Marine Life',
            onChange: setSeason
        },
        // Phase 9: Attachment System Controls
        'Show Attachments': {
            value: true,
            folder: 'Attachment System',
            onChange: (value: boolean) => {
                useGameStore.getState().setAttachmentSystemConfig({ showPoints: value })
            }
        },
        'Attachment Range': {
            value: 15,
            min: 5,
            max: 50,
            step: 1,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ visibilityRange: value })
            }
        },
        'Snap Radius': {
            value: 5,
            min: 1,
            max: 10,
            step: 0.5,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ snapRadius: value })
            }
        },
        'Snap Strength': {
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.1,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ snapStrength: value })
            }
        },
        'Cable Visibility': {
            value: true,
            folder: 'Attachment System',
            onChange: (value: boolean) => {
                useGameStore.getState().setAttachmentSystemConfig({ showCable: value })
            }
        },
        'Magnetic Enabled': {
            value: true,
            folder: 'Attachment System',
            onChange: (value: boolean) => {
                useGameStore.getState().setAttachmentSystemConfig({ magneticEnabled: value })
            }
        },
        'Magnetic Strength': {
            value: 4.0,
            min: 0.5,
            max: 12,
            step: 0.25,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ magneticStrength: value })
            }
        },
        'Magnetic Damping': {
            value: 0.85,
            min: 0.3,
            max: 1.2,
            step: 0.05,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ magneticDampingRatio: value })
            }
        },
        'Magnetic Curve': {
            value: 2.0,
            min: 0.5,
            max: 5,
            step: 0.25,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ magneticCurve: value })
            }
        },
        'Release Hysteresis': {
            value: 1.5,
            min: 1.0,
            max: 2.5,
            step: 0.1,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ releaseHysteresis: value })
            }
        },
        'Settle Damping': {
            value: 0.8,
            min: 0.5,
            max: 1.0,
            step: 0.05,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ settleDampingMultiplier: value })
            }
        },
        'Settle Duration (ms)': {
            value: 1000,
            min: 200,
            max: 3000,
            step: 100,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ settleDurationMs: value })
            }
        },
        'Capture Velocity': {
            value: 6.0,
            min: 1,
            max: 15,
            step: 0.5,
            folder: 'Attachment System',
            onChange: (value: number) => {
                useGameStore.getState().setAttachmentSystemConfig({ captureVelocity: value })
            }
        },
        // Moon System Controls
        'Moon Phase': {
            value: 'full_moon',
            options: ['new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous', 'full_moon', 'waning_gibbous', 'last_quarter', 'waning_crescent'],
            folder: 'Moon System',
            onChange: (phase: MoonPhaseName) => {
                moonSystem.setPhaseOverride(phase)
            }
        },
        'Clear Moon Override': {
            value: false,
            folder: 'Moon System',
            onChange: () => {
                moonSystem.setPhaseOverride(null)
            }
        },
        'Moon Brightness': {
            value: 1.0,
            min: 0,
            max: 2,
            step: 0.1,
            folder: 'Moon System',
            onChange: (value: number) => {
                moonSystem.setBrightnessMultiplier(value)
            }
        },
        'Tide Strength': {
            value: 1.0,
            min: 0,
            max: 3,
            step: 0.1,
            folder: 'Moon System',
            onChange: (value: number) => {
                moonSystem.setTideStrength(value)
            }
        },
        'Jump to Next Phase': {
            value: false,
            folder: 'Moon System',
            onChange: () => {
                const phases: MoonPhaseName[] = ['new_moon', 'waxing_crescent', 'first_quarter', 'waxing_gibbous', 'full_moon', 'waning_gibbous', 'last_quarter', 'waning_crescent']
                const currentPhase = moonSystem.getPhase()
                const nextIndex = (phases.indexOf(currentPhase) + 1) % phases.length
                moonSystem.jumpToPhase(phases[nextIndex])
            }
        },
        // Traffic System Controls
        'Traffic Density': {
            value: 1.0,
            min: 0.1,
            max: 3.0,
            step: 0.1,
            folder: 'Traffic System',
            onChange: (value: number) => {
                trafficSystem.setDensityMultiplier(value)
            }
        },
        'Time Pressure': {
            value: 1.0,
            min: 0.5,
            max: 2.0,
            step: 0.1,
            folder: 'Traffic System',
            onChange: (value: number) => {
                trafficSystem.setTimePressureMultiplier(value)
            }
        },
        'Simulate Event': {
            value: 'none',
            options: ['none', 'surge', 'strike', 'storm_delay'],
            folder: 'Traffic System',
            onChange: (value: string) => {
                trafficSystem.setSimulationEvent(value === 'none' ? null : value)
            }
        },
        'Force Next Ship': {
            value: false,
            folder: 'Traffic System',
            onChange: () => {
                const docked = trafficSystem.getDockedShip()
                if (docked) {
                    trafficSystem.requestEarlyDeparture(docked.id)
                }
            }
        },
        // Sway System Controls
        'Base Damping': {
            value: 1.0,
            min: 0.5,
            max: 2.0,
            step: 0.1,
            folder: 'Sway System',
            onChange: (value: number) => {
                swaySystem.setDebugDampingMultiplier(value)
            }
        },
        'Load Weight Mult': {
            value: 1.0,
            min: 0.5,
            max: 3.0,
            step: 0.1,
            folder: 'Sway System',
            onChange: (value: number) => {
                swaySystem.setDebugLoadMultiplier(value)
            }
        },
        'Gust Multiplier': {
            value: 1.0,
            min: 0,
            max: 3.0,
            step: 0.1,
            folder: 'Sway System',
            onChange: (value: number) => {
                swaySystem.setDebugGustMultiplier(value)
            }
        },
        'Gust Frequency': {
            value: 1.0,
            min: 0.1,
            max: 3.0,
            step: 0.1,
            folder: 'Sway System',
            onChange: (value: number) => {
                swaySystem.setDebugGustFrequencyMultiplier(value)
            }
        },
        'Gust Duration Min': {
            value: 0.8,
            min: 0.2,
            max: 2.0,
            step: 0.1,
            folder: 'Sway System',
            onChange: (value: number) => {
                swaySystem.setDebugGustDurationRange(value, 4.0)
            }
        },
        'Gust Duration Max': {
            value: 4.0,
            min: 1.0,
            max: 8.0,
            step: 0.1,
            folder: 'Sway System',
            onChange: (value: number) => {
                swaySystem.setDebugGustDurationRange(0.8, value)
            }
        },
        'Show Debug': {
            value: false,
            folder: 'Sway System',
            onChange: (value: boolean) => {
                swaySystem.setShowDebugLines(value)
            }
        },
        // Weather Controls
        'Force Weather': {
            value: 'clear',
            options: ['clear', 'fog', 'rain', 'storm', 'golden_hour'],
            folder: 'Weather',
            onChange: (value: WeatherType) => {
                weatherSystem.forceWeather(value)
            }
        },
        'Clear Weather Override': {
            value: false,
            folder: 'Weather',
            onChange: () => {
                weatherSystem.clearOverride()
            }
        },
    })
}
