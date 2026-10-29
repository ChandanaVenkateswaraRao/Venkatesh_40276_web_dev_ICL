# Proposal

## Why

The current BookMyShow clone covers the core authentication and payment flows, but lacks the intermediate decision steps and engagement features that define the real application. To elevate this project to a master-class tier, we must implement city selection, theater/showtime routing, working search filters, user reviews, and advanced admin capabilities.

## What Changes

- Add an intermediate "Theater and Showtime" selection screen between the Movie details and Seat layout.
- Add a "How Many Seats?" selection modal prior to the seat layout.
- Wire up the Navbar search bar to filter movies by title in real-time.
- Add a City/Location selection modal to filter content geographically.
- Add user ratings and written reviews to the Movie details page (verified booking required).
- Upgrade the Admin Dashboard with analytical charts (Recharts).
- Add an Admin QR Code scanner page to simulate ticket validation.

## Capabilities

### New Capabilities
- `booking-flow`: Theater selection, showtimes, and seat quantity modal.
- `search-filters`: Real-time movie search and genre/format filtering.
- `location-selector`: City selection and geographical filtering.
- `admin-dashboard`: Charts, revenue analytics, and QR ticket scanning.
- `user-reviews`: Submitting and displaying user ratings and written reviews.

### Modified Capabilities
- (None)

## Impact

- **Frontend:** Extensive routing updates, new modals, Recharts dependency for admin graphs.
- **Backend:** New models for `Theater`, `Showtime`, and `Review`. Updates to `Movie` model to support city filters and aggregated ratings.
- **Database:** MongoDB schema expansion to handle the complex relationships between Movies, Theaters, and Showtimes.
