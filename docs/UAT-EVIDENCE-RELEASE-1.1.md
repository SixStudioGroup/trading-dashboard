# SixQuant Release 1.1 — UAT Evidence Template

Australian stocks realism (issue #2) + ASX delayed-feed production controls
(issue #6). This is the **human sign-off record**. The code-completable work is
implemented and machine-verified (see "Automated verification" below); the rows
below require a person — the PM and/or chief trader — to confirm in a live
browser and record evidence.

- **Build under test:** branch `improvements/2026-06-23` (record the commit SHA).
- **Live URL:** https://sixstudiogroup.github.io/trading-dashboard/stocks.html
- **Tester:** ______________________  **Role:** PM / Chief Trader  **Date:** __________
- **Device(s):** phone 390 / tablet 768 / desktop 1440 (record which were checked)

> Evidence = a screenshot or a one-line observation per row. Mark each
> Pass / Fail / N/A. A Fail must link a defect per `docs/UAT-PLAN.md` severity.

## Automated verification (already green — re-run to confirm)

| Command | Expected | Result |
|---|---|---|
| `node --check` on all `.mjs`/`.js` | no syntax errors | ☐ |
| `python -m py_compile scripts/*.py` | compiles | ☐ |
| `python scripts/test_signals.py` | 28 tests OK | ☐ |
| `node scripts/test_calculations.mjs` | 42 tests pass | ☐ |
| `node tools/generate-asx-feed.mjs` | feed written, heartbeat `ok`, ≥20 assets | ☐ |

## #2 — Australian stocks realism

| # | Acceptance item | How to check | Pass/Fail | Evidence |
|---|---|---|---|---|
| 2.1 | Expanded ASX universe (documented liquid set) | Stocks queue shows the broad ASX list (~65 names, all sectors); subtitle shows the universe name + revision + asOf | ☐ | |
| 2.2 | Coverage source/freshness is shown | Source badge + subtitle state source, mode, "As at" Sydney time, and universe vintage | ☐ | |
| 2.3 | Brokerage + spread + fees shown in the displayed plan | Fee / Net Outcome panel shows gross, total costs, net, breakeven in AUD | ☐ | |
| 2.4 | Fees reflected in the risk/position-size calc (fee-aware sizing) | Risk panel shows a fee-aware size, "X fewer than fee-blind", and worst-case loss incl. round-trip fees within the risk budget; raising brokerage/spread shrinks the size live | ☐ | |
| 2.5 | Broker-fee config in Settings, persisted | Settings → ASX Broker Fee Defaults: save values, reload, values persist; they pre-fill the Stocks fee panel | ☐ | |
| 2.6 | Fee/net maths correct | Spot-check one plan by hand against the panel (units, gross, costs, net, breakeven) | ☐ | |
| 2.7 | Australian relevance in copy/labels | AUD currency, ASX-first labels, "delayed/unlicensed" framing, AU broker language | ☐ | |

## #6 — ASX delayed-feed production controls

| # | Acceptance item | How to check | Pass/Fail | Evidence |
|---|---|---|---|---|
| 6.1 | Holiday + DST handling | On an ASX holiday, `asxSessionOpen` is false and the UI shows the holiday name; AEST/AEDT label is correct around a DST change | ☐ | |
| 6.2 | Freshness SLA documented | `docs/ASX-LIVE-FEED-CONTRACT.md` states the 36h SLA (and 76h heartbeat / 24h snapshot) | ☐ | |
| 6.3 | Feed validation fails loud | Force a bad run (e.g. empty universe locally); generator exits non-zero, keeps last-good feed, writes degraded heartbeat | ☐ | |
| 6.4 | Workflow-failure alerting | Simulate a failed scheduled run; a `feed-failure` issue opens/updates and the job goes red | ☐ | |
| 6.5 | UI distinguishes delayed vs licensed live | Badge "ASX DELAYED feed (unlicensed)", "Price (delayed)" header/card, persistent delayed banner, demo labelled "DEMO data (not real)" | ☐ | |
| 6.6 | Provider boundary documented | `docs/ASX-LIVE-FEED-CONTRACT.md` + `docs/KNOWN-LIMITATIONS.md` state usage/redistribution/support boundary | ☐ | |
| 6.7 | Calculation tests exist | `node scripts/test_calculations.mjs` passes (fees, units, returns, breakeven edges) | ☐ | |

## #3 — Licensed live feed (PRODUCTION BLOCKER — not code-completable)

| # | Item | State |
|---|---|---|
| 3.1 | Replace delayed snapshot with a production-grade **licensed live** ASX feed | **BLOCKED** — requires a paid/licensed data-provider account and a business decision. Static/delayed feed is *Accepted for layout/UAT only*. Code-side controls (labelling, validation, alerting, freshness SLA, boundary docs) are done. |

## Execution-boundary re-confirmation (every release)

| Check | Pass/Fail |
|---|---|
| No order-execution / broker-POST / money-movement code anywhere | ☐ |
| Stocks remain planning-only; broker handoff is a placeholder | ☐ |
| No client-side trading-capable secrets | ☐ |

## Sign-off

| Role | Name | Decision (Accept / Reject) | Date |
|---|---|---|---|
| Product Manager | | | |
| Chief Trader | | | |

> Human UAT (the rows above) cannot be performed by the build agent and remains
> the outstanding sign-off step for Release 1.1, alongside the #3 licensed-feed
> business decision.
