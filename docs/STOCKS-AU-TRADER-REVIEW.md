# SixSignal Australian Stocks Trader Review

## Product Problem

The Stocks Workspace is structurally sound, but it is not yet strong enough for Australian-based traders. The current stock display is too limited, the ASX universe is narrow, and the trade-planning model does not yet show brokerage, spread, or net trade outcome.

For Australian traders, this matters because brokerage and spread can materially change the quality of a small trade. A clean-looking setup can become poor once realistic execution costs are included.

## Australian Trader Suitability Matrix

| Area | Current State | Trader Risk | Required Improvement | Priority |
|---|---|---|---|---|
| ASX Coverage | Limited stock display | Trader cannot rely on the queue for meaningful ASX scanning | Expand ASX universe and make coverage limits explicit | High |
| Fees | Not visible in planning flow | Trader may overestimate profitability | Add brokerage, percentage fee, and spread assumptions | Critical |
| Net Result | Gross values dominate | Review may misrepresent actual trade quality | Show gross and net after fees | Critical |
| Position Sizing | Risk panel excludes cost model | Position size may be optimistic | Include fees in risk and allocation calculations | Critical |
| Broker Assumptions | External broker boundary exists, but assumptions are not modelled | User may not understand total trade cost | Add AU broker assumptions in Settings and Stock Plan | High |
| Data Freshness | Snapshot/demo state exists but needs stronger emphasis | User may over-trust stale or narrow data | Make freshness and source state visually prominent | High |
| Local Relevance | Generic stock workflow | Product feels less useful for Australian users | Use ASX-first labels, sectors, and examples | Medium |

## Release 1.1 Feature Matrix

| Feature | Description | User Benefit | Acceptance Criteria |
|---|---|---|---|
| ASX Universe Expansion | Increase displayed ASX stock coverage beyond current sample/snapshot limitations | Better scanning surface for Australian traders | User can review a broader ASX candidate list or see clear limits |
| Fee Model | Add configurable brokerage fee, percentage fee, and spread assumption | More realistic trade planning | Stock plan calculates estimated trade cost |
| Net Outcome | Display gross result versus net result | Better review accuracy | Journal and Review distinguish gross/net where available |
| Fee-Aware Position Sizing | Include fees in suggested position size | Avoids oversized or misleading trades | Risk panel reflects estimated costs |
| AU Broker Defaults | Add common Australian default assumptions | Faster setup for AU traders | Settings expose AUD/ASX brokerage assumptions |
| Freshness Badge | Make stock source and staleness visually obvious | Reduces overconfidence in stale data | User can identify snapshot/demo/stale state immediately |

## UX Recommendation

The Stocks page should keep the queue → cockpit → plan model, but the Stock Trade Plan must be redesigned into three sections:

| Section | Purpose | Required Fields |
|---|---|---|
| Setup | Capture why this ticker matters now | Ticker, market, signal state, thesis, entry trigger, invalidation |
| Risk | Calculate position and downside | Account size, risk %, entry, invalidation, suggested position |
| Fees | Estimate real execution cost | Brokerage, percentage fee, spread/slippage, gross/net estimate |

## Chief Trader Position

The current stock flow is directionally correct, but incomplete for real Australian use. Release 1.1 should not add advanced stock features before fixing local realism. The priority is not more charts. The priority is fees, net outcome, broader ASX coverage, and stronger data trust.