# Bullseye Design Skill Trial

Use this command on the `ai-design-skills-trial-2026-10-03` branch only.

1. Read `AGENTS.md`, `.claude/CLAUDE.md`, and `design-system/bullseye/MASTER.md`.
2. Inspect the existing rendered site before editing.
3. Run the design workflow in this order:
   - Impeccable: critique + audit the current page.
   - Taste Skill: redesign-existing-projects pass, preserving the current vanilla stack.
   - Emil design-engineering: motion-only review.
4. Treat the current composition as evidence. Do not layer another patch over an already-conflicting composition.
5. Fix the highest-impact, evidence-backed defects first.
6. Re-check 375px, 768px and 1440px.
7. Verify auth, navigation anchors, course links, legal links, horizontal overflow, console errors and reduced-motion behavior.
8. Keep all Bullseye brand and educational constraints intact.
9. Do not merge or deploy from this command. This is a visual/engineering trial branch.

Useful explicit commands when the relevant skills are installed:

```text
/impeccable critique index.html
/impeccable audit index.html
/impeccable polish index.html
```

For Taste Skill:

```text
Use the redesign-existing-projects skill on the existing Bullseye Theory homepage. Preserve the vanilla HTML/CSS/JS stack and existing functionality. Audit first, then apply only targeted visual improvements.
```

For motion:

```text
Use Emil Kowalski's design-engineering skill for a motion-only pass. Improve easing, duration, sequencing, hover physics, SVG/canvas reveals and scroll behavior without adding gratuitous animation. Preserve reduced-motion behavior.
```
