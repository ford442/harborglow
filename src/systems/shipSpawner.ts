import { useGameStore, ShipType, Ship, AttachmentPoint } from '../store/useGameStore'
import { getBlueprint } from '../types/ShipBlueprint'

// Ship name generators
const CRUISE_NAMES = [
    'Ocean Symphony', 'Sea Princess', 'Star Voyager', 'Royal Horizon',
    'Pacific Dream', 'Atlantic Majesty', 'Crystal Wave', 'Golden Sunset',
    'Silver Moon', 'Diamond Seas', 'Eternal Horizon', 'Paradise Crown'
]

const CONTAINER_NAMES = [
    'Neon Stack', 'Freight Giant', 'Cargo Titan', 'Global Express',
    'Trade Master', 'Container King', 'Logistics Star', 'Cargo Galaxy',
    'Trade Horizon', 'Freight Voyager', 'Container Force', 'Cargo Legend'
]

const TANKER_NAMES = [
    'Flame Runner', 'Black Gold', 'Oil Titan', 'Energy Giant',
    'Petro King', 'Liquid Power', 'Oil Horizon', 'Energy Voyager',
    'Black Pearl', 'Liquid Giant', 'Oil Master', 'Petro Legend'
]

// New ship type names based on real-world vessels
const BULK_NAMES = [
    'Iron Mountain', 'Coal Colossus', 'Grain Guardian', 'Ore Odyssey',
    'Mineral Majesty', 'Bulk Behemoth', 'Cargo Mountain', 'Rock Runner',
    'Earth Mover', 'Raw Power', 'Mineral King', 'Ore Titan'
]

const LNG_NAMES = [
    'Cryo Titan', 'Frozen Flame', 'LNG Legend', 'Arctic Arrow',
    'Gas Giant', 'Cryo Queen', 'Polar Pioneer', 'LNG Voyager',
    'Frost Carrier', 'Gas Guardian', 'Arctic Express', 'Cryo Master'
]

const RORO_NAMES = [
    'Vehicle Voyager', 'Auto Ark', 'Car Carrier', 'Wheels of Fortune',
    'Rolling Thunder', 'Auto Express', 'Vehicle Venture', 'Caravan Seas',
    'Auto Atlantic', 'Rolling Stock', 'Drive-On Dream', 'Vehicle Victory'
]

const RESEARCH_NAMES = [
    'Deep Discoverer', 'Ocean Explorer', 'Research Pioneer', 'Sea Scholar',
    'Marine Maven', 'Abyss Seeker', 'Science Sentinel', 'Knowledge Navigator',
    'Discovery Dawn', 'Research Quest', 'Ocean Oracle', 'Science Sovereign'
]

const DRONESHIP_NAMES = [
    'Of Course I Still Love You', 'Just Read The Instructions', 'A Shortfall of Gravitas',
    'Of Course We Still Love You', 'Please Read The Instructions', 'Gravitys Rainbow',
    'Landing Platform', 'Rocket Recovery', 'Booster Base', 'Falcon Finder'
]

export class ShipSpawner {
    private static nameCounters: Record<ShipType, number> = {
        cruise: 0,
        container: 0,
        tanker: 0,
        bulk: 0,
        lng: 0,
        roro: 0,
        research: 0,
        droneship: 0
    }

    static spawnShip(type: ShipType): Ship {
        const addShip = useGameStore.getState().addShip
        const blueprint = getBlueprint(type)
        
        if (!blueprint) {
            throw new Error(`Blueprint not found for ship type: ${type}`)
        }

        const name = this.generateShipName(type)
        const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

        // Generate attachment points from blueprint
        const attachmentPoints: AttachmentPoint[] = blueprint.attachmentPoints.map((pointId) => {
            // Find the part in blueprint to get position
            const part = blueprint.parts.find(p => p.id === pointId)
            return {
                position: part?.position || [0, 0, 0],
                rotation: part?.rotation || [0, 0, 0],
                partName: pointId
            }
        })

        // Find valid position with spacing based on ship type
        const existingShips = useGameStore.getState().ships
        const shipLength = this.getShipLength(type)
        const position = this.findValidPosition(existingShips, shipLength)

        const ship: Ship = {
            id,
            type,
            modelName: blueprint.id,
            position,
            length: shipLength,
            attachmentPoints,
            name
        }

        addShip(ship)
        console.log(`[ShipSpawner] 🚢 Spawned ${type}: "${name}" using blueprint`)
        
        return ship
    }
    
    private static getShipLength(type: ShipType): number {
        // Lengths based on scientific specifications
        const lengths: Record<ShipType, number> = {
            cruise: 20,
            container: 22,
            tanker: 26,
            bulk: 29,       // Capesize ~290m
            lng: 35,        // Q-Max ~345m
            roro: 19,       // Typical Ro-Ro ~190m
            research: 15,   // Research vessel ~75m
            droneship: 9    // ASDS ~90m
        }
        return lengths[type]
    }

    private static findValidPosition(
        existingShips: Ship[], 
        shipLength: number
    ): [number, number, number] {
        const minDistance = shipLength * 0.8
        const maxAttempts = 50
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = (Math.random() - 0.5) * 40
            const z = (Math.random() - 0.5) * 20
            const position: [number, number, number] = [x, 0, z]
            
            let valid = true
            for (const ship of existingShips) {
                const dx = ship.position[0] - x
                const dz = ship.position[2] - z
                const distance = Math.sqrt(dx * dx + dz * dz)
                
                if (distance < minDistance) {
                    valid = false
                    break
                }
            }
            
            if (valid) return position
        }
        
        const index = existingShips.length
        const gridX = (index % 4) * 15 - 22.5
        const gridZ = Math.floor(index / 4) * 15 - 15
        return [gridX, 0, gridZ]
    }

    private static generateShipName(type: ShipType): string {
        const names: Record<ShipType, string[]> = {
            cruise: CRUISE_NAMES,
            container: CONTAINER_NAMES,
            tanker: TANKER_NAMES,
            bulk: BULK_NAMES,
            lng: LNG_NAMES,
            roro: RORO_NAMES,
            research: RESEARCH_NAMES,
            droneship: DRONESHIP_NAMES
        }
        
        const typeNames = names[type]
        const index = this.nameCounters[type] % typeNames.length
        const baseName = typeNames[index]
        this.nameCounters[type]++
        
        const count = Math.floor(this.nameCounters[type] / typeNames.length)
        return count > 0 ? `${baseName} ${count + 1}` : baseName
    }

    static resetCounters() {
        this.nameCounters = { cruise: 0, container: 0, tanker: 0, bulk: 0, lng: 0, roro: 0, research: 0, droneship: 0 }
    }

    static getShipTypeInfo(type: ShipType) {
        const blueprint = getBlueprint(type)
        const info = {
            cruise: { name: 'Ocean Symphony', genre: 'Orchestral Pop Symphony', bpm: 120, description: 'Mega cruise liner with multi-deck balconies' },
            container: { name: 'Neon Stack', genre: 'Future Bass / Techno', bpm: 128, description: 'Ultra large container vessel with LED billboard' },
            tanker: { name: 'Flame Runner', genre: 'Dubstep / Industrial', bpm: 140, description: 'VLCC oil tanker with flame-effect projector' },
            bulk: { name: 'Iron Mountain', genre: 'Industrial Metal / Hard Rock', bpm: 135, description: 'Capesize bulk carrier (170,000 DWT) with massive cargo holds' },
            lng: { name: 'Cryo Titan', genre: 'Ambient / Cryogenic Techno', bpm: 118, description: 'Q-Max LNG carrier (266,000 m³) with membrane tanks at -163°C' },
            roro: { name: 'Vehicle Voyager', genre: 'Synthwave / Driving Rock', bpm: 125, description: 'Roll-on/Roll-off ferry with vehicle decks and stern ramps' },
            research: { name: 'Deep Discoverer', genre: 'Ambient / Scientific', bpm: 110, description: 'Ice-strengthened research vessel with A-frame and sonar array' },
            droneship: { name: 'Of Course I Still Love You', genre: 'Space Ambient / Electronic', bpm: 105, description: 'SpaceX ASDS - autonomous spaceport drone ship for booster recovery' }
        }
        return { ...info[type], modelName: blueprint?.name || type }
    }
}
