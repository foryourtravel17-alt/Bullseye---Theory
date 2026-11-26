# Market Lab review — 2026-10-29

> Draft internal QA record. This is not a live market brief and is not approved for publication as investment research.

## Decision

No instrument-level market update is warranted. The current scenario pack remains generic and conditional; it does not need a market-direction change based on the sources reviewed. The current approved factory feed contains zero records, so there is no approved, fresh observation to summarize. No current prices, macro figures, company-event claims, probabilities, forecasts, or price targets were added. All sample instrument values remain fictional demo fixtures.

A small educational and compliance update is warranted: the pre-trade checklist now asks learners to verify instrument, exchange/segment, timeframe, data timestamp/timezone, and relevant session or expiry context before interpreting a chart. The third-party quote widget is now explicitly distinguished from Bullseye's fictional fixtures, and the policy records the same boundary.

## Primary sources checked

1. **SEBI, 15 October 2026** — [Review of certain aspects of the Closing Auction Session, market timings and settlement methodology for derivatives contracts](https://www.sebi.gov.in/legal/circulars/oct-2026/review-of-certain-aspects-of-the-closing-auction-session-market-timings-and-settlement-methodology-for-derivatives-contracts_105293.html). The official title and date were verified. This review uses it only to motivate checking session/settlement context; it does not infer exact operational changes or effective dates from the title.
2. **SEBI, 23 October 2026** — [Review of regulatory requirement for maintenance of call records of institutional clients by Research Analysts or Research Entities](https://www.sebi.gov.in/legal/circulars/oct-2026/review-of-regulatory-requirement-for-maintenance-of-call-records-of-institutional-clients-by-research-analysts-or-research-entities_105400.html). This is a compliance watch item, not a reason to change generic market scenarios. Qualified advice is required before offering services that may fall within regulated research/advice.
3. **SEBI, 10 October 2026** — [Research Analysts (Amendment) Regulations, 2026](https://www.sebi.gov.in/legal/regulations/oct-2026/securities-and-exchange-board-of-india-research-analysts-amendment-regulations-2026_105155.html). The official title and date were verified; no legal interpretation is made in this note.
4. **NSE** — [Data Sharing & Usage Policy](https://www.nseindia.com/static/market-data/nse-data-policy). The policy states that commercial market-data use and redistribution are governed by the relevant agreement and restrictions. No independent Bullseye data licence was verified.
5. **NSE** — [Official corporate filings and announcements](https://www.nseindia.com/companies-listing/corporate-filings-application?id=allAnnouncements). Checked as the primary-source index; no company-specific event was incorporated into the demo scenario pack.
6. **MoSPI** — [Advance Release Calendar](https://www.mospi.gov.in/advance-release-calendar). The calendar lists the September 2026 CPI release on 12 October 2026. No CPI figure or macro conclusion was copied into the product.

## Content and guardrails

- `market-briefs.json` remains `mode: educational_demo`, `dataStatus: simulated`; every sample instrument remains `fictional_demo_only`.
- Bullish, range and bearish scenarios remain conditional alternatives with observable conditions and invalidation. They are not forecasts or personalised buy/sell/hold advice.
- The third-party quote widget remains separate from the fictional sample fixtures. Its provider availability and delay may vary. This review did not verify a separate Bullseye market-data licence or redistribution permission.
- The factory's sanitized public feed at `data/approved_market_feed.json` currently reports `records: []` (generated 2026-10-27). No approved observation is available to publish.
- **Security issue still open:** the connected `ai-trending-content-factory` repository is public and its raw `data/state.json` contains historical draft signal fields/levels. The Market Lab page reads the sanitized approved feed, not that raw file, but the public raw file is still directly accessible. Move raw state to private storage and restrict access before treating pre-approval drafts as confidential; do not put secrets in a public repository.
- Membership intent remains **₹999 standalone course** and **₹1,999 Premium bundle including the course**. Duration, renewal/cancellation/refund terms and support process are not finalized. Payments must remain disabled pending these decisions and server-side payment verification.
- The 2026-10-19 review note is a historical record. Its statement about literal homepage demo-price fixtures was not confirmed by this review's source scan of `index.html`; the Market Lab's own numeric fixtures are visibly labelled SIMULATED. The stale fallback review date in `terminal.html` was synchronized to 29 October 2026.
- Official source URLs checked above opened successfully. The site validator checks local references, not every external dependency or every browser/device; this was not a full external-link crawl.

## Review bookkeeping

- Completed review: **2026-10-29**.
- Next review due: **2026-11-02** (next scheduled Monday review).
- Scenario-pack market content changed: **No**.
- Educational/guardrail copy changed: **Yes** — chart-context checklist and third-party quote provenance note.
- Production deployment or publication: **Not performed**.
- PR #11 remains draft/unmerged. Its base comparison currently reports merge conflicts; resolve and revalidate separately before any merge or release.
