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
const requiredFiles = ["market-briefs.json", "scripts/validate-market-briefs.mjs"];
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

if (errors.length) {
  console.error("Site validation failed:");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}
console.log("Site links and Market Lab feed safety OK: " + pages.length + " core pages and their local assets/references checked.");
