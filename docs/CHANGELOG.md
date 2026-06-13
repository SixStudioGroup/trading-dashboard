# Changelog

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