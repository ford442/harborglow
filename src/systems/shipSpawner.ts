import { useGameStore, ShipType, Ship, AttachmentPoint } from '../store/useGameStore'

// =============================================================================
// SHIP SPAWNER SYSTEM
// Creates ships with appropriate attachment points for upgrades
// =============================================================================

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

// Model names for GLB files - place files in /public/models/
const MODEL_NAMES: Record<ShipType, string> = {
    cruise: 'cruise_liner',
    container: 'container_vessel',
    tanker: 'oil_tanker'
}

export class ShipSpawner {
    private static nameCounters: Record<ShipType, number> = {
        cruise: 0,
        container: 0,
        tanker: 0
    }

    static spawnShip(type: ShipType): Ship {
        const addShip = useGameStore.getState().addShip

        // Get ship configuration
        const config = this.getShipConfig(type)
        
        // Generate unique ship name
        const name = this.generateShipName(type)
        
        // Get model name based on type
        const modelName = MODEL_NAMES[type]

        // Generate unique ID
        const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

        // Random position with some spacing from existing ships
        const existingShips = useGameStore.getState().ships
        let position = this.findValidPosition(existingShips, config.length)

        const ship: Ship = {
            id,
            type,
            modelName, // GLB model filename
            position,
            length: config.length,
            attachmentPoints: config.attachmentPoints,
            name
        }

        addShip(ship)
        console.log(`[ShipSpawner] Spawned ${type} ship: "${name}" (${id}) at [${position.join(', ')}]`)
        console.log(`[ShipSpawner] Model: /models/${modelName}.glb`)
        
        return ship
    }

    private static getShipConfig(type: ShipType): { 
        length: number, 
        attachmentPoints: AttachmentPoint[] 
    } {
        switch (type) {
            case 'cruise':
                return this.getCruiseShipConfig()
            case 'container':
                return this.getContainerShipConfig()
            case 'tanker':
                return this.getTankerShipConfig()
            default:
                throw new Error(`Unknown ship type: ${type}`)
        }
    }

    // -------------------------------------------------------------------------
    // MEGA CRUISE LINER - "Ocean Symphony"
    // Model: /models/cruise_liner.glb
    // Scale: 0.8 (TODO: tune scale after testing)
    // -------------------------------------------------------------------------
    private static getCruiseShipConfig() {
        const attachmentPoints: AttachmentPoint[] = [
            // Starboard balconies (4) - positioned along the side decks
            { 
                position: [2.8, 0.8, -6], 
                rotation: [0, 0, 0], 
                partName: 'balcony1' 
            },
            { 
                position: [2.8, 0.8, -2], 
                rotation: [0, 0, 0], 
                partName: 'balcony2' 
            },
            { 
                position: [2.8, 0.8, 2], 
                rotation: [0, 0, 0], 
                partName: 'balcony3' 
            },
            { 
                position: [2.8, 0.8, 6], 
                rotation: [0, 0, 0], 
                partName: 'balcony4' 
            },
            // Port balconies (2 for variety)
            { 
                position: [-2.8, 0.8, -4], 
                rotation: [0, 0, 0], 
                partName: 'balcony5' 
            },
            { 
                position: [-2.8, 0.8, 4], 
                rotation: [0, 0, 0], 
                partName: 'balcony6' 
            },
            // Upper deck balconies - higher up on the ship
            { 
                position: [2.4, 1.8, 0], 
                rotation: [0, 0, 0], 
                partName: 'balcony7' 
            },
            { 
                position: [-2.4, 1.8, 0], 
                rotation: [0, 0, 0], 
                partName: 'balcony8' 
            },
            // Giant funnel array - top of the red funnel
            { 
                position: [0, 4, -7], 
                rotation: [0, 0, 0], 
                partName: 'funnel' 
            },
            // Stern water-curtain - back of the ship
            { 
                position: [0, 1, 10], 
                rotation: [0, 0, 0], 
                partName: 'stern' 
            },
        ]
        return {
            length: 22,
            attachmentPoints
        }
    }

    // -------------------------------------------------------------------------
    // ULTRA LARGE CONTAINER VESSEL - "Neon Stack"
    // Model: /models/container_vessel.glb
    // Scale: 1.1 (TODO: tune scale after testing)
    // -------------------------------------------------------------------------
    private static getContainerShipConfig() {
        const attachmentPoints: AttachmentPoint[] = [
            // Stack tops (5 positions along the deck) - on container stacks
            { 
                position: [-10, 2, 0], 
                rotation: [0, 0, 0], 
                partName: 'stack1' 
            },
            { 
                position: [-5, 2, 0], 
                rotation: [0, 0, 0], 
                partName: 'stack2' 
            },
            { 
                position: [0, 2, 0], 
                rotation: [0, 0, 0], 
                partName: 'stack3' 
            },
            { 
                position: [5, 2, 0], 
                rotation: [0, 0, 0], 
                partName: 'stack4' 
            },
            { 
                position: [10, 2, 0], 
                rotation: [0, 0, 0], 
                partName: 'stack5' 
            },
            // Mast tops (highest points) - above the bridge/radar masts
            { 
                position: [-10, 3.5, 0], 
                rotation: [0, 0, 0], 
                partName: 'top1' 
            },
            { 
                position: [0, 3.5, 0], 
                rotation: [0, 0, 0], 
                partName: 'top2' 
            },
            { 
                position: [10, 3.5, 0], 
                rotation: [0, 0, 0], 
                partName: 'top3' 
            },
            // Side LED walls - along the hull sides
            { 
                position: [0, 0, 2.8], 
                rotation: [0, Math.PI / 2, 0], 
                partName: 'side1' 
            },
            { 
                position: [0, 0, -2.8], 
                rotation: [0, -Math.PI / 2, 0], 
                partName: 'side2' 
            },
        ]
        return {
            length: 26,
            attachmentPoints
        }
    }

    // -------------------------------------------------------------------------
    // VLCC OIL TANKER - "Flame Runner"
    // Model: /models/oil_tanker.glb
    // Scale: 0.9 (TODO: tune scale after testing)
    // -------------------------------------------------------------------------
    private static getTankerShipConfig() {
        const attachmentPoints: AttachmentPoint[] = [
            // Flare stack (the showpiece) - above the superstructure
            { 
                position: [-12, 6, 0], 
                rotation: [0, 0, 0], 
                partName: 'flare' 
            },
            // Deck rails (safety lighting along walkways) - along deck edges
            { 
                position: [-20, 0.5, 0], 
                rotation: [0, 0, 0], 
                partName: 'rail1' 
            },
            { 
                position: [-5, 0.5, 0], 
                rotation: [0, 0, 0], 
                partName: 'rail2' 
            },
            { 
                position: [10, 0.5, 0], 
                rotation: [0, 0, 0], 
                partName: 'rail3' 
            },
            { 
                position: [20, 0.5, 0], 
                rotation: [0, 0, 0], 
                partName: 'rail4' 
            },
            // Hull side washes (underwater lighting) - below waterline
            { 
                position: [18, -1, 0], 
                rotation: [0, 0, 0], 
                partName: 'hull1' 
            },
            { 
                position: [-18, -1, 0], 
                rotation: [0, 0, 0], 
                partName: 'hull2' 
            },
            { 
                position: [0, -1, 0], 
                rotation: [0, 0, 0], 
                partName: 'hull3' 
            },
        ]
        return {
            length: 45,
            attachmentPoints
        }
    }

    // -------------------------------------------------------------------------
    // POSITIONING
    // Finds a valid position for a new ship
    // -------------------------------------------------------------------------
    private static findValidPosition(
        existingShips: Ship[], 
        shipLength: number
    ): [number, number, number] {
        const minDistance = shipLength * 0.8
        const maxAttempts = 50
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Generate random position in dock area
            const x = (Math.random() - 0.5) * 40
            const z = (Math.random() - 0.5) * 20
            const position: [number, number, number] = [x, 0, z]
            
            // Check distance from all existing ships
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
            
            if (valid) {
                return position
            }
        }
        
        // Fallback: place in a grid if random placement fails
        const index = existingShips.length
        const gridX = (index % 4) * 15 - 22.5
        const gridZ = Math.floor(index / 4) * 15 - 15
        return [gridX, 0, gridZ]
    }

    // -------------------------------------------------------------------------
    // NAMING
    // Generates unique ship names
    // -------------------------------------------------------------------------
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
        
        // Add number suffix if not the first of this name
        const count = Math.floor(this.nameCounters[type] / typeNames.length)
        return count > 0 ? `${baseName} ${count + 1}` : baseName
    }

    // -------------------------------------------------------------------------
    // UTILITY
    // Reset counters and get info
    // -------------------------------------------------------------------------
    static resetCounters() {
        this.nameCounters = { cruise: 0, container: 0, tanker: 0 }
    }

    static getShipTypeInfo(type: ShipType): {
        name: string,
        genre: string,
        bpm: number,
        description: string,
        modelName: string
    } {
        const info = {
            cruise: {
                name: 'Ocean Symphony',
                genre: 'Orchestral Pop Symphony',
                bpm: 120,
                description: 'Mega cruise liner with multi-deck balconies',
                modelName: MODEL_NAMES.cruise
            },
            container: {
                name: 'Neon Stack',
                genre: 'Future Bass / Techno',
                bpm: 128,
                description: 'Ultra large container vessel with LED billboard',
                modelName: MODEL_NAMES.container
            },
            tanker: {
                name: 'Flame Runner',
                genre: 'Dubstep / Industrial',
                bpm: 140,
                description: 'VLCC oil tanker with flame-effect projector',
                modelName: MODEL_NAMES.tanker
            }
        }
        return info[type]
    }
    
    // Get model path for a ship type
    static getModelPath(type: ShipType): string {
        return `/models/${MODEL_NAMES[type]}.glb`
    }
}
