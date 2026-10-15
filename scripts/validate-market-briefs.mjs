import { readFileSync } from "node:fs";

const pack = JSON.parse(readFileSync(new URL("../market-briefs.json", import.meta.url), "utf8"));
const errors = [];
const isDate = value => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

if (pack.schemaVersion !== 1) errors.push("schemaVersion must be 1");
if (pack.product !== "Bullseye Theory Market Lab") errors.push("product name is unexpected");
if (pack.mode !== "educational_demo") errors.push("mode must remain educational_demo");
if (pack.dataStatus !== "simulated") errors.push("initial MVP must label data as simulated");
if (!isDate(pack.lastReviewed)) errors.push("lastReviewed must be a real YYYY-MM-DD date");
if (!isDate(pack.nextReviewDue)) errors.push("nextReviewDue must be a real YYYY-MM-DD date");
if (isDate(pack.lastReviewed) && isDate(pack.nextReviewDue) && pack.nextReviewDue < pack.lastReviewed) {
  errors.push("nextReviewDue must not be earlier than lastReviewed");
}
if (!Array.isArray(pack.scenarios) || pack.scenarios.length < 3) errors.push("at least three scenario examples are required");
if (!Array.isArray(pack.sampleInstruments) || pack.sampleInstruments.length < 1) errors.push("sampleInstruments must be non-empty");
if (!/not live market data/i.test(pack.disclaimer || "")) errors.push("disclaimer must state that data is not live");

const scenarioIds = new Set();
for (const scenario of pack.scenarios || []) {
  for (const key of ["id", "label", "title", "hypothesis", "invalidation", "question", "status"]) {
    if (typeof scenario[key] !== "string" || !scenario[key].trim()) errors.push("scenario " + (scenario.id || "(unknown)") + " missing " + key);
  }
  if (scenario.id && scenarioIds.has(scenario.id)) errors.push("duplicate scenario id: " + scenario.id);
  if (scenario.id) scenarioIds.add(scenario.id);
  if (scenario.status !== "illustrative_not_a_forecast") errors.push("scenario " + scenario.id + " must remain explicitly illustrative");
  if (!Array.isArray(scenario.observe) || scenario.observe.length < 1 || scenario.observe.some(item => typeof item !== "string" || !item.trim())) {
    errors.push("scenario " + scenario.id + " needs non-empty observable conditions");
  }
}

const symbols = new Set();
for (const instrument of pack.sampleInstruments || []) {
  if (typeof instrument.symbol !== "string" || !instrument.symbol.trim()) errors.push("sample instrument is missing symbol");
  if (instrument.symbol && symbols.has(instrument.symbol)) errors.push("duplicate sample instrument: " + instrument.symbol);
  if (instrument.symbol) symbols.add(instrument.symbol);
  if (instrument.status !== "fictional_demo_only") errors.push("instrument " + instrument.symbol + " must be marked fictional_demo_only");
  if (!Number.isFinite(instrument.sampleValue) || instrument.sampleValue <= 0) errors.push("instrument " + instrument.symbol + " has invalid sampleValue");
  if (typeof instrument.unit !== "string" || !instrument.unit.trim()) errors.push("instrument " + instrument.symbol + " needs a unit");
}

if (errors.length) {
  console.error("Market brief validation failed:");
  errors.forEach(error => console.error("- " + error));
  process.exit(1);
}
console.log("Market brief OK: " + pack.scenarios.length + " educational scenarios, " + pack.sampleInstruments.length + " fictional instruments; last reviewed " + pack.lastReviewed + ".");
