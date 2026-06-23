# Response Matrix Standard

## Purpose

All future product, UX, design, release, and trading workflow reviews for SixQuant Terminal should use structured matrices and product tables rather than unstructured narrative.

The objective is to:

- Improve execution clarity.
- Improve release governance.
- Reduce ambiguity.
- Support faster product iteration.
- Standardise review quality.

## Product Review Matrix

| Product Layer | Current State | Risk | Target State | Priority |
|---|---|---|---|---|
| Brand | Assess current branding quality | Define brand inconsistency or weakness | Define desired product identity | Critical / High / Medium / Low |
| UX | Assess current interaction quality | Define friction or overload | Define intended workflow behaviour | Critical / High / Medium / Low |
| Trading Workflow | Assess current trading loop | Define operational risk | Define target decision loop | Critical / High / Medium / Low |
| Data Trust | Assess feed and telemetry visibility | Define trust or clarity risk | Define target confidence model | Critical / High / Medium / Low |
| Visual Hierarchy | Assess information weighting | Define cognitive overload | Define intended focus model | Critical / High / Medium / Low |

## UX Friction Matrix

| Area | Friction | User Impact | Recommended Change |
|---|---|---|---|
| Navigation | Define UX issue | Define operational impact | Define UX improvement |
| Decision Flow | Define interaction weakness | Define trading consequence | Define workflow refinement |
| Information Density | Define overload source | Define attention impact | Define simplification approach |
| Data Visibility | Define telemetry issue | Define trust/confusion issue | Define visibility adjustment |

## Release Review Matrix

| Capability | Status | Stable | Needs Refinement | Blocker |
|---|---|---|---|---|
| Opportunity Queue | Working / Partial / Broken | Yes / No | Yes / No | Define if applicable |
| Decision Cockpit | Working / Partial / Broken | Yes / No | Yes / No | Define if applicable |
| Holdings | Working / Partial / Broken | Yes / No | Yes / No | Define if applicable |
| Review System | Working / Partial / Broken | Yes / No | Yes / No | Define if applicable |
| Feed Trust State | Working / Partial / Broken | Yes / No | Yes / No | Define if applicable |

## Design System Matrix

| Design Layer | Current State | Desired State | Action |
|---|---|---|---|
| Colour System | Assess consistency | Define final palette | Define implementation work |
| Typography | Assess readability and hierarchy | Define target rhythm | Define refinement |
| Component Density | Assess spacing and overload | Define desired calmness | Define spacing changes |
| Brand Assets | Assess favicon/logo/identity | Define target identity system | Define asset work |

## Trading Behaviour Matrix

| Trading Phase | Current UX Behaviour | Risk | Target Behaviour |
|---|---|---|---|
| Scan | Define current behaviour | Define trader risk | Define desired scan behaviour |
| Analyse | Define current cockpit quality | Define analysis weakness | Define desired focus state |
| Decide | Define current execution logic | Define impulsive risk | Define decision gating |
| Record | Define current recording quality | Define audit weakness | Define target journal state |
| Review | Define review visibility | Define learning weakness | Define desired review workflow |

## Product Principle

SixQuant Terminal should behave like a calm, disciplined trading cockpit.

It should never behave like:

- a gambling interface,
- a signal-spam dashboard,
- a crypto casino,
- a social trading feed,
- or a hype-driven retail trading app.

Every review should reinforce:

- clarity,
- focus,
- execution discipline,
- repeatability,
- and trader awareness.

## Canonical Signal Spec v1

Both equity-signal engines MUST implement this spec identically so one ticker
can never show different signals across surfaces. The two implementations are:

- `scripts/fetch_stocks.py` (Python — Stooq snapshot, also the test target)
- `tools/generate-asx-feed.mjs` (JavaScript — Yahoo ASX delayed feed)

Each file carries this spec verbatim in a `CANONICAL SIGNAL SPEC v1` comment
block. Unit tests in `scripts/test_signals.py` lock the Python implementation.

### Inputs

| Field | Definition |
|---|---|
| `change1d` | `(close[-1] - close[-2]) / close[-2] * 100` |
| `change5d` | `(close[-1] - close[-6]) / close[-6] * 100` (5 sessions back) |
| `relativeVolume` | `volume[-1] / mean(prior up-to-20 sessions, EXCLUDING the current bar)` |

The current bar is **excluded** from the relative-volume baseline so a fresh
volume spike is not diluted into its own average.

### signalState (first match wins — every label is reachable)

| # | Signal | Condition |
|---|---|---|
| 1 | Breakout | `change1d >= 2` AND `relativeVolume >= 1.5` AND `change5d > 0` |
| 2 | Volume Spike | `relativeVolume >= 2.0` AND `change1d > 0` |
| 3 | Watch | `change1d > 0` AND `change5d > 0` |
| 4 | Sell Risk | `change1d <= -2` OR `change5d <= -5` |
| 5 | No Action | default |

`Watch` is evaluated before `Sell Risk` but never masks it: `Watch` requires
both changes positive, `Sell Risk` requires a negative move, so they cannot
overlap.

### riskState (first match wins)

| # | Risk | Condition |
|---|---|---|
| 1 | Elevated | `signalState == "Sell Risk"` OR `change1d <= -3` OR `change5d <= -7` |
| 2 | Review | `relativeVolume >= 2.0` OR `abs(change1d) >= 3` |
| 3 | Normal | default |

### Partial 5-day window

When fewer than 6 closes are available, `change5d` is computed from the earliest
available close. The feed flags this with `change5dPartial: true` so the UI and
downstream logic do not treat a short window as a true 5-session change.