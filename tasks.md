# TOZY.AI Phase 2 Execution Tasks

## 1. Branding & Name Transition
- [x] Rename VYUHA.AI to TOZY.AI in `index.html`.
- [x] Update `package.json` and `README.md`.
- [x] Update header/branding in `app.js`.

## 2. Authentication & Supabase UI
- [x] Add Supabase Auth Google Login button and session management to `app.js`.
- [x] Build the Login/Auth overlay modal for unregistered users.
- [x] Implement 8:00 AM IST daily flush logic (log out users pre-market).

## 3. Compliance Phrasing Sanitization
- [x] Update `patterns.js` and `derivatives.js` to remove "Buy/Sell", "Stop-Loss", "Target".
- [x] Introduce terms like *High-Confluence Parameter Crossing*, *Downside Invalidation Level*, and *Upside Liquidity Pool*.
- [x] Update `mock-market.js` mock responses and structure to reflect the new terms.
- [x] Update AI Assistant prompts in `app.js` to strictly output mathematically compliant reasoning.
- [x] Add the mandatory educational disclaimer to all AI outputs.

## 4. Execution Safe-Harbors
- [x] Implement the 10-OPS (Orders Per Second) Token Bucket Queue buffer logic.
- [x] Add the 10-OPS Safeguard UI Toast notification.
- [x] Implement the "Educator Mode" / Public View 3-month data delay toggle.

## 5. UI Components for Database Schema
- [x] Update `store.js` to display Broker-Verified badges and cryptographic hashes for profiles.
- [x] Update `patterns.js` UI to reflect `technical_crossings` schema (Direction, Risk Boundary, Liquidity Target).

## 6. Vercel Environment Variables Setup
To ensure Razorpay/Stripe payments work seamlessly in production without being ignored or 404ing, configure the following keys in your Vercel Dashboard under **Settings > Environment Variables**:

1. **`RAZORPAY_KEY_ID`**: Set this to `rzp_test_TCJwZH7ziKv0G4` (or your live key id). This is public, so it does not need to be marked as sensitive.
2. **`RAZORPAY_KEY_SECRET`**: Set this to `VSWc4Z5Nzu7xL8YgLd1Wcs59` (or your live key secret). **Make this sensitive/secret** to encrypt it.

*Note: After adding these variables, redeploy the latest commit in Vercel under the Deployments tab to rebuild the serverless functions with the new env vars.*
