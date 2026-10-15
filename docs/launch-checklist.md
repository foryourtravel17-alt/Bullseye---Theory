# Bullseye Theory — Pre-launch Checklist

This checklist applies to the course website and Market Lab. Keep the current pull request unmerged until the release gates below are checked.

## 1. Build and preview
- [ ] Run `npm run build` and `npm test` from the repository root.
- [ ] Confirm the Cloudflare Workers Builds check passes for the feature branch.
- [ ] Open the preview on Android mobile and desktop; confirm no horizontal overflow.
- [ ] Check Home, Course Dashboard, Market Lab, Membership, and Student Login navigation.
- [ ] Confirm direct visits to `terminal.html` and `membership.html` work.
- [ ] Confirm there are no broken images, missing assets, or console errors.
- [ ] Verify the preview URL and deployment target before any production change.

## 2. Market Lab data integrity
- [ ] Keep demo instruments clearly marked as fictional and not live.
- [ ] Do not label simulated values as current market prices.
- [ ] Confirm each scenario is conditional, has observable conditions and an invalidation condition, and is not a forecast or buy/sell instruction.
- [ ] Any future dated market brief must include source links, an as-of timestamp and timezone, review date, and a human review before publishing.
- [ ] Do not scrape or redistribute market data without checking licensing and terms.

## 3. Security and student access
- [ ] Treat browser-local journal entries as local to that browser/device; do not promise cloud backup or privacy beyond the browser.
- [ ] Do not put API keys, payment secrets, or admin credentials in HTML or client-side JavaScript.
- [ ] Student login must not be presented as secure authentication until a real auth provider and server-side session checks are integrated.
- [ ] Enforce course/premium access on the server; hiding a button in the browser is not a paywall.
- [ ] Add privacy notice, contact/support details, terms, cancellation/refund policy and course access duration before checkout.

## 4. Payments and memberships
- [ ] Keep all payment buttons disabled until payment provider and server-side payment verification are implemented and tested.
- [ ] Decide whether each price is one-time or recurring; do not imply a billing cadence before it is decided.
- [ ] Verify successful, failed, pending, cancelled, duplicate and refunded payment paths.
- [ ] Grant/revoke access only after trusted server-side verification and store the minimum necessary customer data.
- [ ] Test purchase and refund workflows in sandbox mode before accepting real payments.

## 5. Telegram launch
- [ ] Use the announcement in `docs/telegram-launch-copy.md` as a development update, not as a claim that the product is live.
- [ ] Do not claim live data, secure memberships, automated publishing or payments until each is verified.
- [ ] Pin a short risk disclaimer and link only to a verified preview.
- [ ] Never share bot tokens, private invite links, customer phone numbers or payment details in public posts.

## 6. Release decision
A release is ready only after build/checks pass, preview QA is complete, and any authentication/payment claims match the actual implementation. Merging or production deployment remains a deliberate release action; do not auto-merge from this checklist.
