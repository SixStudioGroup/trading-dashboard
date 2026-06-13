# SixQuant Release Board

| Work item | Release | Status | Production gate |
|---|---|---:|---|
| Crypto snapshot automation | Current | Operational | Scheduled snapshots remain current and degraded states remain visible. |
| Crypto decision workflow | Current | Operational | Scan, analyse, decide, record and review surfaces pass browser smoke test. |
| ASX delayed-feed generator | Release 2 | Implemented | Provider-backed run produces populated `mode=delayed` data. |
| ASX market-cycle schedule | Release 2 | Implemented | Four weekday GitHub Action windows run without overlap or repeated failure. |
| Stocks fee and net calculations | Release 2 | Implemented | Brokerage, spread, gross return, net return and breakeven pass browser UAT. |
| Stocks journal persistence | Release 2 | Implemented | Private Local Mode retains plan economics after reload. |
| Live deployment UAT | Release 2 | Completed | Recorded 2026-06-13 via headless-Chrome CDP against live Pages: both terminals load, ASX delayed feed populated (40 rows), no blocking errors. |
| Repository identity protection | Release 2 | Completed | Root controls and repository contents remain limited to SixQuant trading work. |
| SixQuant rebadge + terminal theme | 1.0 | Completed | Live; no SixSignal remnants; theme verified at 390/768/1440. |
| Risk controls (gate, rules, exit alerts) | 1.0 | Completed | Cap/invalidation blocks verified live; alerts row per drawdown breach. |
| Pipeline heartbeat | 1.0 | Completed | Workflows write heartbeat files; both terminals flag missed runs. |
| Device modes + phone Check mode | 1.0 | Completed | Auto phone/tablet/desktop; phone queues fit 390px with Analyse visible. |
| Ultrawide day-trading tier | Next | Parked | Build when full-day trading begins: density toggle, status strip, ≥1800px third column for 57" half-window. |
| Research-brief Action (X1) | Next | Backlog | Server-side 20/50-day MAs committed as data/research-brief.json. |

## Current production decision

SixQuant 1.0 is live and released for live testing. Crypto remains the primary operational surface; Stocks runs on the delayed ASX feed for review-only planning. Release pack: `docs/RELEASE-SIXQUANT-1.0.md`.

## Repository rule

Work unrelated to SixQuant crypto, Australian stocks, trading workflows, market data, journal/review, deployment or product UAT belongs in another repository and must not be added here.
