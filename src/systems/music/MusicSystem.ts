import * as Tone from 'tone'
import { ShipType } from '../../store/useGameStore'
import { getBandInfo, BandInfo } from './musicTracks'
import { getLyrics, LyricEntry } from './lyrics'
import { createSynthChain, SynthChainConfig } from './musicSynthChains'

// =============================================================================
// MUSIC SYSTEM - Main orchestrator
// Manages unique audio tracks for each ship type with synchronized lyrics
// =============================================================================

class MusicSystem {
    private transports: Map<ShipType, any> = new Map()
    private synthChains: Map<ShipType, SynthChainConfig> = new Map()
    private lyrics: Map<ShipType, LyricEntry[]> = new Map()
    private currentLyricIndex: Map<ShipType, number> = new Map()
    private isInitialized: boolean = false

    constructor() {
        this.initializeLyrics()
    }

    private initializeLyrics() {
        const shipTypes: ShipType[] = ['cruise', 'container', 'tanker', 'bulk', 'lng', 'roro', 'research', 'droneship', 'ferry', 'trawler', 'horizon']
        shipTypes.forEach(shipType => {
            this.lyrics.set(shipType, getLyrics(shipType))
            this.currentLyricIndex.set(shipType, 0)
        })
    }

    private async initializeAudio() {
        if (this.isInitialized) return
        
        await Tone.start()
        
        const shipTypes: ShipType[] = ['cruise', 'container', 'tanker', 'bulk', 'lng', 'roro', 'research', 'droneship', 'ferry', 'trawler', 'horizon']
        shipTypes.forEach(shipType => {
            const synthChain = createSynthChain(shipType)
            this.synthChains.set(shipType, synthChain)
        })
        
        this.initializeTransports()
        this.isInitialized = true
    }

    private initializeTransports() {
        const bpmMap: Record<ShipType, number> = {
            cruise: 120, container: 128, tanker: 140, bulk: 135, lng: 118,
            roro: 125, research: 110, droneship: 105, ferry: 115, trawler: 95, horizon: 100
        }

        this.createCruiseTransport(bpmMap.cruise)
        this.createContainerTransport(bpmMap.container)
        this.createTankerTransport(bpmMap.tanker)
        this.createBulkTransport(bpmMap.bulk)
        this.createLngTransport(bpmMap.lng)
        this.createRoroTransport(bpmMap.roro)
        this.createResearchTransport(bpmMap.research)
        this.createDroneshipTransport(bpmMap.droneship)
        this.createFerryTransport(bpmMap.ferry)
        this.createTrawlerTransport(bpmMap.trawler)
        this.createHorizonTransport(bpmMap.horizon)
    }

    private createCruiseTransport(bpm: number) {
        const transport = Tone.getTransport()
        transport.bpm.value = bpm
        const synths = this.synthChains.get('cruise')?.synths || []
        const [lead, pad, bass] = synths

        const chordPart = new Tone.Part((time, value) => {
            lead?.triggerAttackRelease(value.notes, value.duration, time)
            pad?.triggerAttackRelease(value.notes, '2n', time, 0.6)
        }, [
            { time: '0:0', notes: ['C4', 'E4', 'G4', 'B4'], duration: '1n' },
            { time: '1:0', notes: ['F4', 'A4', 'C5', 'E5'], duration: '1n' },
            { time: '2:0', notes: ['G4', 'B4', 'D5', 'F5'], duration: '1n' },
            { time: '3:0', notes: ['C4', 'E4', 'G4', 'C5'], duration: '1n' },
        ])
        chordPart.loop = true
        chordPart.loopEnd = '4:0'

        const bassPart = new Tone.Sequence((time, note) => {
            bass?.triggerAttackRelease(note, '2n', time)
        }, ['C2', 'C2', 'F2', 'G2'])
        bassPart.loop = true

        this.transports.set('cruise', transport)
    }

    private createContainerTransport(bpm: number) {
        const transport = Tone.getTransport()
        transport.bpm.value = bpm
        this.transports.set('container', transport)
    }

    private createTankerTransport(bpm: number) {
        const transport = Tone.getTransport()
        transport.bpm.value = bpm
        this.transports.set('tanker', transport)
    }

    private createBulkTransport(bpm: number) {
        const transport = Tone.getTransport()
        transport.bpm.value = bpm
        this.transports.set('bulk', transport)
    }

    private createLngTransport(bpm: number) {
        const transport = Tone.getTransport()
        transport.bpm.value = bpm
        this.transports.set('lng', transport)
    }

    private createRoroTransport(bpm: number) {
        const transport = Tone.getTransport()
        transport.bpm.value = bpm
        this.transports.set('roro', transport)
    }

    private createResearchTransport(bpm: number) {
        const transport = Tone.getTransport()
        transport.bpm.value = bpm
        this.transports.set('research', transport)
    }

    private createDroneshipTransport(bpm: number) {
        const transport = Tone.getTransport()
        transport.bpm.value = bpm
        this.transports.set('droneship', transport)
    }

    private createFerryTransport(bpm: number) {
        const transport = Tone.getTransport()
        transport.bpm.value = bpm
        this.transports.set('ferry', transport)
    }

    private createTrawlerTransport(bpm: number) {
        const transport = Tone.getTransport()
        transport.bpm.value = bpm
        this.transports.set('trawler', transport)
    }

    private createHorizonTransport(bpm: number) {
        const transport = Tone.getTransport()
        transport.bpm.value = bpm
        this.transports.set('horizon', transport)
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    getBandInfo(shipType: ShipType): BandInfo {
        return getBandInfo(shipType)
    }

    async startMusic(shipType: ShipType) {
        await this.initializeAudio()
        const transport = this.transports.get(shipType)
        if (transport) {
            transport.start()
        }
    }

    stopMusic(shipType: ShipType) {
        const transport = this.transports.get(shipType)
        if (transport) {
            transport.stop()
        }
    }

    stopAllMusic() {
        this.transports.forEach(transport => transport.stop())
    }

    setBPM(bpm: number) {
        this.transports.forEach(transport => {
            transport.bpm.value = bpm
        })
    }

    getCurrentLyric(shipType: ShipType): string {
        const transport = this.transports.get(shipType)
        if (!transport || transport.state !== 'started') return ''
        
        const lyrics = this.lyrics.get(shipType) || []
        if (lyrics.length === 0) return ''

        const position = transport.position as string
        const currentSeconds = Tone.Time(position).toSeconds()

        for (let i = lyrics.length - 1; i >= 0; i--) {
            const lyricTime = Tone.Time(lyrics[i].time).toSeconds()
            if (currentSeconds >= lyricTime) {
                this.currentLyricIndex.set(shipType, i)
                return lyrics[i].text
            }
        }
        
        return ''
    }

    getLyrics(shipType: ShipType): LyricEntry[] {
        return this.lyrics.get(shipType) || []
    }

    getTransportPosition(shipType: ShipType): string {
        const transport = this.transports.get(shipType)
        return transport ? (transport.position as string) : '0:0'
    }

    isPlaying(shipType: ShipType): boolean {
        const transport = this.transports.get(shipType)
        return transport ? transport.state === 'started' : false
    }

    triggerClimax(shipType: ShipType) {
        console.log(`🎵 MUSIC CLIMAX for ${shipType}!`)
        
        const transport = this.transports.get(shipType)
        if (!transport) return
        
        const originalBPM = transport.bpm.value
        transport.bpm.value = originalBPM * 1.2

        const synthChain = this.synthChains.get(shipType)
        if (synthChain) {
            synthChain.synths.forEach((synth: any) => {
                if (synth.volume) {
                    synth.volume.rampTo(synth.volume.value + 3, 0.1)
                }
            })
        }

        transport.scheduleOnce((_: number) => {
            transport.bpm.value = originalBPM
            if (synthChain) {
                synthChain.synths.forEach((synth: any) => {
                    if (synth.volume) {
                        synth.volume.rampTo(synth.volume.value - 3, 1)
                    }
                })
            }
        }, '+5')
    }

    dispose() {
        this.stopAllMusic()
        this.synthChains.forEach(chain => {
            chain.synths.forEach((s: any) => s.dispose())
            chain.effects.forEach((e: any) => e.dispose())
        })
        this.transports.forEach(t => t.dispose())
    }
}

export const musicSystem = new MusicSystem()
export { MusicSystem }
