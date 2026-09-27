/**
 * Harbor Themes - Procedural booth configurations per location
 */

export type HarborType = 
  | 'norway' 
  | 'singapore' 
  | 'dubai' 
  | 'rotterdam' 
  | 'yokohama' 
  | 'longbeach' 
  | 'santos'

export interface HarborTheme {
  name: string
  description: string
  
  // Materials
  wallColor: string
  floorColor: string
  accentColor: string
  metalness: number
  roughness: number
  
  // Window/Glass
  windowTint: string
  windowOpacity: number
  windowRoughness: number
  hasRainDroplets: boolean
  hasCondensation: boolean
  
  // Lighting
  ambientLight: { color: string; intensity: number }
  directionalLight: { color: string; intensity: number }
  boothLights: Array<{
    position: [number, number, number]
    color: string
    intensity: number
    distance: number
  }>
  
  // Emissive elements
  panelEmissive: string
  panelIntensity: number
  buttonColors: {
    active: string
    inactive: string
  }
  
  // Effects
  fogColor: string
  fogDensity: number
  envMap: 'night' | 'sunset' | 'city' | 'warehouse'
  
  // Audio-reactive colors
  bassColor: string
  midColor: string
  trebleColor: string
  
  // UI/Holographic
  hudColor: string
  holographicOpacity: number
  
  // Particles
  hasDustMotes: boolean
  hasSteam: boolean
}

export const harborThemes: Record<HarborType, HarborTheme> = {
  // =============================================================================
  // NORWAY - Arctic, cold, foggy, industrial wood/metal
  // =============================================================================
  norway: {
    name: 'Bergen Fjord Terminal',
    description: 'Cold arctic dock with foggy windows and wooden accents',
    
    wallColor: '#3d4a5c',      // Weathered blue-grey metal
    floorColor: '#2a333f',      // Dark wet concrete
    accentColor: '#5a7a9a',     // Cold steel blue
    metalness: 0.6,
    roughness: 0.7,
    
    windowTint: '#a8c4d9',      // Foggy blue tint
    windowOpacity: 0.35,
    windowRoughness: 0.25,
    hasRainDroplets: true,
    hasCondensation: true,
    
    ambientLight: { color: '#4a5568', intensity: 0.3 },
    directionalLight: { color: '#a0b8d0', intensity: 0.6 },
    boothLights: [
      { position: [0, 3.5, 1], color: '#8bb8d9', intensity: 0.5, distance: 8 },
      { position: [-3.2, 2.5, 0], color: '#7aa0c0', intensity: 0.4, distance: 4 },
      { position: [3.2, 2.5, 0], color: '#7aa0c0', intensity: 0.4, distance: 4 },
      { position: [0, 2.5, 3.2], color: '#6a90b0', intensity: 0.35, distance: 5 },
    ],
    
    panelEmissive: '#5a8aaa',
    panelIntensity: 0.2,
    buttonColors: {
      active: '#00d4ff',
      inactive: '#3a4a5a'
    },
    
    fogColor: '#6a7a8a',
    fogDensity: 0.04,
    envMap: 'night',
    
    bassColor: '#00aaff',
    midColor: '#66ccff',
    trebleColor: '#aaddff',
    
    hudColor: '#00d4ff',
    holographicOpacity: 0.15,
    
    hasDustMotes: false,
    hasSteam: true,  // Cold breath/steam
  },
  
  // =============================================================================
  // SINGAPORE - High-tech, neon, sleek, tropical humidity
  // =============================================================================
  singapore: {
    name: 'Marina Bay Smart Port',
    description: 'Futuristic high-tech terminal with holographic displays',
    
    wallColor: '#1a1a2e',      // Deep space black
    floorColor: '#0f0f1a',      // Polished dark obsidian
    accentColor: '#ff00ff',     // Hot pink neon
    metalness: 0.9,
    roughness: 0.15,
    
    windowTint: '#ffd4a3',      // Warm humid haze
    windowOpacity: 0.15,
    windowRoughness: 0.1,
    hasRainDroplets: false,
    hasCondensation: true,      // Tropical humidity
    
    ambientLight: { color: '#2d1b4e', intensity: 0.4 },
    directionalLight: { color: '#ffcc88', intensity: 0.8 },
    boothLights: [
      { position: [0, 3.5, 1], color: '#ff00ff', intensity: 0.6, distance: 8 },
      { position: [-3.2, 2.5, 0], color: '#00ffff', intensity: 0.5, distance: 4 },
      { position: [3.2, 2.5, 0], color: '#ff6600', intensity: 0.5, distance: 4 },
      { position: [0, 2.5, 3.2], color: '#ff00aa', intensity: 0.45, distance: 5 },
    ],
    
    panelEmissive: '#ff00ff',
    panelIntensity: 0.4,
    buttonColors: {
      active: '#00ffff',
      inactive: '#2a0a3a'
    },
    
    fogColor: '#2a1a3a',
    fogDensity: 0.02,
    envMap: 'city',
    
    bassColor: '#ff00ff',
    midColor: '#ff6600',
    trebleColor: '#00ffff',
    
    hudColor: '#00ffff',
    holographicOpacity: 0.4,
    
    hasDustMotes: true,  // Floating data particles
    hasSteam: false,
  },
  
  // =============================================================================
  // DUBAI - Luxury, gold accents, pristine, desert heat
  // =============================================================================
  dubai: {
    name: 'Jebel Ali Diamond Terminal',
    description: 'Luxury port with gold accents and pristine white surfaces',
    
    wallColor: '#f5f0e8',      // Cream marble
    floorColor: '#e8e0d5',      // Polished sandstone
    accentColor: '#d4af37',     // Gold
    metalness: 0.8,
    roughness: 0.2,
    
    windowTint: '#fff8e7',      // Warm desert light
    windowOpacity: 0.1,
    windowRoughness: 0.05,
    hasRainDroplets: false,
    hasCondensation: false,     // Dry desert
    
    ambientLight: { color: '#fff5e6', intensity: 0.5 },
    directionalLight: { color: '#ffddaa', intensity: 1.2 },
    boothLights: [
      { position: [0, 3.5, 1], color: '#ffd700', intensity: 0.5, distance: 8 },
      { position: [-3.2, 2.5, 0], color: '#ffa500', intensity: 0.4, distance: 4 },
      { position: [3.2, 2.5, 0], color: '#ffa500', intensity: 0.4, distance: 4 },
      { position: [0, 2.5, 3.2], color: '#ffcc00', intensity: 0.4, distance: 5 },
    ],
    
    panelEmissive: '#d4af37',
    panelIntensity: 0.25,
    buttonColors: {
      active: '#00ff88',
      inactive: '#3a3530'
    },
    
    fogColor: '#e8dcc0',
    fogDensity: 0.015,
    envMap: 'sunset',
    
    bassColor: '#d4af37',
    midColor: '#ff8800',
    trebleColor: '#00ffaa',
    
    hudColor: '#d4af37',
    holographicOpacity: 0.2,
    
    hasDustMotes: true,  // Desert sand particles
    hasSteam: false,
  },
  
  // =============================================================================
  // ROTTERDAM - Industrial, green energy, weathered steel
  // =============================================================================
  rotterdam: {
    name: 'Maasvlakte Eco Hub',
    description: 'Industrial wind-powered terminal with weathered steel',
    
    wallColor: '#4a5568',      // Weathered steel
    floorColor: '#2d3748',      // Concrete
    accentColor: '#48bb78',     // Wind energy green
    metalness: 0.75,
    roughness: 0.6,
    
    windowTint: '#c5d5e0',      // Grey North Sea light
    windowOpacity: 0.25,
    windowRoughness: 0.2,
    hasRainDroplets: true,
    hasCondensation: false,
    
    ambientLight: { color: '#4a5568', intensity: 0.35 },
    directionalLight: { color: '#b8c8d8', intensity: 0.7 },
    boothLights: [
      { position: [0, 3.5, 1], color: '#48bb78', intensity: 0.5, distance: 8 },
      { position: [-3.2, 2.5, 0], color: '#68d391', intensity: 0.4, distance: 4 },
      { position: [3.2, 2.5, 0], color: '#68d391', intensity: 0.4, distance: 4 },
      { position: [0, 2.5, 3.2], color: '#9ae6b4', intensity: 0.35, distance: 5 },
    ],
    
    panelEmissive: '#48bb78',
    panelIntensity: 0.25,
    buttonColors: {
      active: '#48bb78',
      inactive: '#2d3748'
    },
    
    fogColor: '#718096',
    fogDensity: 0.03,
    envMap: 'warehouse',
    
    bassColor: '#48bb78',
    midColor: '#68d391',
    trebleColor: '#9ae6b4',
    
    hudColor: '#48bb78',
    holographicOpacity: 0.15,
    
    hasDustMotes: false,
    hasSteam: false,
  },
  
  // =============================================================================
  // YOKOHAMA - Traditional meets modern, cherry blossom pink, clean
  // =============================================================================
  yokohama: {
    name: 'Minato Mirai Sky Port',
    description: 'Japanese fusion of traditional and futuristic design',
    
    wallColor: '#2d3748',      // Dark slate
    floorColor: '#1a202c',      // Polished obsidian
    accentColor: '#ff6b9d',     // Cherry blossom pink
    metalness: 0.7,
    roughness: 0.3,
    
    windowTint: '#ffe4e1',      // Soft pink mist
    windowOpacity: 0.15,
    windowRoughness: 0.1,
    hasRainDroplets: true,
    hasCondensation: true,
    
    ambientLight: { color: '#4a3a4a', intensity: 0.4 },
    directionalLight: { color: '#ffdde1', intensity: 0.8 },
    boothLights: [
      { position: [0, 3.5, 1], color: '#ff6b9d', intensity: 0.5, distance: 8 },
      { position: [-3.2, 2.5, 0], color: '#ff8fab', intensity: 0.45, distance: 4 },
      { position: [3.2, 2.5, 0], color: '#ff8fab', intensity: 0.45, distance: 4 },
      { position: [0, 2.5, 3.2], color: '#ffb3c6', intensity: 0.4, distance: 5 },
    ],
    
    panelEmissive: '#ff6b9d',
    panelIntensity: 0.3,
    buttonColors: {
      active: '#ff6b9d',
      inactive: '#3a2a35'
    },
    
    fogColor: '#4a3a45',
    fogDensity: 0.025,
    envMap: 'city',
    
    bassColor: '#ff6b9d',
    midColor: '#ff8fab',
    trebleColor: '#ffb3c6',
    
    hudColor: '#ff6b9d',
    holographicOpacity: 0.25,
    
    hasDustMotes: true,  // Cherry blossom petals
    hasSteam: true,      // Hot springs aesthetic
  },
  
  // =============================================================================
  // LONG BEACH - California vibe, sunset oranges, laid back
  // =============================================================================
  longbeach: {
    name: 'Pacific Pier Terminal',
    description: 'California sunset vibes with surf culture aesthetics',
    
    wallColor: '#4a3728',      // Weathered wood
    floorColor: '#2d2418',      // Dark teak
    accentColor: '#ff7f50',     // Coral/orange sunset
    metalness: 0.4,
    roughness: 0.6,
    
    windowTint: '#ffcc88',      // Golden hour light
    windowOpacity: 0.12,
    windowRoughness: 0.15,
    hasRainDroplets: false,
    hasCondensation: false,
    
    ambientLight: { color: '#5a4a3a', intensity: 0.45 },
    directionalLight: { color: '#ffaa66', intensity: 0.9 },
    boothLights: [
      { position: [0, 3.5, 1], color: '#ff7f50', intensity: 0.5, distance: 8 },
      { position: [-3.2, 2.5, 0], color: '#ffa07a', intensity: 0.45, distance: 4 },
      { position: [3.2, 2.5, 0], color: '#ffa07a', intensity: 0.45, distance: 4 },
      { position: [0, 2.5, 3.2], color: '#ffb347', intensity: 0.4, distance: 5 },
    ],
    
    panelEmissive: '#ff7f50',
    panelIntensity: 0.25,
    buttonColors: {
      active: '#00ced1',
      inactive: '#3a3028'
    },
    
    fogColor: '#8b7355',
    fogDensity: 0.02,
    envMap: 'sunset',
    
    bassColor: '#ff7f50',
    midColor: '#ffa07a',
    trebleColor: '#00ced1',
    
    hudColor: '#00ced1',
    holographicOpacity: 0.2,
    
    hasDustMotes: false,
    hasSteam: false,
  },
  
  // =============================================================================
  // SANTOS - Brazilian energy, tropical rainforest, vibrant colors
  // =============================================================================
  santos: {
    name: 'Porto de Santos Tropical Hub',
    description: 'Vibrant Brazilian port with rainforest energy',
    
    wallColor: '#2d4a3e',      // Forest green
    floorColor: '#1a2f28',      // Dark moss
    accentColor: '#ffd700',     // Carnival gold
    metalness: 0.5,
    roughness: 0.55,
    
    windowTint: '#98fb98',      // Pale green tropical light
    windowOpacity: 0.2,
    windowRoughness: 0.18,
    hasRainDroplets: true,      // Tropical rain
    hasCondensation: true,
    
    ambientLight: { color: '#3a5a4a', intensity: 0.4 },
    directionalLight: { color: '#90ee90', intensity: 0.85 },
    boothLights: [
      { position: [0, 3.5, 1], color: '#ffd700', intensity: 0.55, distance: 8 },
      { position: [-3.2, 2.5, 0], color: '#ff6b9d', intensity: 0.5, distance: 4 },
      { position: [3.2, 2.5, 0], color: '#00d4aa', intensity: 0.5, distance: 4 },
      { position: [0, 2.5, 3.2], color: '#ff8c00', intensity: 0.45, distance: 5 },
    ],
    
    panelEmissive: '#ffd700',
    panelIntensity: 0.3,
    buttonColors: {
      active: '#00d4aa',
      inactive: '#2a3a35'
    },
    
    fogColor: '#4a6a5a',
    fogDensity: 0.035,
    envMap: 'sunset',
    
    bassColor: '#ff6b9d',
    midColor: '#ffd700',
    trebleColor: '#00d4aa',
    
    hudColor: '#00d4aa',
    holographicOpacity: 0.25,
    
    hasDustMotes: true,  // Jungle pollen/spores
    hasSteam: true,      // Tropical humidity
  },
}

// Helper to get theme by harbor
export function getHarborTheme(harbor: HarborType): HarborTheme {
  return harborThemes[harbor] || harborThemes.rotterdam
}

// All harbors list for UI
export const harborList: { id: HarborType; name: string }[] = [
  { id: 'norway', name: 'Bergen Fjord Terminal' },
  { id: 'singapore', name: 'Marina Bay Smart Port' },
  { id: 'dubai', name: 'Jebel Ali Diamond Terminal' },
  { id: 'rotterdam', name: 'Maasvlakte Eco Hub' },
  { id: 'yokohama', name: 'Minato Mirai Sky Port' },
  { id: 'longbeach', name: 'Pacific Pier Terminal' },
  { id: 'santos', name: 'Porto de Santos Tropical Hub' },
]
