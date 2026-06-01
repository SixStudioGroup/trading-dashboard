# Critical and High Gap Closure

## Closure Matrix

| Gap | Severity | Closure Action | Status |
|---|---:|---|---|
| Real ASX stock universe | Critical | Confirmed as Release 1.1 hard requirement; demo-first posture rejected; ASX-first data pipeline documented as required production condition | Controlled by Issue #2 |
| Dynamic fee calculation | Critical | Fee / Net Outcome panel added to Stocks Workspace; JS calculation remains required implementation item | In Progress |
| Fee persistence | High | Fee fields added to Stock Trade Plan UX; persistence remains required in `stocks.js` | In Progress |
| Gross vs net review | High | Gross/net outcome requirement added to AU trader review and Issue #2 | In Progress |
| AU broker defaults | High | Brokerage, fee %, and spread assumptions added to stock planning surface | Partially Complete |
| Data freshness badge | High | Staleness warning and source badge already active; stronger badge component remains Release 1.1 polish | Partially Complete |

## Product Manager Decision

The Stocks Workspace must be treated as ASX-first from this point forward. SixSignal can proceed as a controlled UAT candidate for workflow testing, but Australian equities cannot be considered production-grade until real ASX coverage and fee-aware calculations are complete.

## Feature Requirement Matrix

| Requirement | Required For Live Test | Required For Broad Production | Notes |
|---|---|---|---|
| ASX-first queue | Yes | Yes | Must become the default stocks experience |
| Expanded ASX universe | Yes | Yes | ASX 200 or equivalent broad universe preferred |
| Brokerage per side | Yes | Yes | Default visible in Stocks planning |
| Fee percentage | Yes | Yes | Allows broker-specific assumptions |
| Spread/slippage | Yes | Yes | Prevents overconfidence in gross outcomes |
| Gross/net result | Yes | Yes | Required for trader review realism |
| Fee persistence | Yes | Yes | Plans must retain assumptions |
| Review net metrics | No | Yes | Can follow after live test if plan persistence is complete |

## Chief Trader Acceptance Criteria

| Criteria | Required Result |
|---|---|
| Trader sees fees before saving stock plan | Must pass |
| Trader sees warning that stock data may be snapshot/demo/stale | Must pass |
| Trader understands broker execution is external | Must pass |
| Trader can distinguish planning from execution | Must pass |
| Trader can review gross/net once trade is recorded | Release 1.1 target |

## Open Engineering Work

| Work Item | File Area | Priority |
|---|---|---:|
| Add dynamic fee/net calculation renderer | `stocks.js` | Critical |
| Persist fee fields in stock plans | `stocks.js` | Critical |
| Show fees in stock journal row | `stocks.js` | High |
| Add broker defaults to Settings | `settings.html` and shared storage logic | High |
| Expand ASX snapshot/feed | `data/stocks-snapshot.json` and feed scripts | Critical |

## Release Position

The UX surface now addresses the concern visibly. Full closure requires JavaScript calculation/persistence and real ASX data expansion. These remain the top engineering priorities before broad production use.