/* eslint-disable no-restricted-syntax -- wall-clock / audio / network; see docs/systems/DETERMINISM.md */
// =============================================================================
// MULTIPLAYER SYSTEM — WebRTC star topology (host ↔ spectators)
//
// #183 re-scope: harbor gameplay sync is seed + input log (see
// docs/systems/DETERMINISM.md). This module remains the WebRTC transport for
// presence, chat, and spectator attach. Do not stream wildlife/traffic/particle
// transforms every frame — share SimContext seed and the recorded input log.
// =============================================================================

import { useGameStore } from '../store/useGameStore';
import { getNetworkSyncState, type NetworkSyncState } from '../store/gameStoreTypes';
import {
    encodeSnapshot,
    encodeDeltaPacket,
    decodeStatePacket,
    decodePacket,
    encodePing,
    encodePong,
    encodeChat,
    decodeChatPacket,
    decodePongPacket,
} from './multiplayerCodec';
import { syncSpectatorMusic } from './multiplayerMusicSync';

const MAX_SPECTATORS = 6;
const BROADCAST_HZ = 10;
const BROADCAST_MS = 1000 / BROADCAST_HZ;
const SIGNAL_POLL_MS = 500;
const PING_INTERVAL_MS = 2000;

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

function sendBinary(channel: RTCDataChannel, data: Uint8Array): void {
    const buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    channel.send(buf);
}

function signalBaseUrl(): string {
    const env = (import.meta as ImportMeta & { env?: { VITE_SIGNAL_URL?: string } }).env;
    return env?.VITE_SIGNAL_URL || 'http://localhost:8787';
}

function generatePeerId(): string {
    return `peer-${Math.random().toString(36).slice(2, 10)}`;
}

interface PeerConnection {
    peerId: string;
    pc: RTCPeerConnection;
    stateChannel: RTCDataChannel | null;
    chatChannel: RTCDataChannel | null;
    lastSent: NetworkSyncState | null;
}

class MultiplayerSystem {
    private peers = new Map<string, PeerConnection>();
    private broadcastTimer: ReturnType<typeof setInterval> | null = null;
    private signalPollTimer: ReturnType<typeof setInterval> | null = null;
    private pingTimer: ReturnType<typeof setInterval> | null = null;
    private localPeerId = generatePeerId();
    private roomId: string | null = null;
    private isHost = false;
    private lastMusicPlaying: Record<string, boolean> = {};
    private disposed = false;

    async createRoom(): Promise<string> {
        const res = await fetch(`${signalBaseUrl()}/room`, { method: 'POST' });
        if (!res.ok) throw new Error(`Failed to create room: ${res.status}`);
        const data = (await res.json()) as { roomId: string };
        return data.roomId;
    }

    getShareUrl(roomId: string): string {
        const url = new URL(window.location.href);
        url.searchParams.set('multiplayer', '1');
        url.searchParams.set('join', roomId);
        return url.toString();
    }

    async startHost(roomId: string): Promise<void> {
        this.roomId = roomId;
        this.isHost = true;
        this.disposed = false;
        const store = useGameStore.getState();
        store.setMultiplayerRole('host');
        store.setRoomId(roomId);
        store.setConnectionStatus('signalling');

        this.startSignalPolling();
        this.startBroadcast();
        store.setConnectionStatus('connected');
    }

    async startSpectator(roomId: string): Promise<void> {
        this.roomId = roomId;
        this.isHost = false;
        this.disposed = false;
        const store = useGameStore.getState();
        store.setMultiplayerRole('spectator');
        store.setRoomId(roomId);
        store.setConnectionStatus('signalling');

        await this.connectSpectatorToHost(roomId);
        this.startSignalPolling();
        this.startPing();
    }

    sendChat(text: string): void {
        const sender = this.isHost ? 'Host' : `Spectator`;
        const bytes = encodeChat(text.slice(0, 200), sender);
        if (this.isHost) {
            for (const peer of this.peers.values()) {
                if (peer.chatChannel?.readyState === 'open') {
                    sendBinary(peer.chatChannel, bytes);
                }
            }
        } else {
            const peer = this.peers.values().next().value;
            if (peer?.chatChannel?.readyState === 'open') {
                sendBinary(peer.chatChannel, bytes);
            }
        }
    }

    dispose(): void {
        this.disposed = true;
        if (this.broadcastTimer) clearInterval(this.broadcastTimer);
        if (this.signalPollTimer) clearInterval(this.signalPollTimer);
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.broadcastTimer = null;
        this.signalPollTimer = null;
        this.pingTimer = null;

        for (const peer of this.peers.values()) {
            peer.pc.close();
        }
        this.peers.clear();

        if (this.isHost && this.roomId) {
            void fetch(`${signalBaseUrl()}/room/${this.roomId}`, { method: 'DELETE' });
        }

        const store = useGameStore.getState();
        store.setConnectionStatus('idle');
        store.setSpectatorCount(0);
        store.setMultiplayerRole('offline');
    }

    private startBroadcast(): void {
        if (this.broadcastTimer) clearInterval(this.broadcastTimer);
        this.broadcastTimer = setInterval(() => {
            if (this.disposed) return;
            const store = useGameStore.getState();
            if (store.isApplyingNetworkPatch) return;

            const current = getNetworkSyncState(store);
            for (const peer of this.peers.values()) {
                if (peer.stateChannel?.readyState !== 'open') continue;

                let bytes: Uint8Array | null;
                if (!peer.lastSent) {
                    bytes = encodeSnapshot(current);
                } else {
                    bytes = encodeDeltaPacket(peer.lastSent, current);
                }
                if (bytes) {
                    try {
                        sendBinary(peer.stateChannel, bytes);
                    } catch {
                        // channel may have closed mid-send
                    }
                }
                peer.lastSent = current;
            }
        }, BROADCAST_MS);
    }

    private startPing(): void {
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
            const peer = this.peers.values().next().value;
            if (peer?.chatChannel?.readyState === 'open') {
                sendBinary(peer.chatChannel, encodePing());
            }
        }, PING_INTERVAL_MS);
    }

    private startSignalPolling(): void {
        if (this.signalPollTimer) clearInterval(this.signalPollTimer);
        this.signalPollTimer = setInterval(() => {
            void this.pollSignals();
        }, SIGNAL_POLL_MS);
    }

    private async pollSignals(): Promise<void> {
        if (this.disposed || !this.roomId) return;

        try {
            if (this.isHost) {
                await this.pollHostSignals(this.roomId);
            } else {
                await this.pollSpectatorSignals(this.roomId);
            }
        } catch (e) {
            console.warn('Signalling poll error:', e);
        }
    }

    private async pollHostSignals(roomId: string): Promise<void> {
        const res = await fetch(`${signalBaseUrl()}/room/${roomId}/pending`);
        if (!res.ok) return;
        const pending = (await res.json()) as Array<{
            peerId: string;
            offer: RTCSessionDescriptionInit;
        }>;

        if (useGameStore.getState().spectatorCount >= MAX_SPECTATORS) return;

        for (const joiner of pending) {
            if (this.peers.has(joiner.peerId)) continue;
            if (this.peers.size >= MAX_SPECTATORS) break;
            await this.acceptSpectator(roomId, joiner.peerId, joiner.offer);
        }

        // Relay ICE from spectators
        const iceRes = await fetch(
            `${signalBaseUrl()}/room/${roomId}/ice?role=host&peerId=${this.localPeerId}`,
        );
        if (iceRes.ok) {
            const candidates = (await iceRes.json()) as Array<{
                peerId: string;
                candidate: RTCIceCandidateInit;
            }>;
            for (const { peerId, candidate } of candidates) {
                const peer = this.peers.get(peerId);
                if (peer) {
                    await peer.pc.addIceCandidate(candidate);
                }
            }
        }
    }

    private async pollSpectatorSignals(roomId: string): Promise<void> {
        const res = await fetch(
            `${signalBaseUrl()}/room/${roomId}/signal?peerId=${this.localPeerId}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
            answer?: RTCSessionDescriptionInit;
            ice?: RTCIceCandidateInit[];
        };

        const peer = this.peers.values().next().value;
        if (!peer) return;

        if (data.answer && !peer.pc.currentRemoteDescription) {
            await peer.pc.setRemoteDescription(data.answer);
        }
        if (data.ice) {
            for (const candidate of data.ice) {
                await peer.pc.addIceCandidate(candidate);
            }
        }
    }

    private async acceptSpectator(
        roomId: string,
        peerId: string,
        offer: RTCSessionDescriptionInit,
    ): Promise<void> {
        const pc = this.createPeerConnection(peerId, true);
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await fetch(`${signalBaseUrl()}/room/${roomId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ peerId, answer }),
        });

        const peer: PeerConnection = {
            peerId,
            pc,
            stateChannel: null,
            chatChannel: null,
            lastSent: null,
        };
        this.peers.set(peerId, peer);
        useGameStore.getState().setSpectatorCount(this.peers.size);
    }

    private async connectSpectatorToHost(roomId: string): Promise<void> {
        const pc = this.createPeerConnection(this.localPeerId, false);
        const stateChannel = pc.createDataChannel('state', {
            ordered: false,
            maxRetransmits: 0,
        });
        const chatChannel = pc.createDataChannel('chat', { ordered: true });

        const peer: PeerConnection = {
            peerId: this.localPeerId,
            pc,
            stateChannel,
            chatChannel,
            lastSent: null,
        };
        this.peers.set(this.localPeerId, peer);
        this.wireDataChannel(stateChannel, false);
        this.wireDataChannel(chatChannel, false);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await fetch(`${signalBaseUrl()}/room/${roomId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ peerId: this.localPeerId, offer }),
        });
    }

    private createPeerConnection(peerId: string, isHostSide: boolean): RTCPeerConnection {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        pc.onicecandidate = (event) => {
            if (!event.candidate || !this.roomId) return;
            void fetch(`${signalBaseUrl()}/room/${this.roomId}/ice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    peerId,
                    from: isHostSide ? 'host' : 'spectator',
                    candidate: event.candidate.toJSON(),
                }),
            });
        };

        if (isHostSide) {
            pc.ondatachannel = (event) => {
                const peer = this.peers.get(peerId);
                if (!peer) return;
                if (event.channel.label === 'state') {
                    peer.stateChannel = event.channel;
                    this.wireDataChannel(event.channel, true);
                    // Send full snapshot on connect
                    const snapshot = getNetworkSyncState(useGameStore.getState());
                    peer.lastSent = snapshot;
                    if (event.channel.readyState === 'open') {
                        sendBinary(event.channel, encodeSnapshot(snapshot));
                    } else {
                        event.channel.onopen = () => {
                            sendBinary(event.channel, encodeSnapshot(snapshot));
                        };
                    }
                } else if (event.channel.label === 'chat') {
                    peer.chatChannel = event.channel;
                    this.wireDataChannel(event.channel, true);
                }
            };
        }

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                this.peers.delete(peerId);
                if (this.isHost) {
                    useGameStore.getState().setSpectatorCount(this.peers.size);
                }
            }
        };

        return pc;
    }

    private wireDataChannel(channel: RTCDataChannel, isHostSide: boolean): void {
        channel.binaryType = 'arraybuffer';
        channel.onmessage = (event) => {
            const bytes = new Uint8Array(event.data as ArrayBuffer);
            try {
                const envelope = decodePacket(bytes);
                if (envelope.t === 'chat') {
                    const msg = decodeChatPacket(bytes);
                    useGameStore.getState().addChatMessage({
                        id: `${msg.ts}-${msg.sender}`,
                        sender: msg.sender,
                        text: msg.text,
                        ts: msg.ts,
                    });
                    return;
                }
                if (envelope.t === 'ping') {
                    if (isHostSide) {
                        sendBinary(channel, encodePong(envelope.ts));
                    } else {
                        sendBinary(channel, encodePong(envelope.ts));
                    }
                    return;
                }
                if (envelope.t === 'pong') {
                    if (!isHostSide) {
                        const pong = decodePongPacket(bytes);
                        if (pong) {
                            useGameStore.getState().setNetworkLatency(Date.now() - pong.pingTs);
                        }
                    }
                    return;
                }
                if (!isHostSide && (envelope.t === 'full' || envelope.t === 'delta')) {
                    const { patch } = decodeStatePacket(bytes);
                    const prevMusic = { ...this.lastMusicPlaying };
                    useGameStore.getState().applyNetworkPatch(patch);
                    queueMicrotask(() => {
                        useGameStore.setState({ isApplyingNetworkPatch: false });
                    });
                    const nextMusic = patch.musicPlaying ?? (envelope.t === 'full'
                        ? (patch as NetworkSyncState).musicPlaying
                        : undefined);
                    if (nextMusic) {
                        syncSpectatorMusic(prevMusic, nextMusic);
                        this.lastMusicPlaying = { ...nextMusic };
                    }
                    if (!useGameStore.getState().connectionStatus ||
                        useGameStore.getState().connectionStatus !== 'connected') {
                        useGameStore.getState().setConnectionStatus('connected');
                    }
                }
            } catch (e) {
                console.warn('Data channel message error:', e);
            }
        };
    }
}

export const multiplayerSystem = new MultiplayerSystem();
