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

// Guard the public Market Lab against accidentally reading internal factory state.
const terminalPath = resolve(root, "terminal.html");
if (existsSync(terminalPath)) {
  const terminal = readFileSync(terminalPath, "utf8");
  if (!terminal.includes("approved_market_feed.json")) {
    errors.push("terminal.html must use the sanitized approved_market_feed.json endpoint");
  }
  if (/data\/state\.json/i.test(terminal)) {
    errors.push("terminal.html must never read raw data/state.json");
  }
  if (!/approvalStatus\s*===\s*["']approved["']/.test(terminal)) {
    errors.push("terminal.html must render only explicitly approved factory records");
  }
  if (!/age\s*<=\s*8/.test(terminal)) {
    errors.push("terminal.html must hide factory observations older than eight hours");
  }
}

// Guard visible content against demo-data and quote-provenance regressions.
if (existsSync(terminalPath)) {
  const terminal = readFileSync(terminalPath, "utf8");
  for (const marker of [
    "Fictional prices only",
    "SIMULATED",
    "Third-party Quote Tape",
    "availability and delay depend on provider/exchange entitlements",
    "Bullseye has not independently verified rights to redistribute quote data"
  ]) {
    if (!terminal.includes(marker)) errors.push("terminal.html is missing Market Lab guardrail: " + marker);
  }
}

const homePath = resolve(root, "index.html");
if (existsSync(homePath)) {
  const home = readFileSync(homePath, "utf8");
  if (!home.includes("Market Lab scenario and watchlist fixtures are simulated")) {
    errors.push("index.html must distinguish simulated Market Lab fixtures from provider data");
  }
  if (!home.includes("the separate ticker above is third-party data and may be delayed")) {
    errors.push("index.html must label the separate provider ticker and possible delay");
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
    "Payments are intentionally disabled for now."
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
