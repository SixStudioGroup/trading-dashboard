# Design Spec: Stooq Stock Feed Adapter — Package 3A

**Date:** 2026-05-27
**Status:** Approved

---

## Overview

Replace demo-only Stocks Workspace with a multi-regional stock universe backed by a keyless Stooq CSV feed delivered via GitHub Actions. Browser reads a static snapshot file only — no browser-side CORS fetch to Stooq. Demo data remains as a fallback. Crypto Workspace is untouched.

---

## Goals

- Show real stock data for 41 symbols across 4 regional universes.
- Derive signalState, riskState, marketRegime algorithmically from price/volume data.
- Fall back to demo data gracefully if the snapshot is unavailable or invalid.
- Add region filter UI to the Stocks Opportunity Queue.
- No API keys, no paid APIs, no broker execution links.
- Deploy to GitHub Pages with no additional configuration.

---

## Non-Goals

- No Crypto Workspace changes.
- No Yahoo scraping.
- No broker execution links (Buy Now, Sell Now, Strong Buy).
- No API keys or secrets.
- No browser-side fetch to Stooq.
- No automated trading.
- No changes to journal/reports storage keys.
- No changes to Public Demo / Private Local mode logic.

---

## Stock Universes

### Australia / ASX (currency: AUD, exchange: ASX)
BHP, CBA, CSL, WES, MQG, TLS, WOW, NAB, WBC, ANZ

### U.S. Technology (currency: USD, exchange: NASDAQ or NYSE)
AAPL, MSFT, NVDA, AMD, GOOGL, META, AMZN, TSLA, AVGO, PLTR, CRM, ORCL, ADBE

### U.S. Large Cap / Market Leaders (currency: USD)
JPM, GS, BRK.B, V, MA, UNH, XOM, COST, NFLX, DIS

### Global / ADR Watch (currency: USD, US-listed ADRs)
TSM, ASML, SAP, SONY, BABA, NVO, SHEL, TM

**Total: 41 symbols**

Sector, exchange, currency, and display name are hardcoded in the Python metadata table. Stooq CSV does not supply these reliably.

---

## Stooq Symbol Mapping

| Region | Format | Notes |
|---|---|---|
| ASX | `{SYM}.AU` | e.g. `BHP.AU` |
| US (all regions) | `{SYM}.US` | e.g. `AAPL.US` |
| BRK.B | `BRK-B.US` | Stooq uses dash, not dot |
| Global ADRs | `{SYM}.US` | All trade on US exchanges |

---

## Architecture

```
GitHub Actions (hourly cron + manual dispatch)
  → scripts/fetch_stocks.py
      → Stooq daily CSV (server-side)
      → compute price, change1d, change5d, volume, avgVol, relVol
      → derive signalState, riskState per asset
      → derive marketRegime per region
      → validate: skip failed symbols, record in fetchErrors
      → guard: do not overwrite last good snapshot if < 50% symbols succeed
      → write data/stocks-snapshot.json
      → commit if changed ([skip ci])

Browser (stocks.js)
  → fetch("data/stocks-snapshot.json") on page load
  → validate source, mode, assets array, lastUpdated age
  → if valid → stockUniverse = snapshot.assets; source label = "Stooq Snapshot"
  → if invalid/missing → stockUniverse = DEMO_STOCKS; source label = "Demo fallback"
  → partial warning if < 50% symbols present
  → region filter state in JS variable
  → renderOpportunityQueue() filters by activeRegion
```

---

## Python Fetch Script: scripts/fetch_stocks.py

### Fetch per symbol

```
GET https://stooq.com/q/d/l/?s={stooq_symbol}&i=d
→ parse CSV → last 20 rows
price         = close[-1]
change1d      = (close[-1] - close[-2]) / close[-2] * 100
change5d      = (close[-1] - close[-6]) / close[-6] * 100
volume        = volume[-1]
averageVolume = mean(volume[-20:])
relativeVolume = volume / averageVolume
```

Rate limit: 0.5 s delay between requests. 41 symbols ≈ 25 s total.

### Per-symbol failure handling

If a symbol fetch fails (network error, bad CSV, insufficient rows):
- Log to `fetchErrors` array with symbol and reason.
- Omit from `assets` array.
- Continue to next symbol.
- Do NOT abort the whole run.

### Snapshot guard

If fewer than 50% of expected symbols return valid data:
- Do not overwrite the existing `data/stocks-snapshot.json`.
- Log a warning. Exit with non-zero code.

### Signal derivation (per asset, Python)

```python
# signalState
if change1d >= 2 and rel_vol >= 1.5 and change5d > 0:  → "Breakout"
elif rel_vol >= 2.0 and change1d > 0:                   → "Volume Spike"
elif change1d > 0 and change5d > 0:                     → "Watch"
elif change1d <= -2 or change5d <= -5:                  → "Sell Risk"
else:                                                   → "No Action"

# riskState
if signal == "Sell Risk" or change1d <= -3 or change5d <= -7: → "Elevated"
elif rel_vol >= 2.0 or abs(change1d) >= 3:                    → "Review"
else:                                                          → "Normal"
```

### Market regime derivation (per region)

Compute for regions: `Australia`, `U.S. Tech`, `U.S. Large Cap`, `Global ADRs`, `All Stocks`.

```python
pos_count = count(change1d > 0 and change5d > 0)
neg_count = count(change1d < 0 or change5d < 0)
total = len(region_assets)

if pos_count / total > 0.6:  → "Constructive"
elif neg_count / total > 0.6: → "Defensive"
else:                         → "Mixed"
```

Only computed if ≥ 3 assets available for that region (otherwise `"Insufficient Data"`).

---

## Snapshot Shape: data/stocks-snapshot.json

```json
{
  "source": "stooq",
  "mode": "snapshot",
  "lastUpdated": "2026-05-27T10:00:00Z",
  "symbols": ["AAPL", "MSFT", "..."],
  "fetchErrors": [
    { "symbol": "BABA", "reason": "insufficient rows" }
  ],
  "marketRegimes": {
    "Australia": "Constructive",
    "U.S. Tech": "Mixed",
    "U.S. Large Cap": "Mixed",
    "Global ADRs": "Mixed",
    "All Stocks": "Mixed"
  },
  "assets": [
    {
      "assetClass": "stock",
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "exchange": "NASDAQ",
      "region": "U.S. Tech",
      "sector": "Technology",
      "currency": "USD",
      "price": 189.50,
      "change1d": 1.2,
      "change5d": 3.4,
      "volume": 52000000,
      "averageVolume": 48000000,
      "relativeVolume": 1.08,
      "signalState": "Watch",
      "riskState": "Normal",
      "marketRegime": "Mixed",
      "source": "Stooq",
      "lastUpdated": "2026-05-27T10:00:00Z"
    }
  ]
}
```

A seed `data/stocks-snapshot.json` is committed with demo-mode assets (source: "Demo") so GitHub Pages serves a valid file before the first Actions run.

---

## GitHub Actions Workflow: .github/workflows/stocks-snapshot.yml

```yaml
name: Stocks Snapshot
on:
  schedule:
    - cron: '0 * * * *'   # every hour
  workflow_dispatch:

permissions:
  contents: write

jobs:
  snapshot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install requests
      - run: python scripts/fetch_stocks.py
      - name: Commit if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/stocks-snapshot.json
          git diff --staged --quiet || git commit -m "chore: update stocks snapshot [skip ci]" && git push
```

`[skip ci]` prevents workflow re-trigger on the commit. No secrets required — `GITHUB_TOKEN` is automatic with `contents: write`.

Existing `bot.yml` (Market Scanner stub) is left untouched.

---

## Browser Adapter: stocks.js changes

### New functions

```
initStocksAdapter()
  → fetch("data/stocks-snapshot.json")
  → validate: source === "stooq", assets is array, lastUpdated parseable
  → if valid: stockUniverse = snapshot.assets; snapshotSource = "Stooq Snapshot"
  → if fail: stockUniverse = normalizeDemoStocks(); snapshotSource = "Demo fallback"
  → set partialWarning if assets.length < (symbols.length * 0.5)
  → set snapshotRegimes from snapshot.marketRegimes

normalizeDemoStocks()
  → maps existing DEMO_STOCKS to full normalized schema
  → adds region, exchange, currency, source:"Demo", signalState, riskState, marketRegime

deriveSnapshotRegime(region)
  → returns from snapshotRegimes[region] or "Mixed"
```

### Modified functions

```
findSelectedStock()     → searches stockUniverse (not hardcoded DEMO_STOCKS)
rankedStocks()          → filters by activeRegion, then sorts by rankingScore
renderOpportunityQueue() → uses stockUniverse + activeRegion filter
renderAnalysis()         → uses new normalized field names (change1d not oneDayChange)
stockRankingScore()      → field name aliases: change1d/oneDayChange both accepted
stockAgentConsensus()    → same logic, updated field names
```

### Region filter state

```javascript
let activeRegion = "All";  // "All" | "Australia" | "U.S. Tech" | "U.S. Large Cap" | "Global ADRs"
```

Filter buttons dispatch to `setActiveRegion(region)` → `renderOpportunityQueue()`.

---

## UI Changes: stocks.html / stocks.js

### Region filter bar (above opportunity queue)

```html
<div class="stock-region-filter" role="group" aria-label="Filter by region">
  <button class="region-btn active" data-region="All">All</button>
  <button class="region-btn" data-region="Australia">Australia</button>
  <button class="region-btn" data-region="U.S. Tech">U.S. Tech</button>
  <button class="region-btn" data-region="U.S. Large Cap">U.S. Large Cap</button>
  <button class="region-btn" data-region="Global ADRs">Global ADRs</button>
</div>
```

### Source badge in status panel

Replaces static "Manual review only":
```
Stooq Snapshot  (green badge if fresh)
Demo fallback   (amber badge)
Stooq Snapshot — partial data (amber badge if < 50%)
```

### Staleness warning

If `lastUpdated` > 24 h ago: append "(data may be stale)" to source badge.

### Fallback message

If snapshot missing/invalid:
> "Stock snapshot unavailable — demo/review mode only."

### Partial warning

If < 50% symbols loaded:
> "Partial stock snapshot — review with caution."

### Disclaimer (below opportunity queue)

> "Stock signals are derived from snapshot data and are for review only."

### Opportunity queue table

Gains two columns: `Region` and `Exchange`. Existing columns preserved.

### Journal rows

`region` and `exchange` fields added to stock journal display where the stock plan includes them.

---

## Demo Fallback

### When used

- `data/stocks-snapshot.json` not found (404).
- JSON parse error.
- `source !== "stooq"` or `assets` not an array.
- `lastUpdated` missing or unparseable.

### Demo stock data

Existing `DEMO_STOCKS` (6 ASX stocks) expanded to full 10-stock ASX universe. Each demo stock normalised to full schema with `source: "Demo"`, `signalState`/`riskState`/`marketRegime` preserved from existing static values.

US and Global ADR demo stocks not added. When region filter is set to a non-ASX region in demo mode, queue shows:
> "No demo data for this region. Switch to Private Local Mode or wait for Stooq snapshot."

---

## Constraints Honoured

| Constraint | Confirmed |
|---|---|
| No API keys | ✓ |
| No paid APIs | ✓ |
| No Yahoo scraping | ✓ |
| No browser fetch to Stooq (CORS) | ✓ |
| No broker execution links | ✓ |
| No Buy Now / Strong Buy / Sell Now | ✓ |
| Crypto Workspace unchanged | ✓ |
| Journal/Reports storage keys unchanged | ✓ |
| Public Demo / Private Local logic unchanged | ✓ |
| Hide Values logic unchanged | ✓ |
| assetClass: "stock" preserved | ✓ |
| No real private trade data committed | ✓ |

---

## Acceptance Criteria

- [ ] GitHub Action generates `data/stocks-snapshot.json` on schedule and manual dispatch.
- [ ] Stocks Workspace loads snapshot and renders Stooq data.
- [ ] Region filters All / Australia / U.S. Tech / U.S. Large Cap / Global ADRs work.
- [ ] signalState / riskState / marketRegime are derived and displayed correctly.
- [ ] Demo fallback renders when snapshot is missing or invalid.
- [ ] Fallback message displayed: "Stock snapshot unavailable — demo/review mode only."
- [ ] Partial warning displayed when < 50% symbols loaded.
- [ ] Individual symbol failures omitted from assets, recorded in fetchErrors.
- [ ] Snapshot not overwritten if < 50% symbols succeed.
- [ ] Opportunity Queue still renders and ranks correctly.
- [ ] Agent Consensus still works with normalized fields.
- [ ] Crypto Workspace remains unchanged.
- [ ] Public Demo / Private Local / Hide Values all work.
- [ ] Journal and Reports retain assetClass: stock; region and exchange shown where available.
- [ ] No API keys in repo.
- [ ] No console errors.
- [ ] No undefined / null / NaN in rendered output.
- [ ] No broker links.
- [ ] Deploys to GitHub Pages without additional configuration.
