# Bullseye Theory

Bullseye Theory is a trading-education website built around market structure, risk management, discipline and process. The Market Lab is an educational companion—not a broker, signal service, or source of personalised investment advice.

## Current project status

This branch contains a draft Market Lab and planned membership pages. Treat all displayed sample instrument values as fictional. The site has no live market feed or order execution. Membership prices are planned only; payments must remain disabled until server-side payment verification and entitlement enforcement are implemented and tested.

## Pages

- `index.html` — main landing page
- `terminal.html` — Market Lab with conditional learning scenarios, a practice risk-sizing calculator, checklist and browser-local journal
- `membership.html` — planned Course (₹999) and Premium Bundle (₹1,999) information
- `auth.html` — Supabase-based student authentication UI
- `dashboard.html` — student dashboard and course-access status
- `privacy.html`, `legal.html`, `disclaimer.html` — policy/disclaimer pages that still require final business contact and legal review

## Local checks

Node.js 20 or later is recommended. There are no npm package dependencies for the validators.

```sh
npm run build
npm test
```

The checks validate the Market Lab scenario-pack schema, demo-only labels, review dates, unique IDs/symbols, required core pages, responsive viewport metadata, and local references in the core pages. They do not prove production deployment, Supabase database policies, payment security, browser/device behaviour, or the truth of any external market data.

## Safety and release boundaries

- Never present simulated sample values as current market prices.
- Future real market briefs need trustworthy source links, as-of timestamp/timezone, review date, and human review.
- Do not add Supabase service-role keys, payment secrets, or admin credentials to browser-delivered files.
- Enforce course and premium entitlements server-side; a client-side button or page is not a secure paywall.
- Keep checkout disabled until billing cadence, access duration, cancellation/refund terms, support contact, server-side verification, and failure/refund paths are implemented and tested.
- Verify Cloudflare preview builds and mobile/desktop navigation before any production release.
- The GitHub workflow validates the educational content pack and core site links. It does not fetch live prices, create forecasts, or publish trading commentary.
