# Retired online payment integration — 26 November 2026

The owner has chosen a manual-enrolment model. This historical payment integration is retired and must not be re-enabled.

- The public website displays product prices only. It does not collect payments or create payment orders.
- The four Supabase Edge Function routes `create-trc20-order`, `get-trc20-order-status`, `get-trc20-payment-config` and `scan-trc20-payments` have been replaced in production with HTTP 410 disabled stubs and JWT verification is required.
- The GitHub Actions payment scanner schedule has been removed. The remaining manual-dispatch workflow is a no-op retirement notice.
- The browser checkout script is a defensive no-network stub and is not linked from the public pages.
- The former QR artwork and customer-facing wallet instructions are retired and must not be published or reused.
- Historical payment database tables/migrations are retained for migration history and audit compatibility. They currently have zero rows, RLS is enabled, and browser roles have no table privileges. Do not drop or reactivate them as part of normal course enrolment.
- Course access is granted only by the administrator through the course admin panel after independently confirming a separately arranged manual enrolment. The customer must create an account first.
- Premium Telegram access is added separately by the administrator. Indicator access remains unavailable until its permitted data source and production entitlement controls are ready.

Do not configure `USDT_CHECKOUT_ENABLED`, `TRC20_SCANNER_ENABLED`, TronGrid secrets or any payment scanner schedule. Do not add a payment gateway, UPI/QR checkout, wallet, order form, payment polling or automatic fulfilment without a new explicit owner decision.
