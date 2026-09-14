import { describe, expect, it } from 'vitest'
import { buildIceServers } from '../iceServers'

describe('buildIceServers', () => {
  it('is STUN-only when VITE_TURN_URL is unset', () => {
    const servers = buildIceServers({})
    expect(servers.every(s => String(s.urls).startsWith('stun:'))).toBe(true)
    expect(buildIceServers(undefined)).toEqual(servers)
  })

  it('appends a TURN entry with env credentials', () => {
    const servers = buildIceServers({
      VITE_TURN_URL: 'turn:turn.example.com:3478?transport=udp, turns:turn.example.com:5349',
      VITE_TURN_USERNAME: 'u',
      VITE_TURN_CREDENTIAL: 'c',
    })
    expect(servers.at(-1)).toEqual({
      urls: ['turn:turn.example.com:3478?transport=udp', 'turns:turn.example.com:5349'],
      username: 'u',
      credential: 'c',
    })
  })
})
