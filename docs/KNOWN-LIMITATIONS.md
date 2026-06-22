# Known Limitations

## Manual Execution Only

The dashboard does not place trades.

All execution occurs externally.

## No Financial Advice

The platform is a personal decision-support environment and does not provide financial advice.

## Live Data Dependency

Some dashboard features depend on external live market feeds.

Fallback mode may activate when feeds are unavailable.

## Manual Holdings

Portfolio data accuracy depends on manual user updates.

## No Exchange Synchronisation

The dashboard does not currently synchronise directly with exchanges.

## No Tax or Accounting Support

The product is not a taxation or accounting platform.

## No Automation

The dashboard does not automatically:

- Buy assets
- Sell assets
- Rebalance positions
- Generate automated orders

## Signal Derivation

Equity signals follow the Canonical Signal Spec v1 (see
`docs/RESPONSE-MATRIX-STANDARD.md`), implemented identically in
`scripts/fetch_stocks.py` and `tools/generate-asx-feed.mjs`. Signals are
derived from delayed/daily price data for review only — they are not buy or
sell recommendations.

When fewer than six daily closes are available, the 5-day change is computed
from the earliest available bar and flagged `change5dPartial: true`; treat such
values as an incomplete window.

## Timezone / Session State

Feed timestamps are recorded in UTC and additionally stamped in Sydney local
time (`lastUpdatedSydney`, AEST/AEDT resolved automatically). The
`asxSessionOpen` flag uses ASX continuous-trading hours (10:00–16:00 Sydney,
Mon–Fri) and intentionally **ignores public holidays** — it is a staleness/age
indicator, not an authoritative trading calendar.

## Product Stage

The platform is currently in an early product maturity phase focused on workflow validation and disciplined decision support.