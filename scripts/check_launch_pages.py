#!/usr/bin/env python3
"""Dependency-free source checks for Bullseye Theory launch pages."""
from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    "index.html", "auth.html", "privacy.html", "legal.html",
    "disclaimer.html", "payment.html", "membership.html", "terms.html",
    "refund.html",
]
SUPPORT = "eyetheorybulls@gmail.com"
PLACEHOLDERS = (
    "replace this section with your final customer-support email",
    "your support email here",
    "lorem ipsum",
)

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title_depth = 0
        self.title = []
        self.links = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self.title_depth += 1
        if tag in ("a", "link", "script", "img"):
            target = attrs.get("href") or attrs.get("src")
            if target:
                self.links.append((tag, target))
    def handle_endtag(self, tag):
        if tag == "title" and self.title_depth:
            self.title_depth -= 1
    def handle_data(self, data):
        if self.title_depth:
            self.title.append(data)

errors = []
pages_workflow = ROOT / ".github/workflows/deploy-pages.yml"
if pages_workflow.exists():
    errors.append("deploy-pages.yml must remain absent: public static publishing bypasses the Worker entitlement gate")
titles = {}
for rel in PAGES:
    path = ROOT / rel
    if not path.is_file():
        errors.append(f"Missing required page: {rel}")
        continue
    source = path.read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(source)
    title = "".join(parser.title).strip()
    if not title:
        errors.append(f"{rel}: missing <title>")
    elif title in titles:
        errors.append(f"{rel}: duplicate title also used by {titles[title]}")
    else:
        titles[title] = rel
    lower = source.lower()
    for marker in PLACEHOLDERS:
        if marker in lower:
            errors.append(f"{rel}: unresolved placeholder: {marker}")
    if rel in ("privacy.html", "payment.html", "membership.html", "terms.html", "refund.html"):
        if SUPPORT not in source:
            errors.append(f"{rel}: support email missing")
    for tag, target in parser.links:
        target = target.strip()
        if not target or target.startswith(("#", "/", "http://", "https://", "mailto:", "tel:", "data:", "javascript:")):
            continue
        target_path = target.split("#", 1)[0].split("?", 1)[0]
        if not target_path:
            continue
        if not (ROOT / target_path).exists():
            errors.append(f"{rel}: broken local {tag} target: {target}")

membership = ROOT / "membership.html"
if membership.is_file():
    text = membership.read_text(encoding="utf-8").lower()
    for phrase in ("enrollment closed", "payment methods", "do not send money"):
        if phrase not in text:
            errors.append(f"membership.html: missing launch safety phrase: {phrase}")


index = ROOT / "index.html"
if index.is_file():
    source = index.read_text(encoding="utf-8")
    if 'href="https://bullseye-theory.foryourtravel17.workers.dev/"' not in source:
        errors.append("index.html: canonical URL must use the Cloudflare production origin, not a preview URL")
    if "bullseye-theory-secure-preview.onrender.com" in source:
        errors.append("index.html: canonical URL must never point to the Render preview")

payment = ROOT / "payment.html"
if payment.is_file():
    source = payment.read_text(encoding="utf-8")
    lower = source.lower()
    if r"\n<section" in source:
        errors.append("payment.html: literal escaped newline is present before the indicator plan")
    if "website-based historical analyzer" not in lower or "<h2>website analyzer</h2>" not in lower:
        errors.append("payment.html: indicator description must match the website analyzer v1 product")
    for phrase in ("tradingview toolkit", "invite-only access", "tradingview invite"):
        if phrase in lower:
            errors.append(f"payment.html: outdated TradingView delivery claim remains: {phrase}")

membership_source = (ROOT / "membership.html").read_text(encoding="utf-8").lower()
if "tradingview csv export" in membership_source:
    errors.append("membership.html: customers must not be told that a paid TradingView export is required")

for rel in ("privacy.html", "legal.html"):
    path = ROOT / rel
    if path.is_file():
        lower = path.read_text(encoding="utf-8").lower()
        if "cloudflare" not in lower:
            errors.append(f"{rel}: current website hosting provider Cloudflare is missing")

if errors:
    print("LAUNCH PAGE CHECKS FAILED")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)
print(f"PASS: checked {len(PAGES)} launch pages; {len(titles)} unique titles; local targets and safety copy verified.")
