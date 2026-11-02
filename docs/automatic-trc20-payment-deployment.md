# Bullseye Theory — USDT TRON Mainnet payment setup

## Current state

This is an implementation draft in a GitHub pull request. It is **not deployed to the live Supabase project**, and checkout must remain closed until the launch checklist is complete. The website shows the supplied QR with a visible closed-checkout warning.

## Approved receiving details supplied by the owner

- Asset: USDT (Tether USD₮)
- Network: TRON Mainnet
- Token standard: TRC-20
- Receiving address: `TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV`
- Official USDT TRC-20 contract: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`
- QR asset: `assets/usdt-tron-mainnet-trc20.svg`

The QR encodes the receiving address only. It does not embed a chain selector, token contract, or amount. A customer wallet must explicitly be set to TRON Mainnet / TRC-20. Never describe the address as an Ethereum ERC-20 or BNB Smart Chain BEP-20 destination.

## Automated payment design

1. The student signs in and chooses the Complete Course. Premium remains disabled until the offer's benefits and access period are published.
2. `create-trc20-order` authenticates the Supabase user from their JWT. It does not accept a user ID or amount supplied by the browser.
3. The server fetches a fresh USDT/INR spot quote, reserves the fixed INR plan price, adds a small unique six-decimal USDT suffix, and stores a 20-minute order. If the price provider is unavailable or an amount collision occurs, order creation fails closed.
4. The page displays the exact amount, expiry, QR, network, and destination. A rounded or reused amount is not accepted as an order match.
5. `scan-trc20-payments` runs on a schedule and queries TronGrid's confirmed TRC-20 transfer history filtered by the official USDT contract.
6. Before crediting a payment, the scanner separately checks the transaction body and execution receipt through TRON SolidityNode endpoints. The transaction ID, successful contract result, receipt result, solidified block, destination, contract, exact token base units, and order time window must all match.
7. A database function records the transaction and updates `course_access` in one transaction. Unique transaction/order constraints and row locking make retries idempotent. Browser-submitted screenshots or transaction hashes are never payment proof.
8. A confirmed deposit that does not match exactly one active order is recorded as an unmatched review event and is not credited automatically.

### What this code unlocks

A paid TRC-20 order unlocks the Bullseye course through the existing `course_access` entitlement. It does not yet provision Telegram Premium membership, send a Telegram invitation, or implement a renewal/subscription. Do not advertise those as automatic until the separate entitlement workflow and terms are completed and tested.

## Supabase Edge Function deployment settings

Deploy the following functions only after the migration has been reviewed and the code is merged to the intended release branch:

| Function | JWT gateway verification | Purpose |
|---|---|---|
| `get-trc20-payment-config` | Off | Public, read-only checkout status and public receiving details |
| `create-trc20-order` | On | Signed-in student creates an order |
| `get-trc20-order-status` | On | Signed-in student reads only their own order |
| `scan-trc20-payments` | Off, with its own bearer-secret check | Scheduled server-side chain verifier |

The scanner is safe only when `TRC20_SCANNER_CRON_SECRET` is set to a long, random value in Supabase Function Secrets and the exact same value is stored in Supabase Vault for the cron invocation. Do not put it in browser JavaScript, GitHub source, or a customer-facing URL.

### Required Edge Function secrets

Set these in Supabase Dashboard → Edge Functions → Secrets:

- `USDT_CHECKOUT_ENABLED=false` initially. Change to `true` only after all gates pass.
- `PREMIUM_CHECKOUT_ENABLED=false`. Keep false until Premium deliverables/access duration are final.
- `COURSE_ACCESS_DAYS` — a positive integer from 1 to 3650 that exactly matches the published course access duration. Checkout will fail closed if this value is missing or invalid; do not set this to an arbitrary value to bypass the policy gate.
- `TRONGRID_API_KEY` — production TronGrid key. Do not rely on anonymous or undocumented rate limits.
- `TRC20_SCANNER_CRON_SECRET` — independently generated random secret used only by the scheduled scanner.
- `ALLOWED_SITE_ORIGIN=https://bullseye-theory.foryourtravel17.workers.dev`

Supabase injects its project URL and server role key into Edge Function runtime environments. Never copy the service-role key into `supabase-config.js`, HTML, client JavaScript, or GitHub Actions logs.

## Scheduled scanner setup

Supabase's documented schedule pattern uses `pg_cron` with `pg_net`, and recommends storing the function invocation token in Vault.

1. Enable the `pg_cron`, `pg_net`, and `supabase_vault` extensions in the Supabase project.
2. Store the project URL, publishable key, and scanner bearer secret in Vault using the SQL editor. Replace the placeholders locally; never commit actual values:

```sql
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
select vault.create_secret('YOUR_SUPABASE_PUBLISHABLE_KEY', 'publishable_key');
select vault.create_secret('YOUR_TRC20_SCANNER_CRON_SECRET', 'trc20_scanner_cron_secret');
```

3. Schedule the function every minute:

```sql
select cron.schedule(
  'bullseye-scan-trc20-payments',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/scan-trc20-payments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key'),
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'trc20_scanner_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Do not schedule this job before the scanner function and its secrets exist. Confirm successful invocation in Supabase Function Logs and `cron.job_run_details`.

## Required tests before enabling checkout

**CI verification already completed on 2 November 2026** (commit `8febef1202a7cd75ff61f4bdbf8cc1bae1e52d1c`):
- The payment migration was applied to a disposable PostgreSQL 17 CI service.
- The SQL finalizer integration test passed for successful paid unlock, idempotent retry, duplicate transaction, wrong amount, wrong destination, wrong token contract and expired order.
- Deno unit tests passed for confirmed TRC-20 history, exact USDT contract, exact Transfer receipt event, amount, destination, order window and solidified successful receipt.
- The four payment Edge Functions passed Deno type-checks and the checkout JavaScript passed Node syntax validation.

This disposable database test does not connect to the customer's live Supabase project or send a real blockchain transfer.

Remaining before enabling checkout:
- Apply the migration in a disposable local/test database or a separate free staging project; do not run it against production as a shortcut.
- Deploy the four functions to that test target with the settings above.
- Confirm the config endpoint says checkout is closed by default.
- Confirm anonymous users cannot create orders or read another user's order.
- Confirm the INR plan price comes only from server code, the quote fails closed when unavailable, and amount collisions retry safely.
- Test wrong token contract, wrong recipient, wrong amount, wrong decimal precision, unconfirmed transfer, failed contract execution, missing solidified receipt, expired order, duplicate tx hash, ambiguous order and unmatched deposit. None may unlock access.
- Test one successful confirmed TRON Mainnet transfer with a tiny real amount only after the accountant/business owner explicitly approves the test and understands the transfer is irreversible.
- Verify the paid order, transaction row, `course_access.payment_verified`, dashboard access, and all direct lesson URLs after unlock; also verify logout/expiry and that no browser can set its own entitlement.
- Review Supabase Security and Performance Advisors after applying schema changes.
- Only after the test target passes should the business owner approve applying migrations and deploying production functions. Keep `USDT_CHECKOUT_ENABLED=false` until the final live smoke test passes.

## Other launch gates

- The official Indian UPI QR has not been supplied in this repository; UPI stays inactive.
- PayPal is not configured.
- The Complete Course refund/cancellation terms, support SLA and access duration still need a final published policy. The current refund page explicitly says a final policy is not available.
- Premium benefits, access duration and Telegram entitlement automation are not final; premium checkout remains disabled.
- The accountant checked the supplied wallet QR according to the owner. That QR check does not by itself settle the business's tax, TDS, GST, VDA, bookkeeping or legal position. Keep the CA/legal review and its written approval with the business records.
- Do not accept a payment while the site shows checkout closed.

Support: `eyetheorybulls@gmail.com`.
