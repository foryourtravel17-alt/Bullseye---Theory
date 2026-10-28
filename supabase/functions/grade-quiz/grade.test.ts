import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const answerKeys: Record<number, string[]> = {
  1: ["a", "b", "a", "c", "b"],
  2: ["a", "a", "a", "b", "b"],
  3: ["0", "1", "2", "0", "1"],
  4: ["2", "0", "1", "2", "0"],
  5: ["1", "2", "0", "1", "2"],
  6: ["1", "0", "2", "1", "0"],
  7: ["2", "1", "0", "2", "1"],
  8: ["0", "1", "2", "0", "1"],
  9: ["1", "0", "2", "0", "1"],
  10: ["2", "1", "0", "2", "1"],
  11: ["a", "b", "a", "b", "b"],
};

function grade(lesson: number, answers: unknown) {
  const key = answerKeys[lesson];
  if (!key || !Array.isArray(answers) || answers.length !== 5 ||
      !answers.every((v) => typeof v === "string")) return null;
  const correct = answers.reduce((sum, value, index) => sum + (value === key[index] ? 1 : 0), 0);
  return { correct, score: Math.round((correct / key.length) * 100), passed: correct >= 4 };
}

Deno.test("supports only the eleven known lessons", () => {
  assertEquals(grade(0, ["a", "b", "a", "c", "b"]), null);
  assertEquals(grade(12, ["a", "b", "a", "c", "b"]), null);
});

Deno.test("rejects missing, extra, or non-string answers", () => {
  assertEquals(grade(1, ["a", "b", "a", "c"]), null);
  assertEquals(grade(1, ["a", "b", "a", "c", "b", "x"]), null);
  assertEquals(grade(1, ["a", "b", "a", "c", 1]), null);
});

Deno.test("grades five correct answers as 100 percent and pass", () => {
  assertEquals(grade(1, ["a", "b", "a", "c", "b"]), { correct: 5, score: 100, passed: true });
});

Deno.test("requires at least four of five correct answers", () => {
  assertEquals(grade(1, ["a", "b", "a", "c", "x"]), { correct: 4, score: 80, passed: true });
  assertEquals(grade(1, ["a", "b", "a", "x", "x"]), { correct: 3, score: 60, passed: false });
});

Deno.test("accepts the option values used by lessons 3 through 10", () => {
  assertEquals(grade(3, ["0", "1", "2", "0", "1"]), { correct: 5, score: 100, passed: true });
});
