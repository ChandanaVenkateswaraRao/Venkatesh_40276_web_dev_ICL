# Spec Delta

## Purpose
Manages the user's geographic location context to filter cinemas and movies relevant to their city.

## ADDED Requirements

### Requirement: City Selection
The system SHALL present a city selection modal on first visit or when the location button is clicked, overriding global movie catalog results based on the chosen city.

#### Scenario: Selecting a new city
- **WHEN** the user changes their location from "Mumbai" to "Delhi"
- **THEN** the application updates the catalog to only show movies playing in Delhi theaters
