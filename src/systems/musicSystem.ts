import * as Tone from 'tone'
import { ShipType } from '../store/useGameStore'

// =============================================================================
// MUSIC SYSTEM - HarborGlow
// Manages unique audio tracks for each ship type with synchronized lyrics
// =============================================================================

export interface LyricEntry {
    time: string
    text: string
}

export interface BandInfo {
    name: string
    genre: string
}

class MusicSystem {
    private transports: Map<ShipType, any> = new Map()
    private synths: Map<ShipType, any[]> = new Map() // Multiple synths per ship
    private effects: Map<ShipType, any[]> = new Map() // Effects chains
    private lyrics: Map<ShipType, LyricEntry[]> = new Map()
    private bandNames: Map<ShipType, BandInfo> = new Map()
    private currentLyricIndex: Map<ShipType, number> = new Map()
    private isInitialized: boolean = false

    constructor() {
        this.initializeBandNames()
        this.initializeLyrics()
        // Defer synth initialization until first user interaction
    }

    // =========================================================================
    // BAND NAMES - Revealed during upgrade cinematic
    // =========================================================================
    private initializeBandNames() {
        this.bandNames.set('cruise', { 
            name: 'The Deck Dancers', 
            genre: 'Orchestral Pop Symphony' 
        })
        this.bandNames.set('container', { 
            name: 'Neon Freight Crew', 
            genre: 'Future Bass / Techno' 
        })
        this.bandNames.set('tanker', { 
            name: 'Industrial Flames', 
            genre: 'Dubstep / Industrial' 
        })
    }

    getBandInfo(shipType: ShipType): BandInfo {
        return this.bandNames.get(shipType) || { name: 'Unknown Band', genre: 'Unknown' }
    }

    // =========================================================================
    // LYRICS - Synced to beat
    // =========================================================================
    private initializeLyrics() {
        // Mega Cruise Liner - "Ocean Symphony" - Orchestral + choir
        this.lyrics.set('cruise', [
            { time: '0:0', text: 'We sail through the night…' },
            { time: '0:2', text: 'stars shining bright…' },
            { time: '1:0', text: 'lights ignite…' },
            { time: '1:2', text: 'HarborGlow!' },
            { time: '2:0', text: 'Ocean Symphony!' },
            { time: '2:2', text: 'Dancing on the waves!' },
            { time: '3:0', text: 'We are the light…' },
            { time: '3:2', text: 'through the night…' },
            { time: '4:0', text: 'HarborGlow!' },
        ])

        // Ultra Large Container Vessel - "Neon Stack" - Heavy techno / future bass
        this.lyrics.set('container', [
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
        ])

        // VLCC Oil Tanker - "Flame Runner" - Gritty industrial / dubstep
        this.lyrics.set('tanker', [
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
        ])

        // Initialize lyric index tracking
        this.currentLyricIndex.set('cruise', 0)
        this.currentLyricIndex.set('container', 0)
        this.currentLyricIndex.set('tanker', 0)
    }

    // =========================================================================
    // SYNTHS & EFFECTS - Initialize on first interaction
    // =========================================================================
    private async initializeAudio() {
        if (this.isInitialized) return
        
        await Tone.start()
        
        this.initializeCruiseSynths()
        this.initializeContainerSynths()
        this.initializeTankerSynths()
        this.initializeTransports()
        
        this.isInitialized = true
    }

    // -------------------------------------------------------------------------
    // CRUISE SHIP - "Ocean Symphony"
    // Orchestral + choir synth with lush reverb
    // -------------------------------------------------------------------------
    private initializeCruiseSynths() {
        const effects: any[] = []
        const synths: any[] = []

        // Main reverb for orchestral space
        const reverb = new Tone.Reverb({
            decay: 4,
            preDelay: 0.2,
            wet: 0.4
        }).toDestination()
        effects.push(reverb)

        // Chorus for lushness
        const chorus = new Tone.Chorus({
            frequency: 2,
            delayTime: 3.5,
            depth: 0.5,
            wet: 0.3
        }).connect(reverb)
        effects.push(chorus)

        // Lead synth - Sawtooth with slow attack
        const leadSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.3, decay: 0.2, sustain: 0.6, release: 1.5 }
        }).connect(chorus)
        leadSynth.volume.value = -8
        synths.push(leadSynth)

        // Choir-like pad
        const padSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.8, decay: 0.5, sustain: 0.7, release: 2 }
        }).connect(reverb)
        padSynth.volume.value = -12
        synths.push(padSynth)

        // Bass foundation
        const bassSynth = new Tone.MonoSynth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.8, release: 0.8 }
        }).connect(reverb)
        bassSynth.volume.value = -6
        synths.push(bassSynth)

        this.synths.set('cruise', synths)
        this.effects.set('cruise', effects)
    }

    // -------------------------------------------------------------------------
    // CONTAINER SHIP - "Neon Stack"
    // Heavy techno / future bass with FM synth + membrane
    // -------------------------------------------------------------------------
    private initializeContainerSynths() {
        const effects: any[] = []
        const synths: any[] = []

        // Sidechain compression feel
        const limiter = new Tone.Limiter(-2).toDestination()
        
        // Ping-pong delay for that techno feel
        const pingPong = new Tone.PingPongDelay({
            delayTime: '8n',
            feedback: 0.4,
            wet: 0.2
        }).connect(limiter)
        effects.push(pingPong)

        // Main FM synth for leads
        const fmSynth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 3,
            modulationIndex: 10,
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 },
            modulation: { type: 'square' },
            modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 }
        }).connect(pingPong)
        fmSynth.volume.value = -10
        synths.push(fmSynth)

        // Membrane synth for kick-like bass
        const membrane = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 4,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
        }).connect(limiter)
        membrane.volume.value = -4
        synths.push(membrane)

        // Metallic percussion
        const metalSynth = new Tone.MetalSynth({
            envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        }).connect(pingPong)
        metalSynth.volume.value = -15
        synths.push(metalSynth)

        this.synths.set('container', synths)
        this.effects.set('container', effects)
    }

    // -------------------------------------------------------------------------
    // TANKER SHIP - "Flame Runner"
    // Gritty industrial / dubstep with Metal synth + noise
    // -------------------------------------------------------------------------
    private initializeTankerSynths() {
        const effects: any[] = []
        const synths: any[] = []

        // Heavy reverb for industrial space
        const reverb = new Tone.Reverb({
            decay: 3,
            preDelay: 0.1,
            wet: 0.25
        }).toDestination()
        effects.push(reverb)

        // Bitcrusher for that industrial edge
        const bitcrusher = new Tone.BitCrusher(8).connect(reverb)
        effects.push(bitcrusher)

        // Lowpass filter for wub effects
        const filter = new Tone.Filter({
            frequency: 800,
            type: 'lowpass',
            rolloff: -24
        }).connect(bitcrusher)
        effects.push(filter)

        // Main metal synth
        const metalSynth = new Tone.MetalSynth({
            envelope: { attack: 0.001, decay: 0.3, release: 0.2 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        }).connect(filter)
        metalSynth.volume.value = -8
        synths.push(metalSynth)

        // Noise synth for industrial texture
        const noiseSynth = new Tone.NoiseSynth({
            noise: { type: 'brown' },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 0.2 }
        }).connect(reverb)
        noiseSynth.volume.value = -18
        synths.push(noiseSynth)

        // Sub bass
        const subSynth = new Tone.MonoSynth({
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.5 },
            filter: { Q: 2, type: 'lowpass', rolloff: -24 }
        }).connect(filter)
        subSynth.volume.value = -2
        synths.push(subSynth)

        // LFO for filter wub
        const lfo = new Tone.LFO('4n', 200, 1000)
        lfo.connect(filter.frequency)
        effects.push(lfo)

        this.synths.set('tanker', synths)
        this.effects.set('tanker', effects)
    }

    // =========================================================================
    // TRANSPORTS - Music sequences for each ship type
    // =========================================================================
    private initializeTransports() {
        // CRUISE TRANSPORT - 120 BPM orchestral
        const cruiseTransport = Tone.getTransport()
        cruiseTransport.bpm.value = 120
        
        const cruiseSynths = this.synths.get('cruise') || []
        const [lead, pad, bass] = cruiseSynths

        // Orchestral chord progression
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

        // Bass line
        const bassPart = new Tone.Sequence((time, note) => {
            bass?.triggerAttackRelease(note, '2n', time)
        }, ['C2', 'C2', 'F2', 'G2'])
        bassPart.loop = true

        this.transports.set('cruise', cruiseTransport)

        // CONTAINER TRANSPORT - 128 BPM techno
        const containerTransport = Tone.getTransport()
        containerTransport.bpm.value = 128
        
        const containerSynths = this.synths.get('container') || []
        const [fm, membrane, metal] = containerSynths

        // Techno beat
        const kickPart = new Tone.Sequence(() => {
            membrane?.triggerAttackRelease('C1', '8n')
        }, ['C1', null, 'C1', null, 'C1', null, 'C1', null])
        kickPart.loop = true

        // Hi-hats
        const hatPart = new Tone.Sequence((time) => {
            metal?.triggerAttackRelease('32n', time)
        }, [null, 'C5', null, 'C5', null, 'C5', null, 'C5'])
        hatPart.loop = true

        // FM lead pattern
        const fmPart = new Tone.Sequence((time, note) => {
            if (note) fm?.triggerAttackRelease(note, '16n', time)
        }, ['C3', 'E3', 'G3', null, 'A3', 'G3', 'E3', null])
        fmPart.loop = true

        this.transports.set('container', containerTransport)

        // TANKER TRANSPORT - 140 BPM dubstep
        const tankerTransport = Tone.getTransport()
        tankerTransport.bpm.value = 140
        
        const tankerSynths = this.synths.get('tanker') || []
        const [tankerMetal, noise, sub] = tankerSynths

        // Industrial beat
        const industrialPart = new Tone.Sequence((time) => {
            tankerMetal?.triggerAttackRelease('16n', time)
            sub?.triggerAttackRelease('C1', '8n', time)
        }, ['C2', 'C2', null, 'C2', null, 'C2', 'C2', null])
        industrialPart.loop = true

        // Noise bursts
        const noisePart = new Tone.Part((time) => {
            noise?.triggerAttackRelease('16n', time)
        }, [
            { time: '0:2' },
            { time: '1:2' },
            { time: '2:0' },
            { time: '3:0' },
        ])
        noisePart.loop = true
        noisePart.loopEnd = '4:0'

        this.transports.set('tanker', tankerTransport)
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

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
        // Update all transport BPMs
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

        // Find the current lyric based on time
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

    // =========================================================================
    // CLIMAX - Triggered on v2.0 structural overhaul
    // =========================================================================
    triggerClimax(shipType: ShipType) {
        console.log(`🎵 MUSIC CLIMAX for ${shipType}!`)
        
        const transport = this.transports.get(shipType)
        if (!transport) return
        
        // Temporarily boost BPM
        const originalBPM = transport.bpm.value
        transport.bpm.value = originalBPM * 1.2 // 20% faster
        
        // Intensify all synths
        const synths = this.synths.get(shipType) || []
        synths.forEach((synth: any) => {
            if (synth.volume) {
                synth.volume.rampTo(synth.volume.value + 3, 0.1)
            }
        })
        
        // Restore after 5 seconds
        setTimeout(() => {
            transport.bpm.value = originalBPM
            synths.forEach((synth: any) => {
                if (synth.volume) {
                    synth.volume.rampTo(synth.volume.value - 3, 1)
                }
            })
        }, 5000)
    }

    // Cleanup
    dispose() {
        this.stopAllMusic()
        this.synths.forEach(synths => synths.forEach((s: any) => s.dispose()))
        this.effects.forEach(effects => effects.forEach((e: any) => e.dispose()))
        this.transports.forEach(t => t.dispose())
    }
}

export const musicSystem = new MusicSystem()
