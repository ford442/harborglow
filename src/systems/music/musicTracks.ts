import { ShipType } from '../../store/useGameStore'

// =============================================================================
// BAND NAMES AND TRACK DEFINITIONS FOR ALL 11 SHIP TYPES
// =============================================================================

export interface BandInfo {
    name: string
    genre: string
}

const bandTracks: Map<ShipType, BandInfo> = new Map([
    ['cruise', { 
        name: 'The Deck Dancers', 
        genre: 'Orchestral Pop Symphony' 
    }],
    ['container', { 
        name: 'Neon Freight Crew', 
        genre: 'Future Bass / Techno' 
    }],
    ['tanker', { 
        name: 'Industrial Flames', 
        genre: 'Dubstep / Industrial' 
    }],
    ['bulk', { 
        name: 'Iron Ore Orchestra', 
        genre: 'Industrial Metal / Hard Rock' 
    }],
    ['lng', { 
        name: 'Cryogenic Pulse', 
        genre: 'Ambient / Cryogenic Techno' 
    }],
    ['roro', { 
        name: 'Highway Star', 
        genre: 'Synthwave / Driving Rock' 
    }],
    ['research', { 
        name: 'Sonar Collective', 
        genre: 'Ambient / Scientific' 
    }],
    ['droneship', {
        name: 'Orbital Mechanics',
        genre: 'Space Ambient / Electronic'
    }],
    ['ferry', {
        name: 'Island Crossings',
        genre: 'Reggae / Calypso Fusion'
    }],
    ['trawler', {
        name: 'The Saltwater Crew',
        genre: 'Sea Shanty / Folk'
    }],
    ['horizon', {
        name: 'Deep Meridian',
        genre: 'Oceanic Ambient / Post-Rock'
    }],
    ['fireboat', {
        name: 'Emergency Pulse',
        genre: 'Industrial / Siren Techno'
    }]
])

export const getBandInfo = (shipType: ShipType): BandInfo => {
    return bandTracks.get(shipType) || { name: 'Unknown Band', genre: 'Unknown' }
}
