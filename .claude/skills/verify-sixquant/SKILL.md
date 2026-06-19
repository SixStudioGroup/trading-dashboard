---
name: verify-sixquant
description: Verify the live SixQuant deploy. Runs the headless-Chrome release check matrix (page loads, console errors, device modes, layout overflow, risk-gate blocks, feed heartbeat) against the production URL and reports pass/fail. Use after deploying, before tagging a release, or to confirm the live site is healthy.
---

# Verify SixQuant

Run the committed engine from the repo root:

    node tools/verify-release.mjs

Optional base-URL arg (defaults to production):

    node tools/verify-release.mjs https://sixstudiogroup.github.io/trading-dashboard

Wait for the GitHub Pages build of the latest commit before running, or the
check tests stale assets:

    gh api repos/SixStudioGroup/trading-dashboard/pages/builds/latest --jq ".status + \" \" + .commit"

(unset GITHUB_TOKEN if gh reports bad credentials — keyring auth is the working one).

## What it checks

| Group | Checks |
|---|---|
| Load | All 8 pages reach complete, title is SixQuant (no SixSignal) |
| Console | index.html and stocks.html throw no errors on load |
| Desktop (1440) | data-device=desktop, no clipped buttons / Analyse / Delete |
| Phone (390) | data-device=phone, scrollWidth<=392, queues fit, Analyse visible, Check strip shown |
| Functional | heartbeat populated; gate blocks save without answers; oversized position blocked by the cap |

Prints `RESULT: PASS (n/n)` or `RESULT: FAIL (x/n)`; exits 0 / 1 / 2.

## Reading results

- PASS — report green with the count.
- FAIL — list failed checks. Each name encodes the surface
  (e.g. phone:stocks.html:analyse-visible). Layout failures trace to
  sixquant.css device-mode rules; functional failures to app.js / stocks.js.
  Do not declare success on a FAIL.

## Machine notes

- Verify against the live URL — headless Chrome here cannot reach localhost.
- The engine uses a fresh Chrome user-data-dir each run; reused profiles serve
  stale cached pages and produce false passes.
- Daily watchdog: ~/.hermes/scripts/sixquant_verify.py, Hermes cron
  sixquant-watchdog (09:00 Brisbane), silent unless a check fails.
