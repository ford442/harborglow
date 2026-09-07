import { useControls } from 'leva'
import { useGameStore, ShipType, CameraMode } from '../../store/useGameStore'
import { musicSystem } from '../../systems/musicSystem'
import { economySystem } from '../../systems/economySystem'
import { timeSystem, DayPhase } from '../../systems/timeSystem'
import { weatherSystem, WeatherType } from '../../systems/weatherSystem'
import { waveSystem } from '../../systems/WaveSystem'
import { harborEventSystem } from '../../systems/eventSystem/HarborEventSystem'
import {
    simScheduler,
    serializeReplay,
    parseReplay,
    applyReplayInput,
} from '../../systems/sim'
import { resetDeterministicSystems } from '../../systems/sim/headless'
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
import { useEnvironmentLevaControls } from './levaControlsEnvironment'
import { useMissionLevaControls } from './levaControlsMissions'
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

let levaSimSeed = 1

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
        underwaterIntensity,
        setUnderwaterIntensity,
        cabinViewMode,
    } = config

    useControls({
        'Sim Seed': {
            value: 1,
            min: 1,
            max: 1000000,
            step: 1,
            folder: 'Determinism',
            onChange: (value: number) => {
                levaSimSeed = value
            },
        },
        'Reset To Seed': {
            value: false,
            folder: 'Determinism',
            onChange: (armed: boolean) => {
                if (!armed) return
                simScheduler.reset(levaSimSeed)
                resetDeterministicSystems()
                simScheduler.record('sim.reset', { seed: levaSimSeed })
            },
        },
        'Record Session': {
            value: false,
            folder: 'Determinism',
            onChange: (recording: boolean) => {
                if (recording) {
                    simScheduler.startRecording()
                    return
                }
                if (!simScheduler.isRecording) return
                const file = simScheduler.stopRecording()
                localStorage.setItem('harborglow.replay', serializeReplay(file))
                console.log(`📼 Replay stored (${file.inputs.length} inputs, seed ${file.seed})`)
            },
        },
        'Replay Stored Session': {
            value: false,
            folder: 'Determinism',
            onChange: (armed: boolean) => {
                if (!armed) return
                const raw = localStorage.getItem('harborglow.replay')
                if (!raw) {
                    console.warn('📼 No stored replay')
                    return
                }
                const file = parseReplay(raw)
                simScheduler.loadReplay(file, (entry) => {
                    applyReplayInput(entry)
                })
                resetDeterministicSystems()
            },
        },
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

    useEnvironmentLevaControls(config)
    useMissionLevaControls()
}
