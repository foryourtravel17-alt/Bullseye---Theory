import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import {
  cookieValue,
  isProtectedCourseAsset,
  isInternalPath,
  normalizedPath,
  safeFilePath,
  tokenExpiry
} from "../server.mjs";

test("paid root lesson pages are protected", () => {
  for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
    assert.equal(isProtectedCourseAsset("/lesson-" + n + ".html"), true);
  }
});

test("free Lesson 1 remains public", () => {
  assert.equal(isProtectedCourseAsset("/lesson-1.html"), false);
});

test("protected directory paths are gated", () => {
  for (const p of ["/lessons/lesson-2.html", "/course-assets/chart.svg", "/downloads/guide.pdf", "/pdf/lesson-3.pdf", "/videos/lesson-4.mp4", "/lessons/what-is-trading.pdf", "/lessons/lesson-2-how-financial-markets-work.pdf", "/lessons/lesson_10_trading_psychology_and_discipline.pptx"]) {
    assert.equal(isProtectedCourseAsset(p), true, p);
  }
});

test("encoded and mixed-case paid lesson paths remain protected", () => {
  assert.equal(isProtectedCourseAsset("/%6cesson-2.html"), true);
  assert.equal(isProtectedCourseAsset("/LESSON-11.HTML"), true);
  assert.equal(isProtectedCourseAsset("/folder/../lesson-7.html"), true);
});

test("malformed encoded paths fail closed", () => {
  assert.equal(normalizedPath("/lesson-%ZZ.html"), null);
  assert.equal(isProtectedCourseAsset("/lesson-%ZZ.html"), true);
});

test("path traversal cannot escape the repository root", () => {
  assert.equal(safeFilePath("/../../../../etc/passwd"), null);
  assert.equal(safeFilePath("/%2e%2e/%2e%2e/etc/passwd"), null);
  assert.ok(safeFilePath("/index.html")?.endsWith("/index.html"));
});

test("cookie parser returns only the named cookie", () => {
  assert.equal(cookieValue("other=1; bt_course_session=abc.def.ghi; more=2"), "abc.def.ghi");
  assert.equal(cookieValue("other=1"), "");
});

test("JWT expiry is parsed and malformed tokens fail closed", () => {
  const payload = Buffer.from(JSON.stringify({ exp: 2000000000 })).toString("base64url");
  assert.equal(tokenExpiry("header." + payload + ".signature"), 2000000000);
  assert.equal(tokenExpiry("not-a-jwt"), 0);
});

test("repository internals are never publicly served", () => {
  for (const p of ["/.mcp.json", "/.github/workflows/deploy-cloudflare.yml", "/supabase/config.toml", "/docs/RENDER_SECURE_COURSE_RUNTIME.md", "/scripts/check_launch_pages.py", "/server.mjs", "/package.json"]) {
    assert.equal(isInternalPath(p), true, p);
  }
  assert.equal(isInternalPath("/"), false);
  assert.equal(isInternalPath("/assets/site.css"), false);
});

test("all 11 lesson quiz interfaces match the server-side answer-key contract", async () => {
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const grading = await readFile(resolve(root, "supabase/functions/grade-quiz/grading.ts"), "utf8");
  const answerKeys = new Map();
  // Parse the lesson-number keys and answer arrays from the server-owned grading map.
  for (const match of grading.matchAll(/^\s*(\d+):\s*\[([^\]]+)\]/gm)) {
    answerKeys.set(Number(match[1]), [...match[2].matchAll(/["']([^"']+)["']/g)].map((item) => item[1]));
  }
  assert.equal(answerKeys.size, 11, "the server must define one answer key for every lesson");

  for (let lesson = 1; lesson <= 11; lesson += 1) {
    const html = await readFile(resolve(root, `lesson-${lesson}.html`), "utf8");
    const groups = new Map();
    for (const match of html.matchAll(/<label[^>]*>\s*<input[^>]*name=["']([^"']+)["'][^>]*value=["']([^"']+)["'][^>]*>([\s\S]*?)<\/label>/gi)) {
      const name = match[1];
      const value = match[2];
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(value);
    }
    const usesLetters = lesson === 1 || lesson === 2 || lesson === 11;
    const expectedNames = Array.from({ length: 5 }, (_, index) => usesLetters ? `q${index + 1}` : `q${index}`);
    const actualNames = [...groups.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    assert.deepEqual(actualNames, expectedNames, `lesson ${lesson} must render five quiz questions using the server contract`);
    const key = answerKeys.get(lesson);
    assert.equal(key.length, 5, `lesson ${lesson} must have five server-side answers`);
    for (let index = 0; index < expectedNames.length; index += 1) {
      const options = groups.get(expectedNames[index]);
      assert.ok(options.length >= 2, `lesson ${lesson} question ${index + 1} must have at least two options`);
      assert.ok(options.includes(key[index]), `lesson ${lesson} question ${index + 1} answer key must exist in the rendered options`);
    }
  }
});

test("membership page does not promise unavailable course video or unverified intraday data", async () => {
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const page = await readFile(resolve(root, "membership.html"), "utf8");
  assert.match(page, /Interactive 11-lesson learning path/);
  assert.doesNotMatch(page, /Recorded video breakdowns/);
  assert.match(page, /TradingView Free CSV export is not available/);
  assert.match(page, /no permitted free 15m\/1h source has been verified/);
  assert.match(page, /COMING SOON — ENROLLMENT CLOSED/);
});

test("course dashboard exposes only existing, entitlement-protected study downloads", async () => {
  const { readFile, stat } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const dashboard = await readFile(resolve(root, "dashboard.html"), "utf8");
  const assets = [...dashboard.matchAll(/["'](lessons\/[^"']+\.(?:pdf|pptx))["']/g)].map((item) => item[1]);
  assert.equal(assets.length, 16, "10 lesson PDFs and 6 slide decks should be linked");
  assert.match(dashboard, /const resources=active/);
  for (const asset of assets) {
    assert.ok(isProtectedCourseAsset("/" + asset), asset + " must require active course entitlement");
    const info = await stat(resolve(root, asset));
    assert.ok(info.isFile() && info.size > 0, asset + " must exist and be non-empty");
  }
});

test("homepage and membership page do not advertise a recorded video library", async () => {
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const { dirname, resolve } = await import("node:path");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const home = await readFile(resolve(root, "index.html"), "utf8");
  const membership = await readFile(resolve(root, "membership.html"), "utf8");
  for (const page of [home, membership]) {
    assert.doesNotMatch(page, /recorded video breakdowns|video breakdowns|VIDEO BREAKDOWNS|PDF \\+ VIDEO/i);
  }
  assert.match(home, /PRACTICE EXERCISES/);
  assert.match(home, /A recorded video library is not included in the current release candidate/);
});

test("course resource library links only existing protected study files", async () => {
  const page = await readFile(new URL("../lessons/resources.html", import.meta.url), "utf8");
  const pdfLinks = [...page.matchAll(/href="([^"]+\\.pdf)"/g)].map((match) => match[1]);
  const slideLinks = [...page.matchAll(/href="([^"]+\\.pptx)"/g)].map((match) => match[1]);
  assert.equal(pdfLinks.length, 10, "all ten current PDF modules must be linked");
  assert.equal(slideLinks.length, 6, "all six current slide decks must be linked");
  for (const link of [...pdfLinks, ...slideLinks]) {
    assert.ok(existsSync(new URL("../lessons/" + link, import.meta.url)), "missing study asset: " + link);
  }
  assert.match(page, /Lesson 11[\\s\\S]*online revision lesson/i);
  assert.match(page, /recorded video[\\s\\S]*not included yet/i);
});

test("chart drills page contains eleven hypothetical, printable exercises with answer reviews", async () => {
  const page = await readFile(new URL("../lessons/chart-drills.html", import.meta.url), "utf8");
  assert.equal((page.match(/class="drill"/g) || []).length, 11);
  assert.equal((page.match(/<svg\\b/g) || []).length, 11);
  assert.equal((page.match(/<details\\b/g) || []).length, 11);
  assert.match(page, /hypothetical|illustrative/i);
  assert.match(page, /not live market data/i);
  assert.match(page, /window\\.print\\(\\)/);
});

test("dashboard links the protected resources and chart drills pages", async () => {
  const page = await readFile(new URL("../dashboard.html", import.meta.url), "utf8");
  assert.match(page, /href="lessons\\/resources\\.html"/);
  assert.match(page, /href="lessons\\/chart-drills\\.html"/);
  assert.equal(isProtectedCourseAsset("/lessons/resources.html"), true);
  assert.equal(isProtectedCourseAsset("/lessons/chart-drills.html"), true);
});
