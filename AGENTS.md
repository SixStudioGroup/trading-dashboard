# SixQuant Agent Guardrails

## Repository role

This repository owns the SixQuant Crypto Terminal, SixQuant Stocks Terminal, shared journal and review surfaces, market-data snapshot workflows, trading calculations, deployment configuration and product UAT evidence.

## Allowed work

Agents may modify trading-platform HTML, CSS, JavaScript, market-data generators, GitHub Actions, product documentation, tests and release evidence when the work directly supports SixQuant.

## Prohibited cross-repository work

Do not add content for client archives, Obsidian vaults, founder operating systems, unrelated product concepts, games, courses, books, publications, ecosystem governance or another repository's deployment.

Do not repurpose `README.md`, `docs/`, `templates/` or GitHub Issues for work that is not part of the trading platform.

## Trading boundaries

SixQuant remains a manual decision-support product. Do not add broker credentials, exchange credentials, order execution, custody, autonomous trading or claims that delayed data is licensed live exchange data.

Secrets must remain in GitHub Secrets or approved provider configuration and must never be committed to the repository or exposed in browser code.

## Change discipline

Inspect the repository identity before writing. Preserve the `SixQuant Terminal` suite name and the `Crypto Terminal` and `Stocks Terminal` surface names. Every release change must include its production gate, failure state and verification evidence.

Stop and reroute any task whose primary subject is not crypto trading, Australian stocks, trading workflow, market-data automation, trader review or SixQuant product operation.
