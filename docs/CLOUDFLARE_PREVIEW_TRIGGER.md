# Cloudflare Preview Build Trigger

This file documents the safe Cloudflare preflight for the Bullseye India release candidate.

- Target branch: `release/bullseye-india-course-indicator-integration`.
- The `cloudflare-preview.yml` workflow runs repository tests and `wrangler deploy --dry-run` only.
- It validates the Worker bundle and Cloudflare credentials; it does **not** deploy a Worker or promote anything to production.
- The workflow also retains the older secure-course preview branch for historical testing.
- The separate Cloudflare GitHub preview deployment is not assumed current until its comment identifies the exact release commit.
- Do not promote a preview to production, merge the release PR, apply production migrations, or enable payment checkout without explicit owner approval.
