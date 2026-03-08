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

export class ShipSpawner {
    private static nameCounters: Record<ShipType, number> = {
        cruise: 0,
        container: 0,
        tanker: 0
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

        // Find valid position
        const existingShips = useGameStore.getState().ships
        const position = this.findValidPosition(existingShips, 20)

        const ship: Ship = {
            id,
            type,
            modelName: blueprint.id,
            position,
            length: 20,
            attachmentPoints,
            name
        }

        addShip(ship)
        console.log(`[ShipSpawner] 🚢 Spawned ${type}: "${name}" using blueprint`)
        
        return ship
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
            tanker: TANKER_NAMES
        }
        
        const typeNames = names[type]
        const index = this.nameCounters[type] % typeNames.length
        const baseName = typeNames[index]
        this.nameCounters[type]++
        
        const count = Math.floor(this.nameCounters[type] / typeNames.length)
        return count > 0 ? `${baseName} ${count + 1}` : baseName
    }

    static resetCounters() {
        this.nameCounters = { cruise: 0, container: 0, tanker: 0 }
    }

    static getShipTypeInfo(type: ShipType) {
        const blueprint = getBlueprint(type)
        const info = {
            cruise: { name: 'Ocean Symphony', genre: 'Orchestral Pop Symphony', bpm: 120, description: 'Mega cruise liner with multi-deck balconies' },
            container: { name: 'Neon Stack', genre: 'Future Bass / Techno', bpm: 128, description: 'Ultra large container vessel with LED billboard' },
            tanker: { name: 'Flame Runner', genre: 'Dubstep / Industrial', bpm: 140, description: 'VLCC oil tanker with flame-effect projector' }
        }
        return { ...info[type], modelName: blueprint?.name || type }
    }
}
