# Bullseye Theory — Claude Design Workflow

For UI/UX work, read design-system/bullseye/MASTER.md first.

Workflow:
1. Plan the visual system before writing CSS.
2. Use UI/UX Pro Max guidance for layout, typography, responsive UX and interaction patterns.
3. Use Anthropic frontend-design principles to avoid generic AI aesthetics.
4. Use browser tooling to inspect the actual rendered page at 375px, 768px and 1440px.
5. Fix visual defects based on screenshots/console state rather than guessing from source code.
6. Run an accessibility/responsive review before declaring the work finished.

Do not layer patches indefinitely. If the composition is wrong, replace the composition.


## AI design skill trial
For the isolated design experiment, use `.claude/commands/bullseye-design-trial.md` on branch `ai-design-skills-trial-2026-10-03`. Do not deploy or merge this trial automatically. Keep the existing vanilla HTML/CSS/JS stack and Bullseye brand constraints.
