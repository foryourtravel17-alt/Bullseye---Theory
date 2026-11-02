# Bullseye Theory Market Lab — Content and Monitoring Policy

## Scope
The Market Lab is an educational companion to the Bullseye Theory course. It does not execute trades, connect to brokers, hold customer money/securities, or provide live market data in the demo phase.

## Scenario publishing rules
- Use conditional scenarios (bullish / range / bearish), not confident predictions or guaranteed outcomes.
- State observable conditions, invalidation conditions, assumptions and review date.
- Do not invent prices, returns, probabilities, news, sources or historical performance.
- Use fictional numbers only when labelled simulated; do not imply they are current.
- Do not issue personalised buy/sell/hold recommendations or price targets in the educational demo.
- For future real market commentary, cite primary sources, record exact publication/data timestamps, confirm data-display rights and obtain regulatory review before paid distribution.
- If an embedded third-party quote widget is used, keep it visually separate from fictional sample fixtures, label the provider and possible delay, and do not imply that the embed grants Bullseye independent market-data redistribution rights. Verify the provider's current terms and applicable exchange entitlements before release; disable the widget if permitted display cannot be confirmed.
- A disclaimer is not a substitute for registration or authorisation that may be required.

## Market price data — SEBI circular (effective 1 July 2026)
- SEBI Circular HO/47/17/12(11)2025-MRD-POD3/I/11107/2026 dated 8 May 2026 prescribes a 30-day time lag for sharing and usage of market price data for investor education and awareness activities, effective 1 July 2026. The circular modifies the earlier 2024/2025 framework.
- The circular provides a specific one-day-lag exception for the National Institute of Securities Markets (NISM) for its simulation lab; Bullseye must not assume that exception applies to it.
- The circular also requires appropriate legal agreements between market infrastructure institutions (MIIs)/market intermediaries and data recipients, with safeguards including audit trails for usage.
- Operational default for Bullseye: do not use, display, quote, or build educational commentary around listed-security price data from the preceding 30 days. Treat the 30-day threshold as a minimum control, not as a licence or permission to obtain/redistribute data.
- Before any non-fictional price data is introduced, verify the applicable SEBI circular and subsequent amendments, the data provider's and exchange's current licence/contract terms, the permitted audience/use, timestamps/timezone, and legal permissions. Obtain qualified Indian securities-law advice for Bullseye's actual business model.
- Do not use live or recent price data to indicate future prices or provide advice/recommendations. Keep any permitted third-party quote product separate from educational content, and disable it for the India-facing educational experience unless written permission and qualified compliance review establish that the exact display/use is allowed.
- This policy summary is an operational safeguard, not a legal opinion or determination of Bullseye's regulatory status.

Primary source: SEBI Circular HO/47/17/12(11)2025-MRD-POD3/I/11107/2026, 8 May 2026: https://www.sebi.gov.in/legal/circulars/may-2026/norms-for-sharing-and-usage-of-price-data-for-educational-purposes_101293.html

## Review cadence
Review the scenario pack twice each week (Monday and Thursday). Review:
1. Date and status labels.
2. Dated assumptions that may have expired.
3. Official exchange and company disclosures, RBI and government statistical releases when relevant.
4. Source quality and licensing/redistribution permissions before incorporating data.
5. Regulatory or product changes that affect how content is offered.
6. When using exchange event calendars, describe entries as scheduled events only; verify the actual exchange-filed announcement before describing a result or drawing conclusions. Record the exchange, publication/as-of time and timezone for dated claims.

If trustworthy evidence is unavailable, keep scenarios generic and label them educational. Do not publish fabricated updates to meet the schedule.

## Release controls
- Review is advisory and draft-first; no commentary is auto-published solely because a scheduled check ran.
- A human must review dated market notes before publication.
- Record lastReviewed and nextReviewDue in market-briefs.json.
- Run node scripts/validate-market-briefs.mjs in CI.
- Initial instrument values are fictional fixtures, not market prices.

## Commercial / regulatory checkpoints
Before adding paid market-specific recommendations, research reports, personalised advice, referral tracking, a real data feed or payments, obtain qualified advice on applicable SEBI regulations, exchange requirements, market-data licensing, privacy, consumer, tax and payment obligations. Referrals require written partner terms and clear disclosures. Never collect customer trading credentials or funds.

## Pricing intent
- Standalone course: planned ₹999.
- Premium bundle: planned ₹1,999 and intended to include the course.
- Billing duration is not yet defined; payment remains disabled until duration, renewal/refund terms, support, gateway and server-side payment verification are implemented.
