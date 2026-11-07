# Bullseye Theory — Indicator Membership Product Specification

Status: implementation specification only. No payment or live access is enabled.

## Product boundary

The website sells educational content and a time-limited membership entitlement. TradingView remains the platform that hosts and enforces invite-only script access. These are separate systems and must be reconciled through an auditable admin workflow.

## Core records

### products
- id
- code: COURSE, INDICATOR_MONTHLY, COURSE_INDICATOR_BUNDLE, PREMIUM_LEARNING
- display_name
- billing_type: one_time | recurring
- price_minor (INR paise; never floating-point rupees)
- currency (INR)
- indicator_access_days (nullable)
- active (default false until launch approval)

### orders
- id
- user_id
- provider
- provider_order_id (unique)
- provider_payment_id (unique when supplied)
- amount_minor
- currency
- status: pending | paid | failed | refunded | disputed
- verified_at
- created_at

### subscriptions
- id
- user_id
- product_id
- provider_subscription_id (unique when supplied)
- status: pending | active | past_due | cancelled | expired
- current_period_start
- current_period_end
- cancel_at_period_end
- created_at
- updated_at

### entitlements
- id
- user_id
- product_id
- source_order_id or source_subscription_id
- status: pending | active | suspended | revoked | expired
- starts_at
- ends_at
- granted_at
- revoked_at
- revocation_reason

### tradingview_access
- id
- user_id
- tradingview_username
- script_identifier
- entitlement_id
- status: pending | granted | revoke_pending | revoked | failed
- granted_by
- granted_at
- revoked_by
- revoked_at
- last_error

### payment_events
- id
- provider_event_id (unique)
- event_type
- signature_verified
- payload_hash (do not store unnecessary card/bank secrets)
- processed_at
- processing_status
- error_code

## Security and correctness requirements

- Only a server-verified, signature-validated provider webhook may transition an order to paid.
- Verify amount, currency, merchant account, order ID and provider payment status server-side.
- Enforce idempotency on provider event IDs and payment IDs.
- Never trust client-supplied price, user_id, entitlement status, expiry, or payment-success flags.
- Never expose payment secrets or service-role credentials to browser code.
- Row-level security must prevent a user from editing their own order status, subscription status, product price, entitlement, or TradingView access status.
- Administrative mutations must use a trusted server-side path and create audit events.
- Users may read only their own order, subscription and entitlement details.
- Admins use least privilege and MFA where available.

## Entitlement rules

- Course one-time purchase grants course access according to the published course policy.
- Indicator monthly subscription grants indicator entitlement only for the verified paid period.
- Bundle grants both course access and indicator access for the explicitly disclosed duration.
- Renewal extends the entitlement only after a verified successful recurring payment event.
- Cancellation at period end does not prematurely remove already-paid access.
- Refund, chargeback, failed renewal after the disclosed grace period, or manual fraud decision triggers suspension/revocation according to policy.
- Duplicate webhook delivery must not duplicate entitlements or extend access twice.
- Expiry worker must be idempotent and log each action.
- TradingView manual grant/revoke must be represented as a state machine; never display "active" until the access action is confirmed.

## Admin workflow

1. Admin opens a verified paid order.
2. System checks that there is an active indicator entitlement and a valid TradingView username.
3. Admin confirms TradingView account eligibility and script publication status.
4. Admin grants access in TradingView Manage access.
5. Admin records the grant result and timestamp.
6. Before expiry, dashboard shows expiry and renewal state; do not promise automatic TradingView revocation unless a supported API actually exists.
7. On expiry/refund, create revoke task; admin removes access in TradingView and records confirmation.
8. Every action is auditable.

## Student dashboard

Show:
- Course access: active / not active.
- Indicator membership: active / expires on [date] / payment issue / cancelled.
- TradingView username on file (editable with verification).
- Setup guide and supported chart intervals.
- Billing history, cancellation instructions and support.
- Educational disclaimer and indicator limitations.

Never show raw provider webhook payloads, secrets or other students' data.

## Launch acceptance tests

- Forged browser payment success cannot grant access.
- Invalid webhook signature is rejected.
- Duplicate successful webhook produces one order transition and one entitlement.
- Wrong amount/currency/order ID is rejected.
- User A cannot read or mutate User B's records.
- User cannot set their own subscription or entitlement to active.
- Expired entitlement cannot be shown as active.
- Cancellation preserves access until paid period end.
- Refund/chargeback creates a revoke task and audit event.
- Admin access grant is not shown as complete before confirmation.
- Missing TradingView username blocks grant but does not lose the paid entitlement.
- All actions are logged without storing unnecessary sensitive payment data.

## Current known dependency

TradingView access is manually managed unless TradingView provides a supported access-management API for this creator account. Do not promise instant or automated grant/revoke before proving the mechanism.
