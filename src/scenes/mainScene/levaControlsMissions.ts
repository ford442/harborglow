import { useControls } from 'leva'
import { useGameStore } from '../../store/useGameStore'
import { stormSystem } from '../../systems/StormSystem'
import { waveSystem } from '../../systems/WaveSystem'
import { trainingSystem, TrainingModuleId } from '../../systems/trainingSystem'
import { dynamicEventSystem } from '../../systems/dynamicEventSystem'
import { reputationSystem } from '../../systems/reputationSystem'
import { recordHostInput } from '../../systems/sim'

/**
 * Leva debug controls for storms/tugboat missions, the training module
 * quick-start panel, forced dynamic events, and reputation debugging.
 */
export function useMissionLevaControls() {
    useControls({
        // Storm System Controls
        'Storm Active': {
            value: false,
            folder: 'Storm System',
            onChange: (value: boolean) => {
                useGameStore.getState().setStormActive(value)
                if (value) {
                    recordHostInput('storm.start', { duration: 180 })
                } else {
                    recordHostInput('storm.stop', null)
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
                        recordHostInput('storm.start', { duration: 180 }, { alreadyApplied: true })
                        console.log('🆘 Storm Rescue mission started!')
                    }
                }, 100)
            }
        },
        'Start Ice Escort': {
            value: false,
            folder: 'Storm System',
            onChange: () => {
                const store = useGameStore.getState()
                if (store.operationMode !== 'tugboat') {
                    store.setOperationMode('tugboat')
                }
                recordHostInput('mission.iceEscort.start', { seed: 204 })
                console.log('Ice-escort mission started')
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
    })
}
