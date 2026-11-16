#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedCorrectText = {
  1: [
    "Buying and selling with the aim",
    "A buyer and a seller",
    "Supply, demand, news and trader sentiment",
    "$30 profit",
    "Trading involves risk, so education",
  ],
  2: [
    "A place where buyers and sellers trade",
    "Stocks and forex",
    "Prices tend to rise",
    "News, events, and shifts in supply",
    "No",
  ],
  3: [
    "Dollars per euro",
    "The difference between bid and ask",
    "Liquidity, custody and token design differ",
    "The euro strengthened relative to the dollar",
    "Fees, spread and slippage",
  ],
  4: [
    "The interval's high/low extremes beyond the body",
    "Higher swing highs and higher swing lows",
    "Price rotating between approximate boundaries",
    "The close was above the open for that interval",
    "As zones that can fail",
  ],
  5: [
    "They are relatively close",
    "Its location and surrounding price action",
    "A relationship between consecutive candle bodies",
    "It is near a meaningful area after prior movement",
    "As descriptive clues requiring context",
  ],
  6: [
    "Higher highs and higher lows",
    "Context, closes and possible follow-through",
    "A range or balance",
    "To reduce hindsight relabeling",
    "A possible change that needs evidence",
  ],
  7: [
    "Areas around meaningful reactions",
    "Identify major swings and repeated reactions",
    "Reject, consolidate or break through",
    "The same area can have different significance across timeframes",
    "Evidence and an invalidation condition",
  ],
  8: [
    "Close and follow-through can add evidence",
    "A later return toward a broken area",
    "Continuation, consolidation or range re-entry",
    "Moves outside a boundary then returns inside",
    "Context, costs and invalidation",
  ],
  9: [
    "The planned amount at risk if the idea fails",
    "Risk budget divided by per-unit loss to stop",
    "It does not establish probability of success",
    "They can change actual net outcomes",
    "No, gaps and slippage can affect execution",
  ],
  10: [
    "Taking a trade mainly to recover a previous loss",
    "Reasoning, risk, execution and emotions",
    "No, evaluate process and a meaningful sample",
    "Structure preparation, execution and review",
    "Pause and review rather than force a trade",
  ],
  11: [
    "Context and structure",
    "Define and control possible loss within a plan",
    "Context and evidence",
    "To review decisions and improve the process",
    "Structured study, risk awareness and disciplined review form a repeatable learning process",
  ],
};

function fail(message) {
  console.error("COURSE QUIZ CONTRACT FAILED");
  console.error("- " + message);
  process.exitCode = 1;
}

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? "";
  }
  return result;
}

const grading = await readFile(path.join(ROOT, "supabase/functions/grade-quiz/grading.ts"), "utf8");
const answerKeys = Object.fromEntries(
  [...grading.matchAll(/^\s*(\d+):\s*\[([^\]]+)\]/gm)].map((match) => [
    Number(match[1]),
    [...match[2].matchAll(/["']([^"']+)["']/g)].map((item) => item[1]),
  ]),
);
const secureClient = await readFile(path.join(ROOT, "lesson-secure-client.js"), "utf8");
if (!secureClient.includes('usesLetters = lesson === 1 || lesson === 2 || lesson === 11')) {
  fail("secure quiz client must preserve q1–q5 names for lessons 1, 2 and 11, and q0–q4 for lessons 3–10");
}

for (let lesson = 1; lesson <= 11; lesson += 1) {
  const page = await readFile(path.join(ROOT, `lesson-${lesson}.html`), "utf8");
  const key = answerKeys[lesson];
  const expected = expectedCorrectText[lesson];
  if (!Array.isArray(key) || key.length !== 5 || !Array.isArray(expected) || expected.length !== 5) {
    fail(`lesson ${lesson}: server grading must define exactly five answers and five expected UI answers`);
    continue;
  }
  if (!page.includes(`lesson-secure-client.js" data-lesson-number="${lesson}"`)) {
    fail(`lesson ${lesson}: secure lesson client is missing or has the wrong lesson number`);
  }

  const groups = new Map();
  for (const label of page.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/gi)) {
    const input = label[1].match(/<input\b[^>]*>/i)?.[0];
    if (!input) continue;
    const attrs = attributes(input);
    if (attrs.type?.toLowerCase() !== "radio") continue;
    if (!attrs.name || attrs.value === undefined) {
      fail(`lesson ${lesson}: radio option is missing name or value`);
      continue;
    }
    const text = decodeHtml(label[1].replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
    const options = groups.get(attrs.name) ?? [];
    options.push({ value: attrs.value, text });
    groups.set(attrs.name, options);
  }

  const usesLetters = lesson === 1 || lesson === 2 || lesson === 11;
  const expectedNames = Array.from({ length: 5 }, (_, index) => `q${usesLetters ? index + 1 : index}`);
  const actualNames = [...groups.keys()].sort();
  if (actualNames.length !== 5 || expectedNames.some((name) => !groups.has(name))) {
    fail(`lesson ${lesson}: expected exactly five quiz groups named ${expectedNames.join(", ")}; found ${actualNames.join(", ") || "none"}`);
    continue;
  }

  for (let index = 0; index < 5; index += 1) {
    const question = expectedNames[index];
    const options = groups.get(question);
    const values = options.map((option) => option.value);
    if (options.length < 2) fail(`lesson ${lesson} ${question}: at least two choices are required`);
    if (new Set(values).size !== values.length) fail(`lesson ${lesson} ${question}: duplicate radio values`);
    const correct = options.find((option) => option.value === key[index]);
    if (!correct) {
      fail(`lesson ${lesson} ${question}: server answer key "${key[index]}" does not exist in the UI`);
    } else if (!correct.text.toLowerCase().includes(expected[index].toLowerCase())) {
      fail(`lesson ${lesson} ${question}: server answer key points to "${correct.text}", not the expected answer fragment "${expected[index]}"`);
    }
  }
}

if (!process.exitCode) {
  console.log("PASS: all 11 lesson quizzes have five UI questions, valid option values, and server answer keys matching the intended correct answers.");
}
