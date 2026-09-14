// =============================================================================
// TRAINING SYSTEM - Module Definitions
// =============================================================================

import { TrainingModule } from './trainingTypes'

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
      unlocks: ['tugmaster-storm-stripe', 'salvage-dispatch-priority', 'ice-escort-module']
    },
    tutorial: [
      { id: 'storm-brief', title: 'Storm Briefing', message: 'Conditions are rough, but controlled. Keep decisions calm and deliberate.', voiceLine: 'training_storm_warning' },
      { id: 'shear-warning', title: 'Shear and Drift', message: 'Cross-shear will pull your tow line sideways. Correct early, not late.', position: 'left' },
      { id: 'cav-limit', title: 'Throttle Discipline', message: 'Avoid prolonged cavitation. A clean prop saves your line and your mission.', position: 'right' },
      { id: 'rescue-run', title: 'Rescue Run', message: 'Complete the full storm escort to Berth Gamma.', waitForAction: true, actionType: 'move' }
    ]
  },

  // ============================================================================
  // TUGBOAT MODULE 5: Ice Escort
  // ============================================================================
  {
    id: 'ice-escort',
    title: 'Polar Ice Escort',
    description: 'Helm Yamal through pack ice and hold a channel while a client hull transits to Polar Berth Gamma.',
    difficulty: 5,
    estimatedTime: 14,
    shipType: 'icebreaker',
    weather: 'fog',
    timeOfDay: 2,
    prerequisites: ['storm-rescue'],
    objectives: [
      { id: 'break-channel', title: 'Break Channel', description: 'Ram a navigable lane through the pack toward the berth' },
      { id: 'hold-station', title: 'Hold Station', description: 'Keep the icebreaker in the corridor while the client advances' },
      { id: 'client-berth', title: 'Client Berth', description: 'Deliver the client hull to Polar Berth Gamma without grounding' }
    ],
    rewards: {
      reputation: 200,
      unlocks: ['arctic-booth-chrome', 'yamal-escort-stripe']
    },
    tutorial: [
      { id: 'ice-brief', title: 'Pack Ice Briefing', message: 'This is not a tow. You are the icebreaker. Cut the channel; the client follows open water.' },
      { id: 'ram-ice', title: 'Ram Discipline', message: 'Speed breaks floes. Heavy ice at high speed damages the hull.', position: 'left' },
      { id: 'client-follow', title: 'Client Transit', message: 'The client grounds if it meets unbroken ice. Clear ahead of its track.', position: 'right', waitForAction: true, actionType: 'move' }
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
      { id: 'crane-b-sync', title: 'Crane B Channel', message: 'Clear the shared zone (cyan/red deck band) while Crane B swings — or press C / Ack B as an accessibility fallback. Watch the cyan beacon on Crane B.', waitForAction: true, actionType: 'wait' },
      { id: 'first-install', title: 'Your Berth First', message: 'Complete at least one installation on your assigned cruise liner while Crane B works the adjacent berth.', waitForAction: true, actionType: 'install' },
      { id: 'second-ship', title: 'Adjacent Berth', message: 'Confirm both vessels have a light rig. Crane B installs on the container automatically once coordinated — or install there yourself without crossing its path.', waitForAction: true, actionType: 'install' },
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
