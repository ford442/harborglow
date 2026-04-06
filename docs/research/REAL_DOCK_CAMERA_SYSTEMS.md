# Real Dock Camera Systems Research - HarborGlow
## Based on 2025-2026 Port Operations from Konecranes, Liebherr, ABB, and California Ports

---

## Executive Summary

Modern container terminals rely on **multi-point camera systems** for safety, efficiency, and emergency response. Real quay crane operations use 6-12 cameras per crane feeding centralized control rooms with video walls. This research grounds HarborGlow's scouting systems in authentic port operations.

---

## 1. Why Multiple Camera POVs Are Essential

### 1.1 Everyday Business & Precision Needs

| Challenge | Camera Solution | Real-World Implementation |
|-----------|-----------------|---------------------------|
| **Blind spots below spreader** | Hook-mounted camera (LoadView) | Stoneridge Orlaco systems - camera looks down at container corners |
| **Twistlock alignment** | Spreader underside camera | 1080p camera with LED lighting for night operations |
| **Rigger signal visibility** | Cab-facing camera | Captures ground crew hand signals |
| **Ship cell guide alignment** | Trolley-mounted forward camera | Aids container placement in vessel holds |
| **Apron traffic** | Gantry-level wide camera | Monitors truck/AGV positioning |
| **Yard handoff** | Rear-facing camera | Ensures safe transfer to straddle carriers/RMGs |

**Real Equipment:**
- **LoadView** (Stoneridge/Orlaco): Hook-mounted AF-zoom camera with dedicated monitor
- **WinchView**: Monitors cable spooling on drum winches
- **LiXplore CMS** (Liebherr): Up to 6 camera inputs, digital switching

### 1.2 Emergency & Safety Conditions

| Hazard | Camera Response | System |
|--------|-----------------|--------|
| **Two-block condition** | Hook proximity camera + limit switch | Anti-two-block (ATB) cameras detect hook near boom tip |
| **Load sway in wind** | Multi-angle sway monitoring | Camera-LiDAR fusion tracks rope inclination (YOLOv9-based, 2026) |
| **Collision risk** | 360° surround view | LiXplore Bird's Eye - 4-camera stitched view |
| **Personnel in danger zone** | AI-powered detection | Thermal + visible camera fusion (Hanwha Vision) |
| **High wind operations** | Anemometer-integrated camera disable | Automatic suspension >20mph (mobile) / >28mph (tower) |

**Research Finding:** Modern cranes use **camera-LiDAR fusion** for real-time wire rope inclination detection. YOLOv9-based systems achieve ~1° accuracy for sway monitoring.

### 1.3 Storm & Weather Operations

California ports (Oakland, LA/Long Beach) face specific challenges:

| Condition | Impact on Cameras | Mitigation |
|-----------|-------------------|------------|
| **Atmospheric rivers** | Heavy rain reduces visibility | Heated lens housings, hydrophobic coatings |
| **Marine layer/fog** | Visibility <100m | Thermal/IR cameras ( penetrate fog) |
| **Lightning** | Electrical surge risk | Fiber optic transmission, surge protectors |
| **High winds** | Camera shake, structural sway | Image stabilization, gyroscopic mounts |
| **Salt corrosion** | Lens degradation | IP69K rated housings, regular washing systems |

**Port of Oakland 2025 Data:** The Outer Harbor Wharf Modernization Project notes that "floodlighting on high mast structures and cranes is present in the Port area for nighttime operations and security."

### 1.4 Broader Port Operations

| Use Case | Camera Type | Coverage |
|----------|-------------|----------|
| **Perimeter security** | Thermal PTZ cameras | 360° coverage, automated patrol patterns |
| **Fire response** | Thermal radiometric cameras | -40°F to 1022°F detection (Hanwha Vision) |
| **Train/truck coordination** | License plate recognition (LPR) | Integration with Terminal Operating System (TOS) |
| **Navy vessel visits** | Elevated long-range PTZ | Berth approach monitoring |
| **Suspicious vessel detection** | Drone-mounted cameras | Tethered drones for persistent surveillance (Elistair/SMAUG project) |
| **Hull inspection** | Underwater ROV cameras | Hull scanner integration |

**EU SMAUG Project (2025-2026):** Combines hydrophones, sonar, underwater drones, hull scanners, and tethered drones for comprehensive port protection.

---

## 2. Real Equipment Specifications

### 2.1 Crane-Mounted Camera Systems

**Konecranes (Port of Houston 2025 Contract)**
- Auto-steering and anti-collision camera systems on RTG cranes
- Integration with container yard management
- $1.6M contract for operational features on 8 cranes

**Liebherr LiXplore CMS**
- Up to 6 camera inputs
- 7" or 12" RLED monitors in cab
- IP69K rating (high-pressure washdown)
- Digital switching between views

**Stoneridge Orlaco LoadView**
- AF-Zoom camera (auto-focus zoom)
- Hook-mounted or spreader-mounted
- Dedicated monitor with single-button view switching

### 2.2 Control Room Video Walls

**Port of Houston 2025:** $440,000 purchase for "additional Operations and Security cameras" with expanded storage infrastructure.

**Typical Configuration:**
- 4×4 or 6×4 monitor arrays
- Mix of fixed cameras and controllable PTZ
- Redundant recording systems
- Integration with:
  - Terminal Operating System (TOS)
  - Vessel Traffic Service (VTS)
  - Coast Guard communication systems

### 2.3 Thermal/IR Systems

**Hanwha Vision AI Radiometric Thermal Cameras (2025)**
- Temperature range: -40°F to 1022°F (-40°C to 550°C)
- Equipment overheating detection
- Fire prevention in container stacks

**Applications:**
- Equipment predictive maintenance
- Fire detection (lithium battery containers)
- Night operations without floodlights
- Fog penetration capability

### 2.4 Drone & Aerial Surveillance

**Elistair Tethered Drone System (EU SMAUG Project)**
- Continuous power via cable
- Hours of persistent flight time
- Live encrypted video feed
- Mobile platform on USV (uncrewed surface vessel)

**Flytbase Port Security Drones**
- AIS integration for vessel identification
- One-click dispatch to suspicious vessels
- "Dark fleet" detection (false transponders)
- Automated perimeter patrol

---

## 3. California Port-Specific Context

### 3.1 Port of Oakland

**2025 Outer Harbor Wharf Modernization Project:**
- Berths 22-38 modernization
- Ship-to-shore crane capabilities for future fleet
- Intermodal rail facilities: 200 acres (Union Pacific + BNSF)
- Visual character: "flat expansive asphalt-paved areas notable for moored vessels, working cranes, stacked shipping containers, trucks, and nearby railroad tracks"

**Key Infrastructure:**
- Four active maritime terminals
- Pier 27/35 cruise ship terminals
- On-dock rail at all container terminals
- 24/7 floodlighting for operations and security

### 3.2 Los Angeles / Long Beach

- **Vessel Traffic Service (VTS)** coordination
- Automated Terminal Operating Systems
- Extensive camera networks for customs/border protection
- Coordination with US Coast Guard

---

## 4. Research Insights for HarborGlow

### Authentic Camera Types to Model

1. **Hook Camera**: Looking down at container corners - essential for twistlock alignment
2. **Trolley Camera**: Forward view for ship cell guide alignment
3. **Gantry Camera**: Wide view of apron traffic and yard operations
4. **Cab Camera**: Operator view with HUD overlays
5. **Underwater Camera**: Hull inspection, marine life, bioluminescence
6. **Thermal/IR Camera**: Fog penetration, equipment monitoring, fire detection
7. **Drone Camera**: Overview, security patrol, emergency response
8. **Rail-Mounted Camera**: Train loading operations monitoring

### Realistic Activation Triggers

| Event | Camera Response |
|-------|-----------------|
| High winds (>20mph) | Switch to sway-monitoring view, increase sampling rate |
| Container fire | Thermal camera auto-focus, fireboat cameras activate |
| Whale migration | Underwater cameras activate, drone dispatched |
| Suspicious vessel | Drone deploys, PTZ cameras track |
| Atmospheric river | IR cameras switch on, visibility overlay |
| Two-block warning | Hook camera zooms out, alarm sounds |

### Performance Targets from Real Systems

- **Latency**: <100ms for operator displays
- **Resolution**: 1080p minimum, 4K for detail work
- **Frame Rate**: 30fps standard, 60fps for precision operations
- **Uptime**: 99.6% availability (Liebherr standard)
- **Response**: AI detection <2 seconds

---

## 5. Sources

1. **Port of Oakland** - Outer Harbor Wharf Modernization Project IS/MND (March 2025)
2. **Port of Houston Authority** - Commission Meeting Documents (March 2025)
3. **Liebherr** - LiXplore Camera Systems Technical Documentation (2024-2025)
4. **Stoneridge Orlaco** - LoadView & WinchView Product Specifications (2024)
5. **Hanwha Vision** - AI Radiometric Thermal Camera Release (January 2025)
6. **Elistair** - SMAUG Project Press Release (June 2025)
7. **MDPI** - "Real-Time Wire Rope Inclination Detection Using YOLOv9-Based Camera–LiDAR Fusion" (February 2026)
8. **Konecranes** - Port of Houston RTG Crane Contract Awards (2025)

---

*Research compiled for HarborGlow realistic camera/scouting system implementation.*
