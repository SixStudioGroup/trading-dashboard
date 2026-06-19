# Package 3A: Stooq Stock Feed Adapter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace demo-only Stocks Workspace with a 41-symbol multi-regional universe sourced from Stooq via GitHub Actions, with derived signals, region filters, and a robust demo fallback.

**Architecture:** A Python script (`scripts/fetch_stocks.py`) runs on GitHub Actions hourly, fetches Stooq daily CSV for 41 symbols, derives signalState/riskState/marketRegime, and writes `data/stocks-snapshot.json`. The browser (`stocks.js`) fetches only that static file — no direct Stooq calls. If the snapshot is missing or invalid, `stocks.js` falls back to demo data with a clear label.

**Tech Stack:** Python 3.11 + `requests` (Actions runner), vanilla JS (browser), GitHub Actions with `GITHUB_TOKEN` (no secrets).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `data/stocks-snapshot.json` | Create | Static snapshot; seed file commits with `source:"seed"` so the browser falls back to demo until first Actions run |
| `scripts/fetch_stocks.py` | Create | Full Stooq fetcher: metadata table, signal derivation, snapshot writer |
| `scripts/test_signals.py` | Create | Unit tests for derive_signal_state, derive_risk_state, derive_market_regime |
| `.github/workflows/stocks-snapshot.yml` | Create | Hourly + manual dispatch; runs fetch script; commits if changed |
| `stocks.js` | Modify | Adapter (fetch + validate + fallback), DEMO_STOCKS expansion, region filter, updated renders |
| `stocks.html` | Modify | Region filter bar, source badge, disclaimer, Region/Exchange table columns |
| `styles.css` | Modify | `.region-btn`, `.stock-region-filter`, `.source-banner` styles |

---

## Task 1: Seed snapshot file

**Files:**
- Create: `data/stocks-snapshot.json`

- [ ] **Step 1: Create data directory and seed file**

Create `data/stocks-snapshot.json` with this exact content. The `source: "seed"` causes browser validation to fail gracefully → demo fallback until first Actions run.

```json
{
  "source": "seed",
  "mode": "snapshot",
  "lastUpdated": "2026-05-27T00:00:00Z",
  "symbols": [],
  "fetchErrors": [],
  "marketRegimes": {},
  "assets": []
}
```

- [ ] **Step 2: Verify the file is valid JSON**

```powershell
python -c "import json; d=json.load(open('data/stocks-snapshot.json')); print('OK', d['source'])"
```

Expected output: `OK seed`

- [ ] **Step 3: Commit**

```bash
git add data/stocks-snapshot.json
git commit -m "chore: add seed stocks-snapshot.json placeholder"
```

---

## Task 2: Signal derivation — stub + unit tests (TDD)

**Files:**
- Create: `scripts/fetch_stocks.py` (stub — functions only, no implementation)
- Create: `scripts/test_signals.py`

- [ ] **Step 1: Create stub `scripts/fetch_stocks.py`**

Write only the three stub functions. The rest of the script is added in Task 3.

```python
"""scripts/fetch_stocks.py — Stooq stock snapshot generator for SixQuant Trading OS."""


def derive_signal_state(change1d, change5d, rel_vol):
    raise NotImplementedError


def derive_risk_state(change1d, change5d, rel_vol, signal_state):
    raise NotImplementedError


def derive_market_regime(assets, region):
    raise NotImplementedError
```

- [ ] **Step 2: Create `scripts/test_signals.py`**

```python
"""scripts/test_signals.py — unit tests for signal derivation logic."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import unittest
from fetch_stocks import derive_signal_state, derive_risk_state, derive_market_regime


class TestDeriveSignalState(unittest.TestCase):

    def test_breakout(self):
        self.assertEqual(derive_signal_state(2.5, 3.0, 1.8), "Breakout")

    def test_breakout_exact_boundary(self):
        self.assertEqual(derive_signal_state(2.0, 0.1, 1.5), "Breakout")

    def test_breakout_requires_positive_5d(self):
        # change1d >= 2, rel_vol >= 1.5, but change5d <= 0 → Volume Spike wins
        self.assertEqual(derive_signal_state(2.5, -0.1, 2.1), "Volume Spike")

    def test_volume_spike(self):
        self.assertEqual(derive_signal_state(0.5, -1.0, 2.5), "Volume Spike")

    def test_watch(self):
        self.assertEqual(derive_signal_state(1.0, 2.0, 1.0), "Watch")

    def test_sell_risk_1d(self):
        self.assertEqual(derive_signal_state(-2.5, 0.0, 1.0), "Sell Risk")

    def test_sell_risk_5d(self):
        self.assertEqual(derive_signal_state(0.0, -5.5, 1.0), "Sell Risk")

    def test_no_action_default(self):
        self.assertEqual(derive_signal_state(-0.5, -0.5, 0.8), "No Action")

    def test_no_action_flat(self):
        self.assertEqual(derive_signal_state(0.0, 0.0, 1.0), "No Action")


class TestDeriveRiskState(unittest.TestCase):

    def test_elevated_sell_risk(self):
        self.assertEqual(derive_risk_state(-1.0, -1.0, 1.0, "Sell Risk"), "Elevated")

    def test_elevated_large_1d_drop(self):
        self.assertEqual(derive_risk_state(-3.5, -1.0, 1.0, "No Action"), "Elevated")

    def test_elevated_large_5d_drop(self):
        self.assertEqual(derive_risk_state(-0.5, -8.0, 1.0, "Watch"), "Elevated")

    def test_elevated_exact_1d_boundary(self):
        self.assertEqual(derive_risk_state(-3.0, -1.0, 1.0, "Watch"), "Elevated")

    def test_review_high_relvol(self):
        self.assertEqual(derive_risk_state(0.5, 0.5, 2.5, "Watch"), "Review")

    def test_review_large_positive_1d(self):
        self.assertEqual(derive_risk_state(3.5, 1.0, 1.0, "Watch"), "Review")

    def test_normal_default(self):
        self.assertEqual(derive_risk_state(0.5, 1.0, 1.0, "Watch"), "Normal")

    def test_normal_flat(self):
        self.assertEqual(derive_risk_state(0.0, 0.0, 1.0, "No Action"), "Normal")


class TestDeriveMarketRegime(unittest.TestCase):

    def _assets(self, c1_list, c5_list, region="Australia"):
        return [{"region": region, "change1d": c1, "change5d": c5}
                for c1, c5 in zip(c1_list, c5_list)]

    def test_constructive(self):
        assets = self._assets([1]*7 + [-1]*3, [1]*7 + [-1]*3)
        self.assertEqual(derive_market_regime(assets, "Australia"), "Constructive")

    def test_defensive(self):
        assets = self._assets([-1]*8 + [1]*2, [-1]*8 + [1]*2)
        self.assertEqual(derive_market_regime(assets, "Australia"), "Defensive")

    def test_mixed(self):
        assets = self._assets([1]*5 + [-1]*5, [1]*5 + [-1]*5)
        self.assertEqual(derive_market_regime(assets, "Australia"), "Mixed")

    def test_insufficient_data_under_3(self):
        assets = self._assets([1, 1], [1, 1])
        self.assertEqual(derive_market_regime(assets, "Australia"), "Insufficient Data")

    def test_all_stocks_uses_all_regions(self):
        au = self._assets([1]*5, [1]*5, "Australia")
        us = self._assets([-1]*5, [-1]*5, "U.S. Tech")
        # 5 positive, 5 negative → Mixed
        self.assertEqual(derive_market_regime(au + us, "All Stocks"), "Mixed")

    def test_region_filters_correctly(self):
        au = self._assets([1]*5, [1]*5, "Australia")
        us = self._assets([-1]*10, [-1]*10, "U.S. Tech")
        # Australia: 5/5 positive → Constructive
        self.assertEqual(derive_market_regime(au + us, "Australia"), "Constructive")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run tests — verify they fail with NotImplementedError**

```powershell
cd scripts; python -m pytest test_signals.py -v 2>&1 | head -30
```

If pytest isn't available:
```powershell
cd scripts; python test_signals.py 2>&1 | head -20
```

Expected: tests raise `NotImplementedError` (all FAIL or ERROR). Confirms the stub is wired correctly.

- [ ] **Step 4: Commit stub + tests**

```bash
git add scripts/fetch_stocks.py scripts/test_signals.py
git commit -m "test: add signal derivation unit tests (TDD stub)"
```

---

## Task 3: Complete fetch script — implement and pass tests

**Files:**
- Modify: `scripts/fetch_stocks.py` (full implementation)

- [ ] **Step 1: Replace `scripts/fetch_stocks.py` with the full implementation**

```python
"""
scripts/fetch_stocks.py — Stooq stock snapshot generator for SixQuant Trading OS.
Fetches daily CSV for 41 symbols, derives signals, writes data/stocks-snapshot.json.
Run by GitHub Actions hourly. No API keys required.
"""

import csv
import io
import json
import os
import sys
import time
from datetime import datetime, timezone
from statistics import mean

import requests

# ---------------------------------------------------------------------------
# Stock universe — 41 symbols with static metadata
# ---------------------------------------------------------------------------
STOCK_UNIVERSE = [
    # Australia / ASX
    {"symbol": "BHP",   "stooq": "BHP.AU",   "name": "BHP Group",               "exchange": "ASX",    "region": "Australia",      "sector": "Materials",              "currency": "AUD"},
    {"symbol": "CBA",   "stooq": "CBA.AU",   "name": "Commonwealth Bank",       "exchange": "ASX",    "region": "Australia",      "sector": "Financials",             "currency": "AUD"},
    {"symbol": "CSL",   "stooq": "CSL.AU",   "name": "CSL Limited",             "exchange": "ASX",    "region": "Australia",      "sector": "Healthcare",             "currency": "AUD"},
    {"symbol": "WES",   "stooq": "WES.AU",   "name": "Wesfarmers",              "exchange": "ASX",    "region": "Australia",      "sector": "Consumer Staples",       "currency": "AUD"},
    {"symbol": "MQG",   "stooq": "MQG.AU",   "name": "Macquarie Group",         "exchange": "ASX",    "region": "Australia",      "sector": "Financials",             "currency": "AUD"},
    {"symbol": "TLS",   "stooq": "TLS.AU",   "name": "Telstra Group",           "exchange": "ASX",    "region": "Australia",      "sector": "Communication Services", "currency": "AUD"},
    {"symbol": "WOW",   "stooq": "WOW.AU",   "name": "Woolworths Group",        "exchange": "ASX",    "region": "Australia",      "sector": "Consumer Staples",       "currency": "AUD"},
    {"symbol": "NAB",   "stooq": "NAB.AU",   "name": "National Australia Bank", "exchange": "ASX",    "region": "Australia",      "sector": "Financials",             "currency": "AUD"},
    {"symbol": "WBC",   "stooq": "WBC.AU",   "name": "Westpac Banking Corp",    "exchange": "ASX",    "region": "Australia",      "sector": "Financials",             "currency": "AUD"},
    {"symbol": "ANZ",   "stooq": "ANZ.AU",   "name": "ANZ Group Holdings",      "exchange": "ASX",    "region": "Australia",      "sector": "Financials",             "currency": "AUD"},
    # U.S. Technology
    {"symbol": "AAPL",  "stooq": "AAPL.US",  "name": "Apple Inc.",              "exchange": "NASDAQ", "region": "U.S. Tech",      "sector": "Technology",             "currency": "USD"},
    {"symbol": "MSFT",  "stooq": "MSFT.US",  "name": "Microsoft Corporation",   "exchange": "NASDAQ", "region": "U.S. Tech",      "sector": "Technology",             "currency": "USD"},
    {"symbol": "NVDA",  "stooq": "NVDA.US",  "name": "NVIDIA Corporation",      "exchange": "NASDAQ", "region": "U.S. Tech",      "sector": "Technology",             "currency": "USD"},
    {"symbol": "AMD",   "stooq": "AMD.US",   "name": "Advanced Micro Devices",  "exchange": "NASDAQ", "region": "U.S. Tech",      "sector": "Technology",             "currency": "USD"},
    {"symbol": "GOOGL", "stooq": "GOOGL.US", "name": "Alphabet Inc.",           "exchange": "NASDAQ", "region": "U.S. Tech",      "sector": "Communication Services", "currency": "USD"},
    {"symbol": "META",  "stooq": "META.US",  "name": "Meta Platforms",          "exchange": "NASDAQ", "region": "U.S. Tech",      "sector": "Communication Services", "currency": "USD"},
    {"symbol": "AMZN",  "stooq": "AMZN.US",  "name": "Amazon.com Inc.",         "exchange": "NASDAQ", "region": "U.S. Tech",      "sector": "Consumer Discretionary", "currency": "USD"},
    {"symbol": "TSLA",  "stooq": "TSLA.US",  "name": "Tesla Inc.",              "exchange": "NASDAQ", "region": "U.S. Tech",      "sector": "Consumer Discretionary", "currency": "USD"},
    {"symbol": "AVGO",  "stooq": "AVGO.US",  "name": "Broadcom Inc.",           "exchange": "NASDAQ", "region": "U.S. Tech",      "sector": "Technology",             "currency": "USD"},
    {"symbol": "PLTR",  "stooq": "PLTR.US",  "name": "Palantir Technologies",   "exchange": "NYSE",   "region": "U.S. Tech",      "sector": "Technology",             "currency": "USD"},
    {"symbol": "CRM",   "stooq": "CRM.US",   "name": "Salesforce Inc.",         "exchange": "NYSE",   "region": "U.S. Tech",      "sector": "Technology",             "currency": "USD"},
    {"symbol": "ORCL",  "stooq": "ORCL.US",  "name": "Oracle Corporation",      "exchange": "NYSE",   "region": "U.S. Tech",      "sector": "Technology",             "currency": "USD"},
    {"symbol": "ADBE",  "stooq": "ADBE.US",  "name": "Adobe Inc.",              "exchange": "NASDAQ", "region": "U.S. Tech",      "sector": "Technology",             "currency": "USD"},
    # U.S. Large Cap
    {"symbol": "JPM",   "stooq": "JPM.US",   "name": "JPMorgan Chase",          "exchange": "NYSE",   "region": "U.S. Large Cap", "sector": "Financials",             "currency": "USD"},
    {"symbol": "GS",    "stooq": "GS.US",    "name": "Goldman Sachs",           "exchange": "NYSE",   "region": "U.S. Large Cap", "sector": "Financials",             "currency": "USD"},
    {"symbol": "BRK.B", "stooq": "BRK-B.US", "name": "Berkshire Hathaway B",   "exchange": "NYSE",   "region": "U.S. Large Cap", "sector": "Financials",             "currency": "USD"},
    {"symbol": "V",     "stooq": "V.US",     "name": "Visa Inc.",               "exchange": "NYSE",   "region": "U.S. Large Cap", "sector": "Financials",             "currency": "USD"},
    {"symbol": "MA",    "stooq": "MA.US",    "name": "Mastercard Inc.",         "exchange": "NYSE",   "region": "U.S. Large Cap", "sector": "Financials",             "currency": "USD"},
    {"symbol": "UNH",   "stooq": "UNH.US",   "name": "UnitedHealth Group",      "exchange": "NYSE",   "region": "U.S. Large Cap", "sector": "Healthcare",             "currency": "USD"},
    {"symbol": "XOM",   "stooq": "XOM.US",   "name": "Exxon Mobil Corporation", "exchange": "NYSE",   "region": "U.S. Large Cap", "sector": "Energy",                 "currency": "USD"},
    {"symbol": "COST",  "stooq": "COST.US",  "name": "Costco Wholesale",        "exchange": "NASDAQ", "region": "U.S. Large Cap", "sector": "Consumer Staples",       "currency": "USD"},
    {"symbol": "NFLX",  "stooq": "NFLX.US",  "name": "Netflix Inc.",            "exchange": "NASDAQ", "region": "U.S. Large Cap", "sector": "Communication Services", "currency": "USD"},
    {"symbol": "DIS",   "stooq": "DIS.US",   "name": "The Walt Disney Company", "exchange": "NYSE",   "region": "U.S. Large Cap", "sector": "Communication Services", "currency": "USD"},
    # Global ADRs
    {"symbol": "TSM",   "stooq": "TSM.US",   "name": "Taiwan Semiconductor",    "exchange": "NYSE",   "region": "Global ADRs",    "sector": "Technology",             "currency": "USD"},
    {"symbol": "ASML",  "stooq": "ASML.US",  "name": "ASML Holding",            "exchange": "NASDAQ", "region": "Global ADRs",    "sector": "Technology",             "currency": "USD"},
    {"symbol": "SAP",   "stooq": "SAP.US",   "name": "SAP SE",                  "exchange": "NYSE",   "region": "Global ADRs",    "sector": "Technology",             "currency": "USD"},
    {"symbol": "SONY",  "stooq": "SONY.US",  "name": "Sony Group Corporation",  "exchange": "NYSE",   "region": "Global ADRs",    "sector": "Technology",             "currency": "USD"},
    {"symbol": "BABA",  "stooq": "BABA.US",  "name": "Alibaba Group",           "exchange": "NYSE",   "region": "Global ADRs",    "sector": "Consumer Discretionary", "currency": "USD"},
    {"symbol": "NVO",   "stooq": "NVO.US",   "name": "Novo Nordisk",            "exchange": "NYSE",   "region": "Global ADRs",    "sector": "Healthcare",             "currency": "USD"},
    {"symbol": "SHEL",  "stooq": "SHEL.US",  "name": "Shell plc",               "exchange": "NYSE",   "region": "Global ADRs",    "sector": "Energy",                 "currency": "USD"},
    {"symbol": "TM",    "stooq": "TM.US",    "name": "Toyota Motor Corporation","exchange": "NYSE",   "region": "Global ADRs",    "sector": "Consumer Discretionary", "currency": "USD"},
]

REGIONS = ["Australia", "U.S. Tech", "U.S. Large Cap", "Global ADRs"]
EXPECTED_COUNT = len(STOCK_UNIVERSE)  # 41
STOOQ_BASE = "https://stooq.com/q/d/l/"
SNAPSHOT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "stocks-snapshot.json")
REQUEST_DELAY = 0.5  # seconds between requests; 41 symbols ≈ 25 s total


# ---------------------------------------------------------------------------
# Signal derivation (also imported by test_signals.py)
# ---------------------------------------------------------------------------

def derive_signal_state(change1d, change5d, rel_vol):
    if change1d >= 2 and rel_vol >= 1.5 and change5d > 0:
        return "Breakout"
    if rel_vol >= 2.0 and change1d > 0:
        return "Volume Spike"
    if change1d > 0 and change5d > 0:
        return "Watch"
    if change1d <= -2 or change5d <= -5:
        return "Sell Risk"
    return "No Action"


def derive_risk_state(change1d, change5d, rel_vol, signal_state):
    if signal_state == "Sell Risk" or change1d <= -3 or change5d <= -7:
        return "Elevated"
    if rel_vol >= 2.0 or abs(change1d) >= 3:
        return "Review"
    return "Normal"


def derive_market_regime(assets, region):
    subset = [a for a in assets if a["region"] == region] if region != "All Stocks" else list(assets)
    if len(subset) < 3:
        return "Insufficient Data"
    pos = sum(1 for a in subset if a["change1d"] > 0 and a["change5d"] > 0)
    neg = sum(1 for a in subset if a["change1d"] < 0 or a["change5d"] < 0)
    total = len(subset)
    if pos / total > 0.6:
        return "Constructive"
    if neg / total > 0.6:
        return "Defensive"
    return "Mixed"


# ---------------------------------------------------------------------------
# Stooq fetch helpers
# ---------------------------------------------------------------------------

def fetch_stooq_csv(stooq_symbol):
    url = f"{STOOQ_BASE}?s={stooq_symbol}&i=d"
    resp = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    return resp.text


def parse_stooq_csv(csv_text):
    reader = csv.DictReader(io.StringIO(csv_text.strip()))
    rows = sorted(
        [r for r in reader if r.get("Date")],
        key=lambda r: r["Date"]
    )
    valid = []
    for row in rows:
        try:
            close = float(row.get("Close", 0) or 0)
            volume = float(row.get("Volume", 0) or 0)
            if close > 0:
                valid.append({"close": close, "volume": max(volume, 0.0)})
        except (ValueError, TypeError):
            continue
    return valid


def compute_metrics(rows):
    if len(rows) < 6:
        raise ValueError(f"only {len(rows)} valid rows — need at least 6")
    closes = [r["close"] for r in rows]
    volumes = [r["volume"] for r in rows]
    price = closes[-1]
    change1d = (closes[-1] - closes[-2]) / closes[-2] * 100
    change5d = (closes[-1] - closes[-6]) / closes[-6] * 100
    volume = volumes[-1]
    window = volumes[-min(20, len(volumes)):]
    avg_vol = mean(window) if window else volume
    rel_vol = volume / avg_vol if avg_vol > 0 else 1.0
    return {
        "price": round(price, 4),
        "change1d": round(change1d, 4),
        "change5d": round(change5d, 4),
        "volume": int(volume),
        "averageVolume": int(avg_vol),
        "relativeVolume": round(rel_vol, 4),
    }


def fetch_asset(meta, now_iso):
    rows = parse_stooq_csv(fetch_stooq_csv(meta["stooq"]))
    m = compute_metrics(rows)
    signal = derive_signal_state(m["change1d"], m["change5d"], m["relativeVolume"])
    risk = derive_risk_state(m["change1d"], m["change5d"], m["relativeVolume"], signal)
    return {
        "assetClass": "stock",
        "symbol": meta["symbol"],
        "name": meta["name"],
        "exchange": meta["exchange"],
        "region": meta["region"],
        "sector": meta["sector"],
        "currency": meta["currency"],
        "price": m["price"],
        "change1d": m["change1d"],
        "change5d": m["change5d"],
        "volume": m["volume"],
        "averageVolume": m["averageVolume"],
        "relativeVolume": m["relativeVolume"],
        "signalState": signal,
        "riskState": risk,
        "marketRegime": "",  # stamped after all assets fetched
        "source": "Stooq",
        "lastUpdated": now_iso,
    }


def load_existing_snapshot(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def write_snapshot(path, data):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Snapshot written: {len(data['assets'])} assets, {len(data['fetchErrors'])} errors")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    now_iso = datetime.now(timezone.utc).isoformat(timespec="seconds")
    assets = []
    fetch_errors = []

    for meta in STOCK_UNIVERSE:
        try:
            asset = fetch_asset(meta, now_iso)
            assets.append(asset)
            print(f"  OK  {meta['symbol']:6s}  {asset['price']:>10.4f}  "
                  f"{asset['change1d']:>+7.2f}%  rv={asset['relativeVolume']:.2f}")
        except Exception as exc:
            fetch_errors.append({"symbol": meta["symbol"], "reason": str(exc)})
            print(f"  ERR {meta['symbol']:6s}  {exc}")
        time.sleep(REQUEST_DELAY)

    # Guard: don't overwrite last good snapshot if < 50% symbols succeeded
    threshold = EXPECTED_COUNT * 0.5
    if len(assets) < threshold:
        print(f"GUARD: {len(assets)}/{EXPECTED_COUNT} fetched (< 50%). Keeping existing snapshot.")
        sys.exit(1)

    # Derive market regimes
    regimes = {region: derive_market_regime(assets, region) for region in REGIONS}
    regimes["All Stocks"] = derive_market_regime(assets, "All Stocks")

    # Stamp each asset with its region's regime
    for asset in assets:
        asset["marketRegime"] = regimes.get(asset["region"], "Mixed")

    snapshot = {
        "source": "stooq",
        "mode": "snapshot",
        "lastUpdated": now_iso,
        "symbols": [m["symbol"] for m in STOCK_UNIVERSE],
        "fetchErrors": fetch_errors,
        "marketRegimes": regimes,
        "assets": assets,
    }

    write_snapshot(os.path.abspath(SNAPSHOT_PATH), snapshot)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run unit tests — verify they all pass**

```powershell
cd scripts; python test_signals.py -v
```

Expected output (all PASS):
```
test_breakout ... ok
test_breakout_exact_boundary ... ok
test_breakout_requires_positive_5d ... ok
test_volume_spike ... ok
test_watch ... ok
test_sell_risk_1d ... ok
test_sell_risk_5d ... ok
test_no_action_default ... ok
test_no_action_flat ... ok
test_elevated_sell_risk ... ok
...
Ran 20 tests in 0.001s
OK
```

- [ ] **Step 3: Verify script imports cleanly (no runtime errors)**

```powershell
cd C:\Users\phill\Documents\GitHub\trading-dashboard
python -c "import scripts.fetch_stocks as f; print('STOCK_UNIVERSE count:', len(f.STOCK_UNIVERSE))"
```

Expected: `STOCK_UNIVERSE count: 41`

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch_stocks.py scripts/test_signals.py
git commit -m "feat: add Stooq stock snapshot fetch script with signal derivation"
```

---

## Task 4: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/stocks-snapshot.yml`

- [ ] **Step 1: Create the workflow file**

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
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install requests

      - name: Fetch stocks snapshot
        run: python scripts/fetch_stocks.py

      - name: Commit snapshot if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/stocks-snapshot.json
          git diff --staged --quiet || (git commit -m "chore: update stocks snapshot [skip ci]" && git push)
```

`[skip ci]` in the commit message prevents this commit from re-triggering the workflow.

- [ ] **Step 2: Verify YAML syntax**

```powershell
python -c "import yaml; yaml.safe_load(open('.github/workflows/stocks-snapshot.yml'))" 2>&1
```

If PyYAML isn't installed: `pip install pyyaml` then retry.
Expected: no output (no error).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/stocks-snapshot.yml
git commit -m "feat: add GitHub Actions stocks snapshot workflow (hourly)"
```

---

## Task 5: Browser adapter + DEMO_STOCKS expansion (stocks.js — part 1)

**Files:**
- Modify: `stocks.js`

This task adds the adapter, expands DEMO_STOCKS, and updates the startup sequence. Task 6 updates the render functions.

- [ ] **Step 1: Replace DEMO_STOCKS (lines 11–18) with the full 10-stock ASX universe**

Replace this block:
```javascript
const DEMO_STOCKS = [
    { symbol: "BHP", name: "BHP Group", market: "ASX", sector: "Materials", signalState: "Breakout", riskState: "Controlled", price: 43.2, oneDayChange: 1.4, fiveDayChange: 4.8, relativeVolume: 1.7, marketRegime: "Constructive", reason: "Demo resources setup with price strength and elevated participation", invalidation: "Review if price loses the recorded support level" },
    { symbol: "CBA", name: "Commonwealth Bank", market: "ASX", sector: "Financials", signalState: "Watch", riskState: "Normal", price: 128.4, oneDayChange: 0.6, fiveDayChange: 2.1, relativeVolume: 1.2, marketRegime: "Constructive", reason: "Demo bank watch candidate with steady relative strength", invalidation: "Review if sector breadth weakens" },
    { symbol: "CSL", name: "CSL", market: "ASX", sector: "Healthcare", signalState: "Sell Risk", riskState: "Elevated", price: 284.1, oneDayChange: -1.1, fiveDayChange: -3.6, relativeVolume: 1.4, marketRegime: "Mixed", reason: "Demo healthcare risk review after downside pressure", invalidation: "Review if thesis no longer matches price action" },
    { symbol: "WES", name: "Wesfarmers", market: "ASX", sector: "Consumer Staples", signalState: "Watch", riskState: "Normal", price: 69.8, oneDayChange: 0.2, fiveDayChange: 1.3, relativeVolume: 0.9, marketRegime: "Mixed", reason: "Demo defensive watchlist candidate", invalidation: "Review if market context changes" },
    { symbol: "MQG", name: "Macquarie Group", market: "ASX", sector: "Financials", signalState: "Volume Spike", riskState: "Review", price: 198.7, oneDayChange: 2.2, fiveDayChange: -0.4, relativeVolume: 2.1, marketRegime: "Mixed", reason: "Demo volume event requiring manual review", invalidation: "Review if volume event fades without follow-through" },
    { symbol: "TLS", name: "Telstra Group", market: "ASX", sector: "Communication Services", signalState: "No Action", riskState: "Low", price: 4.08, oneDayChange: -0.1, fiveDayChange: 0.2, relativeVolume: 0.7, marketRegime: "Mixed", reason: "Demo low-priority candidate with limited movement", invalidation: "No active setup" }
];
```

With:
```javascript
const DEMO_STOCKS = [
    { symbol: "BHP",  name: "BHP Group",             market: "ASX", exchange: "ASX", region: "Australia", sector: "Materials",              currency: "AUD", signalState: "Breakout",     riskState: "Normal",   price: 43.20,  oneDayChange:  1.4, fiveDayChange:  4.8, relativeVolume: 1.7, marketRegime: "Constructive", reason: "Demo — Breakout — Materials",              invalidation: "Review if price loses the recorded support level" },
    { symbol: "CBA",  name: "Commonwealth Bank",     market: "ASX", exchange: "ASX", region: "Australia", sector: "Financials",             currency: "AUD", signalState: "Watch",        riskState: "Normal",   price: 128.40, oneDayChange:  0.6, fiveDayChange:  2.1, relativeVolume: 1.2, marketRegime: "Constructive", reason: "Demo — Watch — Financials",               invalidation: "Review if sector breadth weakens" },
    { symbol: "CSL",  name: "CSL Limited",           market: "ASX", exchange: "ASX", region: "Australia", sector: "Healthcare",             currency: "AUD", signalState: "Sell Risk",    riskState: "Elevated", price: 284.10, oneDayChange: -1.1, fiveDayChange: -3.6, relativeVolume: 1.4, marketRegime: "Mixed",        reason: "Demo — Sell Risk — Healthcare",           invalidation: "Review if thesis no longer matches price action" },
    { symbol: "WES",  name: "Wesfarmers",            market: "ASX", exchange: "ASX", region: "Australia", sector: "Consumer Staples",       currency: "AUD", signalState: "Watch",        riskState: "Normal",   price: 69.80,  oneDayChange:  0.2, fiveDayChange:  1.3, relativeVolume: 0.9, marketRegime: "Mixed",        reason: "Demo — Watch — Consumer Staples",         invalidation: "Review if market context changes" },
    { symbol: "MQG",  name: "Macquarie Group",       market: "ASX", exchange: "ASX", region: "Australia", sector: "Financials",             currency: "AUD", signalState: "Volume Spike", riskState: "Review",   price: 198.70, oneDayChange:  2.2, fiveDayChange: -0.4, relativeVolume: 2.1, marketRegime: "Mixed",        reason: "Demo — Volume Spike — Financials",        invalidation: "Review if volume event fades without follow-through" },
    { symbol: "TLS",  name: "Telstra Group",         market: "ASX", exchange: "ASX", region: "Australia", sector: "Communication Services", currency: "AUD", signalState: "No Action",    riskState: "Normal",   price: 4.08,   oneDayChange: -0.1, fiveDayChange:  0.2, relativeVolume: 0.7, marketRegime: "Mixed",        reason: "Demo — No Action — Communication Services", invalidation: "No active setup" },
    { symbol: "WOW",  name: "Woolworths Group",      market: "ASX", exchange: "ASX", region: "Australia", sector: "Consumer Staples",       currency: "AUD", signalState: "Watch",        riskState: "Normal",   price: 31.50,  oneDayChange:  0.3, fiveDayChange:  1.1, relativeVolume: 0.9, marketRegime: "Mixed",        reason: "Demo — Watch — Consumer Staples",         invalidation: "Review if market context changes" },
    { symbol: "NAB",  name: "National Australia Bank", market: "ASX", exchange: "ASX", region: "Australia", sector: "Financials",           currency: "AUD", signalState: "Watch",        riskState: "Normal",   price: 37.20,  oneDayChange:  0.4, fiveDayChange:  1.5, relativeVolume: 1.0, marketRegime: "Constructive", reason: "Demo — Watch — Financials",               invalidation: "Review if sector weakens" },
    { symbol: "WBC",  name: "Westpac Banking Corp",  market: "ASX", exchange: "ASX", region: "Australia", sector: "Financials",             currency: "AUD", signalState: "No Action",    riskState: "Normal",   price: 30.10,  oneDayChange: -0.2, fiveDayChange:  0.5, relativeVolume: 0.8, marketRegime: "Mixed",        reason: "Demo — No Action — Financials",           invalidation: "No active setup" },
    { symbol: "ANZ",  name: "ANZ Group Holdings",    market: "ASX", exchange: "ASX", region: "Australia", sector: "Financials",             currency: "AUD", signalState: "No Action",    riskState: "Normal",   price: 28.40,  oneDayChange:  0.1, fiveDayChange:  0.8, relativeVolume: 0.9, marketRegime: "Mixed",        reason: "Demo — No Action — Financials",           invalidation: "No active setup" },
];
```

- [ ] **Step 2: Add adapter state variables after the existing `let` declarations (after line ~61)**

After `let completedBrokerChecks = new Set();`, add:

```javascript
const STOCKS_SNAPSHOT_URL = "data/stocks-snapshot.json";
let stockUniverse = [];
let snapshotSource = "Demo fallback";
let snapshotRegimes = {};
let snapshotPartial = false;
let snapshotUnavailable = false;
let activeRegion = "All";
```

- [ ] **Step 3: Add adapter functions before `storageAvailable()`**

Insert these functions before the existing `function storageAvailable()`:

```javascript
function normalizeRiskState(raw) {
    const valid = { Normal: 1, Review: 1, Elevated: 1 };
    return valid[raw] ? raw : "Normal";
}

function normalizeSnapshotAsset(asset) {
    const sym = safeText(asset.symbol).toUpperCase();
    const change1d = finiteNumber(asset.change1d);
    const change5d = finiteNumber(asset.change5d);
    const relVol = finiteNumber(asset.relativeVolume, 1);
    return {
        assetClass: "stock",
        symbol: sym,
        name: safeText(asset.name, sym),
        exchange: safeText(asset.exchange, ""),
        market: safeText(asset.exchange, ""),
        region: safeText(asset.region, ""),
        sector: safeText(asset.sector, ""),
        currency: safeText(asset.currency, "USD"),
        price: finiteNumber(asset.price),
        change1d,
        change5d,
        oneDayChange: change1d,
        fiveDayChange: change5d,
        volume: finiteNumber(asset.volume),
        averageVolume: finiteNumber(asset.averageVolume),
        relativeVolume: relVol,
        signalState: safeText(asset.signalState, "No Action"),
        riskState: normalizeRiskState(safeText(asset.riskState, "Normal")),
        marketRegime: safeText(asset.marketRegime, "Mixed"),
        source: safeText(asset.source, "Stooq"),
        lastUpdated: safeText(asset.lastUpdated, ""),
        reason: `${safeText(asset.signalState, "No Action")} — ${safeText(asset.sector, "")}`,
        invalidation: "Review if price action changes"
    };
}

function normalizeDemoStocks() {
    return DEMO_STOCKS.map(stock => ({
        ...stock,
        assetClass: "stock",
        change1d: finiteNumber(stock.oneDayChange),
        change5d: finiteNumber(stock.fiveDayChange),
        volume: 0,
        averageVolume: 0,
        source: "Demo",
        lastUpdated: "",
        riskState: normalizeRiskState(safeText(stock.riskState, "Normal"))
    }));
}

async function initStocksAdapter() {
    stockUniverse = normalizeDemoStocks();
    renderAll();

    try {
        const resp = await fetch(STOCKS_SNAPSHOT_URL);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (data.source !== "stooq" || !Array.isArray(data.assets) || data.assets.length === 0) {
            throw new Error("invalid snapshot structure");
        }
        const lastUpdated = new Date(data.lastUpdated);
        if (isNaN(lastUpdated.getTime())) throw new Error("invalid lastUpdated");

        const expectedCount = Array.isArray(data.symbols) ? data.symbols.length : 41;
        const normalized = data.assets.map(normalizeSnapshotAsset);

        stockUniverse = normalized;
        snapshotRegimes = typeof data.marketRegimes === "object" && data.marketRegimes !== null
            ? data.marketRegimes : {};
        const ageMs = Date.now() - lastUpdated.getTime();
        const stale = ageMs > 24 * 60 * 60 * 1000;
        snapshotSource = stale ? "Stooq Snapshot (may be stale)" : "Stooq Snapshot";
        snapshotPartial = normalized.length < expectedCount * 0.5;
        snapshotUnavailable = false;

    } catch (_err) {
        stockUniverse = normalizeDemoStocks();
        snapshotUnavailable = true;
        snapshotSource = "Demo fallback";
        snapshotRegimes = {};
        snapshotPartial = false;
    }

    renderAll();
}
```

- [ ] **Step 4: Update `findSelectedStock()` (line ~249) to use stockUniverse**

Replace:
```javascript
function findSelectedStock() {
    return DEMO_STOCKS.find(stock => stock.symbol === selectedStockSymbol) || null;
}
```

With:
```javascript
function findSelectedStock() {
    return stockUniverse.find(stock => stock.symbol === selectedStockSymbol) || null;
}
```

- [ ] **Step 5: Update startup sequence at the bottom of the file**

Replace:
```javascript
initModeControls();
initMasterRuleFooter();
initPlanForm();
initTabs();
renderAll();
```

With:
```javascript
initModeControls();
initMasterRuleFooter();
initPlanForm();
initRegionFilter();
initTabs();
initStocksAdapter();
```

- [ ] **Step 6: Verify no syntax errors**

Open `stocks.html` in a browser. Open DevTools console. Confirm no syntax errors appear on load (page renders with demo data while adapter fetches).

- [ ] **Step 7: Commit**

```bash
git add stocks.js
git commit -m "feat: add Stooq snapshot adapter, expand DEMO_STOCKS to 10 ASX stocks"
```

---

## Task 6: Region filter + updated render functions (stocks.js — part 2)

**Files:**
- Modify: `stocks.js`

- [ ] **Step 1: Add `initRegionFilter()` and filter helpers before `initModeControls()`**

```javascript
function setActiveRegion(region) {
    activeRegion = region;
    document.querySelectorAll(".region-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.region === region);
    });
    renderOpportunityQueue();
}

function filteredStocks() {
    if (activeRegion === "All") return stockUniverse;
    return stockUniverse.filter(s => s.region === activeRegion);
}

function initRegionFilter() {
    document.querySelectorAll(".region-btn").forEach(btn => {
        btn.addEventListener("click", event => {
            setActiveRegion(event.currentTarget.dataset.region);
        });
    });
}
```

- [ ] **Step 2: Update `stockRankingScore()` with broader sector scores**

Replace the entire `stockRankingScore` function:

```javascript
function stockRankingScore(stock) {
    const movementScore = (finiteNumber(stock.oneDayChange) * 5) + (finiteNumber(stock.fiveDayChange) * 3);
    const volumeScore = Math.max(0, finiteNumber(stock.relativeVolume) - 1) * 18;
    const sectorScore = {
        Technology: 8,
        Materials: 7,
        Financials: 6,
        Healthcare: 5,
        "Consumer Discretionary": 5,
        "Communication Services": 4,
        Energy: 4,
        Industrials: 4,
        "Consumer Staples": 3
    }[stock.sector] || 3;
    const regimeScore = stock.marketRegime === "Constructive" ? 8 : stock.marketRegime === "Mixed" ? 3 : 0;
    const riskScore = {
        Normal: 5,
        Review: 1,
        Elevated: -8
    }[stock.riskState] || 0;
    const signalScore = {
        Breakout: 12,
        "Volume Spike": 8,
        Watch: 5,
        "No Action": 0,
        "Sell Risk": -10
    }[stock.signalState] || 0;
    return movementScore + volumeScore + sectorScore + regimeScore + riskScore + signalScore;
}
```

- [ ] **Step 3: Update `rankedStocks()` to use `filteredStocks()`**

Replace:
```javascript
function rankedStocks() {
    return DEMO_STOCKS
        .map(stock => ({ ...stock, rankingScore: stockRankingScore(stock) }))
        .sort((a, b) => b.rankingScore - a.rankingScore);
}
```

With:
```javascript
function rankedStocks() {
    return filteredStocks()
        .map(stock => ({ ...stock, rankingScore: stockRankingScore(stock) }))
        .sort((a, b) => b.rankingScore - a.rankingScore);
}
```

- [ ] **Step 4: Add `formatStockPrice()` after `formatSignedChange()`**

```javascript
function formatStockPrice(stock) {
    if (hideValues) return "$....";
    const numeric = finiteNumber(stock.price);
    const currency = safeText(stock.currency, "AUD") === "USD" ? "USD" : "AUD";
    const locale = currency === "USD" ? "en-US" : "en-AU";
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    }).format(numeric);
}
```

- [ ] **Step 5: Replace `renderOpportunityQueue()` with the region-aware version**

Replace the entire `renderOpportunityQueue` function:

```javascript
function renderOpportunityQueue() {
    const body = document.getElementById("stock-opportunities-body");
    if (!body) return;

    const stocks = rankedStocks();

    const bestSetupEl = document.getElementById("stock-best-setup");
    if (bestSetupEl) bestSetupEl.textContent = stocks[0] ? `${stocks[0].symbol} / ${stocks[0].signalState}` : "No setup";

    if (stocks.length === 0) {
        const regionLabel = activeRegion === "All" ? "all regions" : activeRegion;
        body.innerHTML = `<tr><td colspan="13" class="loading-cell">${
            snapshotUnavailable
                ? "Stock snapshot unavailable — demo/review mode only."
                : `No stocks available for ${escapeHtml(regionLabel)}.`
        }</td></tr>`;
        return;
    }

    body.innerHTML = stocks.map((stock, index) => {
        const action = stockActionFor(stock);
        return `
        <tr>
            <td class="num">${index + 1}</td>
            <td><strong>${escapeHtml(stock.symbol)}</strong></td>
            <td>${escapeHtml(stock.name)}</td>
            <td><span class="muted">${escapeHtml(stock.region || "")}</span></td>
            <td><span class="muted">${escapeHtml(stock.exchange || stock.market || "")}</span></td>
            <td>${escapeHtml(stock.sector)}</td>
            <td class="num">${formatStockPrice(stock)}</td>
            <td class="num ${stock.oneDayChange > 0 ? "positive" : stock.oneDayChange < 0 ? "negative" : "neutral"}">${formatSignedChange(stock.oneDayChange)}</td>
            <td class="num ${stock.fiveDayChange > 0 ? "positive" : stock.fiveDayChange < 0 ? "negative" : "neutral"}">${formatSignedChange(stock.fiveDayChange)}</td>
            <td class="num">${finiteNumber(stock.relativeVolume).toFixed(1)}x</td>
            <td><span class="badge ${signalBadgeClass(stock.signalState)}">${escapeHtml(stock.signalState)}</span></td>
            <td>${escapeHtml(stock.riskState)}</td>
            <td><button class="table-action" type="button" data-analyse-stock="${escapeHtml(stock.symbol)}">${escapeHtml(action)}</button></td>
        </tr>
        `;
    }).join("");

    document.querySelectorAll("[data-analyse-stock]").forEach(button => {
        button.addEventListener("click", event => {
            selectedStockSymbol = event.currentTarget.dataset.analyseStock;
            completedBrokerChecks = new Set();
            const stock = findSelectedStock();
            if (stock) fillPlanFromStock(stock);
            renderAnalysis();
            renderBrokerReview();
        });
    });
}
```

- [ ] **Step 6: Update `fillPlanFromStock()` to handle `exchange` field**

Replace the line:
```javascript
    document.getElementById("stock-plan-market").value = stock.market;
```

With:
```javascript
    document.getElementById("stock-plan-market").value = stock.market || stock.exchange || "";
```

- [ ] **Step 7: Update `renderAnalysis()` to use `formatStockPrice()`**

In `renderAnalysis()`, find:
```javascript
                <div class="rule-card">Price<span>${formatMoney(stock.price)}</span></div>
```

Replace with:
```javascript
                <div class="rule-card">Price<span>${formatStockPrice(stock)}</span></div>
```

Also find (in the rule-card grid for analysis):
```javascript
                <div class="rule-card">Market Regime<span>${escapeHtml(stock.marketRegime)}</span></div>
```

Add after it:
```javascript
                <div class="rule-card">Exchange<span>${escapeHtml(stock.exchange || stock.market || "")}</span></div>
                <div class="rule-card">Region<span>${escapeHtml(stock.region || "")}</span></div>
                <div class="rule-card">Source<span>${escapeHtml(stock.source || "")}</span></div>
```

- [ ] **Step 8: Commit**

```bash
git add stocks.js
git commit -m "feat: add region filter, formatStockPrice, updated queue render"
```

---

## Task 7: Source status banner (stocks.js — part 3)

**Files:**
- Modify: `stocks.js`

- [ ] **Step 1: Add `renderSourceStatus()` function before `renderAll()`**

```javascript
function renderSourceStatus() {
    const badge = document.getElementById("stock-source-badge");
    if (badge) badge.textContent = snapshotSource;

    const note = document.getElementById("stock-data-note");
    if (!note) return;

    if (snapshotUnavailable) {
        note.textContent = "Stock snapshot unavailable — demo/review mode only.";
        note.hidden = false;
    } else if (snapshotPartial) {
        note.textContent = "Partial stock snapshot — review with caution.";
        note.hidden = false;
    } else {
        note.textContent = "";
        note.hidden = true;
    }
}
```

- [ ] **Step 2: Add `renderSourceStatus()` to `renderAll()`**

Replace:
```javascript
function renderAll() {
    renderModeDisplay();
    renderOpportunityQueue();
    renderAnalysis();
    renderStockJournal();
    renderStockHoldings();
    renderBrokerReview();
}
```

With:
```javascript
function renderAll() {
    renderModeDisplay();
    renderSourceStatus();
    renderOpportunityQueue();
    renderAnalysis();
    renderStockJournal();
    renderStockHoldings();
    renderBrokerReview();
}
```

- [ ] **Step 3: Update `renderStockJournal()` to show region and exchange**

In `renderStockJournal()`, the journal rows render plan data. Plans may have `market` and optionally `region`/`exchange` if they were pre-filled from a Stooq asset. Update the Ticker cell to show exchange alongside name:

Find the row template inside `renderStockJournal()`:
```javascript
            <td><strong>${escapeHtml(plan.symbol)}</strong><br><span class="muted">${escapeHtml(plan.name)} / ${escapeHtml(plan.market)}</span></td>
```

Replace with:
```javascript
            <td><strong>${escapeHtml(plan.symbol)}</strong><br><span class="muted">${escapeHtml(plan.name)} / ${escapeHtml(plan.market || "")}</span></td>
```

Then add a lookup for region/exchange from stockUniverse. Find:
```javascript
            <td>${escapeHtml(plan.whyNow)}</td>
```

This is already there — no change needed for the why-now column. The region info is shown via the market/exchange in the ticker cell above.

- [ ] **Step 4: Commit**

```bash
git add stocks.js
git commit -m "feat: add renderSourceStatus, partial/unavailable banners"
```

---

## Task 8: HTML + CSS updates

**Files:**
- Modify: `stocks.html`
- Modify: `styles.css`

- [ ] **Step 1: Add region filter bar to `stocks.html` before the opportunity queue table**

Find in `stocks.html`:
```html
            <section class="panel opportunity-panel">
                <div class="panel-header">
                    <h2 class="panel-title">Stocks Opportunity Queue</h2>
                    <p class="panel-subtitle">Demo-only ranked review list. No live feed or paid API.</p>
                </div>
                <table class="watchlist-table">
```

Replace with:
```html
            <section class="panel opportunity-panel">
                <div class="panel-header">
                    <h2 class="panel-title">Stocks Opportunity Queue</h2>
                    <p class="panel-subtitle">Ranked review list. Source: <strong id="stock-source-badge">Loading...</strong></p>
                </div>
                <div id="stock-data-note" class="source-banner" hidden></div>
                <div class="stock-region-filter" role="group" aria-label="Filter stocks by region">
                    <button class="region-btn active" type="button" data-region="All">All</button>
                    <button class="region-btn" type="button" data-region="Australia">Australia</button>
                    <button class="region-btn" type="button" data-region="U.S. Tech">U.S. Tech</button>
                    <button class="region-btn" type="button" data-region="U.S. Large Cap">U.S. Large Cap</button>
                    <button class="region-btn" type="button" data-region="Global ADRs">Global ADRs</button>
                </div>
                <table class="watchlist-table">
```

- [ ] **Step 2: Update table `<thead>` — add Region and Exchange columns, update headers**

Replace the existing thead:
```html
                    <thead>
                        <tr>
                            <th class="num">Rank</th>
                            <th>Ticker</th>
                            <th>Company</th>
                            <th>Sector</th>
                            <th class="num">Price</th>
                            <th class="num">1D Change</th>
                            <th class="num">5D Change</th>
                            <th class="num">Relative Volume</th>
                            <th>Signal State</th>
                            <th>Risk State</th>
                            <th>Action</th>
                        </tr>
                    </thead>
```

With:
```html
                    <thead>
                        <tr>
                            <th class="num">Rank</th>
                            <th>Ticker</th>
                            <th>Company</th>
                            <th>Region</th>
                            <th>Exchange</th>
                            <th>Sector</th>
                            <th class="num">Price</th>
                            <th class="num">1D %</th>
                            <th class="num">5D %</th>
                            <th class="num">Rel Vol</th>
                            <th>Signal</th>
                            <th>Risk</th>
                            <th>Action</th>
                        </tr>
                    </thead>
```

- [ ] **Step 3: Add disclaimer below the opportunity queue table**

Find the closing `</section>` of the opportunity-panel section (after the `</table>`) and add before it:

```html
                <p class="stock-signal-note">Stock signals are derived from snapshot data and are for review only.</p>
```

Full closing of that section becomes:
```html
                    <tbody id="stock-opportunities-body">
                        <tr><td colspan="13" class="loading-cell">Loading stock workspace...</td></tr>
                    </tbody>
                </table>
                <p class="stock-signal-note">Stock signals are derived from snapshot data and are for review only.</p>
            </section>
```

Note: `colspan="11"` in the loading cell must be updated to `colspan="13"` (two new columns).

- [ ] **Step 4: Update the Source status metric in the status panel**

Find:
```html
            <div class="status-metric">
                <span>Source</span>
                <strong>Manual review only</strong>
            </div>
```

Replace with:
```html
            <div class="status-metric">
                <span>Source</span>
                <strong id="stock-source-badge">Loading...</strong>
            </div>
```

Wait — `stock-source-badge` is now used in TWO places (panel header and status metric). Use only the status metric location. Remove the one added to the panel-subtitle in Step 1 or keep it as a second reference.

To avoid duplicate IDs, update the panel-subtitle to use a class instead:

Update the panel-subtitle from Step 1 to:
```html
                    <p class="panel-subtitle">Ranked review list. Source: <strong class="stock-source-inline">Loading...</strong></p>
```

And in `renderSourceStatus()`, also update the inline badge:
```javascript
function renderSourceStatus() {
    const badge = document.getElementById("stock-source-badge");
    if (badge) badge.textContent = snapshotSource;

    document.querySelectorAll(".stock-source-inline").forEach(el => {
        el.textContent = snapshotSource;
    });

    const note = document.getElementById("stock-data-note");
    if (!note) return;
    if (snapshotUnavailable) {
        note.textContent = "Stock snapshot unavailable — demo/review mode only.";
        note.hidden = false;
    } else if (snapshotPartial) {
        note.textContent = "Partial stock snapshot — review with caution.";
        note.hidden = false;
    } else {
        note.textContent = "";
        note.hidden = true;
    }
}
```

- [ ] **Step 5: Add CSS to `styles.css`**

Append to the end of `styles.css`:

```css
/* --- Stock region filter --- */
.stock-region-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--line);
}

.region-btn {
    appearance: none;
    border: 1px solid var(--line);
    border-radius: 20px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.region-btn:hover {
    background: var(--panel-raised);
    color: var(--text);
}

.region-btn.active {
    background: var(--brand-blue);
    color: #fff;
    border-color: var(--brand-blue);
}

/* --- Source and signal notes --- */
.source-banner {
    padding: 8px 14px;
    background: var(--amber-bg);
    color: var(--amber);
    font-size: 12px;
    font-weight: 600;
    border-bottom: 1px solid var(--line);
}

.stock-signal-note {
    padding: 8px 14px;
    font-size: 11px;
    color: var(--muted);
    border-top: 1px solid var(--line);
    margin: 0;
}
```

- [ ] **Step 6: Verify in browser**

Open `stocks.html`. Check:
- Region filter buttons render in a row below the panel header.
- Clicking "Australia" filters to ASX demo stocks only.
- Clicking "U.S. Tech" shows the empty-region message (demo mode has no US data).
- "All" shows all 10 ASX demo stocks.
- No console errors.
- `colspan="13"` matches 13 columns (Rank, Ticker, Company, Region, Exchange, Sector, Price, 1D, 5D, RelVol, Signal, Risk, Action).

- [ ] **Step 7: Commit**

```bash
git add stocks.html styles.css stocks.js
git commit -m "feat: add region filter bar, source badge, signal disclaimer, Region/Exchange columns"
```

---

## Task 9: Final verification + deploy

**Files:**
- No new files. Verification and push only.

- [ ] **Step 1: Run a full local review — console check**

Open `stocks.html` in a browser. Open DevTools (F12). Confirm:
1. Console: zero errors, zero undefined/null/NaN warnings.
2. `stock-source-badge` shows "Demo fallback" (seed snapshot has `source: "seed"`).
3. `stock-data-note` shows "Stock snapshot unavailable — demo/review mode only."
4. Switching to Private Local Mode: journal/holdings still work.
5. Hide Values: price cells show "$....".
6. Click Australia → 10 demo stocks shown.
7. Click U.S. Tech → empty-region message shown (demo has no US data).
8. Click a stock → Analysis panel populates.
9. Agent consensus renders without errors.
10. Broker Review renders without broker links.

- [ ] **Step 2: Verify crypto workspace untouched**

Open `index.html`. Confirm no stock tickers appear in crypto workspace. Check console for errors.

- [ ] **Step 3: Verify journal and reports pages**

Open `journal.html` and `reports.html`. Confirm `assetClass: "stock"` records still display correctly.

- [ ] **Step 4: Check all snapshot guard behaviour**

Temporarily rename `data/stocks-snapshot.json` to `data/stocks-snapshot.json.bak`.
Reload `stocks.html`. Confirm:
- "Stock snapshot unavailable — demo/review mode only." banner appears.
- Demo stocks render.
- No console errors (fetch 404 is caught and handled).

Restore the file: rename back to `stocks-snapshot.json`.

- [ ] **Step 5: Final commit and push to GitHub Pages**

```bash
git add -A
git status
git push origin main
```

Confirm GitHub Pages deploys (Actions tab → pages build). Visit the deployed URL and verify:
- Stocks Workspace loads.
- Region filter buttons work.
- Source shows "Demo fallback" (first Actions run hasn't happened yet).
- No console errors.

- [ ] **Step 6: Trigger first Actions run manually**

In GitHub → Actions → "Stocks Snapshot" → Run workflow.

After completion, verify `data/stocks-snapshot.json` was committed by `github-actions[bot]`. Pull the change:

```bash
git pull origin main
```

Open `data/stocks-snapshot.json`. Verify:
- `source` is `"stooq"`
- `assets` array has entries
- `fetchErrors` exists (may be empty or have some)
- `marketRegimes` has all 5 regions
- Individual assets have numeric `price`, `change1d`, `change5d`, `relativeVolume`

- [ ] **Step 7: Hard reload deployed site — verify Stooq data appears**

Hard refresh GitHub Pages site (Ctrl+Shift+R). Confirm:
- Source badge shows "Stooq Snapshot".
- Opportunity queue shows real prices.
- Region filters show real stocks in each region.
- No undefined/null/NaN in any cell.
- Signal states and risk states are valid strings.

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| Stooq-compatible provider adapter | Task 3 |
| Demo fallback if snapshot fails | Task 5 (initStocksAdapter catch) |
| 4 regional universes (AU, US Tech, US Large Cap, ADRs) | Task 3 (STOCK_UNIVERSE) |
| ASX demo stocks labeled clearly | Task 5 (DEMO_STOCKS source: "Demo") |
| Normalized schema (all 15 fields) | Task 5 (normalizeSnapshotAsset) |
| "Stock snapshot unavailable — demo/review mode only." | Task 7 (renderSourceStatus) |
| fetchErrors in snapshot shape | Task 3 (main()) |
| Don't overwrite if < 50% | Task 3 (guard) |
| "Partial stock snapshot — review with caution." | Task 7 (renderSourceStatus) |
| signalState derived algorithmically | Tasks 2+3 |
| riskState derived algorithmically | Tasks 2+3 |
| marketRegime per region | Task 3 |
| Region filters: All/AU/US Tech/US Large Cap/ADRs | Tasks 6+8 |
| Source clearly labelled (Stooq / Demo) | Tasks 7+8 |
| "Stock signals are derived from snapshot data..." note | Task 8 |
| GitHub Actions hourly + manual dispatch | Task 4 |
| No browser fetch to Stooq | Task 5 (fetch only hits data/) |
| No API keys | All tasks (confirmed) |
| Crypto workspace unchanged | Untouched files |
| Journal assetClass: stock preserved | Task 7 (no storage key changes) |
| Region/exchange in journal rows | Task 7 |
| Currency-aware price formatting | Task 6 (formatStockPrice) |
| Deploy to GitHub Pages | Task 9 |
| No Buy Now / Sell Now | Confirmed — no such text added |
