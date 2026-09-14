/* eslint-disable no-restricted-syntax -- wall-clock / audio / network; see docs/systems/DETERMINISM.md */
// =============================================================================
// MULTIPLAYER SYSTEM — WebRTC star topology (host ↔ spectators)
//
// Gameplay sync is seed + input log (docs/systems/DETERMINISM.md). This module
// is the WebRTC transport for presence, chat, hello/input/hash, and attach.
// Do not stream wildlife/traffic/particle transforms.
// =============================================================================

import { useGameStore } from '../store/useGameStore'
import {
    encodeHello,
    encodeInputPacket,
    encodeHashPacket,
    encodeResync,
    decodePacket,
    decodeHelloPacket,
    decodeInputPacket,
    decodeHashPacket,
    encodePing,
    encodePong,
    encodeChat,
    decodeChatPacket,
    decodePongPacket,
    type HelloBody,
} from './multiplayerCodec'
import { syncLocalMusicFromStore } from './multiplayerMusicSync'
import { applyReplayInput } from './sim/applyInput'
import { hashSimSnapshot } from './sim/hashState'
import { resetDeterministicSystems, tickSimSystems } from './sim/headless'
import { setHostInputBroadcast } from './sim/hostInput'
import { simScheduler } from './sim/FixedStepScheduler'
import type { ReplayFile } from './sim/replay'

const MAX_SPECTATORS = 6
const SIGNAL_POLL_MS = 500
const PING_INTERVAL_MS = 2000
const HASH_EVERY_TICKS = 60

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
]

function sendBinary(channel: RTCDataChannel, data: Uint8Array): void {
    const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
    channel.send(buf)
}

function signalBaseUrl(): string {
    const env = (import.meta as ImportMeta & { env?: { VITE_SIGNAL_URL?: string } }).env
    return env?.VITE_SIGNAL_URL || 'http://localhost:8787'
}

function generatePeerId(): string {
    return `peer-${Math.random().toString(36).slice(2, 10)}`
}

interface PeerConnection {
    peerId: string
    pc: RTCPeerConnection
    simChannel: RTCDataChannel | null
    chatChannel: RTCDataChannel | null
}

class MultiplayerSystem {
    private peers = new Map<string, PeerConnection>()
    private signalPollTimer: ReturnType<typeof setInterval> | null = null
    private pingTimer: ReturnType<typeof setInterval> | null = null
    private localPeerId = generatePeerId()
    private roomId: string | null = null
    private isHost = false
    private disposed = false
    private hostTickWatermark: number | null = null
    private ignoreInputsBefore = 0
    private lastHashTick = -1
    private pendingHash: { tick: number; fnv: string } | null = null
    private resyncCooldownUntil = 0

    getTickWatermark(): number | null {
        return this.hostTickWatermark
    }

    applyPendingHashCheck(): void {
        if (!this.pendingHash) return
        if (simScheduler.tick < this.pendingHash.tick) return
        if (simScheduler.tick > this.pendingHash.tick) {
            this.pendingHash = null
            this.requestResync()
            return
        }
        const expected = this.pendingHash.fnv
        this.pendingHash = null
        const actual = hashSimSnapshot()
        if (actual !== expected) {
            console.warn(
                `[multiplayer] hash mismatch at tick ${simScheduler.tick}: local=${actual} host=${expected} — requesting hello`,
            )
            this.requestResync()
        }
    }

    onHostSimTick(): void {
        if (!this.isHost || this.disposed) return
        const tick = simScheduler.tick
        if (tick <= 0 || tick % HASH_EVERY_TICKS !== 0 || tick === this.lastHashTick) return
        this.lastHashTick = tick
        const bytes = encodeHashPacket({ tick, fnv: hashSimSnapshot() })
        this.broadcastSim(bytes)
    }

    async createRoom(): Promise<string> {
        const res = await fetch(`${signalBaseUrl()}/room`, { method: 'POST' })
        if (!res.ok) throw new Error(`Failed to create room: ${res.status}`)
        const data = (await res.json()) as { roomId: string }
        return data.roomId
    }

    getShareUrl(roomId: string): string {
        const url = new URL(window.location.href)
        url.searchParams.set('multiplayer', '1')
        url.searchParams.set('join', roomId)
        return url.toString()
    }

    async startHost(roomId: string): Promise<void> {
        this.roomId = roomId
        this.isHost = true
        this.disposed = false
        this.hostTickWatermark = null
        const store = useGameStore.getState()
        store.setMultiplayerRole('host')
        store.setRoomId(roomId)
        store.setConnectionStatus('signalling')

        const seed = (Math.random() * 0xffffffff) >>> 0 || 1
        simScheduler.reset(seed)
        resetDeterministicSystems({ preserveStoreMode: true })
        simScheduler.setInputHandler((entry) => applyReplayInput(entry))
        simScheduler.startRecording()
        setHostInputBroadcast((tick, action, payload) => {
            this.broadcastSim(encodeInputPacket({ tick, action, payload }))
        })

        this.startSignalPolling()
        store.setConnectionStatus('connected')
    }

    async startSpectator(roomId: string): Promise<void> {
        this.roomId = roomId
        this.isHost = false
        this.disposed = false
        this.hostTickWatermark = 0
        const store = useGameStore.getState()
        store.setMultiplayerRole('spectator')
        store.setRoomId(roomId)
        store.setConnectionStatus('signalling')

        await this.connectSpectatorToHost(roomId)
        this.startSignalPolling()
        this.startPing()
    }

    sendChat(text: string): void {
        const sender = this.isHost ? 'Host' : `Spectator`
        const bytes = encodeChat(text.slice(0, 200), sender)
        if (this.isHost) {
            for (const peer of this.peers.values()) {
                if (peer.chatChannel?.readyState === 'open') {
                    sendBinary(peer.chatChannel, bytes)
                }
            }
        } else {
            const peer = this.peers.values().next().value
            if (peer?.chatChannel?.readyState === 'open') {
                sendBinary(peer.chatChannel, bytes)
            }
        }
    }

    dispose(): void {
        this.disposed = true
        setHostInputBroadcast(null)
        if (this.signalPollTimer) clearInterval(this.signalPollTimer)
        if (this.pingTimer) clearInterval(this.pingTimer)
        this.signalPollTimer = null
        this.pingTimer = null
        this.hostTickWatermark = null

        for (const peer of this.peers.values()) {
            peer.pc.close()
        }
        this.peers.clear()

        if (this.isHost && this.roomId) {
            void fetch(`${signalBaseUrl()}/room/${this.roomId}`, { method: 'DELETE' })
        }

        const store = useGameStore.getState()
        store.setConnectionStatus('idle')
        store.setSpectatorCount(0)
        store.setMultiplayerRole('offline')
    }

    private broadcastSim(bytes: Uint8Array): void {
        for (const peer of this.peers.values()) {
            if (peer.simChannel?.readyState === 'open') {
                try {
                    sendBinary(peer.simChannel, bytes)
                } catch {
                    // channel may have closed mid-send
                }
            }
        }
    }

    private sendHello(channel: RTCDataChannel): void {
        const replay: ReplayFile = simScheduler.snapshotReplay()
        const body: HelloBody = {
            seed: simScheduler.seedValue,
            tick: simScheduler.tick,
            replay,
        }
        const send = () => sendBinary(channel, encodeHello(body))
        if (channel.readyState === 'open') send()
        else channel.onopen = send
    }

    private applyHello(body: HelloBody): void {
        this.ignoreInputsBefore = body.tick
        this.hostTickWatermark = body.tick
        resetDeterministicSystems({ preserveStoreMode: true })
        simScheduler.reset(body.seed)
        simScheduler.setInputHandler((entry) => applyReplayInput(entry))
        for (const entry of body.replay.inputs) {
            if (entry.tick <= body.tick) {
                simScheduler.enqueueInput(entry)
            }
        }
        simScheduler.fastForward(body.tick, () => tickSimSystems())
        syncLocalMusicFromStore()
        useGameStore.getState().setConnectionStatus('connected')
    }

    private requestResync(): void {
        const now = Date.now()
        if (now < this.resyncCooldownUntil) return
        this.resyncCooldownUntil = now + 2000
        const peer = this.peers.values().next().value
        if (peer?.simChannel?.readyState === 'open') {
            sendBinary(peer.simChannel, encodeResync())
        }
    }

    private startPing(): void {
        if (this.pingTimer) clearInterval(this.pingTimer)
        this.pingTimer = setInterval(() => {
            const peer = this.peers.values().next().value
            if (peer?.chatChannel?.readyState === 'open') {
                sendBinary(peer.chatChannel, encodePing())
            }
        }, PING_INTERVAL_MS)
    }

    private startSignalPolling(): void {
        if (this.signalPollTimer) clearInterval(this.signalPollTimer)
        this.signalPollTimer = setInterval(() => {
            void this.pollSignals()
        }, SIGNAL_POLL_MS)
    }

    private async pollSignals(): Promise<void> {
        if (this.disposed || !this.roomId) return

        try {
            if (this.isHost) {
                await this.pollHostSignals(this.roomId)
            } else {
                await this.pollSpectatorSignals(this.roomId)
            }
        } catch (e) {
            console.warn('Signalling poll error:', e)
        }
    }

    private async pollHostSignals(roomId: string): Promise<void> {
        const res = await fetch(`${signalBaseUrl()}/room/${roomId}/pending`)
        if (!res.ok) return
        const pending = (await res.json()) as Array<{
            peerId: string
            offer: RTCSessionDescriptionInit
        }>

        if (useGameStore.getState().spectatorCount >= MAX_SPECTATORS) return

        for (const joiner of pending) {
            if (this.peers.has(joiner.peerId)) continue
            if (this.peers.size >= MAX_SPECTATORS) break
            await this.acceptSpectator(roomId, joiner.peerId, joiner.offer)
        }

        const iceRes = await fetch(
            `${signalBaseUrl()}/room/${roomId}/ice?role=host&peerId=${this.localPeerId}`,
        )
        if (iceRes.ok) {
            const candidates = (await iceRes.json()) as Array<{
                peerId: string
                candidate: RTCIceCandidateInit
            }>
            for (const { peerId, candidate } of candidates) {
                const peer = this.peers.get(peerId)
                if (peer) {
                    await peer.pc.addIceCandidate(candidate)
                }
            }
        }
    }

    private async pollSpectatorSignals(roomId: string): Promise<void> {
        const res = await fetch(
            `${signalBaseUrl()}/room/${roomId}/signal?peerId=${this.localPeerId}`,
        )
        if (!res.ok) return
        const data = (await res.json()) as {
            answer?: RTCSessionDescriptionInit
            ice?: RTCIceCandidateInit[]
        }

        const peer = this.peers.values().next().value
        if (!peer) return

        if (data.answer && !peer.pc.currentRemoteDescription) {
            await peer.pc.setRemoteDescription(data.answer)
        }
        if (data.ice) {
            for (const candidate of data.ice) {
                await peer.pc.addIceCandidate(candidate)
            }
        }
    }

    private async acceptSpectator(
        roomId: string,
        peerId: string,
        offer: RTCSessionDescriptionInit,
    ): Promise<void> {
        const pc = this.createPeerConnection(peerId, true)
        await pc.setRemoteDescription(offer)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        await fetch(`${signalBaseUrl()}/room/${roomId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ peerId, answer }),
        })

        const peer: PeerConnection = {
            peerId,
            pc,
            simChannel: null,
            chatChannel: null,
        }
        this.peers.set(peerId, peer)
        useGameStore.getState().setSpectatorCount(this.peers.size)
    }

    private async connectSpectatorToHost(roomId: string): Promise<void> {
        const pc = this.createPeerConnection(this.localPeerId, false)
        const simChannel = pc.createDataChannel('sim', { ordered: true })
        const chatChannel = pc.createDataChannel('chat', { ordered: true })

        const peer: PeerConnection = {
            peerId: this.localPeerId,
            pc,
            simChannel,
            chatChannel,
        }
        this.peers.set(this.localPeerId, peer)
        this.wireDataChannel(simChannel, false)
        this.wireDataChannel(chatChannel, false)

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        await fetch(`${signalBaseUrl()}/room/${roomId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ peerId: this.localPeerId, offer }),
        })
    }

    private createPeerConnection(peerId: string, isHostSide: boolean): RTCPeerConnection {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

        pc.onicecandidate = (event) => {
            if (!event.candidate || !this.roomId) return
            void fetch(`${signalBaseUrl()}/room/${this.roomId}/ice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    peerId,
                    from: isHostSide ? 'host' : 'spectator',
                    candidate: event.candidate.toJSON(),
                }),
            })
        }

        if (isHostSide) {
            pc.ondatachannel = (event) => {
                const peer = this.peers.get(peerId)
                if (!peer) return
                if (event.channel.label === 'sim' || event.channel.label === 'state') {
                    peer.simChannel = event.channel
                    this.wireDataChannel(event.channel, true)
                    this.sendHello(event.channel)
                } else if (event.channel.label === 'chat') {
                    peer.chatChannel = event.channel
                    this.wireDataChannel(event.channel, true)
                }
            }
        }

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                this.peers.delete(peerId)
                if (this.isHost) {
                    useGameStore.getState().setSpectatorCount(this.peers.size)
                }
            }
        }

        return pc
    }

    private wireDataChannel(channel: RTCDataChannel, isHostSide: boolean): void {
        channel.binaryType = 'arraybuffer'
        channel.onmessage = (event) => {
            const bytes = new Uint8Array(event.data as ArrayBuffer)
            try {
                const envelope = decodePacket(bytes)
                if (envelope.t === 'chat') {
                    const msg = decodeChatPacket(bytes)
                    useGameStore.getState().addChatMessage({
                        id: `${msg.ts}-${msg.sender}`,
                        sender: msg.sender,
                        text: msg.text,
                        ts: msg.ts,
                    })
                    return
                }
                if (envelope.t === 'ping') {
                    sendBinary(channel, encodePong(envelope.ts))
                    return
                }
                if (envelope.t === 'pong') {
                    if (!isHostSide) {
                        const pong = decodePongPacket(bytes)
                        if (pong) {
                            useGameStore.getState().setNetworkLatency(Date.now() - pong.pingTs)
                        }
                    }
                    return
                }
                if (isHostSide && envelope.t === 'resync') {
                    this.sendHello(channel)
                    return
                }
                if (!isHostSide && envelope.t === 'hello') {
                    this.applyHello(decodeHelloPacket(bytes))
                    return
                }
                if (!isHostSide && envelope.t === 'input') {
                    const body = decodeInputPacket(bytes)
                    if (body.tick <= this.ignoreInputsBefore) return
                    this.hostTickWatermark = Math.max(this.hostTickWatermark ?? 0, body.tick)
                    simScheduler.enqueueInput(body)
                    return
                }
                if (!isHostSide && envelope.t === 'hash') {
                    const body = decodeHashPacket(bytes)
                    this.hostTickWatermark = Math.max(this.hostTickWatermark ?? 0, body.tick)
                    this.pendingHash = body
                    this.applyPendingHashCheck()
                }
            } catch (e) {
                console.warn('Data channel message error:', e)
            }
        }
    }
}

export const multiplayerSystem = new MultiplayerSystem()
