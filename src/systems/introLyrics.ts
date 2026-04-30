import { LyricEntry } from './musicSystem'

// =============================================================================
// INTRO LYRICS — "Clear Harbor Glow" (Revised for Singability)
// HarborGlow main menu anthem lyrics, synced to 140 BPM.
// =============================================================================
// Phonetic revisions applied:
//   - "obstacles" → "barriers" (cleaner at 140 BPM)
//   - "It's going to" → "It's gonna" (consistent, sidechain-friendly)
//   - "bright" x5 → "bright bright — bright bright — whoa-oh!" (4 reps + open vowel)
//   - "digital" → "neon" (2 syll, matches meter, on-theme)
//   - "and the beats" → "while the beat" (eliminates /nð/ cluster)
//   - "code we rise" → "code we rise, we rise" (bridges /d/ → /w/ gap)
// =============================================================================

export const INTRO_BAND_INFO = {
    name: 'Clear Harbor Glow',
    genre: 'Hands-Up Euro-Trance / Uplifting Trance',
}

export const INTRO_LYRICS: LyricEntry[] = [
    // Atmospheric Intro
    { time: '0:0', text: 'Harborglow…' },
    { time: '0:2', text: 'Awakening…' },

    // Verse 1 — Clean folk-trance acoustic feel
    { time: '4:0', text: 'I can see Harborglow now, the static\'s gone' },
    { time: '4:2', text: 'I can see all the barriers in my way' },
    { time: '5:0', text: 'Gone are the dark clouds that had me blind' },
    { time: '5:2', text: 'It\'s gonna be a bright, bright Harborglow day' },
    { time: '6:0', text: 'Bright, bright Harborglow day' },

    // Verse 2 — Beat picks up
    { time: '8:0', text: 'Oh yes I can make it now, the lag is gone' },
    { time: '8:2', text: 'All of the bad loops have disappeared' },
    { time: '9:0', text: 'Here is that waveform I\'ve been praying for' },
    { time: '9:2', text: 'It\'s gonna be a bright, bright Harborglow day' },

    // Pre-Chorus Build
    { time: '11:0', text: 'Look all around — there\'s nothing but neon skies' },
    { time: '11:2', text: 'Look dead ahead — there\'s nothing but glowing tides' },

    // Heavy Trance Drop
    { time: '13:0', text: 'It\'s gonna be a bright bright Harborglow day!' },
    { time: '13:2', text: '(Yeah! Everybody now!)' },
    { time: '14:0', text: 'Bright bright — bright bright — whoa-oh!' },
    { time: '14:2', text: 'Harborglow day!' },
    { time: '15:0', text: 'It\'s gonna be a bright bright Harborglow day' },
    { time: '15:2', text: 'It\'s gonna be a bright bright Harborglow day' },
    { time: '16:0', text: 'It\'s gonna be a bright bright Harborglow day' },
    { time: '16:2', text: 'Bright bright — bright bright — whoa!' },
    { time: '17:0', text: 'Harborglow day!' },

    // Bridge / Breakdown — Half-time
    { time: '20:0', text: 'In the harbor\'s glow we come alive' },
    { time: '20:2', text: 'Shaders pulse while the beat collides' },
    { time: '21:0', text: 'From the code we rise, we rise into light' },
    { time: '21:2', text: 'Harborglow calling — take flight tonight' },

    // Final Massive Build
    { time: '24:0', text: 'I can see clearly now…' },
    { time: '24:2', text: 'It\'s gonna be a bright bright Harborglow day' },
    { time: '25:0', text: 'Bright sunshiny… neon day!' },

    // Final Drop
    { time: '26:0', text: 'It\'s gonna be a bright bright Harborglow day!' },
    { time: '26:2', text: '(Yeah! Everybody now!)' },
    { time: '27:0', text: 'Bright bright — bright bright — whoa-oh!' },
    { time: '27:2', text: 'Harborglow day!' },

    // Outro — Fading echoes
    { time: '28:0', text: 'Harborglow…' },
    { time: '28:2', text: 'Forever glow…' },
    { time: '29:0', text: '(Bright bright… bright bright…)' },
    { time: '29:2', text: 'Harborglow day…' },
]

/** Total approximate duration of the anthem in bars (at 140 BPM, 4/4). */
export const INTRO_DURATION_BARS = 32

/** Returns the current lyric based on transport position. */
export function getCurrentIntroLyric(positionBars: number): string {
    if (positionBars < 0) return ''

    for (let i = INTRO_LYRICS.length - 1; i >= 0; i--) {
        const lyricTime = parseTimeToBars(INTRO_LYRICS[i].time)
        if (positionBars >= lyricTime) {
            return INTRO_LYRICS[i].text
        }
    }
    return ''
}

/** Parse "bars:beats" time string to fractional bars. */
function parseTimeToBars(time: string): number {
    const [bars, beats] = time.split(':').map(Number)
    return bars + (beats || 0) / 4
}
