import { ShipType } from '../../store/useGameStore'

// =============================================================================
// LYRICS - SYNCED TO BEAT FOR ALL SHIP TYPES
// =============================================================================

export interface LyricEntry {
    time: string
    text: string
}

const lyricsMap: Map<ShipType, LyricEntry[]> = new Map([
    // Mega Cruise Liner - "Ocean Symphony" - Orchestral + choir
    ['cruise', [
        { time: '0:0', text: 'We sail through the night…' },
        { time: '0:2', text: 'stars shining bright…' },
        { time: '1:0', text: 'lights ignite…' },
        { time: '1:2', text: 'HarborGlow!' },
        { time: '2:0', text: 'Ocean Symphony!' },
        { time: '2:2', text: 'Dancing on the waves!' },
        { time: '3:0', text: 'We are the light…' },
        { time: '3:2', text: 'through the night…' },
        { time: '4:0', text: 'HarborGlow!' },
    ]],

    // Ultra Large Container Vessel - "Neon Stack" - Heavy techno / future bass
    ['container', [
        { time: '0:0', text: 'Stack it high…' },
        { time: '0:1', text: 'touch the sky…' },
        { time: '0:2', text: 'light the sky…' },
        { time: '0:3', text: 'NEON STACK!' },
        { time: '1:0', text: 'Move that freight all night!' },
        { time: '1:2', text: 'Beat so tight!' },
        { time: '2:0', text: 'Containers glowing bright!' },
        { time: '2:2', text: 'HarborGlow!' },
        { time: '3:0', text: 'Stack it higher!' },
        { time: '3:2', text: 'Set it on fire!' },
    ]],

    // VLCC Oil Tanker - "Flame Runner" - Gritty industrial / dubstep
    ['tanker', [
        { time: '0:0', text: 'Black gold flows…' },
        { time: '0:2', text: 'fire glows…' },
        { time: '1:0', text: 'we own these glowing seas!' },
        { time: '1:2', text: 'FLAME RUNNER!' },
        { time: '2:0', text: 'Industrial might!' },
        { time: '2:2', text: 'Burning through the night!' },
        { time: '3:0', text: 'We are the fire!' },
        { time: '3:2', text: 'HarborGlow!' },
        { time: '4:0', text: 'Oil and flame!' },
        { time: '4:2', text: 'Know our name!' },
    ]],

    // Bulk Carrier
    ['bulk', []],

    // LNG Carrier
    ['lng', []],

    // RO-RO Ferry
    ['roro', []],

    // Research Vessel
    ['research', []],

    // Drone Ship
    ['droneship', []],

    // Island Hopper Ferry - "Harbour Light" - Reggae / Calypso
    ['ferry', [
        { time: '0:0', text: 'Island to island we ride…' },
        { time: '0:2', text: 'lights on the tide…' },
        { time: '1:0', text: 'HarborGlow!' },
        { time: '2:0', text: 'Every crossing glows bright!' },
        { time: '3:0', text: 'Home on the water tonight!' },
    ]],

    // North Star Trawler - "Saltwater" - Sea Shanty
    ['trawler', [
        { time: '0:0', text: 'Haul the nets, light the way…' },
        { time: '0:2', text: 'North Star guides our day…' },
        { time: '1:0', text: 'HarborGlow!' },
        { time: '2:0', text: 'Salt and steel and light!' },
        { time: '3:0', text: 'We sail through the night!' },
    ]],

    // Horizon Deep - "Meridian" - Oceanic Ambient
    ['horizon', [
        { time: '0:0', text: 'Beneath the deep we find…' },
        { time: '1:0', text: 'the light we left behind…' },
        { time: '2:0', text: 'HarborGlow…' },
        { time: '4:0', text: 'Horizon calling…' },
    ]],
])

export const getLyrics = (shipType: ShipType): LyricEntry[] => {
    return lyricsMap.get(shipType) || []
}

export const getAllLyrics = (): Map<ShipType, LyricEntry[]> => {
    return new Map(lyricsMap)
}
