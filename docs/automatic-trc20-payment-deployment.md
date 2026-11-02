# Bullseye Theory — USDT TRON Mainnet payment setup

## Current state

Implementation source is in draft PR #36. On 2026-11-02, the linked Supabase project received the course-progress, function search-path, TRC-20 payment, quiz-answer isolation, table-privilege, 85-day entitlement, and RLS/index hardening migrations. The six Edge Functions (`grade-quiz`, `complete-lesson`, `get-trc20-payment-config`, `create-trc20-order`, `get-trc20-order-status`, `scan-trc20-payments`) are deployed. **Checkout remains closed**: no TRONGRID API key or scanner secret has been configured, and no scanner schedule has been enabled. Deployment does not mean payments are accepted. The website shows the supplied QR with a visible closed-checkout warning.

## Approved receiving details supplied by the owner

- Asset: USDT (Tether USD₮)
- Network: TRON Mainnet
- Token standard: TRC-20
- Receiving address: `TF8aiK6Q8kboLBcaHtckapVpsEQyR3oWwV`
- Official USDT TRC-20 contract: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`
- QR asset: `assets/usdt-tron-mainnet-trc20.svg`

The QR encodes the receiving address only. It does not embed a chain selector, token contract, or amount. A customer wallet must explicitly be set to TRON Mainnet / TRC-20. Never describe the address as an Ethereum ERC-20 or BNB Smart Chain BEP-20 destination.

## Automated payment design

1. The student signs in and chooses the Complete Course. Standard course access lasts exactly 85 days from verified payment. Premium remains disabled until its benefits, access period, and Telegram provisioning are published.
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
- Course access duration is fixed in the database and checkout code at 85 days. There is no `COURSE_ACCESS_DAYS` secret to configure. Do not add an environment override.
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


## Free scheduled scanner (GitHub Actions)

The scanner can run every five minutes through GitHub Actions; a paid Supabase branch or `pg_cron` extension is not required.

Keep it disabled until the payment tables and Edge Functions have been deployed and tested in a disposable/local Supabase environment. Then configure:
- Repository variable `TRC20_SCANNER_ENABLED=true`.
- GitHub secret `SUPABASE_URL`.
- GitHub secret `TRC20_SCANNER_CRON_SECRET`, matching the Edge Function secret of the same name.
- Supabase Edge Function secrets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `TRONGRID_API_KEY`.

The workflow sends only a signed POST to `scan-trc20-payments`; it does not read the service-role key. It is gated by the repository variable and cannot run on schedule while that variable is absent/false. Manual dispatch additionally requires `run_now=true`. Do not enable the scanner until the Edge Function is deployed and its secrets are verified.
