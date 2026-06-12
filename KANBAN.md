# SixQuant Release Board

| Work item | Release | Status | Production gate |
|---|---|---:|---|
| Crypto snapshot automation | Current | Operational | Scheduled snapshots remain current and degraded states remain visible. |
| Crypto decision workflow | Current | Operational | Scan, analyse, decide, record and review surfaces pass browser smoke test. |
| ASX delayed-feed generator | Release 2 | Implemented | Provider-backed run produces populated `mode=delayed` data. |
| ASX market-cycle schedule | Release 2 | Implemented | Four weekday GitHub Action windows run without overlap or repeated failure. |
| Stocks fee and net calculations | Release 2 | Implemented | Brokerage, spread, gross return, net return and breakeven pass browser UAT. |
| Stocks journal persistence | Release 2 | Implemented | Private Local Mode retains plan economics after reload. |
| Live deployment UAT | Release 2 | Required | GitHub Pages reflects current `main` and both terminal surfaces load without blocking errors. |
| Repository identity protection | Release 2 | Completed | Root controls and repository contents remain limited to SixQuant trading work. |

## Current production decision

Crypto remains the primary operational surface. Stocks is a controlled-production candidate until delayed ASX data is populated and Release 2 browser UAT is recorded.

## Repository rule

Work unrelated to SixQuant crypto, Australian stocks, trading workflows, market data, journal/review, deployment or product UAT belongs in another repository and must not be added here.
