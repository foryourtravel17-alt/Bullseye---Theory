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
- Third-party TradingView quotes remain separate from the fictional fixtures. Provider delay/availability and Bullseye's own redistribution rights have not been independently established; verify applicable provider/exchange terms before release and disable the embed if permitted display cannot be confirmed.
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
