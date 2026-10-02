# Bullseye Theory — Master Design System

## Product
Premium trading education. Institutional, cinematic, disciplined. Never look like a signal-selling, gambling, or easy-money product.

## Visual direction
- Obsidian navy/black foundation: #05070A / #0B0E14
- Metallic gold: #C5A059 / #E4B957
- Neon lime: #A8FF61 / #39FF14 — reserve for signal/data emphasis
- Off-white: #F3F0E8
- Glass panels with restrained blur, thin borders, and real depth
- Premium Dubai/financial-market atmosphere without lifestyle-flex clichés

## Typography
- Display: Inter / Neue Haas Grotesk style, tight tracking, strong hierarchy
- Data: JetBrains Mono / SF Mono
- Never use excessive rounded-card SaaS styling or generic gradients

## Hero composition
The hero must read as one art-directed scene: Dubai skyline + realistic/3D bull centerpiece + target/radar geometry + market data + chart accents + concise headline. The bull is the visual focal point; UI elements orbit it instead of competing with it.

## Motion
- Slow camera/hero parallax
- Target/radar rotation
- Subtle bull breathing/rotation
- Chart line/candlestick draw-in
- Scroll reveal with reduced-motion fallback
- No excessive bouncing, spinning, or gimmicky effects

## Responsive art direction
Desktop and mobile are separately composed. Do not simply scale the desktop composition. On mobile: bull remains the focal point, ticker becomes compact, copy remains readable, CTA stays above the fold, and decorative HUD elements are reduced.

## UX
- Primary CTA: enter student area / start learning
- Secondary CTA: curriculum
- Clear educational disclaimer
- No guaranteed-return claims, profit promises, or signal-selling language
- WCAG-conscious contrast and touch targets

## Quality gate
Before shipping UI changes, inspect rendered desktop and mobile states, check console errors, test navigation/CTAs, and verify that the hero still looks intentional at 375px, 768px, and 1440px widths.
