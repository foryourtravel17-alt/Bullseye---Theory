import { readFileSync } from "node:fs";

const pack = JSON.parse(readFileSync(new URL("../market-briefs.json", import.meta.url), "utf8"));
const errors = [];
const isDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

if (pack.schemaVersion !== 1) errors.push("schemaVersion must be 1");
if (pack.mode !== "educational_demo") errors.push("mode must remain educational_demo");
if (pack.dataStatus !== "simulated") errors.push("initial MVP must label data as simulated");
if (!isDate(pack.lastReviewed)) errors.push("lastReviewed must be YYYY-MM-DD");
if (!isDate(pack.nextReviewDue)) errors.push("nextReviewDue must be YYYY-MM-DD");
if (!Array.isArray(pack.scenarios) || pack.scenarios.length < 3) errors.push("at least three scenario examples are required");
if (!Array.isArray(pack.sampleInstruments) || pack.sampleInstruments.length < 1) errors.push("sampleInstruments must be non-empty");
if (!/not live market data/i.test(pack.disclaimer || "")) errors.push("disclaimer must state that data is not live");

for (const scenario of pack.scenarios || []) {
  for (const key of ["id", "label", "title", "hypothesis", "invalidation", "question", "status"]) {
    if (typeof scenario[key] !== "string" || !scenario[key].trim()) errors.push("scenario " + (scenario.id || "(unknown)") + " missing " + key);
  }
  if (scenario.status !== "illustrative_not_a_forecast") errors.push("scenario " + scenario.id + " must remain explicitly illustrative");
  if (!Array.isArray(scenario.observe) || scenario.observe.length < 1) errors.push("scenario " + scenario.id + " needs observable conditions");
}
for (const instrument of pack.sampleInstruments || []) {
  if (instrument.status !== "fictional_demo_only") errors.push("instrument " + instrument.symbol + " must be marked fictional_demo_only");
  if (!Number.isFinite(instrument.sampleValue) || instrument.sampleValue <= 0) errors.push("instrument " + instrument.symbol + " has invalid sampleValue");
}
if (errors.length) {
  console.error("Market brief validation failed:");
  errors.forEach(error => console.error("- " + error));
  process.exit(1);
}
console.log("Market brief OK: " + pack.scenarios.length + " educational scenarios, " + pack.sampleInstruments.length + " fictional instruments; last reviewed " + pack.lastReviewed + ".");
