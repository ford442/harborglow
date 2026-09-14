// WebRTC ICE server list for multiplayerSystem — STUN + optional env TURN.

const STUN_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
]

export interface TurnEnv {
    VITE_TURN_URL?: string
    VITE_TURN_USERNAME?: string
    VITE_TURN_CREDENTIAL?: string
}

/**
 * STUN always; TURN only when `VITE_TURN_URL` is set at build time (comma-
 * separated URLs allowed). Credentials come from env only — never commit them.
 * See docs/adr/0003-turn-relay-via-env.md.
 */
export function buildIceServers(env: TurnEnv | undefined): RTCIceServer[] {
    const urls = env?.VITE_TURN_URL?.split(',').map(u => u.trim()).filter(Boolean)
    if (!urls?.length) return STUN_SERVERS
    return [
        ...STUN_SERVERS,
        { urls, username: env?.VITE_TURN_USERNAME, credential: env?.VITE_TURN_CREDENTIAL },
    ]
}
