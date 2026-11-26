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

// Keep live/recent market data and the public factory feed disabled until permissions and compliance are verified.
const terminalPath = resolve(root, "terminal.html");
if (existsSync(terminalPath)) {
  const terminal = readFileSync(terminalPath, "utf8");
  if (/approved_market_feed\.json|loadFactoryFeed|age\s*<=\s*8/i.test(terminal)) {
    errors.push("terminal.html must not render the public factory observation feed before the 30-day data-use control is implemented");
  }
  if (/data\/state\.json/i.test(terminal)) {
    errors.push("terminal.html must never read raw data/state.json");
  }
  if (/tradingview-widget|embed-widget-ticker-tape\.js/i.test(terminal)) {
    errors.push("terminal.html must not embed live/recent quote widgets while data permissions are unverified");
  }
  for (const marker of [
    "Quote Tape Paused",
    "Public Feed Paused",
    "Fictional prices only",
    "SIMULATED",
    "preceding 30 days"
  ]) {
    if (!terminal.toLowerCase().includes(marker.toLowerCase())) {
      errors.push("terminal.html is missing Market Lab guardrail: " + marker);
    }
  }
}

const homePath = resolve(root, "index.html");
if (existsSync(homePath)) {
  const home = readFileSync(homePath, "utf8");
  if (!home.includes("Market Lab scenario and watchlist fixtures are simulated")) {
    errors.push("index.html must label Market Lab fixtures as simulated, not live");
  }
  if (!home.includes("MARKET DATA DISPLAY PAUSED")) {
    errors.push("index.html must state that live/recent market data display is paused");
  }
  if (/tradingview-widget|embed-widget-ticker-tape\.js/i.test(home)) {
    errors.push("index.html must not embed a live/recent ticker while data permissions are unverified");
  }
  if (!home.includes('href="terminal.html"')) {
    errors.push("index.html must link to the Market Lab");
  }
}

const membershipPath = resolve(root, "membership.html");
if (existsSync(membershipPath)) {
  const membership = readFileSync(membershipPath, "utf8");
  for (const marker of [
    "₹999",
    "₹1,999",
    "₹9,999",
    "MANUAL ENROLMENT — NO WEBSITE CHECKOUT.",
    "Checkout and payment methods are inactive on this website.",
    "Do not send money or cryptocurrency based on old or unofficial instructions.",
    "administrator manually enables course access",
    "Premium Bundle is intended to include the Complete Course"
  ]) {
    if (!membership.includes(marker)) errors.push("membership.html is missing pricing/payment guardrail: " + marker);
  }
}

const policyPath = resolve(root, "docs/market-briefing-policy.md");
if (existsSync(policyPath)) {
  const policy = readFileSync(policyPath, "utf8");
  for (const marker of [
    "Do not issue personalised buy/sell/hold recommendations or price targets",
    "third-party quote widget",
    "redistribution rights"
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
