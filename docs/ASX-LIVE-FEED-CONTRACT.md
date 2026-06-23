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

---

## Current Implementation State (Release 1.1)

| Aspect | State |
|---|---|
| Queue population | Provider-backed **delayed** feed (`tools/generate-asx-feed.mjs`), refreshed by `asx-feed.yml` on the ASX market-cycle schedule |
| Universe | Static, documented **liquid large-cap swing-trading set** (~65 names across all 11 GICS sectors); version-stamped via `universeMeta` (name / revision / asOf) |
| Data class | `delayed-unlicensed` — **not** a licensed real-time exchange feed |
| Labelling | Every stock-data surface marks the data DELAYED / SNAPSHOT / DEMO; the operator can never read it as licensed real-time data |
| Validation | Generator validates before commit (see below) and refuses to overwrite the last-good feed on failure |
| Failure alerting | Scheduled-run failure opens/updates a `feed-failure` issue and writes a degraded heartbeat the UI surfaces |

> **#3 production blocker (unchanged):** replacing this delayed snapshot with a
> production-grade **licensed live** ASX feed requires a paid/licensed
> data-provider account and a business decision. That integration is **out of
> code scope** and remains the one open non-code item. The static/delayed feed
> is **Accepted for layout/UAT only**.

## Provider Usage, Redistribution & Support Boundary

| Boundary | Position |
|---|---|
| Provider | Public Yahoo Finance chart endpoint (delayed), accessed server-side from a scheduled GitHub Action. No API key, no contract, no SLA from the provider. |
| Licensing | **Unlicensed for redistribution.** Data is fetched for the operator's own decision support only. SixQuant does not redistribute, resell, or publish provider data as a market-data product. |
| Redistribution | The committed `data/asx-feed.json` is a derived, delayed snapshot for this app's own UI. It must not be presented to third parties as a live/licensed exchange feed. |
| Support | **None.** The endpoint is best-effort and may change shape, rate-limit, or disappear without notice. There is no support channel and no uptime guarantee. |
| Production use | For licensed, supportable, redistribution-safe ASX data, a **paid provider** (per the Implementation Path table above) is required. This is the #3 blocker. |
| Boundary preserved | Decision support only — the feed never enables order execution, broker connection, or money movement. |

## Freshness SLA

| Threshold | Value | Meaning |
|---|---|---|
| Feed freshness SLA | **36 hours** (`freshnessSLAHours` in the feed; `MAX_FEED_AGE_HOURS` in `stock-release2.js`) | Beyond 36h the delayed feed is treated as a stale `fallback`, not healthy `delayed`. The 36h window spans a normal overnight + safety margin between weekday capture windows. |
| Heartbeat freshness | **76 hours** (`HEARTBEAT_MAX_AGE_HOURS` in `stock-release2.js`) | The pipeline runs weekdays only; the allowed heartbeat age must span the weekend gap (Friday 16:15 capture to Monday 10:00 open ≈ 66h), so 76h avoids false weekend alarms. |
| Snapshot staleness (Stooq fallback) | **24 hours** (`isSnapshotStale` in `stocks.js`) | The daily-close Stooq snapshot is flagged stale after a day. |

## ASX Holiday & DST Handling

- Sydney timestamps (`lastUpdatedSydney`, `sydneyTimezone`) resolve AEST/AEDT
  automatically via the IANA `Australia/Sydney` zone — no hard-coded offset.
- `asxSessionOpen` uses ASX continuous-trading hours (10:00–16:00 Sydney,
  Mon–Fri) **and now also respects an ASX public-holiday calendar**
  (`ASX_HOLIDAYS` in `tools/generate-asx-feed.mjs`, national + NSW closures,
  maintained per the official ASX trading calendar). On a holiday the flag is
  `false` and `asxHoliday` carries the holiday name, which the UI surfaces so
  the operator knows prices are from the prior session.
- The holiday calendar must be **extended each year** from the official ASX
  trading-calendar publication. It currently covers 2026–2027.

## Feed Validation (fail-loud, no bad data committed)

`tools/generate-asx-feed.mjs` validates the assembled feed before writing:

| Check | Trigger |
|---|---|
| Empty / short asset set | 0 assets, or fewer than the 20-name MVP minimum |
| Missing required fields | Any asset missing a Feed/Asset Contract field |
| Bad prices | Non-positive or non-finite price |
| Anomalous moves | 1-day move beyond ±60% (almost certainly a bad tick / split) |
| Frozen provider | Every asset reports one identical price |
| Schema drift | `schema` no longer `sixquant.asx.feed.v2` |

On any failure the generator does **not** overwrite `data/asx-feed.json`
(the last-good feed stays), writes `data/heartbeat-asx.json` with status
`degraded`/`failed`, exits non-zero, and the workflow opens a `feed-failure`
tracking issue. The Stocks terminal surfaces the degraded heartbeat.