import test from "node:test";
import assert from "node:assert/strict";
import {
  cookieValue,
  isProtectedCourseAsset,
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
  for (const p of ["/lessons/lesson-2.html", "/course-assets/chart.svg", "/downloads/guide.pdf", "/pdf/lesson-3.pdf", "/videos/lesson-4.mp4"]) {
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
