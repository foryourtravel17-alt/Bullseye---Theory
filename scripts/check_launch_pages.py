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

    if "upload your own tradingview csv export" in text:
        errors.append("membership.html: must not require TradingView CSV export or a paid TradingView plan")
    if "tradingview pro/premium and tradingview csv export are not required" not in text:
        errors.append("membership.html: missing free-first, vendor-neutral CSV guidance")
    if "recorded video breakdowns" in text:
        errors.append("membership.html: must not advertise recorded videos that are not present in this release")

index_page = ROOT / "index.html"
if index_page.is_file() and "recorded video breakdowns" in index_page.read_text(encoding="utf-8").lower():
    errors.append("index.html: must not advertise recorded videos that are not present in this release")

dashboard = ROOT / "dashboard.html"
if dashboard.is_file():
    dashboard_text = dashboard.read_text(encoding="utf-8")
    if "const resourceLinks=active &&" not in dashboard_text:
        errors.append("dashboard.html: study-guide and slide downloads must be visible only to active course members")
    required_resources = (
        "lessons/what-is-trading.pdf",
        "lessons/lesson-2-how-financial-markets-work.pdf",
        "lessons/lesson-3-understanding-stocks-forex-and-crypto.pdf",
        "lessons/lesson-4-understanding-market-structure-and-price-action.pdf",
        "lessons/pdf/lesson_5_candlestick_patterns.pdf",
        "lessons/pdf/lesson_6_repaired_compatible.pdf",
        "lessons/pdf/lesson_7_support_resistance_complete.pdf",
        "lessons/pdf/lesson_8_breakouts_and_retests.pdf",
        "lessons/pdf/lesson_9_risk_management.pdf",
        "lessons/pdf/lesson_10_trading_psychology_and_discipline.pdf",
        "lessons/lesson_5_candlestick_patterns.pptx",
        "lessons/lesson_6_repaired_compatible.pptx",
        "lessons/lesson_7_support_resistance_complete.pptx",
        "lessons/lesson_8_breakouts_and_retests.pptx",
        "lessons/lesson_9_risk_management.pptx",
        "lessons/lesson_10_trading_psychology_and_discipline.pptx",
    )
    for resource in required_resources:
        if resource not in dashboard_text or not (ROOT / resource).is_file():
            errors.append(f"dashboard.html: missing or unlinked study resource: {resource}")

if errors:
    print("LAUNCH PAGE CHECKS FAILED")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)
print(f"PASS: checked {len(PAGES)} launch pages; {len(titles)} unique titles; local targets and safety copy verified.")
