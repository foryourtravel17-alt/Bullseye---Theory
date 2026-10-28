import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { gradeAnswers, normalizeAnswers } from "./grading.ts";

Deno.test("rejects unknown lessons and invalid answer counts", () => {
  assertEquals(gradeAnswers(0, ["a", "b", "a", "c", "b"]), null);
  assertEquals(normalizeAnswers(12, ["a", "b", "a", "c", "b"]), null);
  assertEquals(normalizeAnswers(1, ["a", "b"]), null);
  assertEquals(normalizeAnswers(1, ["a", "b", "a", "c", 2]), null);
});

Deno.test("normalizes letter answers for lessons 1, 2 and 11", () => {
  assertEquals(normalizeAnswers(1, { q1: "a", q2: "b", q3: "a", q4: "c", q5: "b" }), ["a", "b", "a", "c", "b"]);
  assertEquals(normalizeAnswers(11, { q1: "a", q2: "b", q3: "a", q4: "b", q5: "b" }), ["a", "b", "a", "b", "b"]);
});

Deno.test("normalizes indexed answers for lessons 3 through 10", () => {
  assertEquals(normalizeAnswers(3, { q0: "0", q1: "1", q2: "2", q3: "0", q4: "1" }), ["0", "1", "2", "0", "1"]);
  assertEquals(gradeAnswers(3, ["0", "1", "2", "0", "1"]), { correct: 5, score: 100, passed: true });
});

Deno.test("grades 4/5 as pass and 3/5 as fail", () => {
  assertEquals(gradeAnswers(1, ["a", "b", "a", "c", "x"]), { correct: 4, score: 80, passed: true });
  assertEquals(gradeAnswers(1, ["a", "b", "a", "x", "x"]), { correct: 3, score: 60, passed: false });
});
