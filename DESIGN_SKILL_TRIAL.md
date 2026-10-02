# Bullseye Theory — AI Design Skill Trial

> Workers Builds smoke test: GitHub `main` push should trigger the connected Cloudflare production deployment.

Purpose: test modern frontend-design skills against the existing Bullseye Theory site without changing the production `main` branch.

## What the uploaded video is showing

The video points at two kinds of GitHub/agent skills:

1. **Impeccable** — a design-review/build vocabulary with commands such as `audit`, `critique`, `polish`, `typeset`, `animate`, `adapt`, and `distill`.
2. **Taste Skill** — an anti-generic frontend skill. Its current repository includes `design-taste-frontend`, `redesign-existing-projects`, `image-to-code`, and other focused skills.

The exact Taste Skill command visible in the video is:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill
```

For an existing Bullseye codebase, the more targeted current install is:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"
```

The current Impeccable repository recommends:

```bash
npx impeccable install
```

or, when installing only the skill:

```bash
npx skills add https://github.com/pbakaus/impeccable --skill impeccable
```

## Why this fits Bullseye

Bullseye is already a vanilla HTML/CSS/JS site with an established design system, responsive requirements, a cinematic hero, a 3D bull, chart/HUD motion, lessons, authentication, and existing motion files.

That makes **audit + targeted redesign**, rather than a framework rewrite, the useful path.

## Trial tracks

### Track A — Impeccable / quality audit

Run:

```text
/impeccable document
/impeccable critique index.html
/impeccable audit index.html
/impeccable polish index.html
```

Constraints:
- Preserve vanilla HTML/CSS/JS.
- Preserve Bullseye brand colors and educational positioning.
- Do not remove working auth/legal links.
- Do not stack another CSS patch file over an already-conflicting architecture.
- Check 375px, 768px and 1440px.
- Respect prefers-reduced-motion.
- Fix only evidence-backed issues.

### Track B — Taste / existing-project redesign

Install:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"
```

Then run the redesign skill against the existing site.

Constraints:
- Improve the existing composition; do not rewrite the site from scratch.
- Avoid generic SaaS cards and generic AI aesthetics.
- Keep the bull as the visual focal point.
- Keep the hero readable on a small laptop and on mobile.
- Do not introduce unnecessary libraries.
- Keep the current brand world: obsidian, signal lime, metallic gold, off-white.
- Preserve the site's actual copy and functional behavior unless a defect requires change.

### Track C — Emil motion / animation craft

Use the current Emil Kowalski design-engineering skill:

```bash
npx skills@latest add emilkowalski/skills
```

Focus the review on:
- easing and duration
- hover behavior
- scroll-linked reveals
- hero parallax
- SVG/canvas draw-in motion
- motion restraint
- reduced-motion fallback
- avoiding animation that competes with the bull

Do not add motion just because the page can animate. Every animation must clarify hierarchy or interaction.

### Track D — image-first redesign (only if the composition still needs a larger change)

Use Taste Skill's image-to-code workflow:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "image-to-code"
```

Use this only for a genuinely different hero/section composition. Generate a clean reference first, then implement it in the existing vanilla stack. Do not replace working UI merely to match a generic generated landing page.

## Recommended execution order

A → B → C → D only when justified.

Stop after the first batch that materially improves the rendered page. Do not keep adding layers of CSS/JS patches.

## Bullseye non-negotiables

- No easy-money claims or guaranteed-return language.
- No signal-selling positioning.
- No rockets or generic finance clip-art.
- No lifestyle-flex imagery.
- Bull remains a brand focal point, not a gambling symbol.
- Mobile and desktop are separately considered.
- Functional auth, legal, course and navigation links must continue to work.
