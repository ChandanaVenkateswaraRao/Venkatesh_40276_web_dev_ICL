# Tasks

## 1. Brand Standardization

- [x] 1.1 Update `frontend/src/pages/Booking.jsx` to replace "BookMyShow Clone" in the Razorpay options with "bookmyshow" and verify the checkout modal displays the new brand.
- [x] 1.2 Update `backend/routes/auth.js` email template to replace "BookMyShow Clone" text in the subject line and HTML body, and verify the verification email shows correct branding.
- [x] 1.3 Update `backend/routes/payment.js` email template to replace "BookMyShow Clone" text in the subject line and footer, and verify the ticket email shows correct branding.

## 2. Iconography Replacement

- [x] 2.1 Install `lucide-react` if not already present, then update `Navbar.jsx` to replace text-based or SVG-path icons with standard Lucide icons (e.g., Menu, ChevronDown, User) and verify navbar layout remains intact.
- [x] 2.2 Update footer component (if exists) or other global components to use `lucide-react` instead of static symbols and verify rendering.

## 3. Page Polish & Styling

- [x] 3.1 Update `ListYourShow.jsx` to match industry standard padding, colors (`#F84464`, `#333545`), and typography, and verify it renders cleanly on mobile and desktop.
- [x] 3.2 Update `Corporates.jsx` with standard layouts, adding visual hierarchy (headers, subheaders, primary buttons) and verify responsiveness.
- [x] 3.3 Update `Offers.jsx` with standard layouts and verify consistency with the rest of the application.
- [x] 3.4 Update `GiftCards.jsx` with standard layouts and verify consistency with the rest of the application.
- [x] 3.5 Update `Contact.jsx` to style form inputs to match the robust `Login.jsx` styles (e.g. gray-50 background, red focus rings) and verify input focus states work.
