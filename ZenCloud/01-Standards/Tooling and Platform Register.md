# ZenCloud Tooling and Platform Register

## Purpose

This register is the ZenCloud surface-level map of tools, platforms, coding languages, deployment services, AI coding environments, and operational systems used or monitored across the ecosystem.

The goal is not to use every tool. The goal is to understand what each tool is for, where it fits, when to use it, and when to avoid it.

## Operating Principle

ZenCloud should operate a small core toolchain and a wider watchlist.

Core tools are used for production delivery, governance, source control, publishing, client engagement, and campaign operations.

Watchlist tools are evaluated for emerging capability, but they do not become production dependencies until they have a defined use case, security posture, cost model, and operational owner.

## ZenCloud Core Toolchain

| Layer | Primary tools | Purpose |
|---|---|---|
| Domain ownership | GoDaddy | Domain registration where domains are still registered there. |
| Edge control | Cloudflare | DNS, CDN, SSL/TLS, WAF, caching, redirects, analytics, and production domain governance. |
| Source of truth | GitHub | Repositories, version control, issues, pull requests, documentation, release history, and GitHub Pages. |
| Static deployment | GitHub Pages, Cloudflare Pages | Static sites, framework pages, documentation sites, and public artefact libraries. |
| React/app deployment | Vercel | React, Next.js, AI-focused app deployments, previews, and frontend application hosting. |
| Advisory front door | ZenCloud Advisory, HubSpot | Commercial site, lead capture, client journey, CRM, and campaign routing. |
| Campaign channels | LinkedIn, Clay, Medium, Buy Me a Coffee | Awareness, outbound, publishing, and community development. |
| Operating memory | Obsidian | Runbooks, repo maps, domain register, prompts, decisions, product strategy, and weekly governance. |
| AI delivery | ChatGPT/Codex, Claude Code, Cursor, JetBrains, Copilot | Architecture, coding, refactoring, documentation, troubleshooting, PRs, and code review. |
| Work management | GitHub Issues, Linear | Product backlog, sprint/cycle planning, issue triage, release tracking, and delivery visibility. |

## Tool Categories to Understand

### 1. Work Management and Product Operating Tools

| Tool | Surface-level use | ZenCloud posture |
|---|---|---|
| Linear | Product backlog, issue tracking, cycles, projects, initiatives, analytics, GitHub workflows. | Strong candidate for product portfolio execution. |
| GitHub Issues / Projects | Repo-native issue tracking, PR-linked work, technical tasks. | Keep for engineering source-of-truth work. |
| Jira | Enterprise-grade agile delivery, complex workflows, client-aligned project governance. | Know for client environments; do not adopt unless needed. |
| Azure DevOps | Boards, Repos, Pipelines, enterprise Microsoft delivery environments. | Know for clients; use only when a client requires it. |
| Notion | Lightweight wiki, product docs, planning, databases. | Optional; Obsidian is preferred for private memory. |
| ClickUp / Monday / Asana | General work management and team coordination. | Awareness only. |
| Trello | Lightweight Kanban. | Not needed unless simple visual boards are useful. |
| Slack / Teams | Communication and workflow notifications. | Use where integrated with clients or automations. |
| Miro / FigJam | Collaborative diagrams and workshops. | Useful for client-facing workshops. |

### 2. AI Coding and Development Environments

| Tool | Surface-level use | ZenCloud posture |
|---|---|---|
| ChatGPT / Codex | Architecture, coding agent work, code review, refactoring, PR support, documentation, multi-agent coding workflows. | Core. Use for structured code and architecture tasks. |
| Claude Code | Deep repo work, terminal/IDE coding, large refactors, test generation, Git operations, MCP integrations. | Core. Use for execution-heavy repo work. |
| Cursor | AI-first coding environment for rapid iteration, codebase navigation, and agentic editing. | Core/near-core. Use for fast frontend/app work. |
| GitHub Copilot | Inline completion, IDE assistance, PR support, GitHub-native AI. | Core support tool, especially inside GitHub workflow. |
| VS Code | General-purpose editor and extension platform. | Keep as universal baseline. |
| JetBrains IDEs | IntelliJ, WebStorm, PyCharm, DataGrip, Rider, GoLand; strong language-specific IDEs with AI Assistant and external agent support. | Use when deeper IDE support is needed. |
| JetBrains AI / Junie | JetBrains-native AI assistant and coding agents. | Evaluate; useful if standardising on JetBrains. |
| Google Antigravity | Emerging AI-first coding environment. | Watchlist; do not make production-critical yet. |
| Windsurf / Codeium | AI coding environment and coding assistant family. | Watchlist / compare against Cursor and Copilot. |
| Replit | Browser-based development, quick prototypes, hosted demos. | Useful for experiments, not core production. |
| Qodo | AI-assisted testing and code review. | Evaluate for QA-heavy repos. |
| Tabnine | AI completion with enterprise/privacy posture. | Watchlist for controlled environments. |
| OpenClaw | Open-source autonomous agent / workflow automation runtime. | Experimental only; requires strong sandboxing and security review. |
| Rabbit / Rabbit Code / Cyberdeck | AI device / agent / vibe-coding hardware ecosystem. | Watchlist only until the exact tool and enterprise value are clear. |

### 3. Deployment and Hosting Platforms

| Tool | Surface-level use | ZenCloud posture |
|---|---|---|
| Cloudflare Pages | Static and frontend deployments, Git integration, custom domains, preview deployments, redirects, functions. | Core for static sites and edge-aligned hosting. |
| Cloudflare Workers | Serverless edge functions, APIs, request handling, lightweight compute. | Use for edge APIs and domain-level logic. |
| GitHub Pages | Static documentation and simple public sites from GitHub repositories. | Core fallback and framework/document publishing layer. |
| Vercel | React/Next.js app deployment, previews, AI app hosting, frontend product delivery. | Core for React and AI-focused product apps. |
| Netlify | Static/frontend hosting, forms, functions, deploy previews. | Awareness; alternative to Cloudflare/Vercel. |
| Azure Static Web Apps | Static apps with Azure integration. | Know for enterprise/Microsoft-aligned clients. |
| Azure App Service / Functions | Web apps, APIs, serverless functions. | Client and enterprise deployment awareness. |
| AWS Amplify / Lambda | Frontend deployment and serverless backend functions. | Client and enterprise deployment awareness. |
| Google Cloud Run / Firebase | Container/serverless app hosting, realtime apps, prototypes. | Awareness for Google-aligned workloads. |
| Docker | Local and deployment packaging standard. | Must know at surface level for reproducibility. |

### 4. Languages, Frameworks, and File Formats

| Technology | Why it matters to ZenCloud |
|---|---|
| Markdown / MDX | Documentation, publications, runbooks, framework content, Obsidian, GitHub-native writing. |
| HTML / CSS | Static sites, public pages, simple publishing, troubleshooting frontend output. |
| JavaScript | Browser scripting and many current repo implementations. |
| TypeScript | Primary app and frontend language for React/Vite/Next.js work. |
| React | Main frontend app framework across several ZenCloud product surfaces. |
| Vite | Fast frontend build tool used across React/static app repos. |
| Next.js | React framework for app routing, server rendering, Vercel-native deployments, and full-stack frontend apps. |
| Node.js | JavaScript/TypeScript backend runtime, tooling scripts, APIs, build systems. |
| Python | Automation, data workflows, AI scripting, analysis, utilities, and learning products. |
| SQL | Data understanding, reporting, analytics, product data, and future client systems. |
| Bash / PowerShell | Local automation, deployment commands, GitHub/Cloudflare/GitHub CLI operations. |
| JSON / YAML | Config, GitHub Actions, package manifests, deployment settings, structured artefacts. |
| Tailwind CSS | Utility-first frontend styling; useful for fast product UI. |
| Dockerfile / Compose | Container packaging and local environment reproduction. |

### 5. AI, Agent, and Integration Standards

| Standard/tool | Surface-level use | ZenCloud posture |
|---|---|---|
| MCP | Connect AI tools to external data/tools such as files, GitHub, Slack, databases, and internal systems. | Learn. Important for agentic architecture. |
| OpenAPI | API contract description. | Important for product/API integration. |
| JSON Schema | Validate structured data and artefact payloads. | Important for generators and agent outputs. |
| OAuth | Secure delegated access. | Important for HubSpot, GitHub, Google, Microsoft integrations. |
| Webhooks | Event-driven integrations across GitHub, HubSpot, Linear, Slack, etc. | Important for automation. |
| n8n / Zapier / Make | No-code/low-code workflow automation. | Useful for HubSpot/LinkedIn/CRM workflows. |
| LangChain / LlamaIndex | AI app orchestration and retrieval patterns. | Awareness; use only with clear need. |
| Vector databases | Semantic search / retrieval for framework and document libraries. | Future capability. |
| Playwright | Browser automation and end-to-end tests. | Useful for deployment validation and site testing. |
| Sentry / Logtail / Datadog | Observability and error tracking. | Add as apps mature beyond static. |

## Top 10 Tools Phil Should Know First

1. **Cloudflare** — edge, DNS, SSL, WAF, caching, analytics, redirects.
2. **GitHub** — repos, branches, issues, pull requests, Pages, Actions.
3. **Vercel** — React/Next.js deployment and previews.
4. **Linear** — product backlog, cycles, projects, initiatives, GitHub-linked delivery.
5. **HubSpot** — forms, CRM, lead capture, campaign follow-up.
6. **ChatGPT / Codex** — architecture, code, review, PRs, and product acceleration.
7. **Claude Code** — deep repository execution, terminal/IDE edits, refactoring, tests.
8. **Cursor** — AI-first rapid development environment.
9. **JetBrains** — professional IDE family and AI-enabled engineering workspace.
10. **Obsidian** — permanent operating memory and ecosystem control plane.

## Learning Model

Phil only needs surface-level operating fluency first. The target is not expert certification in every platform. The target is knowing:

- what the tool does
- when ZenCloud should use it
- what risk it introduces
- how it connects to GitHub, Cloudflare, HubSpot, or the product estate
- what not to put into it
- what the first 30-minute practical exercise should be

## First 30-Minute Exercises

| Tool | First exercise |
|---|---|
| Linear | Create workspace, one team, one project, one cycle, and link one GitHub repo. |
| Cloudflare | Review one domain: DNS, SSL, WAF, cache, redirects, analytics. |
| GitHub | Open one repo, inspect README, issues, Actions, Pages settings, and branch status. |
| Vercel | Deploy a simple React/Vite or Next.js app and connect a preview URL. |
| HubSpot | Create one campaign form and confirm where the contact lands. |
| Codex | Ask it to inspect one repo and propose README/deployment improvements. |
| Claude Code | Run one repo review locally: build, lint, inspect, and propose patch. |
| Cursor | Open one repo and use agent mode to make a small UI/documentation change. |
| JetBrains | Open one TypeScript or Python repo and test AI Assistant / Claude plugin integration. |
| Obsidian | Create one daily operating note and link it to repo, domain, and campaign activity. |

## Governance Rules

- Do not connect sensitive client data to new tools without review.
- Do not let autonomous agents run against production repos without manual review.
- Do not install experimental agents on machines with unrestricted access to mail, credentials, client files, or production secrets.
- Keep API keys out of repos.
- Every new tool gets a register entry before becoming part of the operating model.
- AI tools can draft, inspect, and accelerate. Phil or an accountable architect approves.

## Watchlist

These tools and platforms should be monitored but not treated as core until evaluated:

- OpenClaw
- Google Antigravity
- Rabbit/Cyberdeck/Rabbit Code ecosystem
- Windsurf
- Qodo
- Tabnine
- n8n
- Supabase
- Firebase
- Netlify
- LangChain
- LlamaIndex
- Sentry
- Datadog

## Next Update

Add a scored evaluation table for each tool:

- strategic relevance
- current access
- current skill level
- security risk
- cost risk
- ecosystem fit
- recommended use
- owner
- next action
