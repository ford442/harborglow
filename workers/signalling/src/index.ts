/**
 * HarborGlow signalling worker — WebRTC SDP/ICE relay (no game logic).
 *
 * Dev:  cd workers/signalling && npm install && npx wrangler dev
 * Prod: npx wrangler deploy
 */

export interface Env {
    ROOM: DurableObjectNamespace;
}

interface JoinRequest {
    peerId: string;
    offer: RTCSessionDescriptionInit;
    answered: boolean;
}

interface RoomState {
    hostPeerId: string | null;
    joiners: JoinRequest[];
    answers: Record<string, RTCSessionDescriptionInit>;
    iceFromSpectators: Array<{ peerId: string; candidate: RTCIceCandidateInit }>;
    iceFromHost: Array<{ peerId: string; candidate: RTCIceCandidateInit }>;
}

export class Room {
    private state: DurableObjectState;
    private room: RoomState = {
        hostPeerId: null,
        joiners: [],
        answers: {},
        iceFromSpectators: [],
        iceFromHost: [],
    };

    constructor(state: DurableObjectState) {
        this.state = state;
        this.state.blockConcurrencyWhile(async () => {
            const stored = await this.state.storage.get<RoomState>('room');
            if (stored) this.room = stored;
        });
    }

    private async persist(): Promise<void> {
        await this.state.storage.put('room', this.room);
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        if (request.method === 'GET' && path.endsWith('/pending')) {
            const pending = this.room.joiners.filter((j) => !j.answered);
            return Response.json(pending);
        }

        if (request.method === 'GET' && path.endsWith('/signal')) {
            const peerId = url.searchParams.get('peerId');
            if (!peerId) return new Response('peerId required', { status: 400 });
            const answer = this.room.answers[peerId];
            const ice = this.room.iceFromHost.filter((c) => c.peerId === peerId);
            return Response.json({ answer, ice });
        }

        if (request.method === 'GET' && path.endsWith('/ice')) {
            const role = url.searchParams.get('role');
            if (role === 'host') {
                const batch = this.room.iceFromSpectators.splice(0);
                await this.persist();
                return Response.json(batch);
            }
            return Response.json([]);
        }

        if (request.method === 'POST' && path.endsWith('/join')) {
            const body = (await request.json()) as { peerId: string; offer: RTCSessionDescriptionInit };
            if (this.room.joiners.length >= 6) {
                return new Response('Room full', { status: 403 });
            }
            this.room.joiners.push({ peerId: body.peerId, offer: body.offer, answered: false });
            await this.persist();
            return Response.json({ ok: true });
        }

        if (request.method === 'POST' && path.endsWith('/answer')) {
            const body = (await request.json()) as { peerId: string; answer: RTCSessionDescriptionInit };
            this.room.answers[body.peerId] = body.answer;
            const joiner = this.room.joiners.find((j) => j.peerId === body.peerId);
            if (joiner) joiner.answered = true;
            await this.persist();
            return Response.json({ ok: true });
        }

        if (request.method === 'POST' && path.endsWith('/ice')) {
            const body = (await request.json()) as {
                peerId: string;
                from: 'host' | 'spectator';
                candidate: RTCIceCandidateInit;
            };
            if (body.from === 'spectator') {
                this.room.iceFromSpectators.push({ peerId: body.peerId, candidate: body.candidate });
            } else {
                this.room.iceFromHost.push({ peerId: body.peerId, candidate: body.candidate });
            }
            await this.persist();
            return Response.json({ ok: true });
        }

        if (request.method === 'DELETE') {
            await this.state.storage.deleteAll();
            this.room = {
                hostPeerId: null,
                joiners: [],
                answers: {},
                iceFromSpectators: [],
                iceFromHost: [],
            };
            return Response.json({ ok: true });
        }

        return new Response('Not found', { status: 404 });
    }
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders(),
            });
        }

        if (request.method === 'POST' && url.pathname === '/room') {
            const roomId = crypto.randomUUID().slice(0, 8);
            return json({ roomId }, corsHeaders());
        }

        const match = url.pathname.match(/^\/room\/([^/]+)/);
        if (!match) {
            return new Response('Not found', { status: 404, headers: corsHeaders() });
        }

        const roomId = match[1];
        const id = env.ROOM.idFromName(roomId);
        const stub = env.ROOM.get(id);
        const subPath = url.pathname.slice(`/room/${roomId}`.length) || '/';
        const internalUrl = new URL(`https://internal/room/${roomId}${subPath}`);
        internalUrl.search = url.search;

        const response = await stub.fetch(
            new Request(internalUrl.toString(), {
                method: request.method,
                headers: request.headers,
                body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
            }),
        );

        const headers = new Headers(response.headers);
        for (const [k, v] of Object.entries(corsHeaders())) {
            headers.set(k, v);
        }
        return new Response(response.body, { status: response.status, headers });
    },
};

function corsHeaders(): Record<string, string> {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

function json(data: unknown, extraHeaders: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', ...extraHeaders },
    });
}
