# Release 2 ASX Stocks UAT Gate

| Area | Acceptance Criteria | Current Status | Evidence | Production Gate |
|---|---|---:|---|---|
| ASX feed architecture | Stocks data must load from a provider-backed server-side feed path, not browser-side credentials. | Completed | `.github/workflows/asx-feed.yml`, `tools/generate-asx-feed.mjs`, `data/asx-feed.json` | Provider action must run successfully before production stock use. |
| ASX feed mode | Feed contract must expose source, mode, lastUpdated, symbols, fetchErrors, marketRegimes, and assets. | Completed | `data/asx-feed.json` schema `sixsignal.asx.feed.v2` | `mode=delayed` required for production-grade Stocks verdict. |
| ASX UI state | Stocks UI must show source, mode, last updated, errors, stale/degraded state, and offline fallback warning. | Completed | `stock-release2.js` Release 2 source-state rendering | Offline mode blocks production Stocks use. |
| ASX ticker display | ASX tickers must render without `.AX` suffix and use AUD currency. | Completed | `stock-release2.js` normalisation removes `.AX` and forces ASX/AUD defaults. | Confirm after action-generated feed is deployed. |
| ASX universe | Universe must be broad enough for Australian swing-trading review. | Partial | Generator seeds 40 liquid ASX names across core sectors. | Expand toward ASX 200 in next release or provider-backed symbol source. |
| Dynamic fees | Brokerage per side, percentage fee, spread/slippage, target, entry, and position size must calculate gross/net outcome. | Completed | `stock-release2.js` `calculateNetOutcome()` and fee panel rendering. | Browser UAT required after deployment. |
| Fee persistence | Broker defaults and saved plans must persist fee assumptions in Private Local Mode. | Completed | `sixsignal.stocks.auBrokerDefaults.v2` and augmented `zencloud.stocks.tradeJournal.v1`. | Public Demo Mode intentionally does not persist private records. |
| Journal/review | Saved stock plans must surface net outcome and total costs in the journal fee column. | Completed | `stock-release2.js` journal fee patch. | Confirm after a Private Local Mode save. |
| Broker boundary | SixSignal must remain a manual decision cockpit, not an execution platform. | Completed | UI copy and broker handoff remain locked/manual. | No broker prefill/link/execution added. |

| Chief Trader Verdict | Decision |
|---|---|
| Crypto controlled-production posture | Unchanged. |
| Stocks Release 2 technical posture | Architecture and runtime wiring are materially upgraded. |
| Stocks production verdict | Not production-ready until the GitHub Action successfully generates a provider-backed `mode=delayed` feed and the deployed page confirms current feed state. |
| Required operator action | Run **Generate ASX delayed feed** from GitHub Actions or wait for the next scheduled weekday run, then confirm `data/asx-feed.json` contains assets and `mode=delayed`. |
