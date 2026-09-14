# ADR 0003 — TURN relay configured via build env, never committed

- **Status:** Proposed (no live TURN provisioned yet)
- **Date:** 2026-09-14
- **Deciders:** HarborGlow net / living-port track
- **Related:** #224 workstream B, [`workers/signalling/README.md`](../../workers/signalling/README.md), [`docs/systems/DETERMINISM.md`](../systems/DETERMINISM.md), [`src/systems/iceServers.ts`](../../src/systems/iceServers.ts)

## Context

Shared harbors use wire v2 (seed + input log, `WIRE_VERSION = 2`) over WebRTC data channels. Signalling is a Cloudflare Worker + Durable Object (`workers/signalling`) that relays SDP/ICE only. ICE used Google STUN only, so peers behind symmetric NAT / CGNAT / strict corporate firewalls never get a candidate pair and the spectator join silently stalls. A TURN relay fixes that; the payload is tiny (~2 kB input log bursts + 1 Hz FNV hash), so relay bandwidth cost is negligible.

`DEPLOY_TOKEN` already set the house rule: credentials live in the environment, never in the repo. `VITE_*` variables are inlined into the client bundle, so anything put there **is public to every player** — that shapes which TURN credentials are acceptable.

## Decision

1. ICE servers are built by `buildIceServers()` from build env:
   - `VITE_TURN_URL` — one or more comma-separated `turn:` / `turns:` URLs. Unset ⇒ STUN-only (today's behaviour, the local default).
   - `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` — passed through as the `RTCIceServer` username/credential.
2. Values come from `.env.local` (git-ignored) or the deploy shell. `.env.example` lists the keys with **empty** values. No TURN password, shared secret, or API token is ever committed.
3. Because the values ship in the bundle, a production build must use **short-lived or relay-scoped credentials** (Cloudflare Calls TURN keys, or coturn `use-auth-secret` time-limited usernames), not a long-lived static coturn user. Static creds are acceptable only for a private two-browser NAT test build.
4. Preferred provider order to evaluate: **Cloudflare Calls TURN** (same account as the signalling worker; worker can later mint per-room credentials via the Calls API so nothing long-lived reaches the bundle) → a tiny **coturn** VM with `use-auth-secret`. No Colyseus / PartyKit / Yjs — they do not beat a 2 kB input log.
5. Spectator cap stays at 6 (`MAX_SPECTATORS`, enforced in the worker too).

## Consequences

- No behaviour change until someone sets `VITE_TURN_URL`; local dev is unaffected.
- Follow-up (not this ADR): a `GET /turn` worker route that mints short-lived Calls credentials server-side, with the Calls API token held as a `wrangler secret`. At that point the `VITE_TURN_USERNAME/CREDENTIAL` build vars become a fallback and this ADR moves to Accepted/Superseded.
- Leaked-credential history rewrite is out of scope; rotate out of band.
