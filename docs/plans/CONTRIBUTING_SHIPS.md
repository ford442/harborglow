# 🛳️ CONTRIBUTING SHIPS TO HARBOR GLOW

Any AI (Jules, Gemini, Claude, Cursor, Copilot, etc.) can add new vessels to the game!

## Quick Start

1. Open `src/blueprints/ships.json`
2. Copy the last ship entry in the `ships` array
3. Modify `id`, `version`, `name`, `parts`, etc.
4. Add your name to `contributor`
5. Save and run `npm run heartbeat`

## The Vessel Blueprint Protocol (v1.0)

### Ship Structure

```json
{
  "id": "your-ship-id",           // Unique identifier
  "version": "1.0",               // Semver
  "name": "Ship Name v1.0",       // Display name
  "scale": 1.5,                   // Global scale multiplier
  "baseColor": "#0a2540",         // Default color (hex)
  "parts": [                      // Array of geometry parts
    {
      "id": "part-id",
      "type": "box",              // box | cylinder | cone
      "position": [x, y, z],      // [number, number, number]
      "rotation": [x, y, z],      // radians
      "size": [w, h, d],          // dimensions
      "material": {               // optional
        "emissive": "#ffaa00",    // glow color
        "metalness": 0.5,
        "roughness": 0.3
      }
    }
  ],
  "attachmentPoints": ["part1", "part2"], // Upgradable parts
  "contributor": "Your Name",
  "added": "2026-03-08",
  "notes": "Brief description"
}
```

### Approved Geometry Types

| Type | Size Format | Use For |
|------|-------------|---------|
| `box` | `[width, height, depth]` | Hulls, decks, superstructures |
| `cylinder` | `[radiusTop, radiusBottom, height]` | Funnels, masts, stacks |
| `cone` | `[radius, height, segments]` | Bows, radar domes, tips |

### Example Prompts for Other AIs

**For Jules:**
```
Add a new ship to Harbor Glow! Create a "Bulk Carrier 'Iron Tide' v1.0" 
in src/blueprints/ships.json. Use the Vessel Blueprint Protocol v1.0.
Include: bulbous bow, 5 cargo holds, crane towers. Scale: 1.3. 
Contributor: "Jules". Make it look industrial with rust-colored emissive materials.
```

**For Gemini:**
```
Create a passenger ferry called "Harbor Hopper v1.0" in the ships.json.
Use box/cylinder/cone primitives. Needs: car deck, passenger deck, bridge,
twin funnels. Yellow and white color scheme. Scale: 1.0. Contributor: "Gemini".
```

**For Claude:**
```
Design a luxury yacht "Midnight Pearl v1.0" for Harbor Glow.
Sleek black hull, multiple decks, helipad, curved glass bridge.
Use emissive materials for the underwater lighting. Scale: 0.8.
Add to src/blueprints/ships.json. Contributor: "Claude".
```

## Guidelines

1. **ID must be unique** - check existing ships first
2. **Scale appropriately** - cruise ships: 1.5-2.0, tankers: 1.0-1.3
3. **Use emissive materials** for parts that should glow (funnels, windows)
4. **Include attachmentPoints** for upgrade gameplay (6-10 points recommended)
5. **Keep parts reasonable** - 5-20 parts is a good range
6. **Test before submitting** - run `npm run heartbeat` to verify

## Testing Your Ship

```bash
npm run lint:fix      # Check for errors
npm run heartbeat     # Build and verify
npm run dev           # View at http://localhost:5173/
```

Look for in console:
- `📋 Loaded X ships from standardized Vessel Blueprint Protocol v1.0`
- `🚢 Procedural ship loaded from blueprint: Your Ship Name v1.0`

## Current Fleet

| Ship | Contributor | Notes |
|------|-------------|-------|
| Cruise Liner "Aurora Glow" v1.0 | Grok + Kimi | Multi-deck with balconies |
| Container Vessel "Neon Stack" v1.0 | Grok + Kimi | Colorful containers with dock cranes |
| Oil Tanker "Flame Runner" v1.0 | Grok + Kimi | VLCC with iconic flare stack |

### Ship Details

#### 🎵 Cruise Liner "Aurora Glow" v1.0
**Features:**
- Multi-deck superstructure with 3 passenger decks
- Twin glowing funnels with orange emissive lighting
- Bulbous bow cone geometry
- 6 attachment points (balconies, funnels)
- Scale: 1.8x
- Music: Orchestral Pop Symphony at 120 BPM

**Key Parts:**
- `hull` - Main ship body (18×6×80)
- `deck1-3` - Tiered passenger decks
- `bridge` - Navigation bridge
- `funnel1-2` - Glowing orange funnels
- `bow` - Pointed bow cone

#### 📦 Container Vessel "Neon Stack" v1.0
**Features:**
- Large cargo hold deck (21×0.5×98)
- 4 colorful container stacks with neon emissive materials:
  - Green stack (`#00ff88`)
  - Red stack (`#ff6b6b`)
  - Cyan stack (`#4ecdc4`)
  - Yellow stack (`#ffe66d`)
- Twin dock cranes with articulated arms
- 6 attachment points (container stacks, cranes)
- Scale: 1.5x
- Music: Future Bass / Techno at 128 BPM

**Key Parts:**
- `hull` - Wide cargo hull (22×4×100)
- `deck` - Flat container deck
- `bridge` - Offset navigation bridge
- `crane1-2` + `crane1-2arm` - Articulated dock cranes
- `containerStack1-4` - Colorful container piles

#### 🛢️ Oil Tanker "Flame Runner" v1.0
**Features:**
- Massive VLCC hull (20×8×120) - largest vessel in fleet
- Iconic flare stack with glowing orange tip (`#ff4400`)
- Bulbous bow for ocean efficiency
- 3 cargo hatches for oil loading
- Superstructure with bridge
- 6 attachment points (flare stack, hatches, superstructure)
- Scale: 1.2x
- Music: Dubstep / Industrial at 140 BPM

**Key Parts:**
- `hull` - Massive tanker body
- `bow` - Pointed bow cone
- `superstructure` - Crew quarters
- `bridge` - Navigation bridge
- `flareStack` + `flareTip` - Burning flare with cone tip
- `hatch1-3` - Cargo loading hatches

---

## Example Prompts for Creating Similar Ships

### Container Vessel Prompts

**For Jules:**
```
Add a new container ship to Harbor Glow! Create "Container Vessel 'StackMaster 4000' v1.0" 
in src/blueprints/ships.json using Vessel Blueprint Protocol v1.0.

Design specs:
- Ultra-wide hull for mega-container capacity
- 6 container stacks in alternating colors (cyan, magenta, orange)
- Heavy-lift gantry cranes with extended reach arms
- Bridge positioned mid-ship for visibility
- Scale: 1.6x
- Emissive containers with pulsing potential
- 8 attachment points (cranes + all container stacks)
- Contributor: "Jules"

Reference the existing "Neon Stack" for geometry patterns.
```

**For Gemini:**
```
Create "Container Vessel 'Cargo Titan' v1.0" in src/blueprints/ships.json.
Use Vessel Blueprint Protocol v1.0.

Include:
- Double-wide cargo deck for intermodal containers
- Automated rail-mounted cranes (3x)
- Bridge superstructure at stern
- Distinctive blue hull with orange crane accents
- 5 container stacks in varying heights (realistic loading pattern)
- Scale: 1.4x
- 7 attachment points
- Contributor: "Gemini"
```

### Oil Tanker Prompts

**For Claude:**
```
Design an Oil Tanker "Black Pearl v1.0" for Harbor Glow.
Add to src/blueprints/ships.json using Vessel Blueprint Protocol v1.0.

Features:
- Sleek black/dark grey hull (supertanker class)
- Prominent flare stack with animated flame effect potential
- Multiple cargo compartments (use hatch geometry)
- Helipad on superstructure roof
- Anti-collision lighting rig
- Scale: 1.3x
- Purple emissive accents for modern feel
- 8 attachment points (flare, hatches, helipad, lights)
- Contributor: "Claude"
```

**For Cursor:**
```
Add "Oil Tanker 'Midnight Voyager' v1.0" to the ships registry.
Follow Vessel Blueprint Protocol v1.0 in src/blueprints/ships.json.

Design elements:
- Deep blue hull with rust-streak details (emissive hints)
- Twin flare stacks for a modern tanker
- Accommodations block with multiple deck levels
- Pipeline loading manifold on deck
- Scale: 1.25x
- Red safety lighting for night operations
- 6 attachment points
- Contributor: "Cursor"
```

### Feature-Specific Prompts

**For Copilot:**
```
Enhance the container ship "Neon Stack" with additional crane detail.
Modify src/blueprints/ships.json - add articulated crane arms that extend 
over the container stacks. Use box primitives with precise positioning.
Make cranes glow amber (`#ffaa00`) when upgrades are installed.
```

**For any AI:**
```
Create a new ship type: LNG Carrier "Cryo Queen v1.0"

This specialized tanker carries liquefied natural gas with:
- Spherical LNG tanks (use cylinders with creative sizing)
- Cryogenic pipeline systems
- Specialized loading arms
- Red hazard lighting
- White/silver color scheme with blue accents
- Scale: 1.35x
- 6 attachment points on the spherical tanks
- Add to src/blueprints/ships.json per Vessel Blueprint Protocol v1.0
```

## Questions?

Check the schema at the top of `src/blueprints/ships.json` or look at existing ships for examples.

Happy shipbuilding! 🚢✨
