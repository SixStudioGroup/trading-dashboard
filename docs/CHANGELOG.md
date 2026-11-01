# Changelog

## 2026-11-02 — Original sizes restored (1.3.2)

- Removed the page scaling, wider content area and larger text added for large monitors. Pages use their original sizes.

## 2026-11-02 — Review fixes on the original layout (1.3.1)

- Stocks cockpit: price chart with 20 and 50-day averages, plus 20-day high and low and ATR.
- Crypto cockpit: seven-day price line. The CoinSpot link now works for supported coins once checks are complete.
- Stocks plans need a stop below entry and are refused on stale data. The journal shows each plan's status with a link to record the fill or exit.
- Removed filters with no stocks behind them and the wrong Stooq source label. Best Setup only names a real setup.
- Rule checks now say they share the same price data and have shown no edge.
- Replaced the failing link-integrity workflow with `tools/check-links.mjs` in Checks.

## 2026-11-02 — Original layout restored (1.3)

- The Crypto Terminal is the home page again. The Stocks table and cockpit and the original eight-item menu are back.
- Today moved to `today.html` and the planner to `planner.html`. Both are optional and linked from the footer.
- Kept: crypto and ASX data fixes, freshness labels, the stale-data lock.
- Stocks table columns fold so Analyse stays visible on smaller desktops.
- Saving a plan on the Stocks page no longer overwrites open or closed trades for that ticker.

## 2026-11-01 — Monday-ready (1.2)

### Data truth

- Fixed the crypto workflow's invalid YAML, which had stopped the snapshot for 131 days without any alert.
- Fixed Yahoo's duplicate session bar, which showed a 0% daily move for every ASX stock after each close.
- Page-load time is no longer shown as data time. Stale data blocks new plans. "Live" wording removed.
- ASX freshness counts trading sessions, so weekends no longer raise a false stale warning.
- Generator validation fails when nearly every stock shows no move. New `checks.yml` parses workflow YAML and runs tests.

### Product

- New home: Today (`index.html`). The crypto terminal moved to `crypto.html` and is labelled unproven.
- Navigation reduced to Today, Scan, Journal and Settings.
- Scan has a one-ticker planner: chart, thesis, numeric levels, automatic fee-aware size and rule checks.
- Trades now run planned, open, closed or cancelled, in paper or live mode, with net result and R. Plans for the same ticker no longer overwrite each other.
- Paper criteria before live: 30 closed trades, positive expectancy after costs, 90% plan-following.
- Review adds expectancy, drawdown and fees, with a sample-size guard. Crypto close now deducts an assumed fee.
- Settings adds backup, CSV export and restore with a restore point.

### Removed

- `stock-release2.js` and its patch layer, replaced by `sq-core.js` and `sq-store.js`. `scripts/test_calculations.mjs` replaced by `scripts/test_core.mjs`.
- Queue ranking, agent consensus, prefilled trade reasons, and the rule that execution had to start in SixQuant.
- The scheduled Stooq snapshot, which was timing out while reporting success.

Evidence: `docs/SIGNAL-EVIDENCE.md`.

## 2026-06-13 — SixQuant 1.0

Platform rebadged **SixSignal → SixQuant** and hardened into a working
release across desktop, tablet, and phone. Full pack:
`docs/RELEASE-SIXQUANT-1.0.md`.

### Brand and theme

- Full rename across UI, docs, generators, workflows and data schema labels
  (`sixquant.crypto.snapshot.v1`, `sixquant.asx.feed.v2`). Legacy
  `sixsignal.*` fee-defaults localStorage key migrates on load.
- New brand layer `sixquant.css`: dark trading-terminal theme — neutral
  charcoal surfaces, electric-blue accent, market green/red semantics,
  Inter UI type, IBM Plex Mono tabular numerics, new bar-mark favicon.

### Risk controls (decision-support boundary unchanged)

- Five-Question Gate replaces the generic cockpit checklist; confirm and
  save-to-journal both require it.
- Risk Rules in Settings (`sixquant.riskRules.v1`, defaults 8% position cap
  / 20% cash reserve / −8% exit alert). Cap breaches and missing
  invalidation block crypto and stock plans; reserve shortfall warns.
- Position Monitor and the unified Alerts feed flag held assets past the
  drawdown threshold.
- Snapshot workflows write `data/heartbeat-<feed>.json`; both terminals
  flag a missed pipeline run before the 24h staleness banner trips.

### Device modes

- `sixquant-mode.js` sets `data-device=phone|tablet|desktop` from viewport
  width (Settings can lock a mode; Auto default).
- Phone: Check-mode glance strip (portfolio, positions with worst drawdown,
  exit alerts, regime), priority-column tables sized to fit 390px with no
  side-scroll, 15px base type, 40px touch targets.

### Defects fixed

- `formatTimestamp` undefined in stocks.js scope — any populated ASX feed
  crashed `renderAll`, killing the stocks page (the original "console is
  broken" report).
- Stocks journal MutationObserver re-fired on its own innerHTML writes —
  infinite loop froze the renderer once the crash above was fixed.
- Panels clipped wide tables with no scroll above 760px — stocks queue
  Analyse and journal Delete columns were invisible on desktop.
- Topbar brand/nav/controls overlapped between 761–1180px (iPad portrait).
- Crypto queue header was one column short — the 24hr label sat over the
  1hr data column; missing 1hr header added.
- iOS hardening: `-webkit-backdrop-filter`, text-size-adjust lock, 16px
  form controls (no focus zoom), safe-area padding.

---

## 2026-06-03 — Live Market Data Restored

### Crypto Data Feed Fixed

- Root cause: `MARKET_DATA_PROXY_URL` was empty. CoinGecko deprecated unauthenticated browser-side API access, causing all crypto data to fall back to a stale 9-coin hardcoded snapshot.
- Fix: GitHub Actions workflow (`update-crypto-snapshot.yml`) now fetches CoinGecko server-side using a key stored in GitHub Secrets and commits `data/crypto-snapshot.json` to the repo.
- `app.js` now reads from the committed snapshot — no browser-side API calls, no CORS risk, no key exposure.
- Bootstrap seed committed so the portal works immediately on deploy; live data overwrites it within 15 minutes of first workflow run.

### Schedule Rationalisation

All three data workflows aligned to morning / afternoon / evening AEST windows:

| Workflow | Old cadence | New cadence |
|---|---|---|
| Crypto snapshot | Every 15 min | 07:30 / 13:00 / 19:30 AEST |
| ASX intraday feed | 4× weekday | 3× weekday (10:00 / 13:00 / 16:15 AEST) |
| Stocks snapshot (Stooq) | Every hour | 3× weekday (07:30 / 17:30 / 21:30 AEST) |

### CI Runtime Updated

All three GitHub Actions workflows opt into Node.js 24 (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`) ahead of the June 16 2026 forced cutover.

---

## Release 0.x

### Current State

- Opportunity Queue implemented.
- Manual holdings implemented.
- CoinSpot execution boundary implemented.
- Live versus fallback state implemented.
- Market attention and signal surfaces implemented.
- Portfolio visibility implemented.
- Review surfaces implemented.

### Documentation Pass

The repository now includes:

- Product map
- Release plan
- UX review
- Trader operating model
- User guide
- Known limitations
- Changelog

### Next Release Direction

Release 1.0 should prioritise:

- Workflow clarity
- Reduced UI clutter
- Stronger analysis flow
- Better decision hierarchy
- Improved review discipline
- Product trust and stability