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
        this.bandNames.set('bulk', { 
            name: 'Iron Ore Orchestra', 
            genre: 'Industrial Metal / Hard Rock' 
        })
        this.bandNames.set('lng', { 
            name: 'Cryogenic Pulse', 
            genre: 'Ambient / Cryogenic Techno' 
        })
        this.bandNames.set('roro', { 
            name: 'Highway Star', 
            genre: 'Synthwave / Driving Rock' 
        })
        this.bandNames.set('research', { 
            name: 'Sonar Collective', 
            genre: 'Ambient / Scientific' 
        })
        this.bandNames.set('droneship', { 
            name: 'Orbital Mechanics', 
            genre: 'Space Ambient / Electronic' 
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
        this.currentLyricIndex.set('bulk', 0)
        this.currentLyricIndex.set('lng', 0)
        this.currentLyricIndex.set('roro', 0)
        this.currentLyricIndex.set('research', 0)
        this.currentLyricIndex.set('droneship', 0)
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
        this.initializeBulkSynths()
        this.initializeLngSynths()
        this.initializeRoroSynths()
        this.initializeResearchSynths()
        this.initializeDroneshipSynths()
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

    // -------------------------------------------------------------------------
    // BULK CARRIER - "Iron Mountain" - 135 BPM Industrial Metal / Hard Rock
    // -------------------------------------------------------------------------
    private initializeBulkSynths() {
        const effects: any[] = []
        const synths: any[] = []

        // Heavy distortion for industrial metal sound
        const distortion = new Tone.Distortion({ distortion: 0.4, wet: 0.3 }).toDestination()
        effects.push(distortion)

        // Reverb for massive spaces
        const reverb = new Tone.Reverb({ decay: 3, preDelay: 0.1, wet: 0.25 }).connect(distortion)
        effects.push(reverb)

        // Power chord guitar synth
        const guitarSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.8 }
        }).connect(distortion)
        guitarSynth.volume.value = -10
        synths.push(guitarSynth)

        // Bass synth
        const bassSynth = new Tone.MonoSynth({
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.4 },
            filter: { Q: 4, type: 'lowpass', rolloff: -24 }
        }).connect(reverb)
        bassSynth.volume.value = -6
        synths.push(bassSynth)

        // Industrial percussion
        const metalSynth = new Tone.MetalSynth({
            envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        }).connect(distortion)
        metalSynth.volume.value = -12
        synths.push(metalSynth)

        this.synths.set('bulk', synths)
        this.effects.set('bulk', effects)
    }

    // -------------------------------------------------------------------------
    // LNG CARRIER - "Cryo Titan" - 118 BPM Ambient / Cryogenic Techno
    // -------------------------------------------------------------------------
    private initializeLngSynths() {
        const effects: any[] = []
        const synths: any[] = []

        // Crystalline reverb for frozen atmosphere
        const reverb = new Tone.Reverb({ decay: 8, preDelay: 0.5, wet: 0.6 }).toDestination()
        effects.push(reverb)

        // Chorus for ethereal shimmer
        const chorus = new Tone.Chorus({ frequency: 0.5, delayTime: 3, depth: 0.7, wet: 0.4 }).connect(reverb)
        effects.push(chorus)

        // Cold, crystalline pad
        const padSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4 }
        }).connect(chorus)
        padSynth.volume.value = -14
        synths.push(padSynth)

        // FM synth for icy accents
        const fmSynth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 4,
            modulationIndex: 10,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.5, decay: 0.5, sustain: 0.5, release: 2 },
            modulation: { type: 'triangle' }
        }).connect(reverb)
        fmSynth.volume.value = -16
        synths.push(fmSynth)

        // Sub bass for deep cold
        const subSynth = new Tone.MonoSynth({
            oscillator: { type: 'sine' },
            envelope: { attack: 1, decay: 0.5, sustain: 0.9, release: 3 }
        }).connect(reverb)
        subSynth.volume.value = -8
        synths.push(subSynth)

        this.synths.set('lng', synths)
        this.effects.set('lng', effects)
    }

    // -------------------------------------------------------------------------
    // RO-RO FERRY - "Vehicle Voyager" - 125 BPM Synthwave / Driving Rock
    // -------------------------------------------------------------------------
    private initializeRoroSynths() {
        const effects: any[] = []
        const synths: any[] = []

        // Retro chorus for 80s feel
        const chorus = new Tone.Chorus({ frequency: 2, delayTime: 3.5, depth: 0.5, wet: 0.3 }).toDestination()
        effects.push(chorus)

        // Delay for driving rhythm
        const feedbackDelay = new Tone.FeedbackDelay('8n', 0.3).connect(chorus)
        effects.push(feedbackDelay)

        // Arpeggiator-style lead
        const leadSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.5 }
        }).connect(feedbackDelay)
        leadSynth.volume.value = -10
        synths.push(leadSynth)

        // Driving bass
        const bassSynth = new Tone.MonoSynth({
            oscillator: { type: 'pulse' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.8, release: 0.3 },
            filter: { Q: 2, type: 'lowpass', rolloff: -24 }
        }).connect(chorus)
        bassSynth.volume.value = -8
        synths.push(bassSynth)

        // Snappy percussion
        const membrane = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 4,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
        }).connect(chorus)
        membrane.volume.value = -10
        synths.push(membrane)

        this.synths.set('roro', synths)
        this.effects.set('roro', effects)
    }

    // -------------------------------------------------------------------------
    // RESEARCH VESSEL - "Deep Discoverer" - 110 BPM Ambient / Scientific
    // -------------------------------------------------------------------------
    private initializeResearchSynths() {
        const effects: any[] = []
        const synths: any[] = []

        // Deep ocean reverb
        const reverb = new Tone.Reverb({ decay: 10, preDelay: 0.3, wet: 0.5 }).toDestination()
        effects.push(reverb)

        // Ping pong for sonar effect
        const pingPong = new Tone.PingPongDelay('4n', 0.2).connect(reverb)
        effects.push(pingPong)

        // Sonar ping synth
        const sonarSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 1 }
        }).connect(pingPong)
        sonarSynth.volume.value = -12
        synths.push(sonarSynth)

        // Deep ambient pad
        const padSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: 1, decay: 1, sustain: 0.7, release: 5 }
        }).connect(reverb)
        padSynth.volume.value = -18
        synths.push(padSynth)

        // Subtle bass
        const bassSynth = new Tone.MonoSynth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 3 }
        }).connect(reverb)
        bassSynth.volume.value = -14
        synths.push(bassSynth)

        this.synths.set('research', synths)
        this.effects.set('research', effects)
    }

    // -------------------------------------------------------------------------
    // DRONE SHIP - "Of Course I Still Love You" - 105 BPM Space Ambient
    // -------------------------------------------------------------------------
    private initializeDroneshipSynths() {
        const effects: any[] = []
        const synths: any[] = []

        // Space reverb
        const reverb = new Tone.Reverb({ decay: 12, preDelay: 0.8, wet: 0.7 }).toDestination()
        effects.push(reverb)

        // Long delay for space echo
        const feedbackDelay = new Tone.FeedbackDelay('2n', 0.5).connect(reverb)
        effects.push(feedbackDelay)

        // Ethereal space pad
        const padSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
            envelope: { attack: 2, decay: 1, sustain: 0.8, release: 8 }
        }).connect(feedbackDelay)
        padSynth.volume.value = -16
        synths.push(padSynth)

        // Space blip synth
        const blipSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'square' },
            envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.2 }
        }).connect(reverb)
        blipSynth.volume.value = -20
        synths.push(blipSynth)

        // Deep space drone
        const droneSynth = new Tone.MonoSynth({
            oscillator: { type: 'fmsine' },
            envelope: { attack: 3, decay: 1, sustain: 1, release: 10 }
        }).connect(reverb)
        droneSynth.volume.value = -20
        synths.push(droneSynth)

        this.synths.set('droneship', synths)
        this.effects.set('droneship', effects)
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
        const [containerFm, membrane, metal] = containerSynths

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
        const containerFmPart = new Tone.Sequence((time, note) => {
            if (note) containerFm?.triggerAttackRelease(note, '16n', time)
        }, ['C3', 'E3', 'G3', null, 'A3', 'G3', 'E3', null])
        containerFmPart.loop = true

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

        // BULK TRANSPORT - 135 BPM industrial metal
        const bulkTransport = Tone.getTransport()
        bulkTransport.bpm.value = 135
        
        const bulkSynths = this.synths.get('bulk') || []
        const [guitar, bulkBass, bulkMetal] = bulkSynths

        // Power chord riff
        const riffPart = new Tone.Sequence((time, chord) => {
            if (chord) guitar?.triggerAttackRelease(chord, '4n', time)
        }, [['E3', 'G3', 'B3'], null, ['E3', 'G3', 'B3'], ['D3', 'F3', 'A3'], null, ['D3', 'F3', 'A3'], ['C3', 'E3', 'G3'], null])
        riffPart.loop = true

        // Heavy metal drums
        const bulkDrumPart = new Tone.Sequence((time) => {
            bulkMetal?.triggerAttackRelease('16n', time)
            bulkBass?.triggerAttackRelease('E2', '8n', time)
        }, ['E2', null, 'E2', 'E2', null, 'E2', null, 'E2'])
        bulkDrumPart.loop = true

        this.transports.set('bulk', bulkTransport)

        // LNG TRANSPORT - 118 BPM cryogenic ambient
        const lngTransport = Tone.getTransport()
        lngTransport.bpm.value = 118
        
        const lngSynths = this.synths.get('lng') || []
        const [coldPad, lngFm] = lngSynths

        // Slow crystalline pads
        const coldPadPart = new Tone.Part((time, value) => {
            coldPad?.triggerAttackRelease(value.notes, value.duration, time, 0.5)
        }, [
            { time: '0:0', notes: ['C3', 'E3', 'G3'], duration: '2m' },
            { time: '2:0', notes: ['A2', 'C3', 'E3'], duration: '2m' },
        ])
        coldPadPart.loop = true
        coldPadPart.loopEnd = '4:0'

        // Icy FM accents
        const lngFmPart = new Tone.Sequence((time, note) => {
            if (note) lngFm?.triggerAttackRelease(note, '2n', time)
        }, ['C4', null, 'E4', null, 'G4', null, 'B4', null])
        lngFmPart.loop = true

        this.transports.set('lng', lngTransport)

        // RO-RO TRANSPORT - 125 BPM synthwave
        const roroTransport = Tone.getTransport()
        roroTransport.bpm.value = 125
        
        const roroSynths = this.synths.get('roro') || []
        const [, roroBass, roroDrum] = roroSynths

        // Driving bassline
        const roroBassPart = new Tone.Sequence((time, note) => {
            roroBass?.triggerAttackRelease(note, '8n', time)
        }, ['C2', 'C2', 'G2', 'C2', 'F2', 'F2', 'G2', 'F2'])
        roroBassPart.loop = true

        // Driving beat
        const roroBeatPart = new Tone.Sequence(() => {
            roroDrum?.triggerAttackRelease('C1', '8n')
        }, ['C1', 'C1', null, 'C1', null, 'C1', 'C1', null])
        roroBeatPart.loop = true

        this.transports.set('roro', roroTransport)

        // RESEARCH TRANSPORT - 110 BPM scientific ambient
        const researchTransport = Tone.getTransport()
        researchTransport.bpm.value = 110
        
        const researchSynths = this.synths.get('research') || []
        const [sonar, researchPad] = researchSynths

        // Sonar pings
        const sonarPart = new Tone.Sequence((time, note) => {
            if (note) sonar?.triggerAttackRelease(note, '8n', time)
        }, ['C5', null, null, null, 'C5', null, null, null, 'E5', null, null, null, 'C5', null, null, null])
        sonarPart.loop = true

        // Deep pad chords
        const researchPadPart = new Tone.Part((time, value) => {
            researchPad?.triggerAttackRelease(value.notes, value.duration, time, 0.4)
        }, [
            { time: '0:0', notes: ['C2', 'G2', 'C3'], duration: '4m' },
            { time: '4:0', notes: ['F2', 'C3', 'F3'], duration: '4m' },
        ])
        researchPadPart.loop = true
        researchPadPart.loopEnd = '8:0'

        this.transports.set('research', researchTransport)

        // DRONESHIP TRANSPORT - 105 BPM space ambient
        const droneshipTransport = Tone.getTransport()
        droneshipTransport.bpm.value = 105
        
        const droneshipSynths = this.synths.get('droneship') || []
        const [spacePad, blip, drone] = droneshipSynths

        // Space pad progression
        const spacePadPart = new Tone.Part((time, value) => {
            spacePad?.triggerAttackRelease(value.notes, value.duration, time, 0.3)
        }, [
            { time: '0:0', notes: ['C3', 'E3', 'G3', 'B3'], duration: '4m' },
            { time: '4:0', notes: ['A2', 'C3', 'E3', 'G3'], duration: '4m' },
        ])
        spacePadPart.loop = true
        spacePadPart.loopEnd = '8:0'

        // Communication blips
        const blipPart = new Tone.Sequence((time, note) => {
            if (note) blip?.triggerAttackRelease(note, '16n', time)
        }, [null, null, 'C6', null, null, null, 'E6', null, null, 'G6', null, null, null, null, 'C6', null])
        blipPart.loop = true

        // Continuous space drone
        const dronePart = new Tone.Sequence((time, note) => {
            drone?.triggerAttackRelease(note, '1m', time)
        }, ['C2', 'G1', 'C2', 'F1'])
        dronePart.loop = true

        this.transports.set('droneship', droneshipTransport)
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
