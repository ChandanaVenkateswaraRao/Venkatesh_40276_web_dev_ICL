# Spec Delta

## Purpose
Provides global search and catalog filtering capabilities for users to discover movies.

## ADDED Requirements

### Requirement: Global Movie Search
The system SHALL provide a search bar that returns movies matching the input text against movie titles.

#### Scenario: Searching for a movie
- **WHEN** the user types "Spider" into the global search bar
- **THEN** a dropdown displays movies containing "Spider" in the title

### Requirement: Catalog Filters
The system SHALL allow filtering the movie catalog by Genre (e.g., Action, Comedy) and Format (e.g., 2D, 3D, IMAX).

#### Scenario: Filtering by format
- **WHEN** the user selects "IMAX" from the format filters
- **THEN** only movies available in IMAX are displayed in the catalog
