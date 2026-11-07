# Bullseye Theory — Course + Annual Indicator Membership

Status: approved product direction; implementation proposal only. This document does not activate sales, payments, subscriptions or TradingView access.

## The simple offer

| Product | Price | Access period | Billing |
|---|---:|---|---|
| Bullseye Theory Complete Course | ₹999 | 85 days from verified payment | One-time |
| Bullseye Levels Indicator Membership | ₹9,999 | 365 days from verified payment | Annual renewal, customer-initiated |

The ₹9,999 indicator fee is for one 365-day membership period. The customer must initiate and complete a new payment to renew. The current TRC-20 wallet flow cannot debit a customer's wallet automatically. Do not advertise automatic annual billing or auto-renewal.

The course and indicator are separate purchases. Do not invent a discounted bundle price. If a student buys both, the current list-price total is ₹10,998.

## What the student receives

### Course — ₹999
- 11 structured lessons.
- Study guides/PDFs and chart exercises.
- Course dashboard and progress tracking.
- 85-day access after verified payment.

### Bullseye Levels — ₹9,999 / 365 days
- Time-limited membership for the published Bullseye Levels TradingView script.
- Setup guide, supported timeframe/rule documentation and release notes.
- Educational usage guidance and support.
- TradingView invite-only access for the student's TradingView username after payment and eligibility checks.
- Access ends after the paid 365-day period; renewal requires a new verified payment and a confirmed TradingView access extension.

Indicator access is not live yet. It must not be sold until the script is compiled, validated, published in the correct TradingView mode, and the owner account meets TradingView's current eligibility requirements.

## Customer journey

1. A free education/demo funnel introduces the course and indicator.
2. The customer chooses the ₹999 course or the ₹9,999 annual indicator membership.
3. The customer signs into the Bullseye student website and creates a time-limited order.
4. The server—not the browser—verifies the exact amount, network, token contract, destination, transaction success and chain finality.
5. A verified ₹999 course order grants the 85-day course entitlement.
6. A verified ₹9,999 indicator order grants an internal 365-day indicator entitlement.
7. An admin manually adds the student's TradingView username in the TradingView script's Manage access screen and records confirmation in the admin audit log.
8. Before expiry, the student receives renewal instructions. A successful renewal extends the entitlement; the admin then confirms TradingView access extension.
9. At expiry, refund or chargeback, the admin removes TradingView access and records the action. Do not display TradingView access as revoked until the owner has confirmed it.

## Renewal model and revenue math

Annual membership is prepaid, not auto-debited. The customer starts each renewal. The current USDT/TRC-20 order verifier can automatically confirm the payment and update the website entitlement after the necessary database changes and tests; TradingView access remains a separate manual admin action.

Illustrative gross revenue before any costs, taxes, refunds or fees:
- 20 annual indicator members × ₹9,999 = ₹1,99,980 per year.
- 50 annual indicator members × ₹9,999 = ₹4,99,950 per year.
- 100 annual indicator members × ₹9,999 = ₹9,99,900 per year.
- 20 course purchases × ₹999 = ₹19,980 one-time revenue.

These are arithmetic examples, not forecasts or a promise of sales.

## TradingView commercial requirements (re-check before launch)

TradingView's current Vendor Requirements say an author needs an active Premium or Ultimate plan to publish/manage invite-only scripts. Its updated 6 November 2026 FAQ says creators with an active Premium-or-higher plan can sell a public invite-only script through their own website, courses, social accounts or communities, and manually grant access; the FAQ states the plan includes 100 seats. Public invite-only is required for paid access, and scripts with more than five users must not remain private invite-only.

TradingView Paid Spaces are an optional later channel, not a launch dependency. They are recurring monthly subscriptions processed by TradingView and require Creator Program approval/eligibility. Do not imply that Bullseye Theory is accepted into the Creator Program.

Official sources:
- https://www.tradingview.com/support/solutions/43000797373-selling-scripts-on-tradingview-faq/
- https://www.tradingview.com/support/solutions/43000549951-vendor-requirements/
- https://www.tradingview.com/support/solutions/43000797311-invite-only-script-rules/
- https://www.tradingview.com/support/solutions/43000772177-tradingview-creator-program-paid-spaces-terms/

## Security, trust and compliance

- Educational purposes only; no individualized investment advice, guaranteed returns or guaranteed signals.
- Do not claim win rate, profitability or accuracy without independently reproducible evidence.
- Publish supported symbols/timeframes, data source, confirmation rules, known limitations and testing results.
- Access is personal and non-transferable. Never ask for a TradingView password.
- Only a verified server payment can grant an entitlement. Browser flags, screenshots and customer-entered transaction hashes are not payment proof.
- Every manual TradingView grant/extension/revocation must be logged with admin, username, script, entitlement and timestamp.
- Refund, chargeback, failed reconciliation or fraud cases must follow published terms and applicable law.
- Review Indian consumer, e-commerce, privacy, taxation/GST/TDS and financial-marketing obligations with a qualified professional before accepting payments. Do not represent the course as regulated investment advice.

## Launch gates

Do not open the ₹9,999 indicator plan until all are true:
- The Bullseye Levels Pine script compiles in TradingView and matches the Node.js rule implementation on fixed fixtures.
- Historical and forward demo testing are documented.
- The author's TradingView plan is eligible and the indicator is published as public invite-only under current rules.
- The membership database migration and payment finalizer are tested in disposable PostgreSQL/staging before production.
- A verified ₹9,999 order creates a 365-day indicator entitlement, and a ₹999 order retains the existing 85-day course entitlement.
- Duplicate payment events cannot double-grant or double-extend access.
- Manual TradingView grant, extension and revoke workflows have an audit trail.
- Course and indicator terms show exact durations, renewal method, cancellation/refund rules, support and disclaimers.
- Payment verification, admin recovery and student-dashboard tests pass end-to-end.

No production deployment, production database migration, live checkout activation, public indicator publication or customer launch is authorized by this proposal.

## Free-first implementation order

1. Finalize the two prices and access periods.
2. Complete and test the indicator before offering it.
3. Prepare database and server changes on a feature branch; keep production untouched.
4. Owner verifies TradingView plan and publishes the invite-only script after QA.
5. Test the ₹999/85-day and ₹9,999/365-day payment-to-entitlement paths with disposable accounts.
6. Complete the owner-only TradingView access test.
7. Complete legal/accounting review and only then open checkout.
