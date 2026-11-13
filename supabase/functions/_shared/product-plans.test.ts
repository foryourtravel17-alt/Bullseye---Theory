import { isProductEnabled, resolveProductPlan } from "./product-plans.ts";

function equal(actual: unknown, expected: unknown, message: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message + ": expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual));
  }
}

Deno.test("course, premium and indicator have independent fixed server-side contracts", () => {
  equal(resolveProductPlan("course"), { plan: "course", inrPaise: 99_900, accessDays: 85 }, "course plan");
  equal(resolveProductPlan("premium"), { plan: "premium", inrPaise: 199_900, accessDays: 85 }, "premium legacy plan");
  equal(resolveProductPlan("indicator"), { plan: "indicator", inrPaise: 999_900, accessDays: 365 }, "indicator annual plan");
});

Deno.test("untrusted or unknown plan values are rejected", () => {
  equal(resolveProductPlan(null), null, "null plan");
  equal(resolveProductPlan("9999"), null, "price is not a plan identifier");
  equal(resolveProductPlan("indicator;course"), null, "compound input");
  equal(resolveProductPlan({ plan: "indicator", inrPaise: 1 }), null, "object input");
});

Deno.test("indicator checkout requires both global and indicator-specific switches", () => {
  equal(isProductEnabled("indicator", { checkout: false, premium: false, indicator: true }), false, "global gate");
  equal(isProductEnabled("indicator", { checkout: true, premium: false, indicator: false }), false, "indicator gate");
  equal(isProductEnabled("indicator", { checkout: true, premium: false, indicator: true }), true, "both gates");
});

Deno.test("course remains independent from premium and indicator switches", () => {
  const flags = { checkout: true, premium: false, indicator: false };
  equal(isProductEnabled("course", flags), true, "course gate");
  equal(isProductEnabled("premium", flags), false, "premium gate");
  equal(isProductEnabled("indicator", flags), false, "indicator gate");
});
