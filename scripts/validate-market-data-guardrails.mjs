import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const homepage = read("../index.html");
const terminal = read("../terminal.html");
const policy = read("../docs/market-briefing-policy.md");
const pack = JSON.parse(read("../market-briefs.json"));
const errors = [];

if (/tradingview-widget|embed-widget-ticker-tape\.js/i.test(homepage + "\n" + terminal)) {
  errors.push("live third-party ticker embed must remain disabled pending permissions and compliance review");
}
if (/2354\.80|68324\.12/.test(homepage)) {
  errors.push("stale numeric hero quote fixtures must not be presented as market values");
}
if (/approved_market_feed\.json|loadFactoryFeed|age\s*<=\s*8/i.test(terminal)) {
  errors.push("recent public factory observations must not be rendered before the 30-day educational-data control is implemented");
}
if (!/HO\/47\/17\/12\(11\)2025-MRD-POD3\/I\/11107\/2026/.test(policy) || !/30-day time lag/i.test(policy)) {
  errors.push("policy must record SEBI's 8 May 2026 educational price-data circular and 30-day lag");
}
if (!/NISM/.test(policy) || !/audit trail/i.test(policy)) {
  errors.push("policy must preserve the narrow NISM simulation-lab exception and audit-trail safeguard");
}
if (pack.mode !== "educational_demo" || pack.dataStatus !== "simulated") {
  errors.push("market brief pack must remain an educational simulated demo");
}
for (const instrument of pack.sampleInstruments || []) {
  if (instrument.status !== "fictional_demo_only") {
    errors.push("instrument " + instrument.symbol + " must remain fictional_demo_only");
  }
}
if (errors.length) {
  console.error("Market data compliance guard failed:");
  errors.forEach(error => console.error("- " + error));
  process.exit(1);
}
console.log("Market data guard OK: live/recent price displays paused; SEBI 30-day policy present; fixtures remain fictional.");
