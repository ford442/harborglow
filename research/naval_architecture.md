# Naval Architecture & Ship Physics Research
## HarborGlow Game Reference Document

> **Research Focus**: Satisfying realism — physics should feel authentic even if simplified

---

## 1. REAL SHIP SPECIFICATIONS

### 1.1 Cruise Ships

**Icon of the Seas (Royal Caribbean) - World's Largest Cruise Ship**
| Specification | Value |
|--------------|-------|
| Gross Tonnage | 248,663 GT |
| Length | 364.75 m (1,197 ft) |
| Beam | 66 m (217 ft) |
| Passenger Capacity | 5,610 (double occupancy) / 7,600 max |
| Crew | ~2,350 |
| Decks | 20 |
| Speed | 22 knots |
| Construction Cost | ~$2 billion |

**Symphony of the Seas (Oasis Class)**
| Specification | Value |
|--------------|-------|
| Gross Tonnage | 228,081 GT |
| Length | 361.8 m (1,188 ft) |
| Beam | 66 m |
| Passenger Capacity | 5,518 / 6,680 max |
| Crew | 2,200 |
| Cabins | 2,759 |
| Restaurants | 22 |
| Pools | 4 |

**Key Insight**: Cruise ships are essentially floating cities. The Icon of the Seas has 8 different "neighborhoods" including a 16,000-gallon wave pool and a suspended infinity pool 150 feet above the ocean.

---

### 1.2 Container Vessels

**Ever Alot (Evergreen Marine) - World's Largest Container Ship**
| Specification | Value |
|--------------|-------|
| TEU Capacity | 24,004 (twenty-foot equivalent units) |
| Length | 400 m (1,312 ft) |
| Beam | 61.5 m (202 ft) |
| Draft | 17 m (55 ft) |
| Deadweight | 241,815 DWT |
| Main Engine | WinGD-11X92B, 58,600 kW |
| Speed | 22.5 knots |
| Deck Area | 24,000 m² |
| Builder | Hudong-Zhonghua Shipbuilding (China) |
| Cost | ~$145 million |

**Container Ship Size Classes**
| Class | TEU Range | Length | Typical Use |
|-------|-----------|--------|-------------|
| Feeders | <3,000 | 100-200m | Regional ports |
| Panamax | 3,000-5,000 | 294m max | Panama Canal |
| Post-Panamax | 5,000-10,000 | 300-350m | Major trade routes |
| New Panamax | 10,000-14,500 | 366m max | Expanded Panama Canal |
| Ultra Large (ULCV) | >14,500 | 400m+ | Asia-Europe routes |

**Holy Shit Fact**: If you stacked all containers from a single Ever Alot vertically, it would reach higher than the Empire State Building. The ship can carry the equivalent of 156 million iPhones.

---

### 1.3 Oil Tankers

**Very Large Crude Carrier (VLCC)**
| Specification | Value |
|--------------|-------|
| DWT Range | 200,000-320,000 tonnes |
| Length | 330-340 m |
| Beam | 60 m |
| Draft | 20-22 m |
| Cargo Capacity | ~2 million barrels of oil |
| Cargo Tanks | 15-17 tanks |
| Cargo Pumps | 3 × 5,000 m³/hr |
| Crew | ~20-25 |

**Ultra Large Crude Carrier (ULCC)**
| Specification | Value |
|--------------|-------|
| DWT Range | 320,000-550,000+ tonnes |
| Cargo Capacity | Up to 3 million barrels |
| Notable Example | Knock Nevis (ex-Seawise Giant) - 564,763 DWT, 458.45m length |

**TI Class Supertankers**
| Specification | Value |
|--------------|-------|
| DWT | 441,893 tonnes |
| Length | 380 m |
| Beam | 68 m |
| Draft | 24.5 m |

---

### 1.4 Fireboats

**Chicago Fireboat "Christopher Wheatley"**
| Specification | Value |
|--------------|-------|
| Length | 90 ft |
| Tonnage | 300 tons |
| Crew | 5 (normal) / 10 (firefighting) |
| Propulsion | Twin 1,600 hp Caterpillar diesels |
| Max Speed | 12 knots |
| Fire Pumps | Two 7,000 GPM pumps |
| Foam Capacity | Two 500-gallon tanks |
| Monitors | 4 (3 bow, 1 stern) |
| Special | Can break 12" of first-year ice at 3 knots |

**Los Angeles Fireboat 2**
| Specification | Value |
|--------------|-------|
| Length | 105 ft (largest in US) |
| Firefighting Capacity | 10,300 m³/hr (45,400 GPM) |
| Propulsion | Twin Voith cycloidal propellers |
| Engines | MTU/Detroit Diesel 12V4000, 1,800 bhp each |

**Port of Long Beach Fireboats**
| Specification | Value |
|--------------|-------|
| Propulsion | Voith Schneider Propellers VSP 26GII/165 |
| Fire Pump Capacity | 41,000 GPM total |
| Monitors | 10 (largest: 12,000 GPM at 600' range) |
| Foam Monitors | 2 × 6,000 GPM at 500' range |

**Holy Shit Fact**: Modern fireboats can pump enough water to fill an Olympic swimming pool in under 4 minutes. The FireStorm 70 can change direction within three boat lengths at 45 knots.

---

### 1.5 Icebreakers

**NS Arktika (Project 22220) - World's Largest Icebreaker**
| Specification | Value |
|--------------|-------|
| Length | 173.3 m |
| Beam | 34 m |
| Draft (min/max) | 8.65 m / 10.5 m |
| Displacement | 33,530 tonnes |
| Nuclear Reactors | 2 × RITM-200 (175 MW thermal each) |
| Propulsion Power | 60 MW (shaft power) / 110 MW total |
| Max Speed | 22 knots (open water) |
| Icebreaking Capacity | 2.8-3.0 m continuous |
| Crew | 53-75 |
| Service Life | 40 years |
| Cost | ~$720 million |

**50 Let Pobedy (Arktika Class)**
| Specification | Value |
|--------------|-------|
| Length | 159 m |
| Displacement | 25,840 tonnes |
| Max Speed | 21 knots |
| Icebreaking | 2.8 m thick ice |
| Special | Spoon-shaped bow for ice breaking |

**Icebreaker Physics**: Icebreakers work by riding up on ice and using the ship's weight to break it, not by ramming. The hull is designed with a special "ice belt" of reinforced steel at the waterline.

---

### 1.6 Tugboats

**Harbor Tugs**
| Specification | Value |
|--------------|-------|
| Length | 25-35 m |
| Beam | 9-12 m |
| Engine Power | 2,000-5,000 hp (1,500-3,700 kW) |
| Bollard Pull | 30-80 tonnes |

**Ocean-Going Tugs**
| Specification | Value |
|--------------|-------|
| Length | 35-45 m |
| Engine Power | 10,000-27,000 hp |
| Bollard Pull | 100-200+ tonnes |

**Bollard Pull Reference Chart**
| Tug Type | Bollard Pull | Use Case |
|----------|-------------|----------|
| Small Harbor | <20 tonnes | Marinas, small craft |
| Medium Harbor | 20-50 tonnes | Commercial vessels |
| Large Harbor | 50-80 tonnes | Container ships, tankers |
| Offshore | 80-130 tonnes | Oil rigs, platforms |
| Ocean-Going | 130-200+ tonnes | Emergency towing, salvage |

**Holy Shit Fact**: A modern azimuth tug with 80-tonne bollard pull can stop a 300,000-tonne loaded tanker from 6 knots in under 2 minutes. The thrust is equivalent to a Boeing 747 at full power.

---

## 2. STABILITY SCIENCE

### 2.1 Metacentric Height (GM)

**Fundamental Formula**
```
GM = KM - KG

Where:
- GM = Metacentric Height (measure of stability)
- KM = Distance from Keel to Metacenter
- KG = Distance from Keel to Center of Gravity
```

**Righting Arm (GZ)**
```
GZ = GM × sin(θ)  [for small angles < 10°]

Righting Moment = Displacement × GZ
```

**Metacentric Radius (BM)**
```
BM = I / V

Where:
- I = Second moment of area of waterplane (m⁴)
- V = Volume of displacement (m³)
```

### 2.2 Stability States

| Condition | GM Value | Behavior |
|-----------|----------|----------|
| Stable | GM > 0 | Ship returns to upright |
| Neutral | GM = 0 | Ship stays at any heel angle |
| Unstable | GM < 0 | Ship capsizes or finds angle of loll |

**Typical GM Values**
| Vessel Type | GM Range | Characteristics |
|-------------|----------|-----------------|
| Passenger Ships | 0.04-0.06 × Beam | Comfortable slow roll |
| Cargo Vessels | 0.05-0.08 × Beam | Moderate stability |
| Naval Vessels | Up to 0.10 × Beam | Stiff, quick roll |
| Tugs | Variable | Depends on operation |

### 2.3 Free Surface Effect (FSE)

**The Physics**
When liquid in a partially filled tank moves as the ship rolls, it creates a "virtual rise" of the center of gravity:

```
Free Surface Correction (FSC) = (i × di) / (V × do)

Virtual Loss of GM = FSC

Where:
- i = Moment of inertia of free surface
- di = Density of liquid
- V = Volume of displacement
- do = Density of water
```

**Critical Insights for Game Design:**
- Free surface effect depends on TANK WIDTH, not amount of liquid
- A nearly empty wide tank is as dangerous as a nearly full one
- Cross-connected port/starboard tanks can cause gradual capsizing
- Filled or empty tanks = zero free surface effect

**Countermeasures**
1. **Swash Bulkheads**: Reduce FSE to 1/(n+1)² where n = number of divisions
2. **Pocketing**: Allow liquid to touch tank boundaries
3. **Press Up**: Keep tanks either full or empty

### 2.4 Rolling Period

```
T = 2π√[(k² + a₄₄²) / (g × GM)]

Where:
- T = Rolling period (seconds)
- k = Radius of gyration
- a₄₄ = Added radius of gyration
- g = 9.81 m/s²
```

| Vessel Type | Typical Rolling Period |
|-------------|----------------------|
| Cruise Ships | 12+ seconds (comfort) |
| Cargo Ships | 6-8 seconds |
| Naval Ships | 4-6 seconds |

**Holy Shit Fact**: A ship with negative stability won't necessarily capsize immediately - it will find a stable position at an "angle of loll" (typically 5-15 degrees), giving the crew a false sense of security before a wave finishes the job.

---

## 3. PROPULSION SYSTEMS

### 3.1 Fixed Pitch Propeller (FPP)

**Characteristics**
- Fixed blade angle set at manufacture
- Optimized for one speed/RPM combination
- Requires reversing engine or gearbox for astern
- Simpler, lighter, more efficient at design point
- Lower maintenance

**Efficiency Curve**: Single peak at design RPM; efficiency drops off rapidly away from design point

### 3.2 Controllable Pitch Propeller (CPP)

**Characteristics**
- Blade angle adjustable via hydraulic hub mechanism
- Shaft rotates in one direction only
- Astern by reversing pitch, not shaft
- Can maintain constant RPM while varying thrust
- More complex, higher maintenance

**Key Performance**
- Pitch change from ahead to astern: 14-17 seconds
- Enables "crash stop" without engine reversal
- Allows fine speed control for maneuvering
- Can connect to shaft generators (PTO)

### 3.3 Kort Nozzle (Ducted Propeller)

**The Physics**
- Accelerating duct increases inflow velocity
- Reduces pressure on propeller blades
- Creates additional thrust from circulation forces
- Reduces tip vortex losses

**Best Applications**
- Tugs and harbor craft (high thrust at low speed)
- Heavily loaded propellers
- Limited diameter situations

**Efficiency Trade-off**
- Excellent below 15 knots
- Duct drag exceeds benefits above ~20 knots
- CPP in Kort nozzle has reduced astern thrust (~50% of ahead)

### 3.4 Azimuth Thrusters

**Types**
- **Z-Drive**: Engine above waterline, shaft goes down then horizontal
- **L-Drive**: Motor above, single right-angle gear
- **Diesel-Hydraulic**: Engine drives hydraulic pump, motor in pod

**Kawasaki Rexpeller Specifications**
| Parameter | Value |
|-----------|-------|
| Input Power | Up to 6,500 kW |
| Propeller Diameter | Up to 3.3 m |
| Rotation | 360° azimuth |
| Features | Crash astern, dynamic positioning |

**Advantages**
- Thrust in any direction
- No separate rudder needed
- Excellent maneuverability
- Can "walk" sideways

### 3.5 World's Largest Marine Engine

**Wärtsilä RT-flex96C (14-cylinder)**
| Specification | Value |
|--------------|-------|
| Power Output | 80,080 kW (107,390 hp) |
| Torque | 7,603,850 N·m @ 102 rpm |
| Cylinders | 14 |
| Bore | 960 mm |
| Stroke | 2,500 mm |
| Displacement per Cylinder | 1,828.7 liters |
| Total Displacement | 25,601 liters |
| Weight | 2,300 tonnes |
| Height | 13.5 m (44 ft) |
| Length | 27 m (88 ft) |
| Crankshaft Weight | 300 tonnes |
| Piston Weight | 5.5 tonnes each |
| Piston Height | 6 meters |
| Fuel Consumption | 250 tonnes/day at full power |
| Thermal Efficiency | 50% (vs 25-30% car engines) |

**Installed On**: MV Emma Maersk and other E-class container ships

**Holy Shit Fact**: At 102 RPM redline, this engine produces over 5 million lb-ft of torque - enough to tear a tank to shreds. The crankshaft alone weighs as much as a Boeing 747.

---

## 4. ANCHORING SYSTEMS

### 4.1 Anchor Types

**Stockless Anchor (Hall/Admiralty)**
- Standard for most commercial vessels
- Easy stowage in hawse pipe
- Holding power: 3-7× anchor weight (depends on bottom)
- Fluke angle: Fixed at ~45°

**Danforth (Lightweight)**
- High holding power-to-weight ratio
- Flukes pivot for setting
- Holding power: 9-20× anchor weight
- Best in sand/mud
- Popular for smaller vessels

**Bruce/Claw**
- Single piece construction
- Sets quickly in most bottoms
- Holding power: 15-30× anchor weight
- Popular for recreational boats

**Plow (CQR)**
- Pivots to align with pull
- Good in weeds/grass
- Holding power: 10-15× anchor weight

**Delta**
- Fixed plow design
- High holding power
- Popular for offshore moorings

### 4.2 Holding Power Calculations

```
Holding Power = W × R × f

Where:
- W = Anchor weight in air
- R = Holding power ratio (depends on type and bottom)
- f = Bottom coefficient (0.3-1.0)
```

**Holding Power Ratios by Bottom Type**
| Anchor Type | Sand | Mud | Rock |
|-------------|------|-----|------|
| Stockless | 7:1 | 3:1 | 1:1 |
| Danforth | 20:1 | 9:1 | Poor |
| Bruce | 25:1 | 15:1 | 5:1 |
| Delta | 20:1 | 10:1 | 3:1 |

### 4.3 Scope Ratio

**Definition**: Ratio of anchor rode length to water depth

```
Scope = (Length of Rode) / (Water Depth + Height of Bow)
```

**Recommended Scopes**
| Condition | Scope Ratio |
|-----------|-------------|
| Calm weather, temporary | 3:1 |
| Normal conditions | 5:1 |
| Heavy weather, overnight | 7:1 |
| Storm conditions | 10:1 |

**Scope Angle vs. Holding Power**
| Scope | Angle | Efficiency |
|-------|-------|------------|
| 3:1 | 19° | 50% |
| 5:1 | 11° | 70% |
| 7:1 | 8° | 85% |
| 10:1 | 6° | 95% |

**Holy Shit Fact**: Aircraft carriers use 30-ton anchors with 1,080 feet of chain (12 shots). Each chain link weighs 360 lbs. The anchor alone weighs more than 10 cars.

---

## 5. MOORING SYSTEMS

### 5.1 Mooring Line Types

**By Function**
| Line Type | Purpose | Angle to Pier |
|-----------|---------|---------------|
| Head Line | Prevents stern from moving outward | Forward |
| Stern Line | Prevents bow from moving outward | Aft |
| Breast Line | Prevents ship from moving away | 90° perpendicular |
| Forward Spring | Prevents ship from moving aft | Parallel to ship |
| Aft Spring | Prevents ship from moving forward | Parallel to ship |

**Standard Mooring Line Numbers**
```
#1 - Bow line
#2 - After bow spring
#3 - Forward bow spring  
#4 - Waist breast
#5 - After quarter spring
#6 - Forward quarter spring
#7 - Stern line
```

### 5.2 Mooring Line Materials

| Material | Elasticity | Strength | UV Resistance | Best Use |
|----------|-----------|----------|---------------|----------|
| Nylon | High (~25%) | Very High | Good | Shock absorption |
| Polyester | Low (~3%) | High | Excellent | Static loads |
| Polypropylene | Medium | Low | Poor | Temporary/light duty |
| HMPE (Dyneema) | Very Low (~3%) | Extreme | Good | High-performance |
| Wire Rope | Minimal | Very High | N/A (corrosion) | Heavy duty |
| Chain | None | Very High | N/A (rust) | Anchor rode |

**Dyneema (HMPE) Specifications**
- Strength: 7-10× steel wire of same weight
- Weight: 85% lighter than steel
- Floats on water (specific gravity 0.97)
- Elongation: Only 3-4%
- 15× stronger than steel by weight

**Safety Factor Standards**
- Working Load Limit (WLL) = Minimum Breaking Load (MBL) / Safety Factor
- Typical safety factor: 5:1 for mooring
- OCIMF MEG4 compliance required for large vessels

### 5.3 Bollard Arrangements

**Standard Principles**
1. Arrange symmetrically about ship's midship point
2. Breast lines perpendicular to ship's centerline
3. Spring lines parallel to ship's centerline
4. Keep vertical angles minimal
5. Use same material for lines in same service
6. Keep line lengths approximately equal

**Failure Hierarchy** (for safety)
1. Winch renders (slips) first
2. Mooring line breaks second
3. Bollard fails last

Therefore: SWL(bollard) > MBL(lines) > Winch capacity

### 5.4 Snap-Back Zones

**The Danger**
- Nylon line under tension stores elastic energy
- If line breaks, stored energy releases violently
- Nylon: snap-back zone ~20-25 ft
- Steel wire: unpredictable curling pattern
- Bystander fatalities are common

**Safety Markings**
- Bollards marked with yellow "snap-back zone" lines
- Personnel must stand outside these zones
- Never stand in a loop/bight of rope

---

## 6. CRANE MECHANICS

### 6.1 Container Spreader Types

**Fixed Spreader**
- Single container size (20', 40', or 45')
- Simple structure, lightweight
- Limited flexibility

**Telescopic Spreader**
- Hydraulic adjustment for multiple sizes
- Adjustment time: ~22 seconds (20' to 40')
- Most common in modern ports

**Master-Slave (Combined) Spreader**
- Two spreaders working together
- Can lift two 20' containers simultaneously
- Heavier but more versatile

### 6.2 Twistlock Mechanisms

**Function**: Lock spreader to container corners

**Operation**
1. Spreader lowers over container
2. Twistlock pins enter corner castings
3. Pins rotate 90° to lock
4. Locking time: <1 second
5. Visual indicators show lock status

**Safety Features**
- Double-position locking
- Automatic safety interlock
- Lock/unlock indicator panels
- Anti-drop design

### 6.3 Safe Working Load (SWL)

**Standard Spreader Capacities**
| Container | SWL | Spreader Weight |
|-----------|-----|-----------------|
| 20' | 20-35 tonnes | 2.5 tonnes |
| 40' | 32-45 tonnes | 7.5 tonnes |
| 45' | 40-50 tonnes | 8+ tonnes |

**Load Distribution**
- Four corner lifting points
- Each corner: 10.25 tonnes capacity
- Allowable eccentricity: 1.25m length, 0.26m width

### 6.4 Trolley Systems

**Ship-to-Shore (STS) Crane Trolley**
- Travel speed: 240+ m/min (loaded)
- Acceleration: controlled by VFD drives
- Anti-sway systems essential

**Gantry Crane Components**
1. **Hoisting Mechanism**: Wire rope drums, motors, gearboxes
2. **Trolley Mechanism**: Wheels, rails, drive system
3. **Gantry Travel**: End trucks, rail wheels
4. **Slewing**: Rotation mechanism (for some types)

**Anti-Sway Technology**
- Active: Sensors detect motion, adjust speeds
- Passive: Dampers, shock absorbers
- Spreader rotation lock prevents container swing

### 6.5 Spreader Bar Mechanics

**Purpose**: Distribute load across multiple points

**Types**
- Fixed length
- Adjustable (8-12 ft, 12-20 ft, etc.)
- Over-height frames for tall cargo

**Load Calculations**
```
Each Lifting Point Load = Total Weight / Number of Points

For 4-point lift:
Point Load = Total / 4
```

**Design Standards**
- ASME B30.20 (Below-the-Hook Lifting Devices)
- FEM design with stress analysis
- Hot-dip galvanized or marine-grade coating

---

## 7. GAMEPLAY TRANSLATION IDEAS

### 7.1 Ship Handling Mechanics

**Cruise Ship Gameplay**
- Manage passenger comfort vs. schedule
- Rolling period affects passenger satisfaction (longer = better)
- GM management through ballast/bunkering

**Container Ship Gameplay**
- Loading sequence affects stability
- Heavy containers low, light containers high
- Free surface effect from fuel/water tanks

**Tanker Gameplay**
- Multiple cargo grades can't mix
- Tank cleaning between grades
- Stability changes as cargo is discharged

### 7.2 Tug Operations

**Physics to Model**
- Bollard pull vs. engine RPM curve
- Propeller wash effects on other vessels
- Towline catenary and snap dangers
- Azimuth thruster directional control

**Mission Types**
- Harbor assist (docking/undocking)
- Ship escort through narrow channels
- Emergency towing of disabled vessels
- Oil rig positioning

### 7.3 Fireboat Mechanics

**Water Cannon Physics**
- Jet range proportional to pump pressure
- Monitor elevation/depression angles
- Foam proportioning system
- Water source: onboard tanks vs. pumping from sea

### 7.4 Icebreaker Gameplay

**Ice Breaking Physics**
- Continuous breaking vs. ramming
- Ice thickness detection
- Backing and ramming for thick ice
- Convoy escort management

### 7.5 Mooring Mini-Game

**Elements to Include**
- Line type selection (nylon vs. wire vs. Dyneema)
- Proper line placement (breast vs. spring)
- Tension management (winch operation)
- Snap-back zone awareness
- Tide/current compensation

### 7.6 Crane Operations

**Physics Challenges**
- Spreader-container alignment
- Anti-sway timing
- Load swing during trolley travel
- Multiple container lifts
- Emergency stop procedures

---

## 8. "HOLY SHIT" FACTS FOR FLAVOR

1. **The RT-flex96C engine produces enough torque to tear a tank to shreds** - 7.6 million N·m at just 102 RPM.

2. **Aircraft carrier anchors weigh 30 tons EACH** - That's 60,000 lbs per anchor, with chain links weighing 360 lbs each.

3. **Ever Alot can carry 24,004 containers** - Stacked vertically, they'd reach higher than the Empire State Building.

4. **Nuclear icebreakers can operate for 7 years without refueling** - The RITM-200 reactors run on 20% enriched uranium.

5. **Free surface effect depends on tank width, not liquid amount** - A nearly empty wide tank is as dangerous as a full one.

6. **Tugboats can stop 300,000-tonne tankers** - An 80-tonne bollard pull tug can stop a loaded VLCC in under 2 minutes.

7. **The Wärtsilä RT-flex96C crankshaft weighs 300 tonnes** - That's a single component heavier than most ships.

8. **Modern fireboats pump 45,000+ GPM** - That's enough to fill an Olympic pool in 4 minutes.

9. **Ships with negative stability don't immediately capsize** - They find a "stable" angle of loll, giving false security before disaster.

10. **Dyneema rope is 15× stronger than steel by weight** - Yet it floats and is 85% lighter.

11. **Cruise ships have 2-3 times more crew than an oil tanker** - Despite carrying no cargo, they need 2,000+ staff for passenger services.

12. **Container spreaders lock in under 1 second** - Four twistlocks engage simultaneously with automatic safety verification.

13. **A single ship chain link weighs 360 lbs** - Yet they're manufactured to precision tolerances for smooth stowage.

14. **Icebreakers don't ram ice** - They ride up on it and break it with their weight.

15. **Nylon mooring lines can snap back 20-25 feet** - With enough force to sever limbs.

---

## 9. SOURCE CITATIONS

### Ship Specifications
- Royal Caribbean Blog: https://www.royalcaribbeanblog.com/royal-caribbean-ships-by-size
- Cruise Critic: https://www.cruisecritic.com/articles/what-is-the-biggest-royal-caribbean-ship
- gCaptain (Ever Alot): https://gcaptain.com/china-delivers-first-24000-teu-containership-ever-alot/
- Maritime Page (Evergreen): https://maritimepage.com/evergreen-ship-weight/
- Marine Insight (VLCC): https://www.marineinsight.com/types-of-ships/what-are-very-large-crude-carrier-vlcc-and-ultra-large-crude-carrier-ulcc/
- NYK Line (VLCC operations): https://www.nyk.com/english/stories/01/04/20250718.html

### Fireboats
- Hike Metal (Chicago): https://hikemetal.com/h178-christopher-wheatley-chicago-fire/
- Britannica: https://www.britannica.com/technology/fireboat
- MarineLink (LA Fireboat 2): https://www.marinelink.com/news/fireboat-big-one301087
- MetalCraft Marine (FireStorm): https://metalcraftmarine.com/html/firestorm_69.html

### Icebreakers
- CruiseMapper (NS Arktika): https://www.cruisemapper.com/ships/NS-Arktika-icebreaker-1774
- Baird Maritime: https://www.bairdmaritime.com/work-boat-world/icebreaking/vessel-review-arktika-nuclear-powered-33000-tonne-behemoth-is-largest-icebreaker-yet-built/
- TASS: https://tass.com/russia/1208271
- Rosatom: https://rosatom-energy.ru/en/media/rosatom-news/nuclear-icebreaker-arktika-is-heading-to-murmansk/

### Tugboats
- Alibaba Product Guides: Various tugboat specification sheets
- Harbor Models: Bollard pull and horsepower specifications

### Stability
- Oboe (Metacentric Height): https://oboe.com/learn/mechanics-of-buoyancy-and-archimedes-principle-hyljs9/stability-and-metacentric-height-phw1d8
- Marine Public (GM Fundamentals): https://www.marinepublic.com/blogs/training/203248-vessel-metacentric-height-and-ship-stability-fundamentals
- Merchant Navy Decoded (Free Surface): https://www.merchantnavydecoded.com/free-surface-effect-in-ship/
- Naval War College (Handbook of Damage Control): https://maritime.org/doc/dc/part2.php

### Propulsion
- Marine Insight (CPP vs FPP): https://www.marineinsight.com/naval-architecture/controllable-pitch-propeller-cpp-vs-fixed-pitch-propeller-fpp/
- Seaways Consultants (CPP in Kort Nozzles): http://seaways.net.au/wp-content/uploads/2018/04/Operating-CPP-in-Kort-Nozzles-Article-24-3-18.pdf
- Kawasaki (Azimuth Thruster): https://global.kawasaki.com/en/mobility/marine/machinery/azimuth_thruster/index.html
- Decom Tools (Vessel Design): https://northsearegion.eu/media/18659/decomtools-vessel-design.pdf

### Marine Engines
- Wärtsilä (RT-flex96C): https://www.wartsila.com/media/news/12-09-2006-the-world's-most-powerful-engine-enters-service
- Guinness World Records: https://www.guinnessworldrecords.com/world-records/largest-marine-engine
- SlashGear: https://www.slashgear.com/2034601/of-the-most-powerful-diesel-engines-ships-use/
- The Maritime Post: https://themaritimepost.com/2023/09/the-largest-ship-engine-in-the-world/

### Anchoring
- Anchor Marine Houston: https://anchormarinehouston.com/wp-content/uploads/2019/03/Section_1_Anchors.pdf
- PNNL (Advanced Anchor Study): https://tethys.pnnl.gov/sites/default/files/publications/Advanced-Anchor-and-Mooring-Study.pdf
- NAVFAC (DM-26): https://www.maritime.org/doc/pdf/dm26_6.pdf

### Mooring
- Connect KNKT (Mooring Ropes): https://www.connect-knkt.com/how-to-select-mooring-ropes-for-ships-and-docks/
- Duracordix (Line Types): https://duracordix.com/types-of-mooring-lines-for-ships-you-should-know/
- NSW Government (Mooring Safety): https://www.nsw.gov.au/employment/dogging-and-rigging/guide/part-2-dogging-and-rigging-activities/cranes-barges/operations-vessel
- Marine Public (Mooring Equipment): https://www.marinepublic.com/blogs/training/251301-ship-mooring-equipment-mbl-sdmbl-ldbf-explained
- Port of Bremerhaven (Mooring Guidelines): https://www.readkong.com/page/port-information-guide-5953835

### Crane Mechanics
- AICranes (Gantry Mechanisms): https://aicranes.jimdofree.com/2026/01/19/mechanical-mechanism-design-of-gantry-cranes-for-port-and-container-handling/
- HNHL Crane (Container Spreaders): https://www.hnhlcrane.com/product/container-spreader/
- Airpes (Hydraulic Spreader Beams): https://www.airpes.com/container-handling-hydraulic-lifting-spreader-beams/
- Crosby Airpes (Spreader Design): https://www.airpes.com/container-handling-hydraulic-lifting-spreader-beams/

---

## 10. QUICK REFERENCE TABLES

### Ship Size Comparison
| Vessel Type | Length | Displacement | Crew |
|-------------|--------|--------------|------|
| Icon of Seas | 365m | 130,000t | 2,350 |
| Ever Alot | 400m | 241,000t | ~30 |
| VLCC Tanker | 330m | 300,000t | ~25 |
| Arktika Icebreaker | 173m | 33,500t | 75 |
| Harbor Tug | 30m | 500t | 6-8 |
| Fireboat | 30-100m | 100-500t | 5-12 |

### Power Comparison
| Engine/Vessel | Power Output | Application |
|---------------|--------------|-------------|
| Wärtsilä RT-flex96C | 107,390 hp | Container ships |
| Tug (harbor) | 2,000-5,000 hp | Harbor assist |
| Tug (ocean) | 10,000-27,000 hp | Offshore towing |
| Fireboat pumps | 20,000+ hp equivalent | Firefighting |
| Nuclear Icebreaker | 80,000 hp | Ice breaking |

### Holding Power Ratios
| Anchor Type | Sand | Mud | Rock |
|-------------|------|-----|------|
| Stockless | 7× | 3× | 1× |
| Danforth | 20× | 9× | Poor |
| Bruce | 25× | 15× | 5× |

### Material Properties
| Material | Elongation | Strength/Weight | Floats? |
|----------|-----------|-----------------|---------|
| Nylon | 25% | High | No |
| Polyester | 3% | High | No |
| Dyneema | 3% | 15× Steel | Yes |
| Steel Wire | <1% | Very High | No |
| Chain | 0% | Extreme | No |

---

*Document compiled for HarborGlow game development. Focus on satisfying realism - physics should feel authentic even if simplified for gameplay.*

**Research Date**: March 2025  
**Version**: 1.0
