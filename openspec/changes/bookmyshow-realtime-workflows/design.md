# Design: BookMyShow Enterprise Real-Time Architecture

## Context
See `proposal.md` for problem motivation and scope. The application uses Node.js/Express, Socket.IO, MongoDB, and React with Tailwind CSS. This design specifies the end-to-end multi-persona workflows and real-time state synchronization across Customer, Theater Partner, and Admin roles.

## Goals / Non-Goals

**Goals:**
- Provide authentic BookMyShow visual experience with curved screen auditorium seating, distinct seat tiers (Recliner Lounge, Prime, Classic), and live occupancy tracking.
- Provide theater partners with multi-auditorium (Audi 1, Audi 2, IMAX) scheduling and a real-time visual box office floor map.
- Equip platform administrators with streaming event telemetry and a 1-click live rush simulator to showcase concurrency effortlessly during company presentations.
- Guarantee race-condition prevention with atomic in-memory mutex evaluation.

**Non-Goals:**
- Real production banking API credentials (mock gateway with authentic UI is used for zero-failure presentations).
- Distributed multi-instance Redis cluster setup (in-memory Node.js state manager is optimal for local/demo reliability).

## Architecture & Data Flow

```
+---------------------------------------------------------------------------------+
|                       REAL-TIME WORKFLOW ARCHITECTURE                           |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  [ Customer Web App ]            [ Theater Partner App ]    [ Admin Telemetry ] |
|  - Curved screen UI              - Multi-screen scheduling  - Central audit log |
|  - Recliner/Prime/Classic        - Live floor map monitor   - 1-Click Simulator |
|  - 8-min countdown               - Real-time price updates  - Theater register  |
|          |                                 |                         |          |
|          +-------------\                   |                   /-----+          |
|                         v                  v                  v                 |
|                   +-----------------------------------------------+             |
|                   |           SOCKET.IO REAL-TIME HUB             |             |
|                   |  - Showtime Rooms ('showtime_<id>')           |             |
|                   |  - Partner Feeds  ('theater_<id>')            |             |
|                   |  - Admin Audit    ('admin_telemetry')         |             |
|                   +-----------------------------------------------+             |
|                                            |                                    |
|                      +---------------------+---------------------+              |
|                      v                                           v              |
|             [ In-Memory Lock Manager ]                 [ Express REST API ]     |
|             - Atomic Mutex Check                       - Movies, Theaters       |
|             - 8-Minute Auto TTL                        - Showtimes, Bookings    |
|             - Disconnect Auto-Prune                                             |
|                                            |                                    |
|                                            v                                    |
|                                   [ MongoDB Database ]                          |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

## Decisions

### 1. Seating Tiers & Curved Screen UI
- **Decision:** Model seating into 3 distinct visual sections:
  1. **Royal Recliner Lounge (Rows A-B)**: Spaced double-armchair styling with premium pricing.
  2. **Prime Section (Rows C-F)**: Center cinema rows with standard pricing.
  3. **Classic Section (Rows G-H)**: Front rows with budget pricing.
- **Visuals:** Top curved neon arc with soft ambient backlight and a center "SCREEN THIS WAY" indicator matching BookMyShow standard.
- **Alternative Considered:** Flat single-tier grid. Rejected because company presentations require visible premium and standard tier differentiation.

### 2. Multi-Screen Auditorium Support
- **Decision:** Extend the `Showtime` schema and partner scheduling workflow to support screen names (`Audi 1`, `Audi 2`, `Audi 3 (IMAX Laser)`).
- **Rationale:** Enables partners to manage multiple simultaneous screenings across their property.

### 3. Live Box Office Visual Floor Map for Partners
- **Decision:** Add an interactive auditorium floor map directly into the Partner Dashboard.
- **Rationale:** Rather than only viewing tabular numbers, the cinema manager sees the exact seating chart update in real-time as users lock or purchase tickets.

### 4. Admin Live Event Stream (Audit Log)
- **Decision:** Maintain a dedicated broadcast event `admin_audit_event` on the Socket server that transmits every lock, release, payment, and connection event to the Admin Telemetry console.
- **Rationale:** Provides visible telemetry during technical presentations to prove the reactive event-driven architecture.

### 5. 1-Click "Live Rush" Presentation Simulator
- **Decision:** Build an administrative endpoint and dashboard control that triggers automated virtual concurrent seat reservations on an active showtime over 15 seconds.
- **Rationale:** Eliminates the stress of having to manually juggle multiple browser windows during a live demo.

## Risks / Trade-offs

- **[Risk] Web Audio Autoplay Policy:** Browsers may block audio notifications until the user clicks somewhere on the page.  
  → *Mitigation:* Audio context is initialized lazily upon first user interaction; failures are caught silently with zero UI disruption.
- **[Risk] Multiple Rapid Clicks (Race Condition):** Two users clicking the same seat simultaneously.  
  → *Mitigation:* Server mutex verifies whether `seatLocks.has(key)` before assignment. The loser gets an immediate reject event with an amber lock visual.
