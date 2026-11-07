# Bullseye Theory — Course + Recurring Indicator Membership

Status: proposal and implementation plan. This document does not activate sales, payments, subscriptions, or TradingView access.

## Business model

Bullseye Theory combines:
1. A one-time educational course (11 lessons, study guides, recorded lessons and practice exercises).
2. A recurring indicator membership that provides access to the Bullseye Levels TradingView tool, updates, documentation and member support.
3. A combined course + indicator bundle.

The value proposition is structured market-analysis education plus a rules-based chart tool. Do not market the indicator as a profit system, guaranteed signal service, or substitute for independent decision-making.

## Product ladder

| Offer | Billing | Proposed price | What it includes |
|---|---|---:|---|
| Course | One-time | ₹999 | 11 lessons, PDFs, recorded lessons, exercises |
| Course + Indicator | Initial bundle price to test | ₹1,999 | Course plus an explicitly stated indicator access period |
| Indicator membership | Monthly | ₹499/month (test price) | Invite-only access while subscription is active, release notes and setup guide |
| Premium learning membership | Monthly | ₹999/month (test price) | Indicator access plus additional learning/community benefits only after those benefits exist |

Prices are hypotheses, not published offers. Validate willingness to pay and support costs before publishing. Clearly state taxes, billing interval, access duration, renewal, cancellation and refund terms before taking payment. Do not describe a one-time bundle as lifetime access unless it truly is.

## Customer journey

1. Free educational posts and chart walkthroughs introduce the Bullseye method.
2. A public demo or free educational version explains the rules and limitations.
3. The student buys the course, indicator membership, or bundle through an approved checkout.
4. The server verifies the payment provider's signed webhook; a browser success page alone never grants access.
5. The entitlement service records the product, start/end time, payment reference and status.
6. For an eligible active indicator entitlement, an administrator grants TradingView invite-only access. Access is removed when the entitlement expires or is refunded/charged back, subject to documented grace and dispute rules.
7. Students receive onboarding, renewal/cancellation information and support.

## Revenue math (illustrative only)

- 20 active members × ₹499 = ₹9,980 gross monthly recurring revenue.
- 50 active members × ₹499 = ₹24,950 gross monthly recurring revenue.
- 100 active members × ₹499 = ₹49,900 gross monthly recurring revenue.

These are arithmetic examples, not forecasts. They exclude payment fees, taxes, refunds, churn, support, TradingView plan costs and other expenses. Revenue depends on genuine demand and retention.

## Membership access policy

- Access is personal and non-transferable; no credential sharing or resale.
- Invite-only access is granted only after verified payment and only while entitled.
- State exact access start and expiry in the member dashboard and confirmation email.
- Failed renewal: provide a clearly disclosed grace period (recommended initial policy: 3 days), then suspend indicator access until payment is verified.
- Cancellation: stop future renewal; retain access through the already-paid period unless the published terms or law require otherwise.
- Refund, chargeback or confirmed fraud: follow the published policy and applicable law; revoke access when entitlement ends.
- Manual TradingView access actions must be logged (who, when, script, TradingView username, reason).
- Never ask users for their TradingView password or share account credentials.

## Important TradingView dependency

Before selling access, confirm the creator account's plan eligibility and the current TradingView commercial-script/vendor rules. Confirm whether public invite-only publication and the intended course-bundle arrangement are permitted for the account. TradingView access is a separate entitlement from website login; a successful website login does not automatically grant TradingView access.

## Trust, risk and compliance

- Educational purposes only; no individualized investment advice or guaranteed returns.
- Do not claim win rate, profitability, accuracy or backtest performance without reproducible evidence and clear methodology.
- Show supported symbols/timeframes, data source, last update, known limitations and whether signals are confirmed or delayed.
- Provide a demo/testing guide and encourage paper trading before any real-money use.
- Do not publish personalized buy/sell calls or operate a paid recommendations service without obtaining appropriate Indian regulatory/legal advice and any required registration/permissions.
- Review Indian consumer-protection, e-commerce, privacy/data-protection, tax/GST and financial-marketing obligations with a qualified professional before launch.

## Launch gates

Do not open paid enrollment until all are true:
- Course content, delivery, access duration and support scope are finalized.
- Indicator Pine code compiles in TradingView and passes chart-by-chart validation.
- Historical and forward demo testing are documented; no profitability claims are made without evidence.
- Commercial publication and account-plan eligibility are confirmed with TradingView.
- Payment gateway account and signed webhook are configured and tested in test mode.
- Entitlement, expiry, cancellation, refund and manual TradingView access workflows are tested end-to-end.
- Terms, privacy, refund, disclaimer, pricing and support contact are accurate and visible.
- A real owner/admin recovery process and audit log exist.

## Free-first implementation sequence

1. Finalize product definitions and exact access periods.
2. Finish indicator correctness, Pine compilation and test documentation.
3. Build a non-payment entitlement model and admin checklist using test users.
4. Confirm TradingView account eligibility and commercial terms.
5. Choose a compliant payment provider only after business/KYC requirements are understood.
6. Implement signed webhook-driven entitlements and audit logs.
7. Test purchase → grant → expiry → cancellation/refund → revoke.
8. Open a small beta only after all gates pass; monitor support load and churn.

No production deployment, live payment activation, or public indicator publication is authorized by this plan.
