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
- A disclaimer is not a substitute for registration or authorisation that may be required.

## Review cadence
Review the scenario pack twice each week (Monday and Thursday). Review:
1. Date and status labels.
2. Dated assumptions that may have expired.
3. Official exchange and company disclosures, RBI and government statistical releases when relevant.
4. Source quality and licensing/redistribution permissions before incorporating data.
5. Regulatory or product changes that affect how content is offered.

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
