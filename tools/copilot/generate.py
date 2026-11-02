#!/usr/bin/env python
"""Build data/copilot.json: analysis for each ASX and crypto symbol, using the vendored
trading_skills code. Writes nothing if too few symbols return, so good data is kept."""
import json, math, re, sys, warnings
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
import pandas as pd, yfinance as yf
from trading_skills import fundamentals, news, risk, scanner_bullish

CRYPTO = {"BTC": "Bitcoin", "ETH": "Ethereum", "BNB": "BNB", "ADA": "Cardano", "DOGE": "Dogecoin", "DOT": "Polkadot", "FET": "Fetch.ai", "LTC": "Litecoin", "THETA": "Theta", "XLM": "Stellar", "NEAR": "NEAR"}


def num(v, places=2):
    try:
        v = float(v)
        return round(v, places) if math.isfinite(v) else None
    except (TypeError, ValueError):
        return None


def universe():
    text = (ROOT / "tools/generate-asx-feed.mjs").read_text(encoding="utf8")
    rows = [(s, s + ".AX", n, sec, "ASX") for s, n, sec in re.findall(r"^\s*\['([A-Z0-9]+)',\s*'([^']*)',\s*'([^']*)'\]", text, re.M)]
    return rows + [(s, s + "-AUD", n, "Crypto", "CRYPTO") for s, n in CRYPTO.items()]


def call_for(score):
    return "Strongest setup" if score >= 7 else "Building" if score >= 4 else "Weak"


def analyse(row):
    symbol, yahoo, name, sector, market = row
    ticker = yf.Ticker(yahoo)
    df = ticker.history(period="6mo", auto_adjust=True).dropna(subset=["Close"])
    if len(df) < 60:
        return None
    scan = scanner_bullish.compute_bullish_score(yahoo, period="3mo", ticker=ticker)
    if not scan:
        return None
    prev = df["Close"].shift()
    atr = pd.concat([df["High"] - df["Low"], (df["High"] - prev).abs(), (df["Low"] - prev).abs()], axis=1).max(axis=1).rolling(14).mean().iloc[-1]
    price = float(df["Close"].iloc[-1])
    places = 6 if price < 1 else 2
    out = {
        "symbol": symbol, "yahoo": yahoo, "name": name, "sector": sector, "market": market,
        "price": num(price, places), "changePct": num((price / float(df["Close"].iloc[-2]) - 1) * 100), "lastBar": df.index[-1].strftime("%Y-%m-%d"),
        "score": num(scan.get("score")), "call": call_for(scan.get("score") or 0), "signals": (scan.get("signals") or [])[:8],
        "rsi": num(scan.get("rsi"), 1), "adx": num(scan.get("adx"), 1), "pctFromSma20": num(scan.get("pct_from_sma20")), "pctFromSma50": num(scan.get("pct_from_sma50")),
        "return3mPct": num(scan.get("period_return_pct")), "high20": num(df["High"].tail(20).max(), places), "low20": num(df["Low"].tail(20).min(), places),
        "atr": num(atr, places + 1), "nextEarnings": scan.get("next_earnings"), "plan": None, "risk": None, "fundamentals": None, "news": [],
    }
    if num(atr, 8) and atr > 0:
        out["plan"] = {"entry": out["price"], "stop": num(price - 2 * atr, places), "target": num(price + 4 * atr, places), "rewardRisk": 2}
    try:
        r = risk.calculate_risk_metrics(yahoo)
        if "error" not in r:
            out["risk"] = {"annualVolPct": r["volatility"]["annual"], "var95DailyPct": r["var"]["var_95_daily"], "maxDrawdownPct": r["max_drawdown"], "sharpe": r["sharpe_ratio"], "return1yPct": r["return"]["total_period"]}
    except Exception:
        pass
    if market == "ASX":
        try:
            info = fundamentals.get_fundamentals(yahoo, "info").get("info", {})
            out["fundamentals"] = {k: info.get(k) for k in ["marketCap", "trailingPE", "forwardPE", "dividendYield", "priceToBook", "profitMargin", "returnOnEquity", "beta"] if info.get(k) is not None}
        except Exception:
            pass
    try:
        out["news"] = [{"title": a.get("title"), "publisher": a.get("publisher"), "date": a.get("date"), "link": a.get("link")} for a in news.get_news(yahoo, limit=4).get("articles", []) if str(a.get("link", "")).startswith("https://")]
    except Exception:
        pass
    return out


def safe(row):
    try:
        return analyse(row)
    except Exception as e:
        print("skip", row[0], repr(e)[:160], file=sys.stderr)
        return None


rows = universe()
with ThreadPoolExecutor(4) as pool:
    assets = [a for a in pool.map(safe, rows) if a]
missing = sorted(set(r[0] for r in rows) - set(a["symbol"] for a in assets))
if len(assets) < len(rows) * 0.7:
    print(f"only {len(assets)} of {len(rows)} returned; keeping the last good file", file=sys.stderr)
    sys.exit(1)
assets.sort(key=lambda a: -(a["score"] or 0))
out = {"schema": "sixquant.copilot.v1", "source": "Yahoo Finance via GitHub Action, analysis from trading_skills (MIT)", "mode": "delayed", "dataClass": "delayed-unlicensed",
       "lastUpdated": datetime.now(timezone.utc).isoformat(), "count": len(assets), "missing": missing, "assets": assets}
(ROOT / "data/copilot.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf8")
print(f"{len(assets)} of {len(rows)} symbols; missing {missing}")
