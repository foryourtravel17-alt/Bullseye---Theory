# Bullseye Theory — manual enrolment SOP

Last reviewed: 26 November 2026

## Customer account first

1. Ask the customer to open `auth.html` and create their own account with the email address they will use for the course.
2. The admin panel does not create login credentials or set a customer's password. Never ask the customer to send you their password or one-time code.
3. After the customer signs up, open `admin.html` using the owner's admin account and press **REFRESH STUDENTS**.

## Grant Complete Course access

1. Confirm the customer email and the product they requested.
2. Handle any separately agreed payment arrangement privately. Before accepting money, provide the product-specific written price, deliverables, access period and cancellation/refund terms.
3. Independently verify enrolment; do not rely on screenshots or customer-entered claims alone.
4. In **Grant or update student access**, select the correct student email.
5. Leave **Access expiry** blank for the standard 85-day course term. Use a later date only for an approved, documented extension.
6. Enable **Course access active** and **Manual enrollment check confirmed**.
7. Press **SAVE ACCESS**. Confirm the success status and refresh the student list.
8. Ask the customer to sign in and verify that their dashboard and protected course resources open.

The database enforces the 85-day default for an active admin grant when no expiry date is supplied. The customer must have both active access and the manual confirmation flag to enter protected lessons.

## Premium Bundle

- The Premium Bundle is intended to include the Complete Course and private Telegram membership.
- Grant the course component using the steps above.
- Add the customer to the private Telegram destination manually only after confirming the agreed bundle and Telegram access term.
- Record the agreed Telegram expiry outside the public website; do not imply Telegram access is automatically provisioned by the course admin panel.

## Indicator

- The ₹9,999 listed price is informational only.
- Do not activate or sell indicator access until the permitted data source and production entitlement controls are ready.
- The current admin UI intentionally reports that indicator controls are not deployed when the required database functions are absent.

## Revoke or correct access

- To revoke course access, select the student, turn off **Course access active** and **Manual enrollment check confirmed**, then save.
- To correct an expiry, set the approved future date and save.
- Never edit course access tables directly from a browser or bypass the admin RPC.

## Important boundaries

- The website does not collect payments, create orders, scan transfers or automatically grant paid access.
- Do not add payment gateway, UPI/QR checkout, wallet addresses or payment polling to the site.
- Keep customer credentials private. Do not share admin login credentials with customers.
