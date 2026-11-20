# Bullseye Theory — Complete Course payment status

**Release scope: Complete Course only.** Instagram and Premium Telegram are not prerequisites for this course launch and are excluded from this runbook.

## Current implementation status — 3 November 2026

- Complete Course plan: ₹999.
- Course validity: exactly 85 days from independently verified payment.
- 11 lesson records are present in Supabase.
- Course access is checked server-side by the Cloudflare Worker before protected lesson files are served.
- Quiz grading and lesson completion use server-side Edge Functions.
- The Supabase course/payment migrations are applied and all six course/payment Edge Functions are ACTIVE.
- TRC-20 order creation and the automated verifier are deployed, but **checkout is still closed**.
- GitHub Actions contains a five-minute TRC-20 scanner workflow; it is disabled until owner-side secrets and the repository enable variable are configured.
- Cloudflare's local Wrangler dry-run and course access tests passed in CI, but the latest remote Cloudflare preview build failed. Production Worker release and browser QA are still pending.

Supabase read-only check on 3 November: one verified entitlement is current and one verified entitlement is expired. No verified active entitlement without an expiry was found. No payment orders or unresolved payment-review events were present during the check.

## Accountant-supplied USDT QR

The owner previously confirmed that the accountant checked the supplied QR. The recorded details are:
- Network: TRON Mainnet
- Token: USDT (TRC-20)
- Destination: `TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV`
- Official USDT contract: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`

The website QR is a high-contrast rendering of the verified address. It contains only the destination address; the QR does not encode the network or an exact amount. The payer must explicitly select TRON Mainnet / TRC-20 and send the exact amount reserved in the signed-in checkout order.

## Automated payment protections already implemented

- Signed-in server-side order creation; browser-supplied user IDs and amounts are not trusted.
- A fresh USDT/INR quote is used when the order is created.
- Each order reserves a unique six-decimal USDT amount and expires after 20 minutes.
- The scanner filters for the official USDT contract and checks confirmed transfers.
- The scanner independently checks the transaction body, successful execution receipt and solidified block.
- Wallet, network, token contract, amount and order time window must match.
- Payment transaction recording and the 85-day course-access grant are atomic.
- Duplicate transactions cannot unlock access twice.
- Unmatched and ambiguous deposits go to manual review; they do not unlock the course.
- Screenshots and customer-entered transaction hashes are never accepted as payment proof.

## Owner setup still required

1. In Supabase Dashboard → Edge Functions → Secrets, add `TRONGRID_API_KEY` and `TRC20_SCANNER_CRON_SECRET`. Keep `USDT_CHECKOUT_ENABLED=false` and `PREMIUM_CHECKOUT_ENABLED=false`. Set `ALLOWED_SITE_ORIGIN` to the exact deployed HTTPS site origin.
2. In GitHub repository → Settings → Secrets and variables → Actions, add `SUPABASE_URL` and `TRC20_SCANNER_CRON_SECRET`; the latter must exactly match the Supabase secret.
3. Keep repository variable `TRC20_SCANNER_ENABLED` false until both sets of secrets are saved. Then run the manual scanner workflow once with `run_now=true`; confirm it succeeds without pending orders before enabling its five-minute schedule.
4. Inspect the failed Cloudflare preview build log and fix the actual remote build error. A successful local dry-run is not a production release.
5. Complete browser checks for sign-up/login, free Lesson 1, direct access denial for Lessons 2–11 before entitlement, and paid access only after a verified entitlement.
6. Obtain the owner's explicit approval for a tiny irreversible TRON test transfer. Confirm that the test grants exactly 85 days, not more.
7. Publish final Terms, refund/cancellation, privacy, support and applicable CA/legal/tax disclosures before taking customer payments.

The free GitHub Actions scanner is the selected route. Supabase `pg_cron` / `pg_net` are not required. Do not create a second scanner schedule.

## Keep inactive for this release

- Instagram automation: out of scope; no Instagram task is required to launch the course.
- Premium bundle and Premium Telegram membership: disabled until the benefits, validity and entitlement provisioning are separately finalized.
- UPI: not yet configured; do not show it as an available payment method.
- PayPal: not configured.

## Non-negotiable launch safeguards

- Keep the site in checkout-closed mode until payment scanning and the full customer journey have passed.
- Never unlock from a screenshot, customer-supplied transaction ID, pending transfer or transfer on the wrong network.
- Never expose the Supabase service-role key or scanner secrets in the website, browser code, repository files or logs.
- The accountant's QR check confirms the receiving-address details as relayed by the owner; it does not replace written CA/legal review of the business's applicable accounting, tax, payment and consumer terms.
- Do not merge a release PR or deploy production until the remaining checks are reviewed and the owner approves launch.

Detailed setup: `docs/automatic-trc20-payment-deployment.md`.
Support currently shown in the project: `eyetheorybulls@gmail.com`.
