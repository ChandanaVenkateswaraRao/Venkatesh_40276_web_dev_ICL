# Tasks

## 1. Database & Backend Models

- [x] 1.1 Create `backend/models/Theater.js` to store theater details (name, city, amenities) and verify schema compilation.
- [x] 1.2 Create `backend/models/Showtime.js` to store showtime details (movieId, theaterId, time, date, prices) and verify schema compilation.
- [x] 1.3 Create `backend/models/Review.js` to store user reviews (movieId, userId, rating, text) and verify schema compilation.
- [x] 1.4 Add `city` field to `Movie.js` (or maintain a relationship) to support geographical filtering, and verify compilation.

## 2. Backend Controllers & Routes

- [x] 2.1 Implement GET `/api/theaters` and `/api/theaters/:movieId/showtimes` endpoints to fetch theaters playing a specific movie, and verify via Postman/curl.
- [x] 2.2 Implement POST and GET `/api/movies/:id/reviews` endpoints to allow posting and fetching verified reviews, and verify via curl.
- [x] 2.3 Implement GET `/api/admin/analytics` endpoint returning grouped revenue and booking data for Recharts, and verify via curl.
- [x] 2.4 Update Booking endpoint to accept and validate `showtimeId` instead of just `movieId`, and verify booking creation.

## 3. Location & Search Features

- [x] 3.1 Create `frontend/src/context/LocationContext.jsx` to manage the globally selected City via localStorage, and verify state propagates to child components.
- [x] 3.2 Build `LocationModal.jsx` to let users pick their city (e.g. Mumbai, Delhi, Bangalore) and verify changing city updates the Context.
- [x] 3.3 Update `Navbar.jsx` Search input to dynamically search the movie catalog API, displaying a dropdown of results, and verify accurate filtering.
- [x] 3.4 Update `Home.jsx` to filter the movie list based on the global LocationContext city.

## 4. Booking Flow Overhaul

- [x] 4.1 Create `frontend/src/pages/Theaters.jsx` showing dates, theaters, and available showtime pills for a selected movie, and verify routing works.
- [x] 4.2 Build `SeatQuantityModal.jsx` (1 to 10 seats) that appears when a user clicks a showtime pill, and verify it stores the count.
- [x] 4.3 Update `Booking.jsx` to consume `showtimeId` and `seatQuantity`, enforcing that exactly `seatQuantity` seats are selected before allowing payment, and verify validation.

## 5. Reviews & Admin Analytics

- [x] 5.1 Update `Movie.jsx` to display aggregated ratings and a list of user reviews fetched from the backend.
- [x] 5.2 Add a "Write Review" button and modal on `Profile.jsx` or `Movie.jsx` (only visible to verified bookers), and verify submission works.
- [x] 5.3 Install `recharts` and `html5-qrcode` on the frontend and verify installation succeeds.
- [x] 5.4 Update `AdminDashboard.jsx` to render Recharts line/bar graphs using the new `/api/admin/analytics` endpoint data.
- [x] 5.5 Build `AdminScanner.jsx` page using `html5-qrcode` to scan/input ticket IDs and mark them as used via a backend endpoint, and verify a test scan.
