# Bullseye Theory — standard course payment release

## Release scope

This runbook is for the **Complete Course only**:
- 11 lessons.
- ₹999 plan price.
- 85 days of access, starting only after server-side verified payment.
- USDT on TRON Mainnet / TRC-20 is the only payment rail currently integrated.

Premium checkout, Premium Telegram provisioning, Instagram automation, UPI and PayPal are outside this course-only launch and must remain disabled/unadvertised until separately completed.

## Live implementation status — 3 November 2026

The connected Supabase project is active and healthy. The reviewed course/payment migrations are present, and these six Edge Functions are ACTIVE: `grade-quiz`, `complete-lesson`, `get-trc20-payment-config`, `create-trc20-order`, `get-trc20-order-status`, and `scan-trc20-payments`.

The course entitlement rule is fixed at 85 days. The Cloudflare Worker source and static lesson gate are implemented and pass the repository's Deno tests and Wrangler dry-run build. The latest Cloudflare Workers Build preview nevertheless reported a separate remote build failure, so the production Worker release and browser QA are not confirmed.

**Checkout remains closed.** The scanner schedule is prepared but disabled until owner-side credentials and the repository enable variable are configured. Do not accept payment while the site says checkout is closed.

## Receiving details already recorded

- Asset: USDT (Tether USD₮)
- Network: TRON Mainnet
- Token standard: TRC-20
- Receiving address: `TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV`
- Official USDT TRC-20 contract: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`
- Website QR: `assets/usdt-tron-mainnet-trc20.svg`

The QR encodes only the wallet address. It does not lock the sender's wallet to a network or include the exact order amount. A payer must choose TRON Mainnet / TRC-20 and send only the exact amount shown by a live order. Never use ERC-20 or BEP-20 for this destination.

## How payment-to-course access works

1. A signed-in student chooses Complete Course.
2. `create-trc20-order` validates the student's Supabase session. The browser cannot choose the user ID, plan price, destination or token contract.
3. The server obtains a fresh USDT/INR quote, reserves a unique six-decimal USDT amount and creates a 20-minute order.
4. The student sees the exact amount, expiry, wallet and network.
5. The scanner discovers confirmed USDT transfers for the official contract and checks the transaction body, successful execution receipt, solidified block, destination, token contract, exact amount and order time window.
6. A database function records the transaction and grants the 85-day course entitlement atomically. Duplicate transactions cannot grant access twice.
7. An unmatched or ambiguous confirmed transfer is held for manual reconciliation; it does not unlock the course.
8. Screenshots and customer-entered transaction hashes are never proof of payment.

## Supabase Edge Function secrets

In Supabase Dashboard → Project → Edge Functions → Secrets, configure:

| Secret | Value / rule |
|---|---|
| `TRONGRID_API_KEY` | Owner-generated TronGrid API key. |
| `TRC20_SCANNER_CRON_SECRET` | Long random secret; use the exact same value in the GitHub Actions secret below. |
| `USDT_CHECKOUT_ENABLED` | Keep `false` until every launch gate and payment test has passed. |
| `PREMIUM_CHECKOUT_ENABLED` | Keep `false`; Premium is not part of this release. |
| `ALLOWED_SITE_ORIGIN` | Exact HTTPS origin of the deployed Bullseye course website. |

Supabase injects its project URL and service-role key into Edge Function runtime environments. Do **not** create browser-visible copies or print those values in logs. Do not add a `COURSE_ACCESS_DAYS` override; 85 days is enforced in code and database.

## Free scheduled scanner — GitHub Actions (recommended)

The repository has `.github/workflows/trc20-payment-scan.yml`. It runs every five minutes, but its job is gated by the repository variable `TRC20_SCANNER_ENABLED`. The free GitHub Actions route does not need Supabase `pg_cron`, `pg_net`, a paid Supabase branch, or a Supabase cron job.

In GitHub → repository → Settings → Secrets and variables → Actions:

**Repository secrets**
- `SUPABASE_URL` — `https://kjhdcpjztuzpysdauqdz.supabase.co`
- `TRC20_SCANNER_CRON_SECRET` — the exact same random value configured in Supabase Edge Function Secrets.

**Repository variable**
- `TRC20_SCANNER_ENABLED` — leave unset or `false` during setup. Set to `true` only after the scanner secrets are saved and a safe manual scanner check is ready.

The GitHub workflow sends a signed POST to `scan-trc20-payments`; it does not read or need the Supabase service-role key. To run a manual check, open Actions → TRC20 Payment Scanner → Run workflow and set `run_now=true`. Do this only after both GitHub secrets and both Supabase scanner secrets are configured. With no pending orders, a healthy response should report zero pending and zero verified transfers.

Do not enable the scanner by setting the repository variable before the matching secret is in place. Do not create a Supabase `pg_cron` schedule in parallel; there should be one scanner scheduler, not two.

## Safe verification gates before opening checkout

- Confirm the public payment-config endpoint reports checkout disabled before enabling anything.
- Confirm unauthenticated order creation is rejected and a student cannot read another student's order.
- Confirm the scanner rejects a request without its bearer secret.
- Confirm a scanner run with no pending orders completes without errors.
- Test wrong contract, wrong wallet, wrong amount, unconfirmed transfer, failed execution, missing solidified receipt, expired order, duplicate transaction, ambiguous order and unmatched deposit. None may unlock access.
- Obtain explicit business-owner/accountant approval before a tiny real TRON transfer test. Transfers are irreversible; never send a test amount without that approval.
- After the test, verify the paid order, transaction row, `course_access.payment_verified`, the 85-day expiry, dashboard access and all direct paid lesson URLs. Verify expiry/logout and that the browser cannot set entitlement.
- Complete sign-up, login, free Lesson 1, paid lesson denial before payment, paid lesson access after verified payment, quiz grading, lesson completion and certificate checks.
- Keep checkout closed until these checks and the applicable written business/legal/tax review are complete.

## Cloudflare release gate

The Worker entitlement gate must be deployed before paid course enrollment. Repository CI already passed its local Wrangler dry-run; that is not a production deployment. The current remote Cloudflare preview failure needs its actual log before a code fix can be selected.

To inspect it: Cloudflare Dashboard → Workers & Pages → `bullseye-theory` → Deployments → View Build History → open the latest failed build → copy the first error and the few lines around it. Do not retry or deploy production until the cause is understood. Cloudflare's documented build-history path is in [Workers Builds troubleshooting](https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/).

## Commercial pages and owner decisions

The repository's Terms and Refund pages still contain pre-launch wording. Before accepting paid enrollment, the owner must publish accurate final terms, refund/cancellation policy, privacy details, business/support details and applicable CA/legal decisions. These must not be invented by an automation. UPI is not configured, so do not advertise UPI as available. PayPal is not configured.

Support currently shown in the project: `eyetheorybulls@gmail.com`.
