# Spec Delta: Real-Time Booking Engine

## Purpose
Provides end-to-end customer booking flow with curved screen seating tiers, atomic real-time seat locks, live viewer count, and verifiable digital pass delivery.

## ADDED Requirements

### Requirement: Curved Screen Auditorium and Tiered Seating
The system SHALL present an authentic cinema hall layout with a visual curved neon screen and differentiated seating categories (Recliner Lounge, Prime, Classic) with individual pricing.

#### Scenario: Customer views tiered auditorium
- **WHEN** user selects a movie showtime
- **THEN** system renders a curved projector screen representation with Recliner rows at the top, followed by Prime and Classic sections with their respective pricing tags

### Requirement: Atomic Real-Time Seat Locking
The system SHALL establish an atomic lock via WebSockets whenever a user clicks an available seat, broadcasting the held state immediately to all connected clients viewing that showtime.

#### Scenario: Seat lock broadcast
- **WHEN** User A selects seat B4
- **THEN** system acquires an exclusive temporary lock with an 8-minute TTL, and broadcasts an amber held indicator to all other users viewing the same showtime

#### Scenario: Lock collision resolution
- **WHEN** User A and User B select the exact same seat within the same millisecond
- **THEN** system awards the lock to the first received socket packet and returns an instant warning message to the second user

### Requirement: Expiration and Disconnect Auto-Release
The system SHALL automatically release held seats when the 8-minute timer reaches zero or when the locking client disconnects without confirming payment.

#### Scenario: User tab closure
- **WHEN** a user holding 2 seats closes their browser tab
- **THEN** system immediately prunes the temporary locks and broadcasts the freed seats to all active viewers

### Requirement: Verifiable Ticket Pass Delivery
The system SHALL generate an authentic digital pass containing a scannable QR code and downloadable calendar invite upon successful payment.

#### Scenario: Payment verification and ticket generation
- **WHEN** payment is completed successfully
- **THEN** system marks seats permanently booked, renders a printable E-Ticket pass with QR code, and allows downloading a `.ics` calendar reminder
