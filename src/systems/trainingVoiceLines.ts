// =============================================================================
// TRAINING SYSTEM - Instructor Voice Lines
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
