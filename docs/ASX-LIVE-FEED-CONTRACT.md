# ASX Live Feed Contract

## Production Requirement

| Requirement | Decision |
|---|---|
| Static stock snapshot as production feed | Rejected |
| Live or near-live ASX feed | Mandatory |
| Browser-only provider key exposure | Rejected |
| Server-side scheduled feed generation | Required MVP path |
| Cloudflare Worker or provider proxy | Preferred production path |

## Feed Contract

| Field | Type | Required | Notes |
|---|---|---|---|
| `source` | string | Yes | Example: `provider-live`, `provider-delayed`, `fallback` |
| `mode` | string | Yes | `live`, `delayed`, `snapshot`, `fallback`, or `offline` |
| `lastUpdated` | ISO datetime | Yes | Brisbane or UTC timestamp accepted |
| `symbols` | string array | Yes | ASX tickers without `.AX` suffix |
| `fetchErrors` | string array | Yes | Empty when healthy |
| `marketRegimes` | object | Yes | At minimum includes `Australia` |
| `assets` | array | Yes | ASX asset objects |

## Asset Contract

| Field | Type | Required | Notes |
|---|---|---|---|
| `symbol` | string | Yes | ASX ticker, example `BHP` |
| `name` | string | Yes | Company name |
| `exchange` | string | Yes | Must be `ASX` for Australian equities |
| `sector` | string | Yes | GICS-style sector preferred |
| `price` | number | Yes | AUD last/close/delayed price |
| `change1d` | number | Yes | Percentage movement |
| `change5d` | number | Yes | Percentage movement |
| `relativeVolume` | number | Yes | Relative volume multiple |
| `marketRegime` | string | Yes | `Constructive`, `Mixed`, or `Risk-Off` |
| `region` | string | Yes | `Australia` |
| `currency` | string | Yes | `AUD` |
| `signalState` | string | Yes | `Breakout`, `Watch`, `Sell Risk`, `Volume Spike`, `No Action` |
| `riskState` | string | Yes | `Controlled`, `Normal`, `Review`, `Elevated`, `Low` |

## MVP Universe Requirement

| Universe | Requirement |
|---|---|
| Minimum | 20 liquid ASX names |
| Preferred | ASX 200 or defined liquid swing-trading universe |
| Must include | Banks, miners, healthcare, energy, industrials, staples, technology |
| Must exclude | Illiquid microcaps unless explicitly filtered |

## Production Gate

| Gate | Required Result |
|---|---|
| Feed freshness | `lastUpdated` visible and not stale |
| Live state | `mode` accurately declares live/delayed/snapshot/fallback/offline |
| ASX breadth | Queue populated from provider feed, not manual-only seed |
| Failure state | Feed errors shown as degraded state |
| Execution boundary | Stocks remain planning-only; broker execution remains external |

## Implementation Path

| Path | Use |
|---|---|
| Scheduled GitHub Action | MVP feed refresh path for GitHub Pages |
| Cloudflare Worker | Preferred production path for provider keys, caching, and feed health |
| Paid provider | Required for reliable ASX production use |

## Chief Trader Rule

The Stocks platform is not functionally complete until the queue is populated by a real ASX feed or a clearly labelled delayed provider feed. Manual seed data is acceptable only for layout fallback and failure recovery.