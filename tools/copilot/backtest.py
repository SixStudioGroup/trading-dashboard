#!/usr/bin/env python
"""Backtest the Copilot's calls on daily history. Writes data/copilot-evidence.json.

Scores come from the same vendored scanner the live Copilot uses. Each sampled day,
a stock scoring at or above a threshold takes a long trade at the next open: stop 2 ATR
below, target 4 ATR above, closed after 20 sessions at the latest. Results are after
nabtrade or CoinSpot costs and compared with buying every symbol on the same days.
"""
import json, re, sys, warnings
from datetime import datetime, timezone
from pathlib import Path
warnings.filterwarnings("ignore")
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
import numpy as np, pandas as pd, yfinance as yf
from trading_skills import scanner_bullish

scanner_bullish.get_earnings_info = lambda s: {}
class Frame:
    def __init__(self, df): self.df = df
    def history(self, period=None): return self.df

def universe():
    text = (ROOT / "tools/generate-asx-feed.mjs").read_text(encoding="utf8")
    asx = [m + ".AX" for m in re.findall(r"^\s*\['([A-Z0-9]+)',\s*'[^']*',\s*'[^']*'\]", text, re.M)]
    return asx, [c + "-AUD" for c in ["ADA", "BNB", "BTC", "DOGE", "DOT", "ETH", "FET", "LTC", "NEAR", "THETA", "XLM"]]

def atr(df, n=14):
    pc = df["Close"].shift()
    return pd.concat([df["High"] - df["Low"], (df["High"] - pc).abs(), (df["Low"] - pc).abs()], axis=1).max(axis=1).rolling(n).mean()

def trades(sym, cost_pct, step, years):
    df = yf.Ticker(sym).history(period=f"{years}y", auto_adjust=True).dropna(subset=["Close"])
    if len(df) < 200: return []
    a, out = atr(df), []
    for i in range(70, len(df) - 21, step):
        s = scanner_bullish.compute_bullish_score(sym, ticker=Frame(df.iloc[i - 62:i + 1]))
        if not s or not np.isfinite(a.iloc[i]) or a.iloc[i] <= 0: continue
        e = df["Open"].iloc[i + 1]; stop, target = e - 2 * a.iloc[i], e + 4 * a.iloc[i]; x = df["Close"].iloc[i + 20]
        for j in range(i + 1, i + 21):
            if df["Low"].iloc[j] <= stop: x = stop; break
            if df["High"].iloc[j] >= target: x = target; break
        out.append({"date": df.index[i].strftime("%Y-%m-%d"), "score": s["score"], "ret": (x / e - 1) * 100 - cost_pct, "r": ((x - e) / (2 * a.iloc[i])) - cost_pct / 100 * e / (2 * a.iloc[i])})
    return out

def stats(rows):
    if not rows: return {"trades": 0}
    r = np.array([x["ret"] for x in rows]); rr = np.array([x["r"] for x in rows])
    rng = np.random.default_rng(7)
    by_month = pd.Series(r).groupby([x["date"][:7] for x in rows]).agg(["sum", "count"]).values
    boot = []
    for _ in range(3000):
        pick = by_month[rng.integers(0, len(by_month), len(by_month))]
        boot.append(pick[:, 0].sum() / pick[:, 1].sum())
    return {"trades": len(r), "avgReturnPct": round(float(r.mean()), 2), "winRatePct": round(float((r > 0).mean() * 100), 1), "avgR": round(float(rr.mean()), 2), "low95": round(float(np.percentile(boot, 2.5)), 2), "high95": round(float(np.percentile(boot, 97.5)), 2)}

def market(symbols, cost, step, years):
    rows = []
    for s in symbols:
        try: rows += trades(s, cost, step, years)
        except Exception as e: print("skip", s, e, file=sys.stderr)
    dates = sorted(x["date"] for x in rows); mid = dates[len(dates) // 2]
    res = {"all": stats(rows), "from": dates[0], "to": dates[-1], "symbols": len(symbols), "thresholds": {}}
    for t in [3, 4, 5, 6, 7]:
        sel = [x for x in rows if x["score"] >= t]
        res["thresholds"][str(t)] = {**stats(sel), "first": stats([x for x in sel if x["date"] < mid]), "second": stats([x for x in sel if x["date"] >= mid])}
    return res

asx, crypto = universe()
out = {"generatedAt": datetime.now(timezone.utc).isoformat(), "method": "Next-open long, stop 2 ATR, target 4 ATR, 20-session limit. Sampled every 5 sessions. Costs per round trip: ASX 0.70% (nabtrade on about $5,000 plus spread), crypto 2.5% (1% a side plus spread). Today's surviving symbols, which flatters results.",
       "asx": market(asx, 0.70, 5, 5), "crypto": market(crypto, 2.5, 5, 5)}
(ROOT / "data/copilot-evidence.json").write_text(json.dumps(out, indent=1), encoding="utf8")
print(json.dumps(out, indent=0))
