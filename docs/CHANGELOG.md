# Changelog

## 2026-06-03 — Live Market Data Restored

### Crypto Data Feed Fixed

- Root cause: `MARKET_DATA_PROXY_URL` was empty. CoinGecko deprecated unauthenticated browser-side API access, causing all crypto data to fall back to a stale 9-coin hardcoded snapshot.
- Fix: GitHub Actions workflow (`update-crypto-snapshot.yml`) now fetches CoinGecko server-side using a key stored in GitHub Secrets and commits `data/crypto-snapshot.json` to the repo.
- `app.js` now reads from the committed snapshot — no browser-side API calls, no CORS risk, no key exposure.
- Bootstrap seed committed so the portal works immediately on deploy; live data overwrites it within 15 minutes of first workflow run.

### Schedule Rationalisation

All three data workflows aligned to morning / afternoon / evening AEST windows:

| Workflow | Old cadence | New cadence |
|---|---|---|
| Crypto snapshot | Every 15 min | 07:30 / 13:00 / 19:30 AEST |
| ASX intraday feed | 4× weekday | 3× weekday (10:00 / 13:00 / 16:15 AEST) |
| Stocks snapshot (Stooq) | Every hour | 3× weekday (07:30 / 17:30 / 21:30 AEST) |

### CI Runtime Updated

All three GitHub Actions workflows opt into Node.js 24 (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`) ahead of the June 16 2026 forced cutover.

---

## Release 0.x

### Current State

- Opportunity Queue implemented.
- Manual holdings implemented.
- CoinSpot execution boundary implemented.
- Live versus fallback state implemented.
- Market attention and signal surfaces implemented.
- Portfolio visibility implemented.
- Review surfaces implemented.

### Documentation Pass

The repository now includes:

- Product map
- Release plan
- UX review
- Trader operating model
- User guide
- Known limitations
- Changelog

### Next Release Direction

Release 1.0 should prioritise:

- Workflow clarity
- Reduced UI clutter
- Stronger analysis flow
- Better decision hierarchy
- Improved review discipline
- Product trust and stability