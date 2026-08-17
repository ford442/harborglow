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

## Deploy

```bash
npx wrangler deploy
```

Then set `VITE_SIGNAL_URL` to your deployed worker URL before `npm run build`.

## Manual test (two browser tabs)

1. Start the worker: `npx wrangler dev` (port 8787).
2. Tab A (host): `http://localhost:5173/?multiplayer=1`
   - New Game → Lobby → **Create shared harbor** → copy share link.
3. Tab B (spectator): open the share link (`?multiplayer=1&join=ROOMID`).
   - New Game → auto-joins as spectator.
4. Operate crane in Tab A; spreader position should sync to Tab B within ~100 ms.
   Gameplay-state multiplayer (#183) is **seed + input log**, not per-entity
   transform spam — see `docs/systems/DETERMINISM.md`.
5. Send chat from either tab; message appears in both.

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
