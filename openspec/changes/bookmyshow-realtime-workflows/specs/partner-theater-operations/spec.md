# Spec Delta: Partner Theater Operations

## Purpose
Enables theater owners and cinema partners to manage multi-auditorium showtimes, dynamically update seat prices, and monitor box office occupancy live on an interactive floor map.

## ADDED Requirements

### Requirement: Multi-Auditorium Screen Scheduling
The system SHALL allow theater partners to schedule showtimes across distinct screens (e.g. Audi 1, Audi 2, IMAX Laser) with format tags and custom tier pricing.

#### Scenario: Partner schedules a new screen showtime
- **WHEN** partner selects a movie, date, screen (Audi 1), audio/visual format, and tier prices
- **THEN** system validates and schedules the showtime, immediately listing it under the partner's showtimes catalog

### Requirement: Real-Time Box Office Visual Occupancy Map
The system SHALL provide a live visual floor map of the theater's auditoriums showing real-time seat status (Available, Temporarily Held, Sold Out) without requiring page reloads.

#### Scenario: Live occupancy tracking
- **WHEN** customers book or hold seats for a showtime belonging to this theater
- **THEN** partner's visual floor map updates instantly with color-coded seat states, recalculating occupancy percentage and live box office revenue

### Requirement: Live Dynamic Price Adjustment
The system SHALL allow partners to update ticket prices for Premium and Executive tiers with instant broadcast to active user sessions.

#### Scenario: Dynamic price change
- **WHEN** partner updates the ticket price for an upcoming showtime
- **THEN** system saves the new pricing and updates the customer showtime listing immediately
