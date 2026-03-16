# Maritime Operations & Safety Research for HarborGlow

*Procedural authenticity for realistic harbor simulation*

---

## 1. COLREGs: The Rules of the Road at Sea

### 1.1 International Regulations for Preventing Collisions at Sea (1972)

**Hierarchy of Responsibility:**
| Priority | Vessel Type | Requirement |
|----------|-------------|-------------|
| **1st** | Vessel not under command | Cannot maneuver |
| **2nd** | Vessel restricted in ability to maneuver | Work restricts movement |
| **3rd** | Vessel constrained by draft | Deep water channels only |
| **4th** | Fishing vessel | Gear restricts movement |
| **5th** | Sailing vessel | Under sail alone |
| **6th** | Power-driven vessel | Must give way to all above |

**Rule 34: Maneuvering and Warning Signals**
- **1 Short Blast**: "I am altering course to starboard" (1 sec)
- **2 Short Blasts**: "I am altering course to port" (1 sec each)
- **3 Short Blasts**: "I am operating astern propulsion" (going backward)
- **5 Short Blasts**: Danger signal (mutual disagreement)
- **1 Prolonged (4-6 sec) + 2 Short**: Towing astern, length >200m, restricted ability

### 1.2 Navigation Light Configurations

**Power-Driven Vessel Underway:**
| Light | Color | Arc | Range (vessel >50m) |
|-------|-------|-----|---------------------|
| Masthead | White | 225° (ahead) | 6 nautical miles |
| Port Sidelight | Red | 112.5° (port) | 3 nautical miles |
| Starboard Sidelight | Green | 112.5° (starboard) | 3 nautical miles |
| Sternlight | White | 135° (behind) | 3 nautical miles |

**Vessel at Anchor:**
- **Anchor Light**: All-round white light, visible 360°, 360° arc
- **Vessels >100m**: Additional white light aft, lower than forward light
- **Anchorage in fairway**: Anchor ball (black circle) by day

**Vessel Restricted in Ability to Maneuver:**
- **Three All-Round Lights**: Red-White-Red (top to bottom)
- **Also Shows**: Normal navigation lights
- **Day Shape**: Ball-Diamond-Ball vertically

**Vessel Constrained by Draft:**
- **Three All-Round Lights**: Red-White-Red
- **Day Shape**: Cylinder
- **Applies Only**: In channels (not open water)

**Fishing Vessel:**
- **Trawling**: Green over white (all-round vertical)
- **Fishing (other gear)**: Red over white
- **Gear extends >150m**: White all-round light in direction of gear

**Pilot Vessel:**
- **Underway**: White over red (all-round vertical)
- **At Anchor**: White over red + anchor lights

### 1.3 Sound Signals in Restricted Visibility

| Signal | Vessel Type | Pattern |
|--------|-------------|---------|
| **1 Prolonged (4-6s)** | Power vessel underway | Every 2 minutes |
| **2 Prolonged** | Power vessel stopped | Every 2 minutes |
| **1 Prolonged + 2 Short** | Towing vessel | Every 2 minutes |
| **Bell + Gong** | Anchored vessel (>100m) | 5 seconds rapid bell, gong aft |
| **3 Strokes + Rapid Ringing + 3 Strokes** | Vessel aground | Bell forward, gong aft |

---

## 2. AIS: Automatic Identification System

### 2.1 System Overview

**Purpose:** Vessel tracking and collision avoidance through automatic data broadcast

**Two Classes:**
| Feature | Class A (Commercial) | Class B (Recreational) |
|---------|---------------------|------------------------|
| **Transmit Power** | 12.5 watts | 2 watts |
| **Update Rate** | 2-10 seconds (depending on speed) | 30 seconds (static) to 5 seconds (high speed) |
| **Message Types** | All (1, 2, 3, 5, 18, 19, 24) | Limited set (18, 19, 24) |
| **Required On** | SOLAS vessels >300 GT, passenger vessels | Voluntary (recreational) |
| **Cost** | $2,000-$5,000+ | $500-$1,500 |

### 2.2 Broadcast Data (Class A)

**Dynamic Information (Automatic):**
- Maritime Mobile Service Identity (MMSI) — unique 9-digit ID
- Navigation status (underway, at anchor, etc.)
- Rate of turn (port/starboard)
- Speed over ground (SOG)
- Position accuracy
- Longitude/Latitude (GPS)
- Course over ground (COG)
- True heading
- UTC timestamp

**Static/Voyage-Related (Manual Input):**
- IMO number
- Call sign
- Vessel name
- Type of ship/cargo
- Dimensions (length/beam)
- Destination
- ETA at destination
- Draught
- Route plan

**Safety-Related (As Needed):**
- Free text messages (distress, navigation warnings)
- Binary messages (weather, tide, traffic)

### 2.3 AIS Display in HarborGlow

**Interface Elements:**
- **Target Symbols**: Triangle (power vessel), square (fishing), diamond (towing)
- **Vector Lines**: Course/speed prediction (CPA calculation)
- **CPA/TCPA**: Closest Point of Approach / Time to CPA
- **Labeling**: Name, speed, course, destination
- **History Dots**: Past positions (trail)
- **Alarms**: CPA violation, lost target, anchor watch

**Gameplay Applications:**
- Harbor traffic management mini-game
- Collision avoidance challenges
- Search and rescue target identification
- Weather routing based on vessel reports

---

## 3. GMDSS: Global Maritime Distress and Safety System

### 3.1 System Architecture

**Communication Hierarchy:**
```
Distress Priority
├── Distress Alert (highest)
│   ├── DSC (Digital Selective Calling) on VHF CH 70 / MF 2187.5 kHz
│   ├── EPIRB (406 MHz satellite)
│   ├── INMARSAT (geostationary satellites)
│   └── VHF CH 16 (voice backup)
├── Urgency
│   └── "Pan Pan" — medical emergency, assistance needed
└── Safety
    └── "Securité" — navigation warning, weather advisory
```

### 3.2 EPIRB: Emergency Position Indicating Radio Beacon

**Specifications:**
| Feature | Specification |
|---------|---------------|
| **Frequency** | 406 MHz (primary) + 121.5 MHz (homing) |
| **Satellite System** | Cospas-Sarsat (LEO + GEO) |
| **Position Accuracy** | GPS-integrated: 100m; Doppler: 5km |
| **Activation** | Automatic (submersion) or manual |
| **Battery Life** | 48 hours continuous transmission |
| **Registration** | National authority (MMSI linked) |

**Types:**
- **Category I**: Float-free, auto-activates when submerged 1-4m
- **Category II**: Manual activation only

**False Alert Rate:** ~98% of EPIRB activations are accidental (must be cancelled immediately)

### 3.3 DSC: Digital Selective Calling

**Function:** Digital distress alerting and general calling

**VHF DSC (Channel 70):**
- **Range**: Line-of-sight (20-30 nautical miles typical)
- **Functions**: Distress, urgency, safety, routine calls
- **Acknowledgment**: Distress relay acknowledged by coast station

**MF/HF DSC:**
- **MF (2187.5 kHz)**: Coastal waters (100-200 nm range)
- **HF (8414.5 kHz)**: Ocean regions (1,000+ nm range)

**DSC Distress Format:**
- Nature of distress (fire, flooding, collision, grounding, etc.)
- Position (lat/long)
- Time (UTC)
- Course and speed

### 3.4 Maritime Rescue Coordination Centers (MRCC)

**Global Network:**
- **Coverage**: Divided into Search and Rescue Regions (SRRs)
- **Coordination**: Assigns SAR assets (Coast Guard, helicopters, nearby vessels)
- **Communication**: SITREP updates, search pattern assignments

**SAR Stages:**
1. **Awareness**: Distress received, position confirmed
2. **Initial Action**: Determine search area (datum), assign SMC (SAR Mission Coordinator)
3. **Planning**: Calculate drift, select search pattern, dispatch units
4. **Operations**: Execute search, investigate contacts, rescue
5. **Conclusion**: Survivors recovered, vessels secured, case closed

---

## 4. PILOT OPERATIONS

### 4.1 The Maritime Pilot Role

**Function:** Local expert who boards vessels to navigate dangerous/confined waters

**Boarding Areas:**
- Typically 5-20 nautical miles offshore
- Marked by pilot stations or waypoints
- Weather-dependent (excessive sea state delays boarding)

### 4.2 Pilot Ladder Arrangements

**Combination Ladder (Ship with High Freeboard >9m):**
```
 Ship Side
 [Accommodation Ladder]
       \
        [Platform] ← Pilot steps from launch onto platform
            |
      [Pilot Ladder] ← Rope ladder with wooden steps
            |
         [Water] ← Pilot launch alongside
```

**Pilot Ladder Specifications:**
| Feature | Requirement |
|---------|-------------|
| **Step Width** | 480mm (19 inches) minimum |
| **Step Material** | Hardwood (ash, oak), non-slip grooved |
| **Side Ropes** | 20mm diameter manila rope |
| **Spacing** | 310-350mm between steps |
| **Length** | Extends from boarding point to waterline + 1.5m |
| **Manropes** | Two 28-32mm ropes alongside ladder |
| **Stanchions** | For ladder securing (bulwark openings) |

**Accommodation Ladder:**
- Used when freeboard >9m
- Angle: 45-55° to horizontal
- Lower platform 5-6m above water
- Handrails on both sides

### 4.3 Boarding Procedure

**Preparation:**
1. Ship rigged and ready
2. Pilot launch alongside windward side
3. Speed matched (6-8 knots typically)
4. Crew member stationed at ladder

**Boarding:**
1. Pilot steps from launch to platform (or ladder bottom)
2. Climbs ladder
3. Transfers to deck
4. Proceeds to bridge

**Risk Factors:**
- Heavy seas (can crush pilot between launch and ship)
- Ladder defects (broken steps, worn manropes)
- Communication failure
- Dark/night boarding

---

## 5. DYNAMIC POSITIONING (DP)

### 5.1 System Overview

**Function:** Computer-controlled station-keeping using thrusters/propellers

**Components:**
- **Position Reference Systems**: GPS, hydroacoustic, taut wire, laser
- **Sensors**: Wind, motion, heading, draft
- **Computer**: Calculates required thrust to maintain position
- **Thrusters**: Bow/stern/azimuth thrusters, main propellers

### 5.2 DP Classes

| Class | Redundancy | Failure Capability | Typical Use |
|-------|-----------|-------------------|-------------|
| **DP-1** | Single fault not considered | Loss of position upon failure | Work in benign conditions |
| **DP-2** | Single fault tolerant | Maintains position after any single failure | Most offshore operations |
| **DP-3** | Fire/water tight redundancy | Maintains position after fire/flood in any compartment | Harsh environment, critical ops |

### 5.3 DP Operations

**DP Modes:**
- **Auto Position**: Maintain fixed coordinates
- **Auto Head**: Maintain heading while position drifts
- **Auto Track**: Follow predefined path
- **Weathervane**: Align to weather to minimize loads
- **Follow Target**: Track moving reference (ROV, another vessel)

**Watch Circle:**
- Acceptable position deviation radius (typically 1-5m for drilling)
- Alarm triggers if vessel exceeds watch circle
- Thrusters compensate for wind/current/wave drift

### 5.4 DP Incidents

**Thunderstorm Effect:**
- Atmospheric electricity disrupts GPS/GNSS signals
- DP vessels may lose position reference
- Widespread false position jumps
- Requires manual monitoring, position verification

**Drive-Off vs. Drift-Off:**
- **Drive-Off**: Thrusters push vessel off position (computer/control error)
- **Drift-Off**: Thruster failure allows drift (mechanical/power loss)
- **Critical**: Drilling operations have disconnect procedures for emergency separation

---

## 6. FIREFIGHTING AT SEA

### 6.1 Fire Classes on Ships

| Class | Fuel | Example | Extinguishing Method |
|-------|------|---------|---------------------|
| **A** | Solid combustibles | Wood, paper, textiles | Water, foam |
| **B** | Flammable liquids | Oil, fuel, paint | Foam, CO2, dry chemical |
| **C** | Electrical | Wiring, panels | CO2, dry chemical (de-energize first) |
| **D** | Flammable metals | Magnesium, aluminum | Dry powder (specialized) |

### 6.2 Fixed Firefighting Systems

**CO2 Flooding (Engine Room, Cargo Holds):**
- **Quantity**: Sufficient for 40% volume (engine room) or 30% (cargo)
- **Activation**: Remote manual release (two separate actions required)
- **Warning**: Pre-discharge alarm (20-30 seconds delay)
- **Danger**: Personnel must evacuate (oxygen displacement)
- **No Re-entry**: Until ventilated and tested

**Water Mist Systems:**
- **Mechanism**: Fine water droplets (<100 microns) cool and displace oxygen
- **Advantages**: Minimal water damage, safe for electrical fires
- **Applications**: Accommodation, machinery spaces, control rooms

**High-Expansion Foam:**
- **Expansion Ratio**: 1:1000 (foam:air)
- **Fills Space**: Expands to fill entire compartment
- **Applications**: Cargo holds, vehicle decks, helicopter hangars

**Deluge Systems:**
- **Open nozzles** throughout protected area
- **Activation**: Heat detection or manual
- **Applications**: Vehicle decks, cargo holds, helidecks

### 6.3 Firefighting Tactics

**Boundary Cooling:**
- Spray water on bulkheads/decks adjacent to fire
- Prevents heat spread to uninvolved compartments
- Protects structural integrity

**Direct Attack:**
- Team enters compartment with hose
- Fog pattern for protection, straight stream for penetration
- "Two-in, two-out" rule (buddy system)

**Indirect Attack:**
- Seal compartment, flood with CO2/foam
- Wait for oxygen depletion/cooling
- Re-enter after atmosphere testing

**Fireboat Operations:**
- **Monitor Nozzles**: 5,000-10,000 GPM directional streams
- **Aerial Platforms**: Elevated water streams over ship
- **Foam Capability**: Protein or AFFF foam for fuel fires
- **Cooling**: Hull cooling to prevent structural collapse

---

## 7. SEARCH AND RESCUE PATTERNS

### 7.1 Search Pattern Types

**Expanding Square:**
```
    ┌──────┐
    │      │
    │  ┌───┘
    │  │
    └──┘
    Start
```
- **Use**: Single vessel, known position (datum)
- **Leg Length**: Increases by track spacing each leg
- **First Leg**: 1 track space, 2nd: 1 track space, 3rd: 2, 4th: 2, etc.

**Sector Search:**
```
       /\
      /  \
     /    \
    /______\
    \      /
     \    /
      \  /
       \/
```
- **Use**: Small search area, high probability
- **Pattern**: Triangular sectors from datum
- **Turns**: 120° turns at end of each leg

**Parallel Track:**
```
    →  →  →  →
    ←  ←  ←  ←
    →  →  →  →
    ←  ←  ←  ←
```
- **Use**: Multiple vessels/aircraft, large area
- **Spacing**: Equal track spacing between units
- **Coverage**: Systematic sweep of entire area

**Creeping Line:**
- Like parallel track but with single unit
- Used when search area is wider than long

### 7.2 Search Planning Factors

**Drift Calculations:**
- **Total Drift** = (Wind drift × exposure factor) + Current
- **Search Area**: Centered on drifted datum
- **Uncertainty**: Expands over time (leeway divergence)

**Search Altitude (Aircraft):**
- **Visual Search**: 300-1,000 feet
- **Height/Visibility Trade-off**: Higher = more coverage, lower = better detection

**Sweep Width:**
- Distance either side of track where target detection probability = 50%
- Depends on: Target size, visibility, observer capability
- Calculated using search and rescue tables

### 7.3 Rescue Techniques

**Man Overboard:**
1. **Immediate**: Throw life ring, shout "Man overboard!"
2. **Mark Position**: GPS waypoint, smoke marker
3. **Williamson Turn**: Standard recovery turn (returns to track)
4. **Recovery**: Bring alongside windward side, scramble net or rescue boat

**Helicopter Rescue:**
- **Hover**: 50 feet above vessel (rotor clearance)
- **Hi-Line**: Cable with rescue litter/basket
- **Winch Operator**: Controls cable from helicopter
- **Rescue Swimmer**: Deploys to assist survivor

**Lifeboat/Survival Craft:**
- **Capacity**: SOLAS requires 150% of crew capacity
- **Provisions**: 3 days food/water per person
- **Location**: Weather deck, both sides, 24-hour availability

---

## 8. FASCINATING DETAILS: Maritime Lore

### 8.1 The Five Most Surprising Facts

**1. EPIRB False Alert Rate**
- 98% of EPIRB activations are accidental
- Accidental causes: Rough handling, water ingress, battery corrosion
- Penalties for false alerts (in some jurisdictions)
- Must cancel immediately if activated in error

**2. Pilot Ladder Defects**
- Pilot ladders are the #1 cause of pilot deaths
- Common defects: Worn manropes, broken spreader steps, improper securing
- International maritime lawyers specialize in ladder accidents
- "The pilot takes all the risk, the ship takes all the profit"

**3. DP Thunderstorm Vulnerability**
- A thunderstorm can make a $500M drillship temporarily blind
- Atmospheric electricity scrambles GPS signals
- Multiple vessels have had near-misses during storms
- Some operators maintain manual watchstanders during storms

**4. CO2 Deaths in Engine Rooms**
- CO2 flooding has killed more crew than fires it extinguished
- Mistaken discharge with personnel present
- Panic, disorientation in oxygen-depleted atmosphere
- Ships now have strict pre-discharge alarm procedures

**5. AIS Spoofing**
- Criminals use fake AIS signals for smuggling
- "AIS dark" vessels turn off transponders to hide
- Iranian tankers spoof as other vessels to avoid sanctions
- Some fishing vessels spoof as cargo ships to avoid quotas

### 8.2 Additional Maritime Curiosities

- **VHF Channel 16**: The "party line" of the sea; monitored by all vessels
- **Mayday Origin**: From French "m'aidez" (help me); repeated 3 times
- **Pan Pan**: From French "panne" (breakdown); urgent but not life-threatening
- **SOS**: Not "Save Our Souls"; chosen for Morse code simplicity (· · · — — — · · ·)
- **Q-Signals**: Maritime shorthand (QRA = name of station, QTH = location)
- **Phonetic Alphabet**: Critical for clarity ("B" and "V" sound alike)
- **Bridge Watch**: 4-hour shifts; midnight-0400 is the "zombie watch"

---

## 9. SIMULATION APPLICATIONS: Gameplay Mechanics

### 9.1 COLREGs Compliance System

**Light Configuration Mini-Game:**
- Configure correct navigation lights for vessel status
- Penalties for incorrect configuration
- Visibility checks (range/arc verification)

**Priority Challenge:**
- Multiple vessels approaching; determine right-of-way
- Correct maneuver selection (starboard turn, slow, stop)
- Sound signal synchronization

**Fog Navigation:**
- Reduced visibility mode
- Sound signal timing (2-minute intervals)
- Radar/AIS reliance

### 9.2 Distress Response Gameplay

**EPIRB Alert Chain:**
1. Receive EPIRB activation (406 MHz satellite)
2. Plot position on chart
3. Dispatch nearest vessel or launch rescue boat
4. Navigate to datum, establish search pattern
5. Visual search (weather dependent)
6. Recovery operations

**Mayday Relay:**
- Receive distress call on VHF CH 16
- Record position, nature of distress
- Acknowledge to vessel in distress
- Relay to MRCC (Coast Guard)
- Render assistance if capable

### 9.3 Pilot Operations

**Ladder Inspection:**
- Pre-arrival checklist
- Identify defects (frayed manropes, broken steps)
- Correct rigging (angle, securing, lighting)
- Boarding timing (sea state, vessel speed)

**Harbor Navigation:**
- Follow pilot's course through restricted channel
- Manage speed (slow bell in confined waters)
- Bridge team communication
- Berthing maneuvers

### 9.4 Firefighting Simulation

**Fire Detection:**
- Smoke detector activation
- Visual flame detection
- Heat sensor alarms
- Location determination

**Response Selection:**
- Fire class identification
- Appropriate extinguishing method selection
- Boundary cooling deployment
- Fixed system activation (CO2, foam)

**Damage Control:**
- Compartment isolation (watertight doors)
- Structural integrity monitoring
- Fireboat coordination
- Casualty evacuation

### 9.5 Search and Rescue

**SAR Coordinator Mode:**
- Receive distress call
- Calculate search area (drift modeling)
- Assign assets (helicopters, surface vessels)
- Select search pattern
- Monitor progress, adjust as needed

**Search Execution:**
- Navigate assigned search leg
- Maintain precise track spacing
- Visual scanning (target detection probability)
- Contact investigation (debris vs. survivor)

---

## 10. SOURCE CITATIONS

### Regulatory Sources
- **IMO**: International Maritime Organization — SOLAS Convention
- **ITU**: International Telecommunication Union — Radio Regulations
- **IEC**: International Electrotechnical Commission — IEC 61924 (DP systems)
- **ISO**: International Organization for Standardization — ISO 799 (pilot ladders)

### Operational References
- **UK MCA**: Maritime and Coastguard Agency — SOLAS Training Manual
- **USCG**: United States Coast Guard — Navigation Rules (COMDTINST M16672.2D)
- **NI**: Nautical Institute — Bridge Team Management
- **OCIMF**: Oil Companies International Marine Forum — Mooring Guidelines

### Technical Standards
- **IEC 60945**: Maritime navigation and radio equipment
- **IEC 61162**: Digital interfaces (NMEA 0183/2000)
- **IMO MSC.1/Circ.1580**: Revised GMDSS Master Plan
- **ISO 8468**: Ship's bridge layout and equipment

### Historical Accidents
- **Piper Alpha** (1988): Platform fire, 167 deaths — changed offshore safety
- **Ocean Ranger** (1982): Drilling unit capsize — led to DP redundancy requirements
- **Alexander L. Kielland** (1980): Platform collapse — structural integrity lessons
- **Morro Castle** (1934): Passenger ship fire — modern fire safety regulations

---

*Document Version: 1.0*
*Research compiled for HarborGlow simulation authenticity*
