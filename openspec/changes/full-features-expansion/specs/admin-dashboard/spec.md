# Spec Delta

## Purpose
Provides administrators with operational analytics and ticket validation tools to manage the platform.

## ADDED Requirements

### Requirement: Analytical Charts
The system SHALL display revenue and booking volume trends over time using interactive charts.

#### Scenario: Viewing revenue trends
- **WHEN** an admin visits the dashboard
- **THEN** a chart displaying the last 7 days of revenue is rendered

### Requirement: Ticket QR Scanner
The system SHALL provide a dedicated view for admins to input or scan a QR code payload to validate a ticket.

#### Scenario: Validating a ticket
- **WHEN** an admin submits a valid Ticket ID payload
- **THEN** the system marks the booking as "Used" and returns a success status
