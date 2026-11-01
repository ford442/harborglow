import type { ShipType } from '../../store/gameStoreTypes'
import { getBandInfo, BandInfo } from './musicTracks'
import { getLyrics, LyricEntry } from './lyrics'
import { createSynthChain, SynthChainConfig } from './musicSynthChains'
import { AcousticSpace, audioRuntime } from '../audio/AudioRuntime'
import { positionToBeats, scheduleLoop, scheduleSequence, transport } from '../audio/transport'
import { unlockAudio } from '../audio/voices'

// =============================================================================
// MUSIC SYSTEM - Main orchestrator
// Plays the upgraded ship's track on the shared beat transport, clocked by sim
// time, with lyrics keyed to transport beats.
// =============================================================================

// Local exhaustive list — cannot import SHIP_TYPES at module init (musicSystem
// is constructed while gameStoreTypes is still evaluating a circular import).
const MUSIC_SHIP_TYPES = Object.keys({
    cruise: true,
    container: true,
    tanker: true,
    bulk: true,
    lng: true,
    roro: true,
    research: true,
    droneship: true,
    ferry: true,
    trawler: true,
    horizon: true,
    fireboat: true,
    icebreaker: true,
} satisfies Record<ShipType, true>) as ShipType[]

const BPM_BY_SHIP: Record<ShipType, number> = {
    cruise: 120, container: 128, tanker: 140, bulk: 135, lng: 118,
    roro: 125, research: 110, droneship: 105, ferry: 115, trawler: 95, horizon: 100, fireboat: 152, icebreaker: 108
}

const ROOM_BY_SHIP: Record<ShipType, AcousticSpace> = {
    cruise: 'ship-hall',
    container: 'cargo-hold',
    tanker: 'tanker-hold',
    bulk: 'cargo-hold',
    lng: 'ship-hall',
    roro: 'cargo-hold',
    research: 'ship-hall',
    droneship: 'ship-hall',
    ferry: 'cargo-hold',
    trawler: 'cargo-hold',
    horizon: 'ship-hall',
    fireboat: 'crane-cab',
    icebreaker: 'tanker-hold',
}

/** Bus effects a track may set; cleared when music stops (the room is left to the scene). */
const DRY_MUSIC_BUS = { distortion: 0, bitDepth: 24, delaySeconds: 0, delayFeedback: 0, chorusDepth: 0 }

const CLIMAX_SECONDS = 5

// "Ocean Symphony" progression — the harbor theme every ship currently plays.
const THEME_CHORDS = [
    { beat: 0, notes: ['C4', 'E4', 'G4', 'B4'] },
    { beat: 4, notes: ['F4', 'A4', 'C5', 'E5'] },
    { beat: 8, notes: ['G4', 'B4', 'D5', 'F5'] },
    { beat: 12, notes: ['C4', 'E4', 'G4', 'C5'] },
]
const THEME_BASS = ['C2', 'C2', 'F2', 'G2']

class MusicSystem {
    private synthChains: Map<ShipType, SynthChainConfig> = new Map()
    private lyrics: Map<ShipType, LyricEntry[]> = new Map()
    private currentLyricIndex: Map<ShipType, number> = new Map()
    private scheduledEvents: number[] = []
    private currentShip: ShipType | null = null
    private isInitialized: boolean = false

    constructor() {
        this.initializeLyrics()
    }

    private initializeLyrics() {
        MUSIC_SHIP_TYPES.forEach(shipType => {
            this.lyrics.set(shipType, getLyrics(shipType))
            this.currentLyricIndex.set(shipType, 0)
        })
    }

    private async initializeAudio() {
        if (this.isInitialized) return

        await unlockAudio()

        MUSIC_SHIP_TYPES.forEach(shipType => {
            this.synthChains.set(shipType, createSynthChain(shipType))
        })

        this.isInitialized = true
    }

    /** Schedule the theme on the transport. Returns event ids for clearing. */
    private scheduleTheme(): number[] {
        const [lead, pad, bass] = this.synthChains.get('cruise')?.instruments ?? []
        return [
            ...scheduleLoop(transport, THEME_CHORDS, 16, (_beat, chord, time) => {
                lead?.play(chord.notes, '1n', { at: time })
                pad?.play(chord.notes, '2n', { velocity: 0.6, at: time })
            }),
            scheduleSequence(transport, THEME_BASS, 1, (_beat, note, time) => {
                bass?.play(note, '2n', { at: time })
            }),
        ]
    }

    private clearScheduled() {
        this.scheduledEvents.forEach(id => transport.clear(id))
        this.scheduledEvents = []
    }

    private applyBus(shipType: ShipType, bpm: number) {
        const { delayBeats = 0, roomMix = 0.35, ...bus } = this.synthChains.get(shipType)?.bus ?? {}
        audioRuntime.setEffects({
            ...DRY_MUSIC_BUS,
            ...bus,
            delaySeconds: delayBeats * (60 / bpm),
            room: ROOM_BY_SHIP[shipType],
            roomMix,
        })
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    getBandInfo(shipType: ShipType): BandInfo {
        return getBandInfo(shipType)
    }

    /**
     * Start a ship's track. `offsetSeconds` is sim time into the song (the
     * multiplayer path passes simTime so every peer lands on the same beat).
     */
    async startMusic(shipType: ShipType, offsetSeconds = 0) {
        await this.initializeAudio()
        const bpm = BPM_BY_SHIP[shipType]

        this.clearScheduled()
        this.currentShip = shipType
        transport.bpm = bpm
        this.applyBus(shipType, bpm)
        this.scheduledEvents = this.scheduleTheme()
        transport.start({ clock: 'sim', atBeat: Math.max(0, offsetSeconds) * (bpm / 60) })
    }

    stopMusic(shipType: ShipType) {
        if (this.currentShip === shipType) this.stopAllMusic()
    }

    stopAllMusic() {
        if (this.currentShip === null) return
        this.clearScheduled()
        transport.stop()
        this.synthChains.forEach(chain => chain.instruments.forEach(instrument => instrument.release()))
        audioRuntime.setEffects(DRY_MUSIC_BUS)
        this.currentShip = null
    }

    setBPM(bpm: number) {
        transport.bpm = bpm
    }

    getCurrentLyric(shipType: ShipType): string {
        if (!this.isPlaying(shipType)) return ''

        const lyrics = this.lyrics.get(shipType) || []
        if (lyrics.length === 0) return ''

        // What the player hears now, not what the engine is queueing.
        const beats = transport.audibleBeats
        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (beats >= positionToBeats(lyrics[i].time)) {
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
        return this.currentShip === shipType ? transport.position : '0:0'
    }

    isPlaying(shipType: ShipType): boolean {
        return this.currentShip === shipType && transport.state === 'started'
    }

    triggerClimax(shipType: ShipType) {
        console.log(`🎵 MUSIC CLIMAX for ${shipType}!`)

        if (this.currentShip !== shipType) return

        const originalBPM = transport.bpm
        transport.bpm = originalBPM * 1.2

        const instruments = this.synthChains.get(shipType)?.instruments ?? []
        instruments.forEach(instrument => { instrument.volumeDb += 3 })

        transport.scheduleIn(() => {
            transport.bpm = originalBPM
            instruments.forEach(instrument => { instrument.volumeDb -= 3 })
        }, CLIMAX_SECONDS * (transport.bpm / 60))
    }

    dispose() {
        this.stopAllMusic()
        this.synthChains.forEach(chain => chain.instruments.forEach(instrument => instrument.dispose()))
        this.synthChains.clear()
        this.isInitialized = false
    }
}

export const musicSystem = new MusicSystem()
export { MusicSystem }
