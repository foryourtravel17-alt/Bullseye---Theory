import { existsSync, readFileSync } from "node:fs";
import { resolve, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const pages = [
  "index.html",
  "terminal.html",
  "membership.html",
  "auth.html",
  "dashboard.html",
  "privacy.html",
  "legal.html",
  "disclaimer.html"
];
const requiredFiles = ["market-briefs.json", "scripts/validate-market-briefs.mjs", "docs/market-briefing-policy.md"];
const errors = [];

for (const relative of [...pages, ...requiredFiles]) {
  if (!existsSync(resolve(root, relative))) errors.push("required file missing: " + relative);
}

for (const page of pages) {
  const pagePath = resolve(root, page);
  if (!existsSync(pagePath)) continue;
  const html = readFileSync(pagePath, "utf8");
  if (!/<html\b/i.test(html)) errors.push(page + " is missing an html root element");
  if (!/<meta\s+name=["']viewport["']/i.test(html)) errors.push(page + " is missing a responsive viewport meta tag");

  const refs = [...html.matchAll(/(?:href|src)=["']([^"'<>]+)["']/gi)].map(match => match[1]);
  for (const ref of refs) {
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|\/\/|#)/i.test(ref)) continue;
    const localPath = decodeURIComponent(ref.split(/[?#]/)[0]);
    if (!localPath) continue;
    const target = normalize(resolve(root, localPath));
    if (target !== root && !target.startsWith(root + "/")) {
      errors.push(page + " has a path escaping the site root: " + ref);
    } else if (!existsSync(target)) {
      errors.push(page + " references missing local file: " + ref);
    }
  }
}

// Guard the public Market Lab: non-fictional market data remains disabled.
const terminalPath = resolve(root, "terminal.html");
if (existsSync(terminalPath)) {
  const terminal = readFileSync(terminalPath, "utf8");
  if (/data\\/state\\.json|approved_market_feed\\.json|loadFactoryFeed|age\\s*<=\\s*8/i.test(terminal)) {
    errors.push("terminal.html must not load raw factory state, the public approved feed, or recent-observation windows while data display is paused");
  }
  if (/tradingview-widget|embed-widget-ticker-tape\\.js/i.test(terminal)) {
    errors.push("terminal.html must not embed a live/recent quote widget pending written permissions and compliance review");
  }
  for (const marker of [
    "Quote Tape Paused",
    "Public Feed Paused",
    "preceding 30 days",
    "not a data licence",
    "Fictional prices only",
    "SIMULATED"
  ]) {
    if (!terminal.toLowerCase().includes(marker.toLowerCase())) {
      errors.push("terminal.html is missing Market Lab safety marker: " + marker);
    }
  }
}

const homePath = resolve(root, "index.html");
if (existsSync(homePath)) {
  const home = readFileSync(homePath, "utf8");
  if (/tradingview-widget|embed-widget-ticker-tape\\.js/i.test(home)) {
    errors.push("index.html must not embed a live/recent quote widget pending written permissions and compliance review");
  }
  for (const marker of [
    "MARKET DATA DISPLAY PAUSED",
    "No live or recent market-price ticker is displayed",
    "Market Lab scenario and watchlist fixtures are simulated",
    "membership duration and checkout terms will be confirmed before launch"
  ]) {
    if (!home.includes(marker)) errors.push("index.html is missing Market Lab/pricing guardrail: " + marker);
  }
  if (/LIFETIME ACCESS|ONE-TIME ENROLLMENT/i.test(home)) {
    errors.push("index.html must not promise lifetime or one-time access while membership duration is undefined");
  }
}

const membershipPath = resolve(root, "membership.html");
if (existsSync(membershipPath)) {
  const membership = readFileSync(membershipPath, "utf8");
  for (const marker of [
    "₹999",
    "₹1,999",
    "PRE-LAUNCH · PAYMENTS NOT ENABLED",
    "Everything in the ₹999 course plan",
    "Billing period, renewal terms and exact access duration must be confirmed before launch.",
    "Payments are intentionally disabled for now."
  ]) {
    if (!membership.includes(marker)) errors.push("membership.html is missing pricing/payment guardrail: " + marker);
  }
  if (/<script[^>]+src=["'][^"']*(razorpay|cashfree|stripe|phonepe)/i.test(membership)) {
    errors.push("membership.html must not load a payment-provider checkout script while payments are disabled");
  }
}

const policyPath = resolve(root, "docs/market-briefing-policy.md");
if (existsSync(policyPath)) {
  const policy = readFileSync(policyPath, "utf8");
  for (const marker of [
    "Do not issue personalised buy/sell/hold recommendations or price targets",
    "third-party quote widget",
    "redistribution rights",
    "monetary incentives to participants"
  ]) {
    if (!policy.toLowerCase().includes(marker.toLowerCase())) errors.push("market briefing policy is missing guardrail: " + marker);
  }
}

if (errors.length) {
  console.error("Site validation failed:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}
console.log("Site links and Market Lab feed safety OK: " + pages.length + " core pages and their local assets/references checked.");
