// =============================================================================
// EVENT CONFIGURATIONS - HarborGlow Bay
// Spawn probabilities, intervals, and constraints for all event types
// =============================================================================

import { EventConfig, HarborEventType } from './types'

export const EVENT_CONFIGS: Record<HarborEventType, EventConfig> = {
    whale_migration: {
        enabled: true,
        probability: 0.08,
        minInterval: 1200,  // 20 minutes
        maxConcurrent: 1,
        seasonality: [12, 1, 2, 3, 4, 5],  // Dec-May
        timeOfDay: 'any'
    },
    dolphin_pod: {
        enabled: true,
        probability: 0.15,
        minInterval: 600,   // 10 minutes
        maxConcurrent: 2,
        timeOfDay: 'day'
    },
    porpoise_sighting: {
        enabled: true,
        probability: 0.05,  // Rare
        minInterval: 1800,
        maxConcurrent: 1,
        timeOfDay: 'day'
    },
    shark_patrol: {
        enabled: true,
        probability: 0.06,
        minInterval: 2400,  // 40 minutes
        maxConcurrent: 1,
        seasonality: [7, 8, 9, 10],  // Summer/fall
        timeOfDay: 'any'
    },
    sea_lion_haulout: {
        enabled: true,
        probability: 0.25,
        minInterval: 300,
        maxConcurrent: 3,
        timeOfDay: 'any'
    },
    plankton_bloom: {
        enabled: true,
        probability: 0.1,
        minInterval: 900,
        maxConcurrent: 1,
        seasonality: [6, 7, 8, 9],  // Summer
        timeOfDay: 'night'  // Only visible at night
    },
    ship_fire: {
        enabled: true,
        probability: 0.02,  // Very rare
        minInterval: 1800,
        maxConcurrent: 1,
        requiresShip: true
    },
    fireboat_response: {
        enabled: true,
        probability: 0,
        minInterval: 0,
        maxConcurrent: 1,
        requiresShip: true  // Triggered by ship_fire
    },
    navy_fleet_week: {
        enabled: true,
        probability: 0.05,
        minInterval: 1800,
        maxConcurrent: 1,
        seasonality: [5, 10],  // May and October
        timeOfDay: 'day'
    },
    navy_resupply: {
        enabled: true,
        probability: 0.1,
        minInterval: 900,
        maxConcurrent: 1
    },
    atmospheric_river: {
        enabled: true,
        probability: 0.12,
        minInterval: 600,
        maxConcurrent: 1,
        seasonality: [11, 12, 1, 2, 3, 4]  // Winter storm season
    },
    cruise_arrival: {
        enabled: true,
        probability: 0.15,
        minInterval: 300,
        maxConcurrent: 1,
        timeOfDay: 'day'
    },
    cruise_departure: {
        enabled: true,
        probability: 0.15,
        minInterval: 300,
        maxConcurrent: 1,
        timeOfDay: 'any'
    },
    suspicious_vessel: {
        enabled: true,
        probability: 0.03,  // Very rare
        minInterval: 2400,
        maxConcurrent: 1,
        timeOfDay: 'night'
    },
    clear: {
        enabled: false,
        probability: 0,
        minInterval: 0,
        maxConcurrent: 0
    }
}
