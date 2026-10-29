# Proposal

## Why

The current UI consists of placeholder pages, inconsistent styles, raw emojis instead of professional icons, and hardcoded "Clone" text throughout the application. To elevate the project to an industry-standard, production-ready state, we need to unify the design system, enforce consistent branding, and polish the static pages.

## What Changes

- Replace all instances of "BookMyShow Clone" text with proper branding ("bookmyshow" or equivalent) in the UI and backend email templates.
- Replace raw emojis/text symbols with `lucide-react` SVG icons across all pages (Navbar, Footer, Profile, Admin Dashboard, etc.).
- Implement industry-standard UI styling (spacing, typography, color palette) on the placeholder pages (`ListYourShow`, `Corporates`, `Offers`, `GiftCards`, `Contact`).
- Ensure the color palette (`#F84464` Red, `#333545` Dark Blue/Gray, `#1EA83C` Success Green) is strictly enforced globally.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None. (This change focuses purely on UI presentation, branding, and design system standardization. No new functional business requirements are introduced. `skip_specs: true` has been set).

## Impact

- **Frontend:** All React components in `src/pages` and `src/components`.
- **Backend:** `auth.js` and `payment.js` routes (for updating email template strings).
- **Dependencies:** Relies on the already installed `lucide-react` library for iconography.
