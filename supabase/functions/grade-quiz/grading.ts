export const answerKeys: Record<number, string[]> = {
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

export function normalizeAnswers(lesson: number, submitted: unknown): string[] | null {
  const key = answerKeys[lesson];
  if (!key) return null;
  if (Array.isArray(submitted) && submitted.length === 5 && submitted.every((v) => typeof v === "string")) {
    return submitted as string[];
  }
  if (submitted && typeof submitted === "object" && !Array.isArray(submitted)) {
    const obj = submitted as Record<string, unknown>;
    const usesLetters = lesson === 1 || lesson === 2 || lesson === 11;
    const candidate = Array.from({ length: 5 }, (_, i) => obj["q" + (usesLetters ? i + 1 : i)]);
    if (candidate.every((v) => typeof v === "string")) return candidate as string[];
  }
  return null;
}

export function gradeAnswers(lesson: number, values: string[]) {
  const key = answerKeys[lesson];
  if (!key || values.length !== 5) return null;
  const correct = values.reduce((sum, value, index) => sum + (value === key[index] ? 1 : 0), 0);
  return { correct, score: Math.round((correct / 5) * 100), passed: correct >= 4 };
}
