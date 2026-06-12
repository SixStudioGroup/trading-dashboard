# Release 2 ASX Stocks UAT Gate

| Area | Acceptance Criteria | Current Status | Evidence | Production Gate |
|---|---|---:|---|---|
| ASX feed architecture | Stocks data must load from a provider-backed server-side feed path, not browser-side credentials. | Completed | `.github/workflows/asx-feed.yml`, `tools/generate-asx-feed.mjs`, `data/asx-feed.json` | Provider action must run successfully before production stock use. |
| ASX feed schedule | Feed must refresh multiple times per ASX trading day using market-cycle windows. | Completed | GitHub Action runs 4 weekday windows: 10:15 AEST, 12:00 AEST, 14:00 AEST, 16:15 AEST, with daylight-saving UTC caveat. | Confirm scheduled runs execute and commit refreshed feed data. |
| ASX feed mode | Feed contract must expose source, mode, lastUpdated, symbols, fetchErrors, marketRegimes, and assets. | Completed | `data/asx-feed.json` schema `sixquant.asx.feed.v2` | `mode=delayed` required for production-grade Stocks verdict. |
| ASX UI state | Stocks UI must show source, mode, last updated, errors, stale/degraded state, and offline fallback warning. | Completed | `stock-release2.js` Release 2 source-state rendering | Offline mode blocks production Stocks use. |
| ASX ticker display | ASX tickers must render without `.AX` suffix and use AUD currency. | Completed | `stock-release2.js` normalisation removes `.AX` and forces ASX/AUD defaults. | Confirm after action-generated feed is deployed. |
| ASX universe | Universe must be broad enough for Australian swing-trading review. | Partial | Generator seeds 40 liquid ASX names across core sectors. | Expand toward ASX 200 in next release or provider-backed symbol source. |
| Dynamic fees | Brokerage per side, percentage fee, spread/slippage, target, entry, and position size must calculate gross/net outcome. | Completed | `stock-release2.js` `calculateNetOutcome()` and fee panel rendering. | Browser UAT required after deployment. |
| Fee persistence | Broker defaults and saved plans must persist fee assumptions in Private Local Mode. | Completed | `sixquant.stocks.auBrokerDefaults.v2` and augmented `zencloud.stocks.tradeJournal.v1`. | Public Demo Mode intentionally does not persist private records. |
| Journal/review | Saved stock plans must surface net outcome and total costs in the journal fee column. | Completed | `stock-release2.js` journal fee patch. | Confirm after a Private Local Mode save. |
| Broker boundary | SixQuant must remain a manual decision cockpit, not an execution platform. | Completed | UI copy and broker handoff remain locked/manual. | No broker prefill/link/execution added. |

| ASX Market-Cycle Window | UTC Cron | AEST Operating Window | Purpose | Expected Feed State |
|---|---:|---:|---|---|
| Post-open stabilisation | `15 0 * * 1-5` | 10:15 AEST | Capture early movement after the open settles. | `mode=delayed`, populated assets, current `lastUpdated`. |
| Midday liquidity | `0 2 * * 1-5` | 12:00 AEST | Refresh after morning rotation and liquidity formation. | `mode=delayed`, updated price/change/volume values. |
| Afternoon trend | `0 4 * * 1-5` | 14:00 AEST | Capture afternoon continuation or reversal candidates. | `mode=delayed`, updated market regimes and signals. |
| Post-close delayed capture | `15 6 * * 1-5` | 16:15 AEST | Capture end-of-day delayed data after ASX close. | `mode=delayed`, final daily review snapshot. |

| Chief Trader Verdict | Decision |
|---|---|
| Crypto controlled-production posture | Unchanged. |
| Stocks Release 2 technical posture | Architecture, runtime wiring, and scheduled market-cycle feed automation are materially upgraded. |
| Stocks production verdict | Not production-ready until the GitHub Action successfully generates a provider-backed `mode=delayed` feed and the deployed page confirms current feed state. |
| Required operator action | Run **Generate ASX delayed feed** from GitHub Actions now, then confirm `data/asx-feed.json` contains assets and `mode=delayed`. Scheduled runs will continue across the four ASX market-cycle windows. |
