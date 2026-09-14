# HarborGlow Signalling Worker

Minimal Cloudflare Worker + Durable Object for WebRTC SDP/ICE relay. No game logic.

## Local development

```bash
cd workers/signalling
npm install
npx wrangler dev
```

Set in the game app root `.env`:

```
VITE_SIGNAL_URL=http://localhost:8787
```

## Production deploy

```bash
cd workers/signalling
npx wrangler login            # once, interactive
npx wrangler deploy           # prints https://harborglow-signalling.<account>.workers.dev
```

The Durable Object migration in `wrangler.toml` is applied on first deploy.
Then build the game against that URL (shell env or git-ignored `.env.local`,
not `.env.example`):

```bash
VITE_SIGNAL_URL=https://harborglow-signalling.<account>.workers.dev npm run build
```

`VITE_SIGNAL_URL` is baked in at build time; changing it needs a rebuild.
The worker answers CORS `*`, so any origin serving `dist/` can use it.

## TURN relay (env only)

STUN alone fails for symmetric NAT / CGNAT pairs. Set a TURN relay at build
time — see [ADR 0003](../../docs/adr/0003-turn-relay-via-env.md):

```bash
VITE_TURN_URL="turn:turn.example.com:3478?transport=udp,turns:turn.example.com:5349" \
VITE_TURN_USERNAME=... \
VITE_TURN_CREDENTIAL=... \
VITE_SIGNAL_URL=https://harborglow-signalling.<account>.workers.dev \
npm run build
```

- Unset `VITE_TURN_URL` ⇒ STUN-only (`src/systems/iceServers.ts`).
- **Never commit TURN usernames/passwords or Calls API tokens** — same rule as
  `DEPLOY_TOKEN`. `VITE_*` values are public in the bundle, so production
  should use short-lived credentials (Cloudflare Calls TURN keys, or coturn
  `use-auth-secret`), not a static coturn user.
- Candidates: Cloudflare Calls TURN (same account as this worker) or a tiny
  coturn VM. No Colyseus / PartyKit / Yjs.

## Manual test (two browser tabs)

1. Start the worker: `npx wrangler dev` (port 8787).
2. Tab A (host): `http://localhost:5173/?multiplayer=1`
   - New Game → Lobby → **Create shared harbor** → copy share link.
3. Tab B (spectator): open the share link (`?multiplayer=1&join=ROOMID`).
   - New Game → auto-joins as spectator.
4. Operate crane in Tab A; Tab B should follow from **shared seed + inputs**,
   not 10 Hz spreader patches — see `docs/systems/DETERMINISM.md`.
   Creating a shared harbor reseeds the sim. Signalling is local-only by
   default (`VITE_SIGNAL_URL=http://localhost:8787`).
5. Send chat from either tab; message appears in both.

## Two-browser NAT test (production)

Same-machine tabs always connect via host candidates, so they prove nothing
about NAT. To exercise STUN/TURN:

1. Deploy the worker and build with production `VITE_SIGNAL_URL` (+ TURN
   vars for the relay run). Serve `dist/` somewhere both peers can reach.
2. Put the host on one network (home Wi-Fi) and the spectator on another
   (phone hotspot / CGNAT mobile data is the useful hard case).
3. Host: `?multiplayer=1` → Create shared harbor → send link. Spectator opens it.
4. In each browser open `chrome://webrtc-internals` and check the selected
   candidate pair: `srflx` = STUN worked, `relay` = TURN in use.
5. Record for each run: networks, TURN on/off, connected yes/no, candidate
   type, and whether the spectator logged any FNV desync.
6. Expected: STUN-only build fails on at least some hotspot pairs; TURN build
   connects with `relay`. To force the relay path, temporarily set
   `iceTransportPolicy: 'relay'` in a local (uncommitted) build.

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/room` | Create room, returns `{ roomId }` |
| POST | `/room/:id/join` | Spectator posts `{ peerId, offer }` |
| GET | `/room/:id/pending` | Host polls unanswered joiners |
| POST | `/room/:id/answer` | Host posts `{ peerId, answer }` |
| GET | `/room/:id/signal?peerId=` | Spectator polls answer + host ICE |
| POST | `/room/:id/ice` | Relay ICE candidate |
| GET | `/room/:id/ice?role=host` | Host polls spectator ICE batch |
| DELETE | `/room/:id` | Tear down room |

Max 6 spectators per room.
