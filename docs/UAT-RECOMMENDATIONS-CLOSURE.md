# UAT Recommendations — Closure Register

Disposition of every recommendation from the MVP/MLP UI/UX + engineering review
(crypto terminal, stocks terminal, shared design system). Every item is closed:
either **Done** (implemented + verified in-browser) or **Deferred** (consciously
scheduled later, with the reason). Verified against commit `b409177`.

## Done — implemented and verified

| # | Recommendation | Severity | Where | Verification |
|---|---|---|---|---|
| 1 | Stocks multi-plan fee/net persistence — `normalizePlan` now carries Release-2 fee fields so saving one plan no longer strips fees off the others | Blocker | `stocks.js` | In-browser: `feesPreserved: true` |
| 2 | Closed-trade integrity — a trade can only be saved as "closed" with both an exit date and a positive exit price | Major | `app.js` | In-browser: invalid close blocked with message |
| 3 | `boot()` 60s poll wrapped in try/catch — a render error degrades status instead of freezing the UI | Major | `app.js` | Loads clean; no console errors |
| 4 | Fallback/demo feed state surfaced in the Check Summary glance strip | Blocker | `app.js` | `cs-regime` annotated + `is-fallback` class |
| 5 | Inline holdings edit: Enter commits the edit (keyboard parity with Save) | Major (a11y) | `app.js` | Handler bound to `.inline-balance` |
| 6 | Decision Cockpit receives focus on Analyse click (not on the poll re-render, which would steal focus) | Major (a11y) | `app.js` | Focus moved at click site only |
| 7 | Skip-to-content link + `main` landmark id on all 8 pages | Major (a11y) | all HTML | DOM-verified across pages |
| 8 | `aria-live` on dynamic status/feed elements; decorative nav icons `aria-hidden` | Major (a11y) | all HTML | DOM-verified (4 live regions/page) |
| 9 | `role=tab`/`tablist` + `aria-selected` on tab groups | Major (a11y) | index/stocks/reports | DOM-verified |
| 10 | Explicit `for=`/`aria-label` on form fields (risk rules, display mode, GitHub token) | Major (a11y) | settings | DOM-verified |
| 11 | `--muted` token raised `#A4AFC0` → `#B8C5D8` for WCAG-AA contrast on the dark theme | Polish | `sixquant.css` | Computed token `#B8C5D8` |

The earlier review flagged "device-mode selector is non-functional" as a blocker.
**Refuted** on inspection: device mode is applied via CSS attributes in
`sixquant-mode.js` (`html[data-device=…]`) and renders correctly — no change needed.

## Deferred — dispositioned, not UAT gates

| # | Recommendation | Why deferred | Target |
|---|---|---|---|
| D1 | Real ASX live feed + full ASX universe (replace delayed/demo Stooq snapshot) | Data-source decision, not a code defect; requires choosing a market-data provider. The Stocks terminal clearly labels delayed/demo feed state (source badge + staleness warning), so UAT can validate the workflow safely on the current feed. | Release 1.1 — pending provider choice |
| D2 | De-duplicate the ~16 utility functions shared between `app.js` and `stocks.js` into a common module | Pure maintainability; a cross-file refactor of the two largest files carries regression risk that is not worth taking against a freshly stabilised UAT build. | Post-UAT hardening |
| D3 | Replace the `stock-release2.js` patch/MutationObserver layer with a first-class module integrated into `stocks.js` | Architectural; the current layer works and is verified. Rewriting it now trades stability for cleanliness at the wrong moment. | Post-UAT hardening |
| D4 | Migrate complex `innerHTML` template rendering to `createElement`/DOM APIs | Large, app-wide change; current rendering escapes user input (`escapeHtml`) so there is no correctness/XSS gap to force now. | Post-UAT hardening |
| D5 | Minor polish: form double-submit guards, localStorage-quota user notification, Lucide icon fallback, selected-asset session persistence, centralised signal-label map | Low impact; each is self-mitigated today (idempotent upserts, large quota, text labels beside icons). Batch into a polish pass. | Backlog |

## Net UAT posture

All blocker- and major-severity **code** recommendations are resolved and verified.
Remaining open items are a data-source decision (D1) and post-UAT quality work
(D2–D5) — none block User Acceptance Testing. Crypto terminal is UAT-ready;
Stocks terminal is UAT-ready on the labelled delayed feed.
