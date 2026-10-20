# Zero-Budget First-Sale Readiness

Status: internal working checklist — not a claim that the product is ready to sell.

## Budget guardrail
- Keep incremental spend at ₹0 until the first verified course sale.
- Do not buy AI subscriptions, paid schedulers, ads, domains, or hosting upgrades without explicit approval.
- Existing provider fees and payment transaction fees may still apply; disclose them before enabling checkout.
- Keep all social publishing approval-gated.

## Verified from the current feature branch
- Membership page lists ₹999 Course and ₹1,999 Premium as planned prices and explicitly says payments are disabled.
- Supabase browser configuration contains a publishable key only; never add a service-role or secret key to browser code.
- Student dashboard reads `course_access` and hides lesson links unless access is active.
- Lesson pages are static HTML routes. Client-side dashboard gating alone does not protect lesson content from direct URL access.
- No checkout should be enabled until a trusted server-side payment verification path and database access policies are confirmed.
- Market Lab examples must remain visibly simulated, not live prices or trade signals.

## Release blockers — resolve before accepting money
1. **Access enforcement:** inspect Supabase RLS policies for `course_access`, `lesson_progress`, and any lesson-content storage. Ensure a student cannot grant themselves access or read another user's records. Static lesson files are public if deployed as ordinary assets; move paid lesson content behind verified server-side authorization or clearly classify it as public preview content.
2. **Payment verification:** choose a payment provider only after checking its zero-upfront-cost option and transaction fees. Verify payment on a trusted server/webhook; never activate access from a browser redirect alone.
3. **Purchase terms:** state one-time/recurring status, course access duration, support contact, refund/cancellation terms, and privacy/data handling before checkout.
4. **Auth & progress:** test signup, email confirmation, login, password reset, logout, progress save/load, and expected failures on the deployed preview.
5. **Content QA:** verify all eleven lesson routes and assets exist, mobile navigation works, and demo data is labelled as simulated.
6. **Release safety:** run the repository build and checks on the current PR head. Do not merge or deploy until the user explicitly approves the release after checks pass.

## Free-first acquisition loop
1. Publish one useful educational post and one short reel draft at a time; review before publishing.
2. Use a clear CTA to the free Market Lab or student-interest signup, without implying payment is enabled.
3. Invite interested people to a Telegram/community channel only after the link and moderation settings are verified.
4. Track post, profile visits, link clicks, inquiries, and conversions in a simple spreadsheet.
5. Reuse the topics that earn meaningful saves, shares, and qualified inquiries; avoid buying reach before organic message-market fit is visible.

## First-sale definition
Count a first sale only after a real payment is confirmed by the payment provider and the corresponding access grant is verified server-side. Test/sandbox transactions and verbal interest do not count.
