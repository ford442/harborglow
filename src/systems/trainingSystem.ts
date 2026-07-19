// =============================================================================
// TRAINING SYSTEM - HarborGlow Crane Operator Training Simulations
// Professional training mode with progressive skill development
// =============================================================================

import { useGameStore, ShipType, WeatherState } from '../store/useGameStore'
import { reputationSystem } from './reputationSystem'
import {
  TrainingRuntimeState,
  DEFAULT_TRAINING_RUNTIME,
  evaluateCompletedObjectives,
} from './trainingObjectiveEvaluator'
import { ShipSpawner } from './shipSpawner'
import { stormSystem } from './StormSystem'

// =============================================================================
// TRAINING MODULE TYPES
// =============================================================================

export type TrainingModuleId = 
  | 'basic-hooks'      // Module 1: Basic Hook Control
  | 'precision'        // Module 2: Precision Placement
  | 'wind-sway'        // Module 3: Wind & Sway Management
  | 'night-ops'        // Module 4: Night Operations
  | 'tugboat-basics'   // Tugboat Module 1: Basic tug handling
  | 'twin-screw-differential' // Tugboat Module 2: Differential thrust
  | 'acoustic-handshake' // Tugboat Module 3: Acoustic handshake protocol
  | 'storm-rescue'     // Tugboat Module 4: Controlled storm tow
  | 'multi-crane'      // Module 5: Multi-Crane Coordination
  | 'emergency'        // Module 6: Emergency Response
  | 'light-show'       // Module 7: Advanced Light Show Install

export const TUGBOAT_TRAINING_MODULE_IDS: TrainingModuleId[] = [
  'tugboat-basics',
  'twin-screw-differential',
  'acoustic-handshake',
  'storm-rescue',
]

export function isTugboatTrainingModule(moduleId: TrainingModuleId): boolean {
  return TUGBOAT_TRAINING_MODULE_IDS.includes(moduleId)
}

export type TrainingRank = 'S' | 'A' | 'B' | 'C' | 'F'
export type TrainingState = 'locked' | 'available' | 'in-progress' | 'completed'

export interface TrainingObjective {
  id: string
  title: string
  description: string
  completed: boolean
  progress: number // 0-100
}

export interface TrainingMetrics {
  timeElapsed: number
  maxSway: number
  totalDamage: number
  accuracyScore: number
  installationsCompleted: number
  installationsTarget: number
}

export interface TrainingResult {
  moduleId: TrainingModuleId
  rank: TrainingRank
  score: number
  metrics: TrainingMetrics
  completedAt: number
  attempts: number
}

export interface TrainingModule {
  id: TrainingModuleId
  title: string
  description: string
  difficulty: 1 | 2 | 3 | 4 | 5
  estimatedTime: number // minutes
  shipType: ShipType
  weather: WeatherState
  timeOfDay: number // 0-24
  prerequisites: TrainingModuleId[]
  objectives: Omit<TrainingObjective, 'completed' | 'progress'>[]
  rewards: {
    reputation: number
    unlocks: string[]
  }
  tutorial: TrainingStep[]
}

export interface TrainingStep {
  id: string
  title: string
  message: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  highlightElement?: string // CSS selector or element ID
  voiceLine?: string
  waitForAction?: boolean
  actionType?: 'move' | 'lower' | 'install' | 'wait'
}

// =============================================================================
// TRAINING MODULE DEFINITIONS
// =============================================================================

export const TRAINING_MODULES: TrainingModule[] = [
  // ============================================================================
  // MODULE 1: Basic Hook Control
  // ============================================================================
  {
    id: 'basic-hooks',
    title: 'Basic Hook Control',
    description: 'Master the fundamentals of crane operation in clear weather. Learn to move, lower, and stabilize the spreader.',
    difficulty: 1,
    estimatedTime: 5,
    shipType: 'container',
    weather: 'clear',
    timeOfDay: 12,
    prerequisites: [],
    objectives: [
      { id: 'move-to-target', title: 'Navigate to Target', description: 'Move the spreader to the designated practice zone' },
      { id: 'lower-securely', title: 'Controlled Lowering', description: 'Lower the spreader smoothly to 2m above deck' },
      { id: 'hold-position', title: 'Hold Position', description: 'Maintain position for 5 seconds with <10% sway' },
      { id: 'return-home', title: 'Return Home', description: 'Return spreader to starting position' }
    ],
    rewards: {
      reputation: 50,
      unlocks: ['precision-module', 'basic-crane-skin']
    },
    tutorial: [
      { id: 'welcome', title: 'Welcome', message: 'Welcome to HarborGlow Training. I\'ll be your instructor today.', voiceLine: 'training_welcome' },
      { id: 'controls-move', title: 'Movement', message: 'Use WASD or the joystick to move the spreader horizontally.', position: 'bottom', waitForAction: true, actionType: 'move' },
      { id: 'controls-lower', title: 'Lowering', message: 'Press Q/E or use the second joystick to raise and lower the spreader.', position: 'bottom', waitForAction: true, actionType: 'lower' },
      { id: 'first-target', title: 'First Target', message: 'Navigate to the green marker on the ship deck.', highlightElement: '.target-marker', waitForAction: true, actionType: 'move' },
      { id: 'sway-intro', title: 'Understanding Sway', message: 'Watch the sway indicator. Movement creates momentum - plan your stops.', position: 'left' },
      { id: 'lower-practice', title: 'Lower Practice', message: 'Lower to 2m above deck. Slow and steady wins.', waitForAction: true, actionType: 'lower' },
      { id: 'hold-steady', title: 'Hold Steady', message: 'Hold position for 5 seconds. Keep sway under control!', waitForAction: true, actionType: 'wait' },
      { id: 'complete', title: 'Module Complete', message: 'Excellent work! You\'re ready for precision training.', voiceLine: 'training_complete_basic' }
    ]
  },

  // ============================================================================
  // MODULE 2: Precision Placement
  // ============================================================================
  {
    id: 'precision',
    title: 'Precision Placement',
    description: 'Install LED light rigs on attachment points with millimeter precision. Master the art of delicate placement.',
    difficulty: 2,
    estimatedTime: 8,
    shipType: 'cruise',
    weather: 'clear',
    timeOfDay: 14,
    prerequisites: ['basic-hooks'],
    objectives: [
      { id: 'install-funnel', title: 'Funnel Installation', description: 'Install RGB matrix on the ship funnel' },
      { id: 'install-bridge', title: 'Bridge Installation', description: 'Install projector on the bridge' },
      { id: 'install-rails', title: 'Rail Installation', description: 'Install LED strips on deck rails' },
      { id: 'zero-damage', title: 'Zero Damage', description: 'Complete without any ship contact damage' }
    ],
    rewards: {
      reputation: 100,
      unlocks: ['wind-sway-module', 'precision-operator-title']
    },
    tutorial: [
      { id: 'intro-precision', title: 'Precision Work', message: 'Light rig installation requires precision. Watch for the magnetic snap zones.', voiceLine: 'training_precision_intro' },
      { id: 'attachment-points', title: 'Attachment Points', message: 'Colored markers indicate rig types. Cyan = RGB, Purple = Projector.', highlightElement: '.attachment-point' },
      { id: 'snap-zones', title: 'Magnetic Snap', message: 'When close to an attachment point, you\'ll feel magnetic assistance.', position: 'right' },
      { id: 'first-install', title: 'First Installation', message: 'Navigate to the funnel. Get within 2m to begin installation.', waitForAction: true, actionType: 'install' },
      { id: 'twistlock', title: 'Twistlock', message: 'The twistlock engages automatically when aligned. Green = locked, Red = open.', highlightElement: '.twistlock-indicator' },
      { id: 'accuracy-matters', title: 'Accuracy Matters', message: 'Sway and misalignment slow installation. Stay steady for best results.', position: 'left' },
      { id: 'complete-all', title: 'Install All', message: 'Install all three light rigs to complete the module.', waitForAction: true, actionType: 'install' }
    ]
  },

  // ============================================================================
  // MODULE 3: Wind & Sway Management
  // ============================================================================
  {
    id: 'wind-sway',
    title: 'Wind & Sway Management',
    description: 'Operate in challenging weather conditions. Learn to anticipate and compensate for wind gusts and load sway.',
    difficulty: 3,
    estimatedTime: 10,
    shipType: 'bulk',
    weather: 'storm',
    timeOfDay: 10,
    prerequisites: ['precision'],
    objectives: [
      { id: 'survive-gusts', title: 'Survive Gusts', description: 'Complete installations during 3 wind gusts' },
      { id: 'sway-control', title: 'Sway Control', description: 'Keep average sway below 30% during operations' },
      { id: 'install-weather', title: 'Weather Installation', description: 'Install 4 light rigs despite the storm' },
      { id: 'no-emergency', title: 'No Emergency Stop', description: 'Complete without using emergency brake' }
    ],
    rewards: {
      reputation: 150,
      unlocks: ['night-ops-module', 'storm-operator-badge']
    },
    tutorial: [
      { id: 'weather-warning', title: 'Weather Alert', message: 'Storm conditions detected. Wind speeds up to 25 m/s expected.', voiceLine: 'training_storm_warning' },
      { id: 'gust-forecast', title: 'Gust Forecast', message: 'Watch the weather panel. Wind arrows indicate gust direction.', position: 'right', highlightElement: '.weather-panel' },
      { id: 'sway-physics', title: 'Sway Physics', message: 'Wind creates pendulum motion. Counter-sway by moving into the wind.', position: 'left' },
      { id: 'timing', title: 'Timing is Everything', message: 'Wait for lulls between gusts. Patience is safer than speed.', waitForAction: true, actionType: 'wait' },
      { id: 'emergency-brake', title: 'Emergency Brake', message: 'Space bar engages emergency brake. Use sparingly - it stresses the cable.', highlightElement: '.emergency-brake' },
      { id: 'stability-bonus', title: 'Stability Bonus', message: 'Low sway = faster installs. The ship crew is watching!', position: 'bottom' }
    ]
  },

  // ============================================================================
  // MODULE 4: Night Operations
  // ============================================================================
  {
    id: 'night-ops',
    title: 'Night Operations',
    description: 'Master crane operation in darkness. Rely on camera feeds, instrument panels, and ship lighting to complete installations.',
    difficulty: 4,
    estimatedTime: 12,
    shipType: 'tanker',
    weather: 'clear',
    timeOfDay: 23,
    prerequisites: ['wind-sway'],
    objectives: [
      { id: 'camera-reliance', title: 'Camera Reliance', description: 'Complete 3 installations using only camera feeds' },
      { id: 'night-lights', title: 'Night Lights', description: 'Install emergency strobes on all designated points' },
      { id: 'no-collisions', title: 'Collision-Free', description: 'Complete without any collisions in low visibility' },
      { id: 'efficiency', title: 'Night Efficiency', description: 'Complete within time limit with >80% accuracy' }
    ],
    rewards: {
      reputation: 200,
      unlocks: ['multi-crane-module', 'night-vision-mode', 'midnight-operator-title']
    },
    tutorial: [
      { id: 'night-intro', title: 'Night Shift', message: 'Welcome to the night shift. Visibility is limited - trust your instruments.', voiceLine: 'training_night_intro' },
      { id: 'cameras', title: 'Camera Feeds', message: 'The multiview cameras are your eyes. Hook cam shows your target zone.', highlightElement: '.camera-feed' },
      { id: 'ship-lights', title: 'Ship Lighting', message: 'Ships glow under their lights. Look for the attachment point beacons.', position: 'center' },
      { id: 'instruments', title: 'Trust Instruments', message: 'When you can\'t see, read the numbers. Height, position, tension - they don\'t lie.', position: 'left', highlightElement: '.status-panel' },
      { id: 'bioluminescence', title: 'Bioluminescence', message: 'On some nights, the water itself glows. A beautiful but distracting phenomenon.', position: 'bottom' },
      { id: 'emergency-lights', title: 'Emergency Strobes', message: 'Install emergency strobes first - they\'ll help light the rest of the ship.', waitForAction: true, actionType: 'install' }
    ]
  },

  // ============================================================================
  // TUGBOAT MODULE 1: Tugboat Basics
  // ============================================================================
  {
    id: 'tugboat-basics',
    title: 'Tugboat Basics',
    description: 'Learn tug startup, tow-line safety, and controlled berth escorting in calm harbor water.',
    difficulty: 1,
    estimatedTime: 6,
    shipType: 'container',
    weather: 'clear',
    timeOfDay: 9,
    prerequisites: [],
    objectives: [
      { id: 'escort-alpha', title: 'Escort to Berth Alpha', description: 'Guide a practice vessel into Alpha berth' },
      { id: 'tow-line-safe', title: 'Tow-Line Safety', description: 'Keep tow tension below snap zone while towing' },
      { id: 'clean-dock', title: 'Clean Docking', description: 'Complete without hull contact damage' }
    ],
    rewards: {
      reputation: 60,
      unlocks: ['twin-screw-differential-module', 'deckhand-cert-i']
    },
    tutorial: [
      { id: 'welcome-tug', title: 'Welcome, Captain', message: 'Tonight we switch from crane cab to harbor tug. You are now the hands on the water.', voiceLine: 'training_welcome' },
      { id: 'helm-controls', title: 'Helm Controls', message: 'Use WASD for coordinated thrust. Small inputs keep your wake smooth.', position: 'bottom', waitForAction: true, actionType: 'move' },
      { id: 'towline', title: 'Tow Line', message: 'Press T to connect and disconnect the tow line when in range.', position: 'left' },
      { id: 'cavitation', title: 'Cavitation Watch', message: 'If cavitation warnings flash, reduce throttle before efficiency drops.', position: 'right' },
      { id: 'first-escort', title: 'First Escort', message: 'Move the training vessel into Berth Alpha and hold steady.', waitForAction: true, actionType: 'move' },
      { id: 'finish-basics', title: 'Module Complete', message: 'Solid tug handling. Next up: independent screw control.' }
    ]
  },

  // ============================================================================
  // TUGBOAT MODULE 2: Twin-Screw Differential
  // ============================================================================
  {
    id: 'twin-screw-differential',
    title: 'Twin-Screw Differential',
    description: 'Practice split-throttle maneuvers, pivot turns, and low-speed precision using independent prop control.',
    difficulty: 2,
    estimatedTime: 8,
    shipType: 'tanker',
    weather: 'clear',
    timeOfDay: 11,
    prerequisites: ['tugboat-basics'],
    objectives: [
      { id: 'pivot-turn', title: 'Pivot Turn', description: 'Rotate 180° in a marked box using differential thrust' },
      { id: 'thread-channel', title: 'Thread the Channel', description: 'Escort through the narrow training lane' },
      { id: 'dock-beta', title: 'Dock at Berth Beta', description: 'Complete final approach with <25% cavitation intensity' }
    ],
    rewards: {
      reputation: 90,
      unlocks: ['acoustic-handshake-module', 'engine-room-trim-badge']
    },
    tutorial: [
      { id: 'diff-intro', title: 'Independent Screws', message: 'Twin screws let you rotate in place. Split thrust, then counter to stabilize.' },
      { id: 'console-reminder', title: 'Console Fine-Tune', message: 'Use the tug console to compare port and starboard RPM in real time.', position: 'right' },
      { id: 'pivot-demo', title: 'Pivot Drill', message: 'Practice a controlled pivot turn before entering the channel.', waitForAction: true, actionType: 'move' },
      { id: 'channel', title: 'Channel Transit', message: 'Keep your stern clear while guiding the target through the markers.', waitForAction: true, actionType: 'move' },
      { id: 'finish-diff', title: 'Module Complete', message: 'Great control. You are ready for acoustic protocol work.' }
    ]
  },

  // ============================================================================
  // TUGBOAT MODULE 3: Acoustic Handshake
  // ============================================================================
  {
    id: 'acoustic-handshake',
    title: 'Acoustic Handshake',
    description: 'Calibrate the acoustic console, transmit the correct handshake sequence, and unlock towing authorization.',
    difficulty: 3,
    estimatedTime: 9,
    shipType: 'bulk',
    weather: 'fog',
    timeOfDay: 20,
    prerequisites: ['twin-screw-differential'],
    objectives: [
      { id: 'scan-berth', title: 'Scan Berth Signature', description: 'Use array feedback to locate the assigned berth pattern' },
      { id: 'handshake-sequence', title: 'Complete Handshake', description: 'Transmit the full note sequence in order' },
      { id: 'authorized-tow', title: 'Authorized Tow', description: 'Tow one vessel after handshake unlocks' }
    ],
    rewards: {
      reputation: 120,
      unlocks: ['storm-rescue-module', 'acoustic-clearance']
    },
    tutorial: [
      { id: 'acoustic-intro', title: 'Acoustic Protocol', message: 'No handshake, no tow. The harbor array verifies every assist operation.' },
      { id: 'read-array', title: 'Read the Array', message: 'Watch pulse feedback and log each note before transmitting.', position: 'left' },
      { id: 'submit-notes', title: 'Transmit Sequence', message: 'Play the matching sequence to unlock towing authorization.', waitForAction: true, actionType: 'wait' },
      { id: 'post-unlock', title: 'Tow Authorization', message: 'Authorization granted. Complete a short tow to confirm the lock.', waitForAction: true, actionType: 'move' }
    ]
  },

  // ============================================================================
  // TUGBOAT MODULE 4: Storm Rescue
  // ============================================================================
  {
    id: 'storm-rescue',
    title: 'Storm Rescue',
    description: 'Execute a controlled rescue tow in low-storm conditions while managing shear, cavitation, and tow tension.',
    difficulty: 4,
    estimatedTime: 12,
    shipType: 'container',
    weather: 'storm',
    timeOfDay: 22,
    prerequisites: ['acoustic-handshake'],
    objectives: [
      { id: 'secure-distressed', title: 'Secure Distressed Vessel', description: 'Attach and stabilize the tow line in rough water' },
      { id: 'maintain-tension', title: 'Maintain Tow Tension', description: 'Complete tow without entering sustained snap zone' },
      { id: 'storm-dock', title: 'Storm Docking', description: 'Deliver the vessel to Berth Gamma before storm peak' }
    ],
    rewards: {
      reputation: 170,
      unlocks: ['tugmaster-storm-stripe', 'salvage-dispatch-priority']
    },
    tutorial: [
      { id: 'storm-brief', title: 'Storm Briefing', message: 'Conditions are rough, but controlled. Keep decisions calm and deliberate.', voiceLine: 'training_storm_warning' },
      { id: 'shear-warning', title: 'Shear and Drift', message: 'Cross-shear will pull your tow line sideways. Correct early, not late.', position: 'left' },
      { id: 'cav-limit', title: 'Throttle Discipline', message: 'Avoid prolonged cavitation. A clean prop saves your line and your mission.', position: 'right' },
      { id: 'rescue-run', title: 'Rescue Run', message: 'Complete the full storm escort to Berth Gamma.', waitForAction: true, actionType: 'move' }
    ]
  },

  // ============================================================================
  // MODULE 5: Multi-Crane Coordination
  // ============================================================================
  {
    id: 'multi-crane',
    title: 'Multi-Crane Coordination',
    description: 'Coordinate with AI crane operators to install light rigs on two adjacent berths without interference.',
    difficulty: 4,
    estimatedTime: 15,
    shipType: 'cruise',
    weather: 'clear',
    timeOfDay: 18,
    prerequisites: ['night-ops'],
    objectives: [
      { id: 'coordinate-1', title: 'Coordinate with Crane B', description: 'Sync operations with the NPC crane on the adjacent berth' },
      { id: 'dual-install', title: 'Dual Installation', description: 'Install rigs on both vessels within the time window' },
      { id: 'no-interference', title: 'No Interference', description: 'Complete without crane collisions or ship contact damage' }
    ],
    rewards: {
      reputation: 250,
      unlocks: ['emergency-module', 'coordinator-badge']
    },
    tutorial: [
      { id: 'multi-intro', title: 'Dual Berth Operations', message: 'Two cranes, two ships, one harbor. Crane B is on autopilot at the adjacent berth — stay aware of its swing radius.', voiceLine: 'training_multi_crane_intro' },
      { id: 'multiview', title: 'Multiview Awareness', message: 'Open the multiview dashboard to watch both berths. Spatial awareness prevents costly collisions.', highlightElement: '.camera-feed', position: 'right' },
      { id: 'queue-plan', title: 'Queue Planning', message: 'Install on your ship first, then coordinate timing so Crane B finishes its rig before you cross the shared zone.', position: 'left' },
      { id: 'crane-b-sync', title: 'Crane B Channel', message: 'Acknowledge Crane B on the coordination channel. Watch for the cyan beacon on the adjacent vessel.', waitForAction: true, actionType: 'wait' },
      { id: 'first-install', title: 'Your Berth First', message: 'Complete at least one installation on your assigned cruise liner.', waitForAction: true, actionType: 'install' },
      { id: 'second-ship', title: 'Adjacent Berth', message: 'Move to the container vessel at the adjacent berth and install a rig without crossing into Crane B\'s path.', waitForAction: true, actionType: 'install' },
      { id: 'complete', title: 'Coordination Complete', message: 'Clean dual-crane operations. You\'re cleared for emergency response training.', voiceLine: 'training_multi_crane_complete' }
    ]
  },

  // ============================================================================
  // MODULE 6: Emergency Response
  // ============================================================================
  {
    id: 'emergency',
    title: 'Emergency Response',
    description: 'Handle crane emergencies during a storm: secure the load, switch to tugboat assist, then return to crane operations.',
    difficulty: 5,
    estimatedTime: 10,
    shipType: 'container',
    weather: 'storm',
    timeOfDay: 15,
    prerequisites: ['multi-crane'],
    objectives: [
      { id: 'emergency-stop', title: 'Emergency Stop', description: 'Engage emergency brake when the cable alarm triggers' },
      { id: 'secure-load', title: 'Secure Load', description: 'Hold the spreader steady with sway below 20% for 5 seconds' },
      { id: 'evacuate', title: 'Mode Switch Protocol', description: 'Switch to tugboat to stabilize the distressed vessel, then return to crane' }
    ],
    rewards: {
      reputation: 300,
      unlocks: ['light-show-module', 'emergency-responder-title']
    },
    tutorial: [
      { id: 'emergency-intro', title: 'Emergency Alert', message: 'Storm intensity is rising and the cable tension alarm is active. Execute procedures calmly — panic costs lives.', voiceLine: 'training_emergency_intro' },
      { id: 'e-stop', title: 'Emergency Brake', message: 'Press Space to engage the emergency brake immediately when the alarm sounds.', highlightElement: '.emergency-brake', waitForAction: true, actionType: 'wait' },
      { id: 'secure', title: 'Secure the Load', message: 'With the brake engaged, hold position. Keep sway under 20% until the load is stable.', position: 'left', waitForAction: true, actionType: 'wait' },
      { id: 'tugboat-switch', title: 'Tugboat Assist', message: 'Toggle to Tugboat Captain mode to stabilize the distressed container vessel alongside the berth.', position: 'bottom', waitForAction: true, actionType: 'move' },
      { id: 'storm-manage', title: 'Storm Management', message: 'Watch storm intensity on the weather panel. Keep the vessel inside the safe zone until conditions ease.', highlightElement: '.weather-panel', position: 'right' },
      { id: 'return-crane', title: 'Return to Crane', message: 'Switch back to crane mode and confirm the berth is secure before completing the module.', waitForAction: true, actionType: 'move' },
      { id: 'complete', title: 'Crisis Resolved', message: 'Emergency protocols executed correctly. You\'re ready for the advanced light show install.', voiceLine: 'training_emergency_complete' }
    ]
  },

  // ============================================================================
  // MODULE 7: Advanced Light Show Install
  // ============================================================================
  {
    id: 'light-show',
    title: 'Advanced Light Show Install',
    description: 'The ultimate test: install a complete music-synchronized light show on a mega-cruise ship with sequence-sensitive rig types.',
    difficulty: 5,
    estimatedTime: 20,
    shipType: 'cruise',
    weather: 'clear',
    timeOfDay: 20,
    prerequisites: ['emergency'],
    objectives: [
      { id: 'complete-show', title: 'Complete Installation', description: 'Install all light rigs on the cruise liner' },
      { id: 'sync-test', title: 'Sync Test', description: 'Trigger the music sync test after all rigs are installed' },
      { id: 's-rank', title: 'S-Rank Performance', description: 'Achieve S-rank: sway <15%, zero damage, accuracy ≥95%' }
    ],
    rewards: {
      reputation: 500,
      unlocks: ['master-operator-title', 'legendary-crane-skin', 'all-weather-unlocked']
    },
    tutorial: [
      { id: 'lightshow-intro', title: 'The Grand Install', message: 'This is the capstone module. Every rig type matters — holographic, plasma, and matrix rigs must be installed in the recommended sequence.', voiceLine: 'training_lightshow_intro' },
      { id: 'rig-sequence', title: 'Installation Sequence', message: 'Start with funnel rigs, then balcony matrices, then deck projectors. Out-of-order installs reduce your sync score.', highlightElement: '.attachment-point', position: 'left' },
      { id: 'choreography', title: 'Choreography Preview', message: 'Each band has a unique light-show cue. Install cleanly to preserve timing headroom for the sync test.', position: 'right' },
      { id: 'first-rig', title: 'First Rig', message: 'Install the funnel RGB matrix to begin the sequence.', waitForAction: true, actionType: 'install' },
      { id: 'full-install', title: 'Complete the Show', message: 'Install every remaining rig on the cruise liner.', waitForAction: true, actionType: 'install' },
      { id: 'sync', title: 'Sync Test', message: 'When all rigs are installed, the music sync test runs automatically. Watch the beat indicators.', waitForAction: true, actionType: 'wait' },
      { id: 'complete', title: 'Master Operator', message: 'Outstanding. You\'ve earned Master Operator certification.', voiceLine: 'training_lightshow_complete' }
    ]
  }
]

// =============================================================================
// TRAINING STATE MANAGEMENT
// =============================================================================

export interface TrainingProgress {
  moduleStates: Record<TrainingModuleId, TrainingState>
  results: TrainingResult[]
  currentModule: TrainingModuleId | null
  currentStep: number
  totalScore: number
  unlockedRewards: string[]
  // Persistent bonuses
  permanentReputationBonus: number
  unlockedCosmetics: string[]
  unlockedWeather: WeatherState[]
}

export const DEFAULT_TRAINING_PROGRESS: TrainingProgress = {
  moduleStates: {
    'basic-hooks': 'available',
    'precision': 'locked',
    'wind-sway': 'locked',
    'night-ops': 'locked',
    'tugboat-basics': 'available',
    'twin-screw-differential': 'locked',
    'acoustic-handshake': 'locked',
    'storm-rescue': 'locked',
    'multi-crane': 'locked',
    'emergency': 'locked',
    'light-show': 'locked'
  },
  results: [],
  currentModule: null,
  currentStep: 0,
  totalScore: 0,
  unlockedRewards: [],
  permanentReputationBonus: 0,
  unlockedCosmetics: [],
  unlockedWeather: ['clear']
}

// =============================================================================
// SCORING SYSTEM
// =============================================================================

export function calculateRank(metrics: TrainingMetrics): TrainingRank {
  const { timeElapsed, maxSway, totalDamage, accuracyScore } = metrics
  
  // S-Rank: Perfect execution
  if (maxSway < 0.15 && totalDamage === 0 && accuracyScore >= 95) return 'S'
  
  // A-Rank: Excellent
  if (maxSway < 0.25 && totalDamage < 10 && accuracyScore >= 85) return 'A'
  
  // B-Rank: Good
  if (maxSway < 0.4 && totalDamage < 30 && accuracyScore >= 70) return 'B'
  
  // C-Rank: Pass
  if (accuracyScore >= 50) return 'C'
  
  // F-Rank: Fail
  return 'F'
}

export function calculateScore(metrics: TrainingMetrics): number {
  const baseScore = 1000
  
  // Time bonus (faster = better, up to 500 pts)
  const timeBonus = Math.max(0, 500 - metrics.timeElapsed * 2)
  
  // Sway penalty (high sway = penalty, up to -300 pts)
  const swayPenalty = metrics.maxSway * 300
  
  // Damage penalty (damage = penalty, up to -400 pts)
  const damagePenalty = metrics.totalDamage * 10
  
  // Accuracy bonus (accuracy % * 5, up to 500 pts)
  const accuracyBonus = metrics.accuracyScore * 5
  
  return Math.max(0, Math.round(baseScore + timeBonus - swayPenalty - damagePenalty + accuracyBonus))
}

export function getRankColor(rank: TrainingRank): string {
  switch (rank) {
    case 'S': return '#ffd700' // Gold
    case 'A': return '#00d4aa' // Teal
    case 'B': return '#4a9eff' // Blue
    case 'C': return '#888888' // Gray
    case 'F': return '#ff4757' // Red
  }
}

export function getRankDescription(rank: TrainingRank): string {
  switch (rank) {
    case 'S': return 'Perfect Execution'
    case 'A': return 'Excellent'
    case 'B': return 'Good'
    case 'C': return 'Pass'
    case 'F': return 'Needs Improvement'
  }
}

// =============================================================================
// VOICE LINES
// =============================================================================

export const TRAINING_VOICE_LINES: Record<string, { text: string; tone: 'neutral' | 'encouraging' | 'urgent' | 'congratulatory' }> = {
  // Module 1: Basic Hooks
  training_welcome: { text: "Welcome to HarborGlow Training. I'll be your instructor today.", tone: 'neutral' },
  training_complete_basic: { text: "Excellent work! You're ready for precision training.", tone: 'congratulatory' },
  
  // Module 2: Precision
  training_precision_intro: { text: "Light rig installation requires precision. Watch for the magnetic snap zones.", tone: 'neutral' },
  training_first_install: { text: "Perfect! Feel that magnetic pull? That's the snap zone assisting you.", tone: 'encouraging' },
  
  // Module 3: Wind & Sway
  training_storm_warning: { text: "Storm conditions detected. Wind speeds up to 25 meters per second expected.", tone: 'urgent' },
  training_gust_approach: { text: "Gust approaching! Hold position and prepare for sway.", tone: 'urgent' },
  training_gust_passed: { text: "Gust has passed. Resume operations when ready.", tone: 'neutral' },
  
  // Module 4: Night Ops
  training_night_intro: { text: "Welcome to the night shift. Visibility is limited - trust your instruments.", tone: 'neutral' },
  training_night_complete: { text: "Outstanding work in challenging conditions. You're a true night operator.", tone: 'congratulatory' },

  // Module 5: Multi-Crane
  training_multi_crane_intro: { text: "Two cranes, two berths. Crane B is on autopilot — stay aware of its swing radius.", tone: 'neutral' },
  training_multi_crane_complete: { text: "Clean dual-crane coordination. Emergency response training is now available.", tone: 'congratulatory' },

  // Module 6: Emergency Response
  training_emergency_intro: { text: "Storm intensity rising. Cable alarm active. Execute emergency procedures calmly.", tone: 'urgent' },
  training_emergency_complete: { text: "Crisis resolved. You've earned emergency responder certification.", tone: 'congratulatory' },

  // Module 7: Light Show
  training_lightshow_intro: { text: "Capstone module. Install every rig in sequence, then pass the music sync test.", tone: 'neutral' },
  training_lightshow_complete: { text: "Master Operator certified. The harbor is yours.", tone: 'congratulatory' },
  
  // General
  training_good_job: { text: "Good job. Keep it steady.", tone: 'encouraging' },
  training_excellent: { text: "Excellent! That's textbook crane operation.", tone: 'congratulatory' },
  training_too_fast: { text: "Slow down. Precision over speed.", tone: 'neutral' },
  training_high_sway: { text: "Watch the sway! Counter-movement needed.", tone: 'urgent' },
  training_install_complete: { text: "Installation confirmed. Moving to next target.", tone: 'neutral' },
  training_module_complete: { text: "Module complete! Check your performance summary.", tone: 'congratulatory' }
}

// =============================================================================
// TRAINING SYSTEM CLASS
// =============================================================================

export class TrainingSystem {
  private progress: TrainingProgress = { ...DEFAULT_TRAINING_PROGRESS }
  private listeners: Set<(progress: TrainingProgress) => void> = new Set()
  private runtimeState: TrainingRuntimeState = { ...DEFAULT_TRAINING_RUNTIME, shipsWithInstalls: new Set() }
  private runtimeListeners: Set<(runtime: TrainingRuntimeState) => void> = new Set()
  private currentMetrics: TrainingMetrics = {
    timeElapsed: 0,
    maxSway: 0,
    totalDamage: 0,
    accuracyScore: 100,
    installationsCompleted: 0,
    installationsTarget: 0
  }
  private metricsInterval: ReturnType<typeof setInterval> | null = null
  private startTime: number = 0

  // Getters
  getProgress(): TrainingProgress {
    return { ...this.progress }
  }

  getModule(moduleId: TrainingModuleId): TrainingModule | undefined {
    return TRAINING_MODULES.find(m => m.id === moduleId)
  }

  isModuleAvailable(moduleId: TrainingModuleId): boolean {
    return this.progress.moduleStates[moduleId] !== 'locked'
  }

  isModuleCompleted(moduleId: TrainingModuleId): boolean {
    return this.progress.results.some(r => r.moduleId === moduleId)
  }

  getBestResult(moduleId: TrainingModuleId): TrainingResult | undefined {
    const results = this.progress.results.filter(r => r.moduleId === moduleId)
    if (results.length === 0) return undefined
    return results.reduce((best, current) => current.score > best.score ? current : best)
  }

  // State Management
  startModule(moduleId: TrainingModuleId): boolean {
    if (!this.isModuleAvailable(moduleId)) {
      console.warn(`[Training] Module ${moduleId} is locked`)
      return false
    }

    const module = this.getModule(moduleId)
    if (!module) return false

    this.progress.currentModule = moduleId
    this.progress.currentStep = 0
    this.progress.moduleStates[moduleId] = 'in-progress'
    this.resetRuntimeState()
    
    // Reset metrics
    this.currentMetrics = {
      timeElapsed: 0,
      maxSway: 0,
      totalDamage: 0,
      accuracyScore: 100,
      installationsCompleted: 0,
      installationsTarget: this.getInstallTargetForModule(module)
    }
    
    this.startTime = Date.now()
    this.startMetricsTracking()
    
    this.notifyListeners()
    console.log(`[Training] Started module: ${module.title}`)
    
    return true
  }

  exitModule(): void {
    if (this.progress.currentModule) {
      const moduleId = this.progress.currentModule
      if (this.progress.moduleStates[moduleId] === 'in-progress') {
        this.progress.moduleStates[moduleId] = 'available'
      }
    }
    
    this.progress.currentModule = null
    this.progress.currentStep = 0
    this.stopMetricsTracking()
    
    this.notifyListeners()
    console.log('[Training] Exited module')
  }

  completeModule(): TrainingResult {
    const moduleId = this.progress.currentModule
    if (!moduleId) {
      throw new Error('No active module to complete')
    }

    this.stopMetricsTracking()
    
    // Calculate final metrics
    this.currentMetrics.timeElapsed = Math.floor((Date.now() - this.startTime) / 1000)
    
    const rank = calculateRank(this.currentMetrics)
    const score = calculateScore(this.currentMetrics)
    
    const result: TrainingResult = {
      moduleId,
      rank,
      score,
      metrics: { ...this.currentMetrics },
      completedAt: Date.now(),
      attempts: (this.progress.results.filter(r => r.moduleId === moduleId).length) + 1
    }
    
    this.progress.results.push(result)
    this.progress.moduleStates[moduleId] = 'completed'
    this.progress.totalScore += score
    
    // Unlock next module
    this.unlockNextModules(moduleId)
    
    // Apply rewards
    this.applyModuleRewards(moduleId)
    
    // Record with reputation system
    reputationSystem.recordTrainingComplete(rank)
    
    this.progress.currentModule = null
    this.progress.currentStep = 0
    
    this.notifyListeners()
    console.log(`[Training] Completed ${moduleId} with rank ${rank}, score ${score}`)
    
    return result
  }

  private unlockNextModules(completedModuleId: TrainingModuleId): void {
    TRAINING_MODULES.forEach(module => {
      if (module.prerequisites.includes(completedModuleId)) {
        const allPrereqsMet = module.prerequisites.every(
          prereq => this.progress.moduleStates[prereq] === 'completed'
        )
        if (allPrereqsMet && this.progress.moduleStates[module.id] === 'locked') {
          this.progress.moduleStates[module.id] = 'available'
          console.log(`[Training] Unlocked module: ${module.title}`)
        }
      }
    })
  }

  private applyModuleRewards(moduleId: TrainingModuleId): void {
    const module = this.getModule(moduleId)
    if (!module) return

    // Add reputation bonus
    this.progress.permanentReputationBonus += module.rewards.reputation
    
    // Track unlocked rewards
    module.rewards.unlocks.forEach(unlock => {
      if (!this.progress.unlockedRewards.includes(unlock)) {
        this.progress.unlockedRewards.push(unlock)
      }
    })
    
    // Apply to game store
    const store = useGameStore.getState()
    store.addReputation(module.rewards.reputation)
  }

  // Tutorial Step Navigation
  nextStep(): void {
    if (!this.progress.currentModule) return
    const module = this.getModule(this.progress.currentModule)
    if (!module) return
    
    if (this.progress.currentStep < module.tutorial.length - 1) {
      this.progress.currentStep++
      this.notifyListeners()
    }
  }

  previousStep(): void {
    if (this.progress.currentStep > 0) {
      this.progress.currentStep--
      this.notifyListeners()
    }
  }

  getCurrentStep(): TrainingStep | null {
    if (!this.progress.currentModule) return null
    const module = this.getModule(this.progress.currentModule)
    if (!module) return null
    return module.tutorial[this.progress.currentStep] || null
  }

  // Metrics Tracking
  private startMetricsTracking(): void {
    this.metricsInterval = setInterval(() => {
      // In real implementation, this would read from swaySystem, etc.
      // For now, we simulate metric updates
      this.updateMetricsFromGameState()
    }, 100)
  }

  private stopMetricsTracking(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }
  }

  private updateMetricsFromGameState(): void {
    const store = useGameStore.getState()
    
    // Get sway from store if available
    // This would integrate with swaySystem in full implementation
    // For now, placeholder
  }

  updateMetrics(updates: Partial<TrainingMetrics>): void {
    this.currentMetrics = { ...this.currentMetrics, ...updates }
  }

  recordSway(sway: number): void {
    if (sway > this.currentMetrics.maxSway) {
      this.currentMetrics.maxSway = sway
    }
  }

  recordDamage(damage: number): void {
    this.currentMetrics.totalDamage += damage
  }

  recordInstallation(shipId?: string): void {
    this.currentMetrics.installationsCompleted++
    if (shipId) {
      this.runtimeState.shipsWithInstalls.add(shipId)
      if (!this.runtimeState.primaryShipId) {
        this.runtimeState.primaryShipId = shipId
      } else if (shipId !== this.runtimeState.primaryShipId) {
        this.runtimeState.secondaryShipId = shipId
      }
    }
    this.notifyRuntimeListeners()
  }

  recordEmergencyStop(): void {
    this.runtimeState.emergencyStopExecuted = true
    this.notifyRuntimeListeners()
  }

  recordLoadSecured(): void {
    this.runtimeState.loadSecured = true
    this.notifyRuntimeListeners()
  }

  recordCraneBCoordinated(): void {
    this.runtimeState.craneBCoordinated = true
    this.notifyRuntimeListeners()
  }

  recordOperationModeSwitch(mode: 'crane' | 'tugboat' | 'walking'): void {
    if (mode === 'tugboat') {
      this.runtimeState.operationModeSwitched = true
    } else if (mode === 'crane' && this.runtimeState.operationModeSwitched) {
      this.runtimeState.returnedToCrane = true
    }
    this.notifyRuntimeListeners()
  }

  recordSyncTestPassed(): void {
    this.runtimeState.syncTestPassed = true
    this.notifyRuntimeListeners()
  }

  recordCollision(): void {
    this.runtimeState.craneCollisionCount++
    this.notifyRuntimeListeners()
  }

  getRuntimeState(): TrainingRuntimeState {
    return {
      ...this.runtimeState,
      shipsWithInstalls: new Set(this.runtimeState.shipsWithInstalls),
    }
  }

  resetRuntimeState(): void {
    this.runtimeState = { ...DEFAULT_TRAINING_RUNTIME, shipsWithInstalls: new Set() }
    this.notifyRuntimeListeners()
  }

  setTrainingShipIds(primaryId: string, secondaryId?: string): void {
    this.runtimeState.primaryShipId = primaryId
    if (secondaryId) this.runtimeState.secondaryShipId = secondaryId
    this.notifyRuntimeListeners()
  }

  getCompletedObjectiveIds(): string[] {
    const moduleId = this.progress.currentModule
    if (!moduleId) return []
    const module = this.getModule(moduleId)
    if (!module) return []

    const store = useGameStore.getState()
    const currentShip = store.ships.find(s => s.id === store.currentShipId)
    const installedCount = currentShip
      ? store.installedUpgrades.filter(u => u.shipId === currentShip.id).length
      : this.currentMetrics.installationsCompleted

    return evaluateCompletedObjectives(
      moduleId,
      module.objectives.map(o => o.id),
      this.currentMetrics,
      this.runtimeState,
      {
        operationMode: store.operationMode,
        musicPlaying: store.currentShipId
          ? store.musicPlaying.get(store.currentShipId) === true
          : false,
        installedCount,
        installTarget: currentShip?.attachmentPoints.length ?? this.currentMetrics.installationsTarget,
      },
    )
  }

  private getInstallTargetForModule(module: TrainingModule): number {
    if (module.id === 'light-show') return 6 // cruise attachment points
    if (module.id === 'multi-crane') return 2
    if (module.id === 'wind-sway') return 4
    if (module.id === 'precision') return 3
  if (module.id === 'night-ops') return 3
    return module.objectives.filter(o => o.id.includes('install')).length || 3
  }

  subscribeRuntime(listener: (runtime: TrainingRuntimeState) => void): () => void {
    this.runtimeListeners.add(listener)
    return () => this.runtimeListeners.delete(listener)
  }

  private notifyRuntimeListeners(): void {
    const snapshot = this.getRuntimeState()
    this.runtimeListeners.forEach(listener => listener(snapshot))
  }

  getCurrentMetrics(): TrainingMetrics {
    return { ...this.currentMetrics }
  }

  // Listeners
  subscribe(listener: (progress: TrainingProgress) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.progress))
  }

  // Persistence
  serialize(): string {
    return JSON.stringify(this.progress)
  }

  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data)
      this.progress = { ...DEFAULT_TRAINING_PROGRESS, ...parsed }
      this.notifyListeners()
    } catch (e) {
      console.error('[Training] Failed to deserialize progress:', e)
    }
  }

  reset(): void {
    this.progress = { ...DEFAULT_TRAINING_PROGRESS }
    this.currentMetrics = {
      timeElapsed: 0,
      maxSway: 0,
      totalDamage: 0,
      accuracyScore: 100,
      installationsCompleted: 0,
      installationsTarget: 0
    }
    this.stopMetricsTracking()
    this.notifyListeners()
  }

  // Debug / Testing
  unlockAll(): void {
    TRAINING_MODULES.forEach(module => {
      this.progress.moduleStates[module.id] = 'available'
    })
    this.notifyListeners()
  }

  completeAll(): void {
    TRAINING_MODULES.forEach(module => {
      this.progress.moduleStates[module.id] = 'completed'
      if (!this.progress.results.some(r => r.moduleId === module.id)) {
        this.progress.results.push({
          moduleId: module.id,
          rank: 'S',
          score: 2500,
          metrics: {
            timeElapsed: 300,
            maxSway: 0.1,
            totalDamage: 0,
            accuracyScore: 95,
            installationsCompleted: 5,
            installationsTarget: 5
          },
          completedAt: Date.now(),
          attempts: 1
        })
      }
    })
    this.notifyListeners()
  }
}

// =============================================================================
// TRAINING SCENARIO SETUP
// =============================================================================

/**
 * Spawns ships and configures environment for a training module.
 * Called from the game store when a module starts.
 */
export function setupTrainingScenario(moduleId: TrainingModuleId): void {
  const module = TRAINING_MODULES.find(m => m.id === moduleId)
  if (!module) return

  const store = useGameStore.getState()

  // Clear existing fleet for a clean training scenario
  ;[...store.ships].forEach(ship => store.removeShip(ship.id))

  trainingSystem.resetRuntimeState()

  switch (moduleId) {
  case 'multi-crane': {
    const primary = ShipSpawner.spawnShip('cruise')
    const secondary = ShipSpawner.spawnShip('container')
    store.setCurrentShip(primary.id)
    trainingSystem.setTrainingShipIds(primary.id, secondary.id)
    break
  }
  case 'emergency': {
    const ship = ShipSpawner.spawnShip('container')
    store.setCurrentShip(ship.id)
    stormSystem.start(180)
    store.setWeather('storm')
    break
  }
  case 'light-show': {
    const ship = ShipSpawner.spawnShip('cruise')
    store.setCurrentShip(ship.id)
    break
  }
  default: {
    const ship = ShipSpawner.spawnShip(module.shipType)
    store.setCurrentShip(ship.id)
    break
  }
  }

  console.log(`[Training] Scenario ready for ${module.title}`)
}

// Export singleton
export const trainingSystem = new TrainingSystem()

// =============================================================================
// REACT HOOK
// =============================================================================

import { useState, useEffect } from 'react'

export function useTrainingSystem() {
  const [progress, setProgress] = useState<TrainingProgress>(trainingSystem.getProgress())
  
  useEffect(() => {
    return trainingSystem.subscribe(setProgress)
  }, [])
  
  return {
    progress,
    startModule: trainingSystem.startModule.bind(trainingSystem),
    exitModule: trainingSystem.exitModule.bind(trainingSystem),
    completeModule: trainingSystem.completeModule.bind(trainingSystem),
    nextStep: trainingSystem.nextStep.bind(trainingSystem),
    previousStep: trainingSystem.previousStep.bind(trainingSystem),
    getCurrentStep: trainingSystem.getCurrentStep.bind(trainingSystem),
    isModuleAvailable: trainingSystem.isModuleAvailable.bind(trainingSystem),
    isModuleCompleted: trainingSystem.isModuleCompleted.bind(trainingSystem),
    getBestResult: trainingSystem.getBestResult.bind(trainingSystem),
    getCurrentMetrics: trainingSystem.getCurrentMetrics.bind(trainingSystem),
    unlockAll: trainingSystem.unlockAll.bind(trainingSystem),
    completeAll: trainingSystem.completeAll.bind(trainingSystem),
    reset: trainingSystem.reset.bind(trainingSystem),
    recordSway: trainingSystem.recordSway.bind(trainingSystem),
    recordDamage: trainingSystem.recordDamage.bind(trainingSystem),
    recordInstallation: trainingSystem.recordInstallation.bind(trainingSystem),
    recordEmergencyStop: trainingSystem.recordEmergencyStop.bind(trainingSystem),
    recordLoadSecured: trainingSystem.recordLoadSecured.bind(trainingSystem),
    recordCraneBCoordinated: trainingSystem.recordCraneBCoordinated.bind(trainingSystem),
    recordOperationModeSwitch: trainingSystem.recordOperationModeSwitch.bind(trainingSystem),
    recordSyncTestPassed: trainingSystem.recordSyncTestPassed.bind(trainingSystem),
    getRuntimeState: trainingSystem.getRuntimeState.bind(trainingSystem),
    getCompletedObjectiveIds: trainingSystem.getCompletedObjectiveIds.bind(trainingSystem),
  }
}
