# Tasks: BookMyShow Enterprise Real-Time Workflows

## 1. Customer Seating & Booking Flow Enhancements

- [x] 1.1 Upgrade `Booking.jsx` with an authentic curved neon screen projection arc, "SCREEN THIS WAY" indicator, and ambient cinema lighting. Verify in browser that the curved screen renders with glowing gradient at the top of the seating layout.
- [x] 1.2 Structure seating into 3 differentiated categories in `Booking.jsx`: Royal Recliner Lounge (Rows A-B with spaced couple-armchair styling), Prime Circle (Rows C-F), and Classic Section (Rows G-H) with dynamic tier pricing badges. Verify tier selection accurately recalculates total amount.
- [x] 1.3 Add an authentic simulated UPI QR & Card payment modal in `Booking.jsx` with instant countdown and one-click payment completion. Verify completing payment transitions to the confirmed pass screen without errors.
- [x] 1.4 Add an "Add to Calendar" (`.ics`) download button on the Booking Confirmation pass in `Booking.jsx`. Verify that clicking downloads an `.ics` file with movie name, cinema location, and showtime.

## 2. Theater Partner Multi-Screen & Live Box Office Operations

- [x] 2.1 Update `backend/models/Showtime.js` to include an optional `screen` field (e.g., "Audi 1", "Audi 2", "IMAX 4K Laser"). Verify schema updates without breaking existing records.
- [x] 2.2 Update the "Schedule Showtime" modal in `PartnerDashboard.jsx` to support screen selection and format assignment. Verify newly created showtimes display their screen tag in the showtimes table.
- [x] 2.3 Build the interactive Live Box Office Floor Map in `PartnerDashboard.jsx` allowing cinema managers to pick any showtime and visually inspect real-time seat occupancy (Sold, Held, Open) updating live via Socket.IO. Verify live seat lock events update the partner's floor map without page reload.

## 3. Admin Live Telemetry & Presentation Simulator

- [x] 3.1 Implement the `admin_audit_event` streaming channel in `backend/server.js` that emits real-time timestamped audit logs for seat locks, releases, payments, and viewer presence. Verify server emits audit payloads on user actions.
- [x] 3.2 Build the Live Audit Stream Terminal in `frontend/src/pages/admin/Dashboard.jsx` displaying a monospace telemetry feed with color-coded event badges (LOCK, RELEASE, BOOK, SYNC) and an auto-pause toggle. Verify live events stream into the terminal in real-time.
- [x] 3.3 Create the 1-Click "Live Rush Presentation Simulator" in `backend/routes/admin.js` and add the launch controller to `Dashboard.jsx`. Verify clicking "Simulate Live Traffic" generates concurrent seat reservations, triggers audio chimes, increments revenue counters, and streams live audit logs in front of viewers.

## 4. End-to-End Verification & Build Check

- [x] 4.1 Perform end-to-end multi-role verification across 3 browser tabs (Customer Booking, Partner Floor Map, Admin Telemetry) and verify synchronized real-time updates.
- [x] 4.2 Execute `npm run build` in `frontend` and verify that the production build completes with 0 errors.
