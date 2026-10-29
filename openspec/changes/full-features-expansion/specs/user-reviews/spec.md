# Spec Delta

## Purpose
Enables users to rate and review movies, aggregating community feedback on the movie details page.

## ADDED Requirements

### Requirement: Verified Reviews
The system SHALL allow users to submit a 1-10 star rating and text review for a movie, but only if they have a completed booking for that movie.

#### Scenario: Submitting a review
- **WHEN** a verified user submits an 8/10 rating for a movie
- **THEN** the review is saved and the movie's aggregate rating is updated

### Requirement: Display Reviews
The system SHALL display aggregate ratings and a paginated list of user reviews on the movie details page.

#### Scenario: Viewing a movie
- **WHEN** any user visits the movie details page
- **THEN** the aggregate rating and top written reviews are displayed
