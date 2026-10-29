# Spec Delta

## Purpose
Manages the extended booking lifecycle from selecting a theater and showtime to picking the number of seats.

## ADDED Requirements

### Requirement: Theater and Showtime Selection
The system SHALL require users to select a specific theater and showtime for a movie before proceeding to seat selection.

#### Scenario: Selecting a showtime
- **WHEN** a user selects a showtime for a given theater and date
- **THEN** the system proceeds to the seat quantity selection step

### Requirement: Seat Quantity Selection
The system SHALL require the user to explicitly select the number of seats (1-10) before displaying the seat map.

#### Scenario: Selecting seat count
- **WHEN** the user selects "2" seats
- **THEN** the seat map UI enforces the selection of exactly 2 seats before allowing payment
