# SixQuant Improvement Roadmap

Source review: two external articles assessed against the SixQuant product boundary
(decision support only — no order execution, no broker connections, no client-side
secrets, static GitHub Pages with GitHub Actions data pipeline).

Sources:

1. MindStudio — *Build an AI Trading Agent with Claude Code and Alpaca*
2. Medium (@aiintrading) — *900 Hours of Using Claude Code for Trading: What I Learned*

Ideas that require live order execution (Alpaca order placement, market/limit order
APIs, auto stop-loss selling) are explicitly **out of boundary** per SECURITY.md and
the operator manual: SixQuant plans and reviews; execution stays external and manual.
They are adapted below into decision-support equivalents.

---

## Now (high value, low effort, inside boundary)

> Status 2026-06-13: N1, N2, N3, N4, N5 shipped. Crypto cockpit checklist is
> now the five-question gate; risk rules configurable in Settings (defaults
> 8% position cap / 20% reserve / −8% exit alert); Position Monitor and the
> Alerts feed surface drawdown breaches; snapshot workflows write
> `data/heartbeat-*.json` consumed by the feed diagnostics on both terminals.

### N1. Five-question gate in the Decision Cockpit

Article 1 prescribes a pre-trade checklist: cash balance, existing positions, recent
news, 20/50-day moving averages, downside risk if the trade fails. SixQuant already
locks execution behind analysis; add these five questions as explicit confirm items
in the cockpit before a plan can be recorded.

### N2. Hard risk rules in plan validation

Article 1's three-layer risk model maps cleanly:

| Article layer | SixQuant equivalent |
|---|---|
| Instruction rules in CLAUDE.md | Operating rules already on every page |
| Script-level pre-flight checks | **Add:** plan form validation |
| Exchange protections | External broker (out of scope) |

Add to the plan forms: position size capped at a configurable % of portfolio value
(default 5–8%), warning when total planned exposure would drop cash reserve below
20%, and a required invalidation level on every plan (already present for stocks —
extend to crypto).

### N3. Exit-risk alert at fixed drawdown

Article 1 closes positions after 8% drawdown. SixQuant must not execute, but the
Open Position Monitor already computes P/L%: surface a prominent exit-risk state and
Alerts entry when any held asset passes −8% (configurable in Settings).

### N4. CLAUDE.md project memory

Article 2's strongest repeatable lesson. Add a repo `CLAUDE.md` recording: snapshot
schemas (`sixquant.crypto.snapshot.v1`, `sixquant.asx.feed.v2`), feed cadence and
workflow names, localStorage key namespace (`sixquant.*`, `sixquant.*`), risk rules,
brand tokens, and the decision-support boundary — so every future agent session
starts with full context instead of 15 minutes of re-explaining.

### N5. Feed heartbeat

Article 1's heartbeat.json pattern. The snapshot workflows should write
`data/heartbeat.json` (timestamp + status per feed) on every run; the dashboard
feed-diagnostics panel reads it and flags a missed run instead of only flagging
stale data after the 24h threshold.

---

## Next (medium effort, high leverage)

### X1. Daily research brief generated server-side

Article 1's "morning research" routine, adapted: a scheduled Action computes per
watchlist asset the 20-day and 50-day moving averages, distance from each, volume
state, and regime classification, and commits `data/research-brief.json`. The
dashboard renders it in the Decision Cockpit. Keeps computation out of the browser,
uses no client-side secrets, and gives every analysis the same technical baseline.

### X2. Structured daily journal export

Article 1's `YYYY-MM-DD.md` journal format: portfolio snapshot, per-symbol research
summary, execution table, end-of-day reflection. SixQuant's journal already records
plans; add a one-click dated markdown export in that structure so past entries can
be fed back into review sessions ("the journal becomes valuable data").

### X3. Risk Reviewer pass (debate pattern, human-in-the-loop)

Article 1's second-agent reviewer, adapted to decision support: a "challenge" step
in the cockpit that forces the operator to argue the bear case (what invalidates
this plan, what is the worst realistic fill, what does the regime say) before the
plan unlocks. Same psychology, no automation risk.

### X4. Daily digest

Article 1's monitoring digest: a scheduled Action that summarises the day's feed
health, regime changes, and any exit-risk flags into a commit (or optional email via
a GitHub Secret-held provider key — server-side only, consistent with SECURITY.md).

---

## Later (larger or external-dependency items)

### L1. MCP live-data sessions for development

Article 2 recommends connecting Claude directly to market data rather than pasting
CSVs. For working **on** SixQuant (not in the product), use a market-data MCP server
in Claude Code sessions so feed changes are developed against live shapes.

### L2. Watchlist config with per-asset allocation caps

Article 1's `watchlist.json` (symbol, thesis, max allocation %). SixQuant's
watchlist is currently flat; add per-asset metadata so cockpit risk checks (N2) can
be asset-specific.

### L3. Signal back-review

Feed prior journal entries and signal-change history into a periodic review report:
hit rate of signals followed vs ignored, plan adherence, drawdown behaviour. Pure
derivation from existing local records — no new data sources.

---

## Explicitly rejected (boundary violations)

- Automated order placement, cancellation, or stop-loss execution (Alpaca-style
  `place_order` / `cancel_all_orders`) — SixQuant never executes.
- Broker or exchange credentials anywhere in the product, including browser
  storage of trading-capable keys (the Gist PAT remains gist-scope only).
- Autonomous scheduled trading agents acting without human confirmation.

## Working-practice notes (from Article 2, for the operator)

- Plan before coding: start agent sessions with "ask me everything you need to know
  before writing code."
- Voice-dictated prompts produce 2–3× more specific requirements.
- Treat the agent like a junior quant: exact column names, signal definitions,
  thresholds, expected outputs.
