import { ShipType } from '../../store/useGameStore'

// =============================================================================
// UPGRADE CONFIGURATION DATA
// Ship-specific LED upgrade parts for all 8 ship types
// =============================================================================

export interface UpgradeOption {
    partName: string
    label: string
    description: string
}

export const UPGRADE_CONFIGS: Record<ShipType, UpgradeOption[]> = {
    cruise: [
        { partName: 'balcony1', label: 'Port Fore Balcony', description: 'LED rail lighting' },
        { partName: 'balcony2', label: 'Starboard Fore Balcony', description: 'LED rail lighting' },
        { partName: 'balcony3', label: 'Port Mid Balcony', description: 'Ambient deck lights' },
        { partName: 'balcony4', label: 'Starboard Mid Balcony', description: 'Ambient deck lights' },
        { partName: 'balcony5', label: 'Port Aft Balcony', description: 'Sunset accent lights' },
        { partName: 'balcony6', label: 'Starboard Aft Balcony', description: 'Sunset accent lights' },
        { partName: 'funnel', label: 'Giant Funnel Array', description: 'Smokestack light show' },
        { partName: 'stern', label: 'Stern Water-Curtain', description: 'Aqua light projection' },
    ],
    container: [
        { partName: 'stack1', label: 'Forward Stack Array', description: 'Container top floodlights' },
        { partName: 'stack2', label: 'Forward-Mid Stack', description: 'Stack accent lighting' },
        { partName: 'stack3', label: 'Center Stack Array', description: 'Main mast beacons' },
        { partName: 'stack4', label: 'Aft-Mid Stack', description: 'Cargo bay illumination' },
        { partName: 'stack5', label: 'Aft Stack Array', description: 'Stern cargo lights' },
        { partName: 'top1', label: 'Fore Mast Array', description: 'Rotating searchlight' },
        { partName: 'top2', label: 'Center Mast Array', description: 'LED billboard array' },
        { partName: 'top3', label: 'Aft Mast Array', description: 'Navigation beacon' },
        { partName: 'side1', label: 'Port Hull LED Wall', description: 'Full side LED billboard' },
        { partName: 'side2', label: 'Starboard Hull LED Wall', description: 'Full side LED billboard' },
    ],
    tanker: [
        { partName: 'flare', label: 'Flare Stack Projector', description: 'Flame-effect light show' },
        { partName: 'rail1', label: 'Fore Deck Rails', description: 'Safety rail lighting' },
        { partName: 'rail2', label: 'Mid Deck Rails', description: 'Walkway illumination' },
        { partName: 'rail3', label: 'Aft Deck Rails', description: 'Perimeter floodlights' },
        { partName: 'rail4', label: 'Bridge Wing Rails', description: 'Navigation rail lights' },
        { partName: 'hull1', label: 'Bow Hull Wash', description: 'Underwater projection' },
        { partName: 'hull2', label: 'Stern Hull Wash', description: 'Wake illumination' },
        { partName: 'hull3', label: 'Port Hull Array', description: 'Side floodlighting' },
    ],
    bulk: [
        { partName: 'hatch1', label: 'Hold 1-2 Lighting', description: 'Fore cargo hold floodlights' },
        { partName: 'hatch2', label: 'Hold 3-4 Lighting', description: 'Mid-forward hold illumination' },
        { partName: 'hatch3', label: 'Hold 5-6 Lighting', description: 'Mid-aft hold floodlights' },
        { partName: 'hatch4', label: 'Hold 7-9 Lighting', description: 'Aft cargo hold illumination' },
        { partName: 'crane1', label: 'Port Fore Crane', description: 'Gantry crane LED array' },
        { partName: 'crane2', label: 'Stbd Fore Crane', description: 'Gantry crane LED array' },
        { partName: 'crane3', label: 'Port Aft Crane', description: 'Gantry crane LED array' },
        { partName: 'crane4', label: 'Stbd Aft Crane', description: 'Gantry crane LED array' },
        { partName: 'funnel', label: 'Exhaust Funnel', description: 'Stack light projection system' },
    ],
    lng: [
        { partName: 'membraneTank1', label: 'Tank 1 Cryo-Lights', description: 'Forward membrane tank glow' },
        { partName: 'membraneTank2', label: 'Tank 2 Cryo-Lights', description: 'Forward-mid tank illumination' },
        { partName: 'membraneTank3', label: 'Tank 3 Cryo-Lights', description: 'Aft-mid tank glow system' },
        { partName: 'membraneTank4', label: 'Tank 4 Cryo-Lights', description: 'Aft membrane tank illumination' },
        { partName: 'superstructure', label: 'Accommodation Lights', description: 'Living quarters accent lighting' },
        { partName: 'mast', label: 'Navigation Mast', description: 'Combined lantern array' },
        { partName: 'loadingArm1', label: 'Stbd Loading Arm', description: 'Cryogenic arm floodlight' },
        { partName: 'loadingArm2', label: 'Port Loading Arm', description: 'Cryogenic arm floodlight' },
        { partName: 'reliquefaction', label: 'Process Plant', description: 'Reliquefaction unit lighting' },
        { partName: 'tankBarrier1', label: 'Tank Barrier LEDs', description: 'Inter-barrier illumination' },
    ],
    roro: [
        { partName: 'sternRamp', label: 'Stern Ramp System', description: 'Vehicle ramp lighting' },
        { partName: 'bowVisor', label: 'Bow Visor Lights', description: 'Forward loading door illumination' },
        { partName: 'superstructure', label: 'Passenger Deck', description: 'Superstructure accent lighting' },
        { partName: 'lifeboat1', label: 'Port Lifeboat', description: 'Survival craft lighting' },
        { partName: 'lifeboat2', label: 'Starboard Lifeboat', description: 'Survival craft lighting' },
        { partName: 'sideDoorL', label: 'Port Side Door', description: 'Port side loading door lights' },
        { partName: 'sideDoorR', label: 'Starboard Side Door', description: 'Stbd side loading door lights' },
        { partName: 'mast', label: 'Mast Head Lights', description: 'Navigation and signal lights' },
    ],
    research: [
        { partName: 'aFrame', label: 'A-Frame Crane', description: 'Deployment crane lighting' },
        { partName: 'sonarDome', label: 'Sonar Array', description: 'Multibeam sonar illumination' },
        { partName: 'radarDish', label: 'Radar Mast', description: 'Scientific radar lighting' },
        { partName: 'crane', label: 'Deck Crane', description: 'Work crane floodlights' },
        { partName: 'laboratory', label: 'Lab Module', description: 'Research lab accent lights' },
        { partName: 'heliDeck', label: 'Helicopter Deck', description: 'Flight deck lighting system' },
        { partName: 'moonPool', label: 'Moon Pool', description: 'Submersible launch bay lights' },
    ],
    droneship: [
        { partName: 'thruster1', label: 'Port-Aft Thruster', description: 'Azimuth thruster bay light' },
        { partName: 'thruster2', label: 'Stbd-Aft Thruster', description: 'Azimuth thruster bay light' },
        { partName: 'thruster3', label: 'Port-Fwd Thruster', description: 'Azimuth thruster bay light' },
        { partName: 'thruster4', label: 'Stbd-Fwd Thruster', description: 'Azimuth thruster bay light' },
        { partName: 'equipmentContainer', label: 'Equipment Bay', description: 'Generator room lighting' },
        { partName: 'starlinkDish', label: 'Comm Array', description: 'Starlink and antenna lighting' },
        { partName: 'cameras', label: 'Camera System', description: 'Landing camera floodlights' },
        { partName: 'octagrabber', label: 'Octagrabber', description: 'Robot securing system lights' },
    ],
}

export const shipTypeLabels: Record<ShipType, string> = {
    cruise: 'Mega Cruise Liner',
    container: 'Ultra Container Vessel',
    tanker: 'VLCC Oil Tanker',
    bulk: 'Capesize Bulk Carrier',
    lng: 'Q-Max LNG Carrier',
    roro: 'Roll-on/Roll-off Ferry',
    research: 'Research Vessel',
    droneship: 'Space Recovery Drone Ship',
}

export const shipTypeColors: Record<ShipType, string> = {
    cruise: '#ff6b9d',
    container: '#00d4aa',
    tanker: '#ff9500',
    bulk: '#8b4513',
    lng: '#00bfff',
    roro: '#9b59b6',
    research: '#2ecc71',
    droneship: '#34495e',
}
