import { assertEquals } from "jsr:@std/assert@1";
import { isProductEnabled, resolveProductPlan } from "./product-plans.ts";

Deno.test("course, premium and indicator have independent fixed server-side contracts", () => {
  assertEquals(resolveProductPlan("course"), { plan: "course", inrPaise: 99_900, accessDays: 85 });
  assertEquals(resolveProductPlan("premium"), { plan: "premium", inrPaise: 199_900, accessDays: 85 });
  assertEquals(resolveProductPlan("indicator"), { plan: "indicator", inrPaise: 999_900, accessDays: 365 });
});

Deno.test("untrusted or unknown plan values are rejected", () => {
  assertEquals(resolveProductPlan(null), null);
  assertEquals(resolveProductPlan("9999"), null);
  assertEquals(resolveProductPlan("indicator;course"), null);
  assertEquals(resolveProductPlan({ plan: "indicator", inrPaise: 1 }), null);
});

Deno.test("indicator checkout requires both the global payment switch and its own feature switch", () => {
  assertEquals(isProductEnabled("indicator", { checkout: false, premium: false, indicator: true }), false);
  assertEquals(isProductEnabled("indicator", { checkout: true, premium: false, indicator: false }), false);
  assertEquals(isProductEnabled("indicator", { checkout: true, premium: false, indicator: true }), true);
});

Deno.test("course remains independent from premium and indicator switches", () => {
  const flags = { checkout: true, premium: false, indicator: false };
  assertEquals(isProductEnabled("course", flags), true);
  assertEquals(isProductEnabled("premium", flags), false);
  assertEquals(isProductEnabled("indicator", flags), false);
});
