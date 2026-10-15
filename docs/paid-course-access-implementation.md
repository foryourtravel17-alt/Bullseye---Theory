# Paid Course Access — Implementation Plan

Status: implementation specification only. No payment is enabled, no production deployment is requested, and no live schema changes have been applied.

## Product decision
- Lesson 1 is a free preview.
- Lessons 2–11 are paid course content.
- Course price remains a planned ₹999 one-time price until checkout terms and provider fees are approved.
- Premium ₹1,999 remains a planned offer; do not sell until its included features and access period are finalized.
- Zero additional spend until the first verified sale. Payment-provider transaction fees, if any, must be disclosed before checkout.

## Critical security distinction
A browser-side dashboard check is only presentation. It cannot protect static HTML files served publicly. Do not mark lessons 2–11 as securely paid-only while those files remain directly accessible from the public asset host.

## Target architecture
1. Public site serves the home page, membership page, Market Lab demo and Lesson 1 preview.
2. Student authenticates through Supabase Auth.
3. Checkout creates a server-side order with a unique order ID, user ID, plan ID, amount, currency and pending status. The server determines the amount; never trust a client-supplied price.
4. Payment provider processes payment. A server-side webhook validates the provider signature and verifies the order ID, amount, currency and final captured/paid status.
5. Only after verified payment, trusted server code grants the matching course entitlement. Browser redirects and screenshots are never proof of payment.
6. Lessons 2–11 are delivered through an authorization-enforcing server endpoint or private object storage with short-lived signed access. Public static URLs must not contain paid lesson bodies.
7. Student dashboard reads the entitlement and progress for the authenticated user. Database Row Level Security (RLS) prevents students from changing their own entitlement or reading other students' records.

## Suggested data model (confirm against actual Supabase schema before migration)
- `orders`: id, user_id, plan_id, amount_minor, currency, provider_order_id, provider_payment_id, status, created_at, paid_at.
- `course_entitlements`: id, user_id, plan_id, status, granted_at, expires_at, source_order_id.
- `lesson_progress`: user_id, lesson_number, completed, progress_percent, updated_at.
- Unique constraints: provider event ID (or webhook event table), provider payment ID, and one entitlement per user/plan/order as appropriate.
- Use integer minor units for money (₹999 = 99900 paise); validate currency and amount server-side.
- Webhook handler must be idempotent and reject replayed/invalid events.

## RLS and authorization requirements
- Enable RLS on user-scoped tables.
- Authenticated users can read only their own progress and order summaries.
- Students must not insert/update/delete entitlements or mark orders as paid.
- Only trusted server code using a secret kept in server-side environment variables may grant entitlements.
- Public browser code may contain only the Supabase publishable key. Never expose a service-role key or payment secret.
- Test unauthenticated, other-user, forged entitlement, forged amount, repeated webhook, failed payment and refund/cancellation cases.

## Payment-provider decision
Do not choose or configure a gateway until current India onboarding requirements, supported payment methods, settlement, transaction charges, refund handling and no-upfront-cost availability are checked. Do not store card or UPI credentials. Never enable checkout without provider signature verification and a verified webhook.

## Safe implementation order
1. Inspect the actual database schema, RLS policies, functions and deployment bindings. Do not assume table names or existing policies.
2. Make Lesson 1 explicitly a free preview and update the login page curriculum copy from 10 lessons to 11.
3. Move paid lesson bodies behind server-side authorization; do not rely on client-side redirects.
4. Implement provider-neutral order and entitlement contracts, then provider-specific checkout/webhook only after a provider is approved.
5. Add tests for authorization and webhook idempotency.
6. Run local build, link validation and security tests; report exact evidence.
7. Keep PR unmerged, deployment untouched, and payment disabled until explicit approval.

## Acceptance criteria
- Lesson 1 loads without login.
- Lessons 2–11 cannot be fetched anonymously or by a signed-in user without an active entitlement, including by direct URL.
- A student cannot grant or extend their own entitlement via browser/API calls.
- Invalid, failed, pending, wrong-amount, wrong-currency and replayed payment events never grant access.
- A valid confirmed payment grants the intended plan once, and refunds/reversals follow a documented revocation policy.
- All purchase terms, support contact, privacy and refund/cancellation information are visible before checkout.
- Tests pass on the PR branch. No merge, deployment, live payment, or paid service is triggered by this work.
