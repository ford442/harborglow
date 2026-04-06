// =============================================================================
// EVENT SYSTEM TYPES - HarborGlow Bay
// =============================================================================

export type HarborEventType = 
    | 'whale_migration'      // Gray/humpback migration (Dec-May)
    | 'dolphin_pod'          // Bottlenose dolphins bow-riding
    | 'porpoise_sighting'    // Harbor porpoise (rare, shy)
    | 'shark_patrol'         // Great whites near entrance
    | 'sea_lion_haulout'     // Piers/rocks with barking sea lions
    | 'plankton_bloom'       // Bioluminescent display
    | 'ship_fire'            // Rare container/tanker fire emergency
    | 'fireboat_response'    // 5 fireboats responding
    | 'navy_fleet_week'      // May/October naval visits
    | 'navy_resupply'        // Random naval vessel
    | 'atmospheric_river'    // Pineapple Express storm
    | 'cruise_arrival'       // Tourism ship arrival
    | 'cruise_departure'     // Mexico/Alaska bound
    | 'suspicious_vessel'    // Rare small boat alert
    | 'clear'                // No active event

export interface HarborEvent {
    id: string
    type: HarborEventType
    startTime: number
    duration: number
    intensity: number
    affectedShipId?: string
    position: [number, number, number]
    metadata?: Record<string, unknown>
}

export interface EventConfig {
    enabled: boolean
    probability: number
    minInterval: number
    maxConcurrent: number
    seasonality?: number[]  // Months (1-12)
    timeOfDay?: 'day' | 'night' | 'any'
    requiresShip?: boolean
}

export type BusinessPatternType = 
    | 'tanker_geopolitical'
    | 'tariff_event'
    | 'labor_action'
    | 'peak_season'

export interface BusinessPattern {
    type: BusinessPatternType
    active: boolean
    intensity: number
    startTime: number
    duration: number
    affectedShipTypes: import('../../store/useGameStore').ShipType[]
    arrivalModifier: number
    description: string
}

export interface PortOperations {
    craneSwayFactor: number
    loadingSpeedModifier: number
    queueLength: number
    railActivity: number
}
