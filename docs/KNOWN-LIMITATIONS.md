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

## Delayed, Unlicensed Stock Data

The ASX stock feed is **delayed, unlicensed data** (`mode: delayed`,
`dataClass: delayed-unlicensed`) from a public, best-effort provider accessed
server-side — it is **not** a licensed real-time exchange feed. Every
stock-data surface labels it DELAYED / SNAPSHOT / DEMO so it is never mistaken
for live licensed data. Replacing it with a production-grade licensed live feed
requires a paid provider account and a business decision (the open #3 item);
see `docs/ASX-LIVE-FEED-CONTRACT.md` for the provider usage / redistribution /
support boundary. Always confirm live price, spread, and liquidity in your
external broker before execution.

## Feed Freshness SLA

The delayed feed is considered fresh for **36 hours** (`freshnessSLAHours`);
beyond that the UI shows a stale `fallback` state. The pipeline heartbeat
tolerates **76 hours** to span the weekday-only schedule across a weekend, and
the Stooq snapshot fallback is flagged stale after **24 hours**. Full
definitions are in `docs/ASX-LIVE-FEED-CONTRACT.md`.

## Timezone / Session State

Feed timestamps are recorded in UTC and additionally stamped in Sydney local
time (`lastUpdatedSydney`, AEST/AEDT resolved automatically). The
`asxSessionOpen` flag uses ASX continuous-trading hours (10:00–16:00 Sydney,
Mon–Fri) **and respects an ASX public-holiday calendar** (national + NSW
closures, maintained per the official ASX trading calendar in
`tools/generate-asx-feed.mjs`). On a holiday the flag is `false` and the feed
carries the holiday name in `asxHoliday`, which the UI surfaces. The calendar
covers 2026–2027 and must be extended each year; it is a staleness/session
indicator, not a guarantee of intraday market microstructure.

## Product Stage

The platform is currently in an early product maturity phase focused on workflow validation and disciplined decision support.