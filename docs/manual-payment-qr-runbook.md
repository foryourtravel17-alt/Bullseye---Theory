# Bullseye Theory — manual QR payment runbook

**Status: preparation only. Enrollment and all payment methods remain disabled.**

## Planned pricing
- Complete Course: ₹999.
- Premium Bundle: ₹1,999; includes the course.
- Access duration, renewal/cancellation terms, refund policy and final support commitments are not yet approved. Do not collect payment until these are published and reviewed.

## Payment methods being prepared
- India: official UPI QR is expected from the owner. Do not publish a placeholder or an unofficial QR.
- International: owner reports a USDT QR is available. Before displaying it, record and independently verify the exact network, token contract, destination address, wallet custody and a small test transfer. Never assume TRC20 from the label USDT alone.
- PayPal remains an inactive placeholder and is not part of this readiness change.

## Customer workflow after launch approval
1. Customer creates a Bullseye student account and selects Course or Premium.
2. Payment page displays only the approved QR and exact amount/asset/network instructions.
3. Customer sends the registered account email, selected plan, amount, payment method, date/time and transaction reference to the published support channel. Never request passwords, OTPs, private keys or wallet seed phrases.
4. Admin independently verifies settlement in the bank/payment account or by checking the correct blockchain, token contract, destination address, amount, transaction status and required confirmations. A screenshot or user-supplied transaction hash alone is not proof.
5. Admin records the verification evidence in the business's secure accounting records and activates course access using the protected admin workflow. Access duration must be set from the published offer terms.
6. Admin separately verifies Premium entitlements (course included plus the final approved Premium benefits); no Premium benefit is promised until its scope and duration are defined.
7. Failed, underpaid, duplicate, wrong-network, pending and refunded transactions are not activated. Customer support follows the published refund/cancellation policy.

## Technical controls already present
- The existing admin page uses the protected `admin_set_course_access` RPC, which checks admin status and records `payment_verified`, `is_active` and optional expiry.
- This QR workflow does not create automatic payment verification, webhook handling or automatic unlock.
- Do not let a browser form or screenshot set `payment_verified=true`.
- Keep checkout closed until course entitlement and server-side paid-content protection are verified.

## Owner/compliance actions before enabling
- Upload the actual official UPI QR and confirm the UPI payee/business name.
- Upload the actual USDT QR and confirm network, token contract, wallet address and a verified test transfer. If QR is multi-chain, specify exactly which chain the business will support.
- Obtain qualified Indian CA/legal advice on accepting USDT as consideration for course services, including VDA classification, section 194S/TDS where applicable, income-tax, GST, bookkeeping, and any applicable payment/foreign-exchange requirements. Applicability depends on the transaction structure and facts.
- Finalise one-time/recurring billing intent, access duration, renewal/cancellation, refund policy, customer support SLA and Premium deliverables.
- Test manual verification and admin access activation with a dedicated test account before accepting a real customer payment.
- Never deploy or publish the QR until the owner has reviewed the exact image and wallet/UPI details.

## Source note
The Income Tax Department's current official material includes section 194S on consideration for transfer of a virtual digital asset and guidance describing possible TDS responsibilities for certain VDA-for-services arrangements. Obtain advice for Bullseye's actual structure; this runbook is not tax/legal advice:
- https://www.incometaxindia.gov.in/w/section-194s-3
- https://wm.incometax.gov.in/w/tds-on-payment-for-the-transfer-of-virtual-digital-assets-vdas-
