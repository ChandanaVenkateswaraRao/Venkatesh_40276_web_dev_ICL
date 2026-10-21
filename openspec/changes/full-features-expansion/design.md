# Design

## Context
See proposal.md. Expanding the current simple movie booking app into a fully-fledged BookMyShow clone requires bridging the gap between clicking a movie and selecting seats. It also requires introducing geographical context (cities) and community features (reviews).

## Goals / Non-Goals

**Goals:**
- Implement dynamic routing for Theater and Showtime selection.
- Build a City selection context using React Context or simple local state/localStorage.
- Integrate Recharts for admin analytics.
- Create new MongoDB schemas for `Theater`, `Showtime`, and `Review`.

**Non-Goals:**
- Real-time geolocation using browser GPS (user will manually select from a list).
- Advanced seating algorithms (we will stick to the static grid layout but pass down theater-specific pricing).

## Decisions

- **Database Normalization**: We will separate `Movie`, `Theater`, and `Showtime`. 
  - `Theater` holds `name`, `city`.
  - `Showtime` holds `movieId`, `theaterId`, `time`, `date`, `pricePremium`, `priceExecutive`.
  - *Alternative*: Embed showtimes in the Movie document. *Rationale*: Normalization allows easier querying by City or Theater independently.
- **State Management for Location**: We will use `localStorage` to persist the selected City, and pass it around via a simple React Context (`LocationContext`) so the Navbar, Home page, and Search bar can all re-render instantly when the city changes.
- **Admin Charts**: Use `recharts` library for its excellent React compatibility and clean defaults.
- **QR Scanning**: Use `html5-qrcode` library for the admin panel to allow reading the ticket QR code via webcam or file upload.

## Risks / Trade-offs

- **Risk: Complex Schema Migration** → Currently, `Booking` links only to `Movie`. We need to update `Booking` to link to `Showtime` instead, which breaks existing bookings.
  - *Mitigation*: We will either wipe the DB (it's a dev clone) or make `showtimeId` optional for legacy bookings.
- **Risk: QR Scanner complexity** → Webcams can be tricky to test in a dev environment.
  - *Mitigation*: Provide a text input fallback for the Admin to manually type the Booking ID if the camera fails.
