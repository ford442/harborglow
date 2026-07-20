import { useControls } from 'leva'
import { useGameStore, ShipType, CameraMode } from '../../store/useGameStore'
import { musicSystem } from '../../systems/musicSystem'
import { economySystem } from '../../systems/economySystem'
import { ambientMarineLifeSystem } from '../../systems/ambientMarineLifeSystem'
import { timeSystem, DayPhase } from '../../systems/timeSystem'
import { weatherSystem, WeatherType } from '../../systems/weatherSystem'
import { moonSystem, MoonPhaseName } from '../../systems/moonSystem'
import { trafficSystem } from '../../systems/trafficSystem'
import { swaySystem } from '../../systems/swaySystem'
import { stormSystem } from '../../systems/StormSystem'
import { waveSystem } from '../../systems/WaveSystem'
import { trainingSystem, TrainingModuleId } from '../../systems/trainingSystem'
import { dynamicEventSystem } from '../../systems/dynamicEventSystem'
import { reputationSystem } from '../../systems/reputationSystem'
import { harborEventSystem } from '../../systems/eventSystem/HarborEventSystem'
import {
    setCraneSoundVolume,
    setCraneSoundsEnabled,
    playContainerImpact,
    playTwistlockEngage,
} from '../../systems/craneSoundSystem'
import {
    playBirdCall,
    playFoghorn,
    playShipHorn,
    playRadioChatter,
} from '../../systems/ambientSoundSystem'
import type { LevaControlsConfig } from './types'

export type { LevaControlsConfig } from './types'

const CAMERA_MODES = [
    'orbit',
    'crane-cockpit',
    'crane-shoulder',
    'crane-top',
    'ship-low',
    'ship-aerial',
    'ship-water',
    'ship-rig',
    'spectator',
    'crane',
    'booth',
] as const

// Business pattern trigger export functions for Leva
export function triggerGeopoliticalEvent() {
    const regions: ('red_sea' | 'hormuz' | 'panama')[] = ['red_sea', 'hormuz', 'panama']
    const region = regions[Math.floor(Math.random() * regions.length)]
    harborEventSystem.triggerGeopoliticalEvent(region)
}

export function triggerTariffEvent() {
    harborEventSystem.triggerTariffEvent()
}

export function triggerLaborAction() {
    harborEventSystem.triggerLaborAction()
}

export function triggerPeakSeason() {
    harborEventSystem.triggerPeakSeason()
}

export function useLevaControls(config: LevaControlsConfig) {
    const {
        currentShip,
        ships,
        timeOfDay,
        setBPM,
        setLyricsSize,
        setLightIntensity,
        setTimeOfDay,
        setCameraMode,
        weather,
        setWeather,
        setCurrentShip,
        multiviewMode,
        setMultiviewMode,
        underwaterIntensity,
        setUnderwaterIntensity,
        cabinViewMode,
        season,
        setSeason,
        wildlifeDensity,
        setWildlifeDensity,
        enableMarineLife,
        setEnableMarineLife
    } = config

    useControls({
        'Current Ship': {
            value: currentShip?.type || 'cruise',
            options: ['cruise', 'container', 'tanker'],
            onChange: (value: ShipType) => {
                const ship = ships.find(s => s.type === value)
                if (ship) setCurrentShip(ship.id)
            }
        },
        'Music BPM': {
            value: 128,
            min: 60,
            max: 200,
            onChange: (value: number) => {
                setBPM(value)
                musicSystem.setBPM(value)
            }
        },
        'Lyrics Size': {
            value: 28,
            min: 12,
            max: 72,
            onChange: setLyricsSize
        },
        'Light Intensity': {
            value: 1.5,
            min: 0.1,
            max: 5,
            onChange: setLightIntensity
        },
        'Time of Day': {
            value: timeOfDay,
            min: 0,
            max: 24,
            step: 0.5,
            onChange: (hour: number) => {
                setTimeOfDay(hour)
                timeSystem.setGameTime(hour)
            }
        },
        'Time Speed': {
            value: 20,
            min: 1,
            max: 120,
            step: 1,
            onChange: (speed: number) => {
                timeSystem.setTimeScale(speed)
            }
        },
        'Jump to Phase': {
            value: 'sunrise',
            options: ['pre_dawn', 'sunrise', 'mid_morning', 'midday', 'golden_hour', 'night'],
            onChange: (phase: DayPhase) => {
                timeSystem.jumpToPhase(phase)
            }
        },
        'Fog Density': {
            value: 0.02,
            min: 0,
            max: 0.1,
            step: 0.001
        },
        'Marine Layer': {
            value: true
        },
        'Rail Activity': {
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.1
        },
        'Camera Mode': {
            value: 'orbit',
            options: CAMERA_MODES,
            onChange: (mode: string) => {
                setCameraMode(mode as CameraMode)
            }
        },
        'Weather': {
            value: weather,
            options: ['clear', 'rain', 'fog', 'storm', 'golden_hour'],
            onChange: (w: string) => {
                setWeather(w as any)
                weatherSystem.forceWeather(w as WeatherType)
            }
        },
        'Cabin View': {
            value: cabinViewMode,
            options: ['multiview', 'immersive'],
            onChange: (mode: string) => {
                useGameStore.getState().setCabinViewMode(mode as any)
            }
        },
        'Underwater Intensity': {
            value: underwaterIntensity,
            min: 0,
            max: 2,
            step: 0.1,
            onChange: setUnderwaterIntensity
        },
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
        // Storm System Controls
        'Storm Active': {
            value: false,
            folder: 'Storm System',
            onChange: (value: boolean) => {
                useGameStore.getState().setStormActive(value)
                if (value) {
                    stormSystem.start(180)
                } else {
                    stormSystem.stop()
                }
            }
        },
        'Storm Intensity': {
            value: 0,
            min: 0,
            max: 1,
            step: 0.05,
            folder: 'Storm System',
            onChange: (value: number) => {
                useGameStore.getState().setStormIntensity(value)
                waveSystem.setStormIntensity(value)
            }
        },
        'Wind Direction': {
            value: 0,
            min: 0,
            max: 360,
            step: 5,
            folder: 'Storm System',
            onChange: (value: number) => {
                useGameStore.getState().setWindDirection((value * Math.PI) / 180)
            }
        },
        'Wind Strength': {
            value: 0,
            min: 0,
            max: 30,
            step: 1,
            folder: 'Storm System',
            onChange: (value: number) => {
                useGameStore.getState().setWindStrength(value)
            }
        },
        'Rain Density': {
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.05,
            folder: 'Storm System',
            onChange: (value: number) => {
                useGameStore.getState().setRainDensity(value)
            }
        },
        'Start Storm Rescue': {
            value: false,
            folder: 'Storm System',
            onChange: () => {
                const store = useGameStore.getState()
                if (store.operationMode !== 'tugboat') {
                    store.setOperationMode('tugboat')
                }
                // Wait for objectives to spawn then replace first with mission
                setTimeout(() => {
                    const objectives = store.tugboatObjectives
                    if (objectives.length > 0 && !store.activeMission) {
                        const target = objectives[0]
                        const rewards: Record<string, number> = {
                            cruise: 800, container: 1200, tanker: 1500,
                            bulk: 1000, lng: 1400, roro: 900,
                            research: 700, droneship: 600
                        }
                        store.setActiveMission({
                            id: `rescue-${Date.now()}`,
                            type: 'storm_rescue',
                            targetShipType: target.shipType,
                            targetShipId: target.id,
                            timeLimit: 120,
                            timeRemaining: 120,
                            damage: 0,
                            maxDamage: 100,
                            reward: rewards[target.shipType] || 1000,
                            status: 'active',
                            berthCenter: target.berthCenter,
                            berthRadius: target.berthRadius,
                        })
                        stormSystem.start(180)
                        console.log('🆘 Storm Rescue mission started!')
                    }
                }, 100)
            }
        },
        // Tugboat Mode Controls
        'Force Operation Mode': {
            value: 'crane',
            options: ['crane', 'tugboat', 'walking'],
            folder: 'Tugboat Mode',
            onChange: (value: string) => {
                useGameStore.getState().setOperationMode(value as 'crane' | 'tugboat' | 'walking')
            }
        },
        'Storm Duration': {
            value: 180,
            min: 60,
            max: 300,
            step: 10,
            folder: 'Tugboat Mode',
            onChange: (value: number) => {
                if (stormSystem.isActive()) {
                    stormSystem.start(value)
                }
            }
        },
        'Wind Force Multiplier': {
            value: 1.0,
            min: 0,
            max: 3,
            step: 0.1,
            folder: 'Tugboat Mode',
        },
        // Tugboat Environment — hydrodynamic shear tuning
        'Crosscurrent Strength': {
            value: 1.0,
            min: 0,
            max: 3,
            step: 0.1,
            folder: 'Tugboat Environment',
            onChange: (value: number) => {
                stormSystem.crosscurrentStrength = value
            }
        },
        'Wind Shear Scale': {
            value: 1.0,
            min: 0,
            max: 4,
            step: 0.1,
            folder: 'Tugboat Environment',
            onChange: (value: number) => {
                stormSystem.shearTorqueScale = value
            }
        },
        // Training System Controls
        'Quick Start Module': {
            value: 'none',
            options: ['none', 'basic-hooks', 'precision', 'wind-sway', 'night-ops', 'multi-crane', 'emergency', 'light-show'],
            folder: 'Training System',
            onChange: (value: string) => {
                if (value !== 'none') {
                    trainingSystem.startModule(value as TrainingModuleId)
                }
            }
        },
        'Unlock All Modules': {
            value: false,
            folder: 'Training System',
            onChange: () => {
                trainingSystem.unlockAll()
            }
        },
        'Complete All Modules': {
            value: false,
            folder: 'Training System',
            onChange: () => {
                trainingSystem.completeAll()
            }
        },
        'Reset Training': {
            value: false,
            folder: 'Training System',
            onChange: () => {
                trainingSystem.reset()
            }
        },
        // Dynamic Event System Controls
        'Force Storm Event': {
            value: false,
            folder: 'Dynamic Events',
            onChange: () => {
                dynamicEventSystem.forceEvent('atmospheric_river', 0.9)
            }
        },
        'Force Whale Migration': {
            value: false,
            folder: 'Dynamic Events',
            onChange: () => {
                dynamicEventSystem.forceEvent('whale_migration', 0.8)
            }
        },
        'Force Ship Fire': {
            value: false,
            folder: 'Dynamic Events',
            onChange: () => {
                dynamicEventSystem.forceEvent('ship_fire', 0.9)
            }
        },
        'Force Navy Visit': {
            value: false,
            folder: 'Dynamic Events',
            onChange: () => {
                dynamicEventSystem.forceEvent('navy_fleet_week', 0.8)
            }
        },
        'Force Plankton Bloom': {
            value: false,
            folder: 'Dynamic Events',
            onChange: () => {
                dynamicEventSystem.forceEvent('plankton_bloom', 0.85)
            }
        },
        'Clear Dynamic Events': {
            value: false,
            folder: 'Dynamic Events',
            onChange: () => {
                dynamicEventSystem.clearAllEvents()
            }
        },
        'Event Spawn Rate': {
            value: 1.0,
            min: 0,
            max: 3,
            step: 0.1,
            folder: 'Dynamic Events',
            onChange: (value: number) => {
                // Modify event spawn rates
            }
        },
        // Reputation System Controls
        'Add Reputation': {
            value: 100,
            min: 0,
            max: 1000,
            step: 50,
            folder: 'Reputation System',
            onChange: (value: number) => {
                reputationSystem.addDebugReputation(value)
            }
        },
        'Set Tier': {
            value: 'novice',
            options: ['novice', 'apprentice', 'operator', 'veteran', 'expert', 'master', 'legendary'],
            folder: 'Reputation System',
            onChange: (tier: string) => {
                reputationSystem.forceTier(tier as any)
            }
        },
        'Reset Reputation': {
            value: false,
            folder: 'Reputation System',
            onChange: () => {
                reputationSystem.reset()
            }
        },
        'Simulate Installation': {
            value: false,
            folder: 'Reputation System',
            onChange: () => {
                reputationSystem.recordInstallation({
                    success: true,
                    timeSeconds: 25,
                    swayPercent: 0.15,
                    damage: 0
                })
            }
        },
        'Simulate Perfect Install': {
            value: false,
            folder: 'Reputation System',
            onChange: () => {
                reputationSystem.recordInstallation({
                    success: true,
                    timeSeconds: 20,
                    swayPercent: 0.05,
                    damage: 0
                })
            }
        },
        // Sound System Controls
        'Master Volume': {
            value: -8,
            min: -30,
            max: 0,
            step: 1,
            folder: 'Sound Design',
            onChange: (value: number) => {
                setCraneSoundVolume(value)
            }
        },
        'Crane Sounds': {
            value: true,
            folder: 'Sound Design',
            onChange: (enabled: boolean) => {
                setCraneSoundsEnabled(enabled)
            }
        },
        'Play Bird Call': {
            value: false,
            folder: 'Sound Design',
            onChange: () => playBirdCall()
        },
        'Play Foghorn': {
            value: false,
            folder: 'Sound Design',
            onChange: () => playFoghorn()
        },
        'Play Ship Horn': {
            value: false,
            folder: 'Sound Design',
            onChange: () => playShipHorn('far')
        },
        'Play Radio Chatter': {
            value: false,
            folder: 'Sound Design',
            onChange: () => {
                playRadioChatter()
            }
        },
        'Test Impact Sound': {
            value: false,
            folder: 'Sound Design',
            onChange: () => playContainerImpact('medium')
        },
        'Test Lock Sound': {
            value: false,
            folder: 'Sound Design',
            onChange: () => playTwistlockEngage()
        },
        // Economy System Controls
        'Set Credits': {
            value: 0,
            min: 0,
            max: 10000,
            step: 100,
            folder: 'Economy System',
            onChange: (value: number) => {
                economySystem.setCredits(value)
            }
        },
        'Set Reputation': {
            value: 0,
            min: 0,
            max: 1000,
            step: 10,
            folder: 'Economy System',
            onChange: (value: number) => {
                economySystem.setReputation(value)
            }
        },
        'Eco: Simulate Install': {
            value: false,
            folder: 'Economy System',
            onChange: () => {
                economySystem.recordInstallation({
                    rigType: 'rgb_matrix',
                    timeSeconds: 25,
                    targetTimeSeconds: 30,
                    swayPercent: 0.15,
                    syncAccuracy: 0.7,
                    weather: 'clear',
                    isEventActive: false
                })
            }
        },
        'Eco: Simulate Perfect': {
            value: false,
            folder: 'Economy System',
            onChange: () => {
                economySystem.recordInstallation({
                    rigType: 'rgb_matrix',
                    timeSeconds: 20,
                    targetTimeSeconds: 30,
                    swayPercent: 0.05,
                    syncAccuracy: 0.9,
                    weather: 'clear',
                    isEventActive: false
                })
            }
        },
        'Simulate Shift': {
            value: false,
            folder: 'Economy System',
            onChange: () => {
                economySystem.simulateShift(5, 0.6)
            }
        },
        'End Shift': {
            value: false,
            folder: 'Economy System',
            onChange: () => {
                const result = economySystem.endShift()
                console.log(`Shift ended: ${result.credits} HC earned, ${result.reputation} rep gained`)
            }
        },
        'Reset Economy': {
            value: false,
            folder: 'Economy System',
            onChange: () => {
                economySystem.reset()
            }
        },
        // Wave System Controls
        'Wave Amplitude': {
            value: 1.0,
            min: 0.1,
            max: 3.0,
            step: 0.1,
            folder: 'Wave System',
            onChange: (value: number) => {
                useGameStore.getState().setWaveParams({ amplitude: value })
                waveSystem.setParams({ amplitude: value })
            }
        },
        'Wave Speed': {
            value: 1.0,
            min: 0.1,
            max: 3.0,
            step: 0.1,
            folder: 'Wave System',
            onChange: (value: number) => {
                useGameStore.getState().setWaveParams({ speed: value })
                waveSystem.setParams({ speed: value })
            }
        },
        'Wave Chaos': {
            value: 0.0,
            min: 0,
            max: 1.0,
            step: 0.05,
            folder: 'Wave System',
            onChange: (value: number) => {
                useGameStore.getState().setWaveParams({ chaos: value })
                waveSystem.setParams({ chaos: value })
            }
        },
        'Reset Waves': {
            value: false,
            folder: 'Wave System',
            onChange: () => {
                useGameStore.getState().setWaveParams({ amplitude: 1.0, speed: 1.0, chaos: 0.0 })
                waveSystem.setParams({ amplitude: 1.0, speed: 1.0, chaos: 0.0 })
            }
        }
    })
}
