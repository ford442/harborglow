# 🫀 HarborGlow HEARTBEAT
**Last checked:** Sun Apr 19 2026 (crane physics tuning)

## Status
- Git status: src/ changed; crane physics tuning wrap-up
- TODO/FIXME count: 0 items in src/
- Build status: ✅ SUCCESS (4.13 MB raw / 1.32 MB gzip; 1760 modules; 23.74s)
- Save status: localStorage 'harborglow-save-v2' ready
- Ships: **3 vessels** from Vessel Blueprint Protocol v1.0
- **NEW: Living Fleet** - Ships sail away and return automatically!
- **NEW: Structural Overhaul** - Upgrade ships v1.0 → v1.5 → v2.0
- **Public access:** http://10.140.210.58:5173/

## 📦 Bundle Breakdown (Apr 19 2026)
| Chunk | Raw | gzip |
|-------|-----|------|
| vendor-3d (Three.js + Rapier + R3F) | 3,227 kB | 1,096 kB |
| index (React + Leva + Zustand + app) | 472 kB | 136 kB |
| vendor-audio (Tone.js) | 288 kB | 69 kB |
| MainScene (lazy) | 188 kB | 49 kB |
| PostProcessing chunks (7 files) | 17 kB | 5 kB |
| index.css | 34 kB | 8 kB |
| **Total** | **4,226 kB / 4.13 MB** | **1,363 kB / 1.33 MB** |

**vs Mar 8 baseline (3.62 MB):** +0.51 MB / +14% — baseline likely excluded MainScene + PostProcessing chunks

## ⚠️ Pipeline Findings (hygiene pass)
- 4 circular-dep warnings: `harborEventSystem` reexport through `eventSystem/index.ts` affects OnDockRail, DistantShipQueue, techSystem, MainScene
- vendor-audio (288 kB) is 3rd largest chunk, not 2nd — main `index` bundle (472 kB) is larger
- react-dom + react-reconciler pulled into vendor-3d by @react-three/fiber transitive dep (not app leak)
- deploy.py: password hardcoded in plaintext (line 45); recursive call uses outer `sftp` var not `sftp_client` param
- All dist/ assets return HTTP 200 (preview server smoke test)
- base:'./' honored — zero absolute `/assets/` paths in dist/index.html

## Quick commands
```bash
npm run heartbeat  # Full status + build check
npm run lint       # Check code quality
npm run lint:fix   # Fix auto-fixable issues
npm run dev        # Start dev server (http://localhost:5173/)
npm run build      # Production build
```

## 🚢 Fleet Registry (3 Ships)
| Ship | Contributor | Features |
|------|-------------|----------|
| Cruise Liner "Aurora Glow" v1.0 | Grok + Kimi | Multi-deck, twin funnels, glowing balconies |
| Container Vessel "StackMaster 4000" v1.0 | Agent Swarm | 6 container stacks, LED deck strips, cranes |
| Oil Tanker "Black Pearl" v1.0 | Agent Swarm | Bulbous bow, flare stack, pipe arrays |

## 🌊 Living Fleet Features
- Ships automatically depart after 45-90 seconds
- Sail away animation (Z position)
- 10 seconds "at sea" (invisible)
- Auto-return to dock with rescheduling
- Console logs: "⛵ Ship departing..." / "🔄 Ship returning"

## 🔧 Upgrade System
- **Full Structural Overhaul** button in UpgradeMenu
- Version progression: v1.0 → v1.5 → v2.0
- Flash effect on completion
- ShipVersionDisplay shows current version + dock status

## Console Logs
- 📋 Loaded 3 ships from Vessel Blueprint Protocol v1.0
- 🚢 Procedural ship loaded from blueprint
- 💾 Saved to storage_manager (v2)
- ⛵ Ship [name] departing for sea...
- 🔄 Ship [name] returning for upgrade
