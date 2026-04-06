// =============================================================================
// WILDLIFE SPECIES DATA (Scientifically Accurate)
// HarborGlow Bay - Port of Oakland + SF Bay Area research
//
// SCIENTIFIC SOURCES:
// - Gray whales (Eschrichtius robustus): Migrate Dec-May, 10-12m, protected by speed limits
// - Humpback whales (Megaptera novaeangliae): Dec-May migration, 14-16m
// - Bottlenose dolphins (Tursiops truncatus): Year-round SF Bay residents
// - Harbor porpoise (Phocoena phocoena): Year-round, shy, near shore
// - Great white sharks (Carcharodon carcharias): Near Golden Gate/Farallon Islands
// - California sea lions (Zalophus californianus): Pier 39 style haul-outs
// - Bioluminescent plankton: Lingulodinium polyedrum, summer blooms
// =============================================================================

export const SPECIES_DATA = {
    gray_whale: {
        scientificName: 'Eschrichtius robustus',
        length: 12,
        weight: 36000,  // kg
        migrationMonths: [12, 1, 2, 3, 4, 5],
        speed: 7,  // km/h cruising
        protected: true,
        description: 'Pacific Coast migration between Alaska and Baja'
    },
    humpback_whale: {
        scientificName: 'Megaptera novaeangliae',
        length: 14,
        weight: 30000,
        migrationMonths: [12, 1, 2, 3, 4, 5],
        speed: 8,
        protected: true,
        description: 'Known for spectacular breaching behavior'
    },
    bottlenose_dolphin: {
        scientificName: 'Tursiops truncatus',
        length: 3,
        weight: 650,
        yearRound: true,
        speed: 35,
        description: 'Intelligent, playful, known for bow-riding'
    },
    harbor_porpoise: {
        scientificName: 'Phocoena phocoena',
        length: 1.5,
        weight: 60,
        yearRound: true,
        speed: 15,
        description: 'Shy, elusive, stays close to shore'
    },
    great_white_shark: {
        scientificName: 'Carcharodon carcharias',
        length: 4.5,
        weight: 1100,
        habitat: 'Near Golden Gate/Farallon Islands',
        speed: 40,  // km/h burst
        description: 'Apex predator, seasonal near harbor entrance'
    },
    california_sea_lion: {
        scientificName: 'Zalophus californianus',
        length: 2.2,
        weight: 300,
        yearRound: true,
        hauloutSites: ['Pier 39', 'North breakwater', 'Moss Landing'],
        description: 'Vocal, social, popular with tourists'
    },
    bioluminescent_plankton: {
        scientificName: 'Lingulodinium polyedrum',
        bloomSeason: [6, 7, 8, 9],  // Summer/fall
        trigger: 'Wave disturbance at night',
        color: 'Electric blue',
        description: 'Red tide by day, blue glow by night when disturbed'
    }
}
