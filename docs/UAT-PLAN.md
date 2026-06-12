# SixQuant Release 1.0 UAT Plan

## UAT Objective

Validate SixQuant as a coherent manual trading decision cockpit before Release 1.0 is treated as ready for controlled use.

UAT should confirm that the product supports the operating loop:

Scan → Analyse → Decide → Record → Review.

## UAT Scope Matrix

| Area | Route | UAT Objective | Expected Result | Status |
|---|---|---|---|---|
| Crypto Decision Terminal | `index.html` | Confirm user can scan crypto opportunities and select one asset for analysis | User understands the queue and cockpit without using secondary panels first | Ready for UAT |
| Stocks Workspace | `stocks.html` | Confirm user can filter stocks, select a ticker, and create a trade plan | Stock workflow feels connected to the broader SixQuant model | Ready for UAT |
| Trading Journal | `journal.html` | Confirm user can create, view, and review manual trade records | Journal records support audit and review | Ready for UAT |
| Signal Transition Feed | `alerts.html` | Confirm alerts are understood as review prompts, not execution instructions | User routes alerts back to analysis | Ready for UAT |
| Evidence Trail | `logs.html` | Confirm logs are understood as evidence/audit trail | User does not treat logs as trade signals | Ready for UAT |
| Review Centre | `reports.html` | Confirm review page supports weekly, behavioural, trade, position, and consensus review | User can assess decision quality and outcomes | Ready for UAT |
| Operator Manual | `guide.html` | Confirm manual explains workflow quickly during active use | User can find the operating rule and route guidance | Ready for UAT |
| Settings | `settings.html` | Confirm privacy, sharing, and local mode concepts are understandable | User understands local/private/browser storage boundary | Ready for UAT |

## UAT Acceptance Matrix

| Test Category | Pass Criteria | Fail Condition | Severity |
|---|---|---|---|
| Navigation | Every top navigation link resolves to the correct page and uses SixQuant language | Any route shows old product shell or unclear page identity | Critical |
| Brand | User-facing pages show SixQuant as the product and StudioSix as parent brand | User sees legacy product identity on active routes | Critical |
| Workflow | User can describe the core loop after using the app | User treats the app as a generic market dashboard | High |
| Crypto Workflow | User can select one asset, inspect cockpit, and understand execution gating | User tries to trade directly from queue | High |
| Stocks Workflow | User can filter/select a ticker and build a stock plan | User cannot find where to create a plan | High |
| Journal | User can record an entry and understand that no trade execution occurs | User believes journal places or syncs trades | Critical |
| Alerts | User understands alerts as prompts for analysis | User treats alerts as buy/sell recommendations | Critical |
| Logs | User understands logs as evidence | User treats logs as execution signals | High |
| Review | User can review behaviour and outcomes | Reports only feel like raw analytics | Medium |
| Settings | User understands private local storage and sharing boundary | User believes data syncs automatically | High |

## UAT Script

| Step | User Action | Expected Observation |
|---|---|---|
| 1 | Open live site root | Lands on SixQuant Crypto Decision Terminal |
| 2 | Click Stocks | Opens SixQuant Stocks Workspace |
| 3 | Return to Crypto | Crypto route loads without old Terminal wording confusion |
| 4 | Click Journal | Journal loads with SixQuant shell and navigation |
| 5 | Click Alerts | Signal Transition Feed loads and clearly says alerts are prompts |
| 6 | Click Evidence | Evidence Trail loads and clearly says logs are not execution instructions |
| 7 | Click Review | Review Centre loads with behaviour and decision framing |
| 8 | Click Guide | Operator Manual loads with workflow matrices |
| 9 | Click Settings | Settings loads with privacy and sharing controls |
| 10 | Create or simulate a manual journal record | Entry appears in journal/review surfaces where supported |

## UAT Defect Severity Matrix

| Severity | Definition | Example |
|---|---|---|
| Critical | Blocks core trust, navigation, or execution boundary | Broken route, old shell, misleading execution action |
| High | Blocks workflow clarity or trader discipline | Cannot find plan, alerts imply direct action |
| Medium | Causes friction but does not block use | Table density, inconsistent empty state |
| Low | Polish issue | Spacing, hover state, minor wording |

## UAT Exit Criteria

| Criteria | Required State |
|---|---|
| Navigation | All active routes pass |
| Branding | All active user-facing routes use SixQuant shell |
| Workflow | User can complete Scan → Analyse → Decide → Record → Review |
| Execution boundary | No route implies automatic broker/exchange execution |
| Documentation | Operator Manual and UAT Plan exist |
| Release governance | Progress matrix and release acceptance matrix are current |

## UAT Notes

SixQuant is not financial advice and does not place trades. UAT must evaluate whether the product improves trading discipline and review quality, not whether a signal produces profit.