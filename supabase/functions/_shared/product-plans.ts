export type ProductPlanCode = "course" | "premium" | "indicator";

export type ProductPlan = {
  plan: ProductPlanCode;
  inrPaise: number;
  accessDays: number | null;
};

const PRODUCT_PLANS: Record<ProductPlanCode, ProductPlan> = {
  course: { plan: "course", inrPaise: 99_900, accessDays: 85 },
  premium: { plan: "premium", inrPaise: 199_900, accessDays: null },
  indicator: { plan: "indicator", inrPaise: 999_900, accessDays: 365 },
};

export function resolveProductPlan(value: unknown): ProductPlan | null {
  if (typeof value !== "string" || !Object.hasOwn(PRODUCT_PLANS, value)) return null;
  return PRODUCT_PLANS[value as ProductPlanCode];
}

export function isProductEnabled(
  plan: ProductPlanCode,
  flags: { checkout: boolean; premium: boolean; premiumTermConfirmed: boolean; indicator: boolean },
): boolean {
  if (!flags.checkout) return false;
  if (plan === "premium") return flags.premium && flags.premiumTermConfirmed && PRODUCT_PLANS.premium.accessDays !== null;
  if (plan === "indicator") return flags.indicator;
  return true;
}
