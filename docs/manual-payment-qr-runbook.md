# Bullseye Theory — payment readiness status

**Status: QR integration and automated TRC-20 verifier are prepared in a draft pull request only. Live checkout remains closed.**

## Planned offers
- Complete Course: ₹999.
- Premium Bundle: ₹1,999, including the course.
- Course access duration, final refund/cancellation terms and support SLA still require a final published policy.
- Premium deliverables, access duration and Telegram entitlements are not finalized. Premium checkout remains disabled in the server code.

## Accountant-supplied USDT QR
The owner confirms the accountant checked the supplied QR. The QR decoded to:
- Network: TRON Mainnet
- Token: USDT (TRC-20)
- Destination: `TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV`
- Official USDT contract: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`

The committed website QR is a clean high-contrast re-render of the decoded address, and it has been decoded again against the original wallet string. It contains only the receiving address; it does not embed a payment amount or force the customer's wallet onto TRON. Customers must select TRON Mainnet / TRC-20 explicitly.

## Automated TRC-20 implementation now prepared
- Authenticated server-side order creation; the browser cannot set user IDs or amounts.
- Live USDT/INR quote at order creation; 20-minute order expiry.
- Unique six-decimal order amount to distinguish simultaneous payments.
- TronGrid confirmed USDT transfer discovery, filtered to the official USDT contract.
- Separate SolidityNode transaction-body and successful receipt checks, requiring a solidified block.
- Atomic database finalization, duplicate transaction protection and course-access unlock.
- Unmatched confirmed deposits are recorded for manual reconciliation, not credited.
- Payment config and order-status endpoints for the checkout UI.
- CI tests for exact contract, amount, recipient, confirmation, receipt, order window and idempotency-related matching conditions.

This implementation is not active until the migration and Edge Functions are deployed, cron/Vault secrets are configured, and test scenarios pass. No code or schema has been applied to the live Supabase project from this change.

## Methods not ready
- Indian UPI QR: not supplied here; inactive.
- PayPal: no account/link configured; inactive.
- Premium Telegram access: not yet automatically provisioned; do not promise it at checkout.

## Launch/legal safeguards
- Current site must continue to display checkout closed until the automatic verifier is live and tested.
- Never accept screenshots or a customer-submitted transaction hash as proof of payment.
- Never unlock on a pending or unconfirmed transfer, the wrong token contract, wrong destination, rounded/partial amount, expired order, reverted transaction, or duplicate transaction.
- Keep service-role keys and scanner secrets server-side only.
- The accountant's QR check is recorded as the owner's confirmation of the receiving QR. It is not, by itself, legal/tax advice on VDA treatment, GST, TDS, foreign exchange or accounting. Keep the relevant written CA/legal decision with business records.
- Before launch, publish final Terms, refund/cancellation policy, privacy details, access duration and support route, and test sign-up, paid lesson gating, quiz completion, certificate issuance and direct lesson URLs.

Detailed deployment and verification steps: `docs/automatic-trc20-payment-deployment.md`.
Support: `eyetheorybulls@gmail.com`.
