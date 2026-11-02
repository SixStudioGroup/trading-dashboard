# SixQuant Security Policy

## Security posture

SixQuant is a static GitHub Pages decision-support application. It must not contain broker credentials, exchange credentials, API secrets, private keys, passwords or personal financial records in the repository.

## Market-data controls

Provider credentials belong in GitHub Secrets or approved server-side configuration. Browser code must consume generated snapshots and must not expose secret provider keys. Feed source, mode, timestamp and degraded state must remain visible so delayed, stale, fallback and offline data are not mistaken for licensed live exchange data.

## Browser storage

Private Local Mode stores user-entered holdings, plans and journal records in the user's browser. This information is not encrypted by SixQuant and is not synchronised to a server. Public Demo Mode must not persist private records.

## Execution boundary

SixQuant does not place orders, connect to broker accounts or custody funds. Any future broker or exchange integration requires a separate security design, explicit approval and isolated credential handling before implementation.

## GitHub Actions

Workflows must use least-privilege permissions, pinned or reviewed actions and no plaintext secrets. Automated feed commits must be limited to the intended data files.

## Reporting

Report security concerns privately to the repository owner. Do not post credentials, personal trading records or exploitable details in public issues.

## Copilot AI server

`copilot-api/` is a Cloudflare Worker that holds the operator's Anthropic API key in KV, never in the page or this repository. It accepts requests only from the site's origin with an access code held as a Worker secret, caps questions per day and message sizes, and has no broker connection. Questions, the account value, the risk setting and open trades in private mode go to Anthropic to answer them. Market data, news and web results are passed to the AI as untrusted reference material, and replies are escaped before display. The access code is excluded from backup files.
