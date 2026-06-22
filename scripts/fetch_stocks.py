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

try:
    from zoneinfo import ZoneInfo  # Python 3.9+
    SYDNEY_TZ = ZoneInfo("Australia/Sydney")
except Exception:  # pragma: no cover - zoneinfo always present on 3.11 runner
    SYDNEY_TZ = None

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
#
# ===========================================================================
# CANONICAL SIGNAL SPEC v1  (single source of truth — mirror in
# tools/generate-asx-feed.mjs and docs/RESPONSE-MATRIX-STANDARD.md)
#
# Inputs (all percentages except rel_vol, a ratio):
#   change1d  = (close[-1] - close[-2]) / close[-2] * 100
#   change5d  = (close[-1] - close[-6]) / close[-6] * 100   (5 sessions back)
#   rel_vol   = volume[-1] / mean(volume of the PRIOR up-to-20 sessions,
#               EXCLUDING the current bar)
#
# signalState — evaluated top to bottom, FIRST match wins. Every label is
# reachable (mutually-exclusive or precedence-ordered):
#   1. Breakout     : change1d >= 2  AND rel_vol >= 1.5 AND change5d > 0
#   2. Volume Spike : rel_vol  >= 2.0 AND change1d > 0
#   3. Watch        : change1d > 0    AND change5d > 0
#   4. Sell Risk    : change1d <= -2  OR  change5d <= -5
#   5. No Action    : (default)
#   Watch precedes Sell Risk but cannot mask it: Watch needs both changes
#   positive, Sell Risk needs a negative move, so they never overlap.
#
# riskState — evaluated top to bottom, FIRST match wins:
#   1. Elevated : signalState == "Sell Risk" OR change1d <= -3 OR change5d <= -7
#   2. Review   : rel_vol >= 2.0 OR abs(change1d) >= 3
#   3. Normal   : (default)
# ===========================================================================
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


def sydney_session(now_utc):
    """Sydney-local stamp + best-effort ASX-open flag (DST handled by zoneinfo).

    Returns (label, abbr, is_open). The open flag uses ASX continuous-trading
    hours (10:00-16:00 local, Mon-Fri) and intentionally ignores public
    holidays — it is a staleness label, not a trading calendar.
    """
    if SYDNEY_TZ is None:
        return (now_utc.strftime("%d/%m/%Y %H:%M UTC"), "UTC", False)
    local = now_utc.astimezone(SYDNEY_TZ)
    abbr = local.tzname() or ""
    minutes_of_day = local.hour * 60 + local.minute
    is_open = local.weekday() < 5 and 600 <= minutes_of_day < 960
    label = f"{local.strftime('%d/%m/%Y %H:%M')} {abbr}".strip()
    return (label, abbr, is_open)


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
    # Canonical spec: average the PRIOR up-to-20 sessions, EXCLUDING the
    # current bar, so today's spike isn't diluted into its own baseline.
    prior_volumes = volumes[:-1]
    window = prior_volumes[-20:]
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
    now_utc = datetime.now(timezone.utc)
    now_iso = now_utc.isoformat(timespec="seconds")
    syd_label, syd_abbr, syd_open = sydney_session(now_utc)
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
        "lastUpdatedSydney": syd_label,   # e.g. "23/06/2026 17:30 AEST"
        "sydneyTimezone": syd_abbr,       # "AEST" | "AEDT"
        "asxSessionOpen": syd_open,       # best-effort (ignores holidays)
        "symbols": [m["symbol"] for m in STOCK_UNIVERSE],
        "fetchErrors": fetch_errors,
        "marketRegimes": regimes,
        "assets": assets,
    }

    write_snapshot(os.path.abspath(SNAPSHOT_PATH), snapshot)


if __name__ == "__main__":
    main()
