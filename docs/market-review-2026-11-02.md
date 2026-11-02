# Market Lab review — 2026-11-02

> Draft internal QA record. This is not a live market brief and is not approved for publication as investment research.

## Decision

- No instrument-level or directional market update is warranted. The bullish, range and bearish scenarios remain generic conditional learning examples with observable conditions and invalidation; no evidence reviewed supports changing them.
- All sample values remain fictional demo fixtures. `market-briefs.json` remains `mode: educational_demo` and `dataStatus: simulated`; every sample instrument remains `fictional_demo_only`. No current prices, company results, macro figures, probabilities, forecasts, returns or price targets were added.
- A small educational update is warranted: learners are now prompted to check the official exchange event calendar and verify the actual filing before interpreting a scheduled board meeting or results date. The Market Lab also clarifies that its Factory Feed reads the sanitized approved-only feed, not raw factory state.
- Review metadata records this completed review: `lastReviewed=2026-11-02`, `nextReviewDue=2026-11-05`.

## Primary sources checked

1. **NSE — Corporate Filings Event Calendar** (checked 2 Nov 2026): https://www.nseindia.com/companies-listing/corporate-filings-event-calendar. The page lists scheduled board meetings and financial-results items. A calendar entry is a scheduled event, not the result itself; verify the subsequent exchange-filed disclosure before describing an outcome.
2. **NSE — Data Sharing & Usage Policy**: https://www.nseindia.com/static/market-data/nse-data-policy. The policy governs use, sharing, distribution/redistribution and display of NSE market data. No independent Bullseye market-data licence or redistribution entitlement was verified.
3. **SEBI — Legal / Circulars index** (checked 2 Nov 2026): https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListingAll=yes&sid=1&smid=0&ssid=7. The latest listed circulars included 30 Oct 2026 items on digital-accessibility compliance timelines and FPI KYC review periodicity, plus 27 Oct debenture-trustee compliance timelines. These do not support a change to the generic Market Lab scenarios.
4. **SEBI — Institutional-client call-record requirements for Research Analysts / Research Entities** (23 Oct 2026): https://www.sebi.gov.in/legal/circulars/oct-2026/review-of-regulatory-requirement-for-maintenance-of-call-records-of-institutional-clients-by-research-analysts-or-research-entities_105400.html. Recorded as a compliance watch item only; no legal interpretation is made here.
5. **SEBI — Closing Auction Session, market timings and derivatives settlement methodology** (15 Oct 2026): https://www.sebi.gov.in/legal/circulars/oct-2026/review-of-certain-aspects-of-the-closing-auction-session-market-timings-and-settlement-methodology-for-derivatives-contracts_105293.html. This supports checking instrument/session/expiry context, not changing the demo's market-direction scenarios.
6. **RBI — Press Releases** (checked 2 Nov 2026): https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx. The current list included money-market operations dated 30 Oct and other scheduled/operational releases. No RBI figure or market-direction inference was copied into the Market Lab.

## Content, feed and compliance guardrails

- The three scenario alternatives remain conditional and educational, not forecasts or personalised buy/sell/hold advice. No price targets or confidence/probability claims were added.
- The fictional sample watchlist values were not edited or relabelled as live data.
- The public sanitized factory feed at https://raw.githubusercontent.com/foryourtravel17-alt/ai-trending-content-factory/main/data/approved_market_feed.json reports `generatedAt=2026-10-27T05:35:44Z` and `records=[]`. It is older than the eight-hour observation window and contains no approved observations. The Market Lab should therefore show no current approved factory observations until a fresh, human-approved record is generated.
- **Security issue remains open:** the connected `ai-trending-content-factory` repository is public and raw `data/state.json` remains directly readable. The inspected file contains historical draft signal fields, including numeric entry/stop/target data and expired records. The Market Lab fetches the sanitized allow-list, but this does not make the raw repository state confidential. Move raw state to private storage and review repository history before treating pre-approval levels as confidential. Do not place credentials in public files.
- A material compliance gap was identified: the homepage and Market Lab contained live third-party ticker embeds, and the Market Lab rendered fresh approved factory observations (age window up to eight hours). Human approval and provider delay labels do not establish that this use is permitted for an India-facing educational product. SEBI Circular HO/47/17/12(11)2025-MRD-POD3/I/11107/2026 dated 8 May 2026, effective 1 July 2026, prescribes a 30-day lag for sharing and usage of market price data for investor education/awareness; its one-day exception is specific to NISM's simulation lab. The circular also requires appropriate agreements and audit-trail safeguards. Official source: https://www.sebi.gov.in/legal/circulars/may-2026/norms-for-sharing-and-usage-of-price-data-for-educational-purposes_101293.html. This is an operational summary, not a legal opinion.
- Pricing intent remains **₹999 standalone course** and **₹1,999 Premium bundle including the course**. Billing duration, renewal/cancellation/refund terms, support, gateway and server-side payment verification remain unfinished. Payments and checkout must stay disabled.

## Stale content, links and release status

- The visible Market Lab fallback review date was 29 Oct 2026; it is synchronized to 2 Nov 2026. The page also loads the review date from `market-briefs.json`.
- The 19 Oct and 29 Oct review notes are historical records and should remain dated as such.
- The local link validator checks core local references and required guardrail strings; it is not a complete external-link crawl or browser/device QA. The NSE event-calendar URL opened during this review. The official source pages above were reachable during the review.
- PR #11 remains **open, draft and unmerged** on `feat/bullseye-companion-terminal-memberships`; GitHub reports `mergeable=false`. The canonical default branch is `main`, which does not yet contain the Market Lab files. The PR description still records a Cloudflare Workers Builds blocker and outstanding mobile/browser QA and live Supabase migration verification; those release gates must be rechecked before any merge.
- The previously recorded Market Lab Review Guard run 40818994686 completed successfully on the prior reviewed head. No production deployment, merge or auto-publication was performed in this review.

## Review bookkeeping

- Completed review: **2026-11-02**.
- Next review due: **2026-11-05**.
- Market scenario pack content changed: **No**.
- Educational checklist/provenance copy changed: **Yes**.
- Production deployment or publication: **Not performed**.


## Compliance remediation added after the initial review

- Updated `docs/market-briefing-policy.md` with the SEBI 8 May 2026 circular, effective 1 July 2026: 30-day lag for educational price-data sharing/use, narrow NISM simulation-lab exception, agreement/audit-trail controls, and a requirement for qualified legal review. Bullseye must not assume the NISM exception applies.
- Removed the TradingView ticker embeds from `index.html` and `terminal.html`. The homepage hero's stale numeric XAUUSD/BTCUSD overlays were replaced with non-price learning labels.
- Paused rendering of the public factory approved-observation feed in `terminal.html`. A Telegram approval does not establish data age, licensing or educational-use eligibility.
- Added `scripts/validate-market-data-guardrails.mjs` and wired it into `npm run build` / `npm test`. It checks that ticker embeds, stale quote overlays and recent public factory-feed rendering do not regress, and that the SEBI policy and fictional fixture labels remain.
- Existing `market-briefs.json` scenario pack and fictional sample values were not changed. Review metadata remains 2026-11-02 / 2026-11-05 because this review was completed on 2 November.
- These changes are draft-only on `feat/bullseye-companion-terminal-memberships`. They do not establish legal compliance or data rights; obtain qualified Indian securities-law review before re-enabling any live/recent data display.
- Required next verification: run the branch's GitHub Actions on the latest head; visually QA the changed homepage/Market Lab on mobile and desktop; resolve PR #11's base-branch divergence/conflicts; separately remediate the public factory raw-state exposure and reconcile course-security PRs #14/#27/#30/#31/#32. No merge, production deploy, Supabase migration or publishing was performed.

## Follow-up verification addendum — 2026-11-02

This addendum supersedes the earlier pre-remediation sentence suggesting that a fresh, human-approved factory observation could be displayed. **Current release decision: keep all factory observations disabled in Market Lab**, whether approved or not. Telegram approval does not establish data age, licensing, exchange permission or regulatory eligibility.

### Primary-source clarification

- The SEBI circular dated 8 May 2026 (effective 1 July 2026) prescribes a 30-day lag for both sharing and usage of market-price data for educational purposes. Its sharing clause is framed for investor education/awareness without monetary incentives to participants and requires an appropriate legal agreement; the circular also calls for safeguards including audit trails. Its separate clarification restricts use of the preceding 30 days' market-price data to speak about or display a security's name (including a code name) in content indicating a future price, advice or recommendation. The one-day exception is specific to NISM's simulation lab. This operational summary is not a legal opinion and does not determine whether a paid course or membership qualifies.
- NSE's Data Sharing & Usage Policy requires a relevant agreement to define permitted use and handling; redistribution is not permitted except as agreed in that agreement. No Bullseye-specific data licence or redistribution entitlement was verified.
- The SEBI legal index checked on 2 November 2026 showed later October circulars, but no later educational market-price-data circular was identified in that index. No market-direction update is supported by these compliance notices.

### Additional findings and draft corrections

- The separate public `ai-trending-content-factory` repository still exposes `data/state.json` directly. A current public fetch confirms that it contains draft signal direction, entry/stop/target and indicator fields. This is an information-exposure issue even though Bullseye Market Lab no longer reads that file. Move raw state to private storage and review repository history; do not treat the sanitized feed as making raw state private. No credentials were confirmed by this limited inspection, and it is not a complete secret/history scan.
- The current `terminal.html` intentionally contains no raw-state or approved-feed fetch and no live/recent quote widget. Keep both disabled until written permissions and qualified compliance review establish the exact permitted use.
- The site-link validator still encoded the former design: it required the sanitized feed, approval checks, an eight-hour freshness window and third-party quote-widget wording, while the newer market-data guard correctly prohibited the feed and ticker. Those mutually exclusive assertions made the validation contract internally inconsistent. The validator has been updated in this draft to assert the paused-data design instead.
- The homepage still said “one-time enrollment” and “lifetime access” while the membership policy and membership page state that duration is undecided. The homepage wording has been corrected; ₹999 remains the planned standalone course price and ₹1,999 the planned Premium bundle price including the course. Payments remain disabled until duration, renewal/cancellation/refund terms, support, gateway and server-side verification are finalised.
- `market-briefs.json` was not changed: the three scenarios remain conditional, observable and invalidatable; all sample values remain fictional. Review dates remain `lastReviewed=2026-11-02` and `nextReviewDue=2026-11-05`.

### Verification limitations

- GitHub returned no PR-triggered workflow runs or commit status entries for the current PR head `8753ee5e527eb5323776ecd4f0863179fd1bdb56` during this review. The latest Cloudflare deployment comment reported a failed build for commit `4db2bbd` at 2026-11-02 12:49 UTC. The full local `npm test` could not be executed in this session because the isolated runtime could not reach GitHub to clone the private repository. The new CI run must be checked on the updated head before calling tests green.
- PR #11 remains draft and unmerged. The feature branch is 78 commits ahead and 54 behind `main`, and GitHub reports `mergeable=false`. Resolve the divergence/conflicts separately; no merge, production deployment, Supabase migration, payment activation or publishing was performed.

### Course-access security check

- Static lesson files such as `lesson-2.html` and `lesson-11.html` contain the lesson body in the delivered HTML and perform the entitlement check in browser JavaScript. A redirect after page load is not server-side content protection; direct requests/page-source can expose the lesson body. This is a release blocker for paid-content claims and checkout. Keep payments disabled until paid lesson content is served only after server-side authorization and bypass tests prove that direct URLs, signed-out sessions and non-entitled accounts cannot retrieve it.
- PR #32 is still open/draft and describes server-side quiz grading/completion plus client migration; that description does not establish that the lesson HTML body itself is behind a server-side authorization boundary. PR #14 also explicitly records static paid-content exposure. Reconcile the security PRs and verify the actual content-delivery boundary, not only quiz APIs.
- `terms.html` and `refund.html` were not found in this branch; `legal.html` is a pre-launch placeholder asking for business identity, support and payment/refund terms. The membership page correctly says access duration and billing terms are undecided and payments are disabled. These documents and support details remain owner/legal tasks before checkout.

