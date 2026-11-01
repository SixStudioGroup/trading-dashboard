// SixQuant Scan: rule-state list on the left, one-ticker trade planner on the
// right. Signals only surface candidates. They do not rank trades by merit: see
// docs/SIGNAL-EVIDENCE.md. The planner records decisions and never touches a broker.
(function () {
    const SQ = window.SQ;
    const S = SQ.store;
    const e = S.escapeHtml;
    const byId = id => document.getElementById(id);
    const SETUP_STATES = ["Breakout", "Volume Spike", "Watch"];
    const STATE_ORDER = { Breakout: 0, "Volume Spike": 1, Watch: 2, "No Action": 3, "Sell Risk": 4 };
    const BADGES = { Breakout: "strong", Watch: "watch", "Sell Risk": "risk", "Volume Spike": "volume", "No Action": "wait" };

    let feed = { mode: "offline", assets: [] };
    let history = {};
    let freshness = SQ.asxFreshness(feed);
    let filter = "setups";
    let selected = "";
    const manualDone = new Set();

    const stocks = () => feed.assets || [];
    const selectedStock = () => stocks().find(s => s.symbol === selected) || null;
    const signed = v => `${v > 0 ? "+" : ""}${Number(v).toFixed(1)}%`;
    const tone = v => (v > 0 ? "positive" : v < 0 ? "negative" : "neutral");

    function visibleStocks() {
        const list = filter === "all" ? stocks() : filter === "held"
            ? stocks().filter(s => S.stockTrades().some(t => t.symbol === s.symbol && (t.status === "open" || t.status === "planned")))
            : stocks().filter(s => SETUP_STATES.includes(s.signalState));
        // Grouped by rule state, then by symbol: order inside a group implies no merit.
        return [...list].sort((a, b) => (STATE_ORDER[a.signalState] ?? 9) - (STATE_ORDER[b.signalState] ?? 9) || a.symbol.localeCompare(b.symbol));
    }

    function renderSummary() {
        const count = state => stocks().filter(s => s.signalState === state).length;
        byId("stock-setups").textContent = freshness.blocks ? "Hidden: data not usable" : `${count("Breakout")} Breakout · ${count("Volume Spike")} Volume Spike · ${count("Watch")} Watch`;
        byId("stock-source-badge").textContent = feed.source ? "Delayed, unlicensed. Yahoo via GitHub Action" : "No feed";
        const universe = feed.universeMeta;
        byId("stock-queue-subtitle").textContent = universe
            ? `${stocks().length} liquid ASX names, list revision ${universe.revision}. Grouped by rule state, not ranked.`
            : "No data loaded.";
        document.querySelectorAll("[data-stock-filter]").forEach(btn => btn.classList.toggle("active", btn.dataset.stockFilter === filter));
    }

    function renderQueue() {
        const body = byId("stock-opportunities-body");
        const rows = visibleStocks();
        if (!rows.length) {
            const text = !stocks().length ? "No ASX data available."
                : filter === "held" ? "No plans or positions yet."
                : "No setups at the last close. Doing nothing is a valid result.";
            body.innerHTML = `<tr><td colspan="8" class="loading-cell">${text}</td></tr>`;
            return;
        }
        body.innerHTML = rows.map(s => `
            <tr class="${s.symbol === selected ? "sq-row-selected" : ""}">
                <td><strong>${e(s.symbol)}</strong><br><span class="muted sq-company">${e(s.name)}</span></td>
                <td class="num">${S.price(s.price)}</td>
                <td class="num ${tone(s.change1d)}">${signed(s.change1d)}</td>
                <td class="num ${tone(s.change5d)}" ${s.change5dPartial ? 'title="Partial window, under 6 sessions"' : ""}>${signed(s.change5d)}${s.change5dPartial ? "*" : ""}</td>
                <td class="num">${Number(s.relativeVolume).toFixed(1)}x</td>
                <td>${e(s.trend || "Unknown")}</td>
                <td><span class="badge ${BADGES[s.signalState] || "wait"}">${e(s.signalState)}</span></td>
                <td><button class="table-action" type="button" data-analyse-stock="${e(s.symbol)}">Plan</button></td>
            </tr>`).join("");
    }

    function planInputs() {
        const value = id => byId(id)?.value ?? "";
        return {
            mode: document.querySelector('input[name="plan-mode"]:checked')?.value || "paper",
            whyNow: value("plan-why"), trigger: value("plan-trigger"),
            entry: value("plan-entry"), stop: value("plan-stop"), target: value("plan-target"),
            account: value("plan-account"), riskPercent: value("plan-risk")
        };
    }

    function currentCalc() {
        const stock = selectedStock();
        const input = planInputs();
        const fees = S.fees();
        const rules = S.rules();
        const size = SQ.sizePosition({ ...input, ...fees, maxPositionPct: rules.maxPositionPct });
        const trades = S.stockTrades();
        const plan = { ...input, symbol: stock?.symbol, sector: stock?.sector, size };
        const checks = SQ.planChecks(plan, { freshness, rules, trades, stock });
        const grad = SQ.graduation(trades);
        if (input.mode === "live" && !grad.met) {
            checks.push({ id: "live-early", status: "manual", label: "I accept this is live money before meeting my paper criteria", detail: `${grad.stats.count} of ${SQ.GRADUATION.minTrades} paper trades closed` });
        }
        return { input, size, checks, fees, rules };
    }

    function renderChart() {
        const el = byId("plan-chart");
        if (!el) return;
        const { input } = currentCalc();
        const svg = SQ.chartSvg(history[selected], { entry: input.entry, stop: input.stop, target: input.target });
        el.innerHTML = svg
            ? `${svg}<p class="sq-chart-key"><span class="k-close">Close</span><span class="k-ma20">20-day</span><span class="k-ma50">50-day</span><span>Delayed daily closes</span></p>`
            : `<p class="compact-empty">No price history available for this ticker.</p>`;
    }

    function renderOutputs() {
        if (!selectedStock()) return;
        const { size, checks, fees, rules, input } = currentCalc();
        const ready = size.units > 0;
        byId("plan-size-output").innerHTML = ready ? `
            <div><dt>Shares</dt><dd>${S.hideValues() ? "...." : size.units.toLocaleString("en-AU")}</dd></div>
            <div><dt>Position</dt><dd>${S.money(size.position)}</dd></div>
            <div><dt>Of account</dt><dd>${size.allocationPct.toFixed(1)}%</dd></div>
            <div><dt>Loss if stopped</dt><dd class="negative">${S.money(size.worstCaseLoss)}</dd></div>
            <div><dt>Costs, both sides</dt><dd>${S.money(size.roundTripCost)}</dd></div>
            <div><dt>Net at target</dt><dd class="${size.netReward > 0 ? "positive" : ""}">${S.money(size.netReward, { signed: true })}</dd></div>
            <div><dt>Reward : risk</dt><dd>${size.rewardRisk.toFixed(2)}R</dd></div>
            <div><dt>Breakeven</dt><dd>${S.price(size.breakeven)}</dd></div>`
            : `<p class="compact-empty sq-span">Enter entry, stop and account to size this trade.</p>`;
        byId("plan-fee-note").innerHTML = `Using $${Number(fees.brokerageFee).toFixed(2)} brokerage per side and ${Number(fees.spreadPercent).toFixed(2)}% spread. Position cap ${rules.maxPositionPct}%. <a href="settings.html">Change</a>`;
        byId("plan-checks").innerHTML = checks.map(c => {
            if (c.status === "manual") {
                return `<li class="sq-check manual"><label><input type="checkbox" data-manual-check="${e(c.id)}" ${manualDone.has(c.id) ? "checked" : ""}><span>${e(c.label)}</span></label>${c.detail ? `<small>${e(c.detail)}</small>` : ""}</li>`;
            }
            const word = { pass: "Pass", warn: "Warn", fail: "Fail" }[c.status];
            return `<li class="sq-check ${c.status}"><span class="sq-check-mark">${word}</span><span>${e(c.label)}</span>${c.detail ? `<small>${e(c.detail)}</small>` : ""}</li>`;
        }).join("");
        const pass = SQ.checksPass(checks, [...manualDone]);
        const save = byId("plan-save");
        save.disabled = !pass;
        const fails = checks.filter(c => c.status === "fail").length;
        const open = checks.filter(c => c.status === "manual" && !manualDone.has(c.id)).length;
        byId("plan-save-hint").textContent = pass
            ? (S.isPrivate() ? `Records a ${input.mode} plan. It places no order.` : "Demo mode: shown until you leave this page. It places no order.")
            : `${fails ? `${fails} failed check${fails > 1 ? "s" : ""}` : ""}${fails && open ? " and " : ""}${open ? `${open} to confirm` : ""} before recording.`;
    }

    function renderPlanner() {
        const panel = byId("stock-analysis-panel");
        const stock = selectedStock();
        if (!stock) {
            panel.innerHTML = `<div class="empty-analysis">Pick a ticker to plan a trade. You choose the stop and target. SixQuant sizes the position and checks it against your rules.</div>`;
            return;
        }
        manualDone.clear();
        const account = S.account();
        panel.innerHTML = `
            <div class="sq-plan">
                <div class="sq-plan-head">
                    <div><h3>${e(stock.symbol)}</h3><span class="muted">${e(stock.name)} · ${e(stock.sector)}</span></div>
                    <span class="badge ${BADGES[stock.signalState] || "wait"}">${e(stock.signalState)}</span>
                </div>
                <div id="plan-chart" class="sq-chart-wrap"></div>
                <dl class="sq-facts">
                    <div><dt>Last close</dt><dd>${S.price(stock.price)}</dd></div>
                    <div><dt>20-day</dt><dd>${S.price(stock.ma20)}</dd></div>
                    <div><dt>50-day</dt><dd>${S.price(stock.ma50)}</dd></div>
                    <div><dt>200-day</dt><dd>${S.price(stock.ma200)}</dd></div>
                    <div><dt>ATR 14</dt><dd>${S.price(stock.atr14)}</dd></div>
                    <div><dt>Trend</dt><dd>${e(stock.trend || "Unknown")}</dd></div>
                </dl>
                <form id="stock-plan-form" novalidate>
                    <fieldset class="sq-step"><legend>1. Why this trade</legend>
                        <label><span>Thesis, in your own words</span><textarea id="plan-why" rows="2" placeholder="What has to be true for this to work?"></textarea></label>
                        <label><span>Entry trigger</span><input id="plan-trigger" type="text" placeholder="What must happen before you enter?"></label>
                    </fieldset>
                    <fieldset class="sq-step"><legend>2. Levels</legend>
                        <div class="sq-field-row">
                            <label><span>Entry</span><input id="plan-entry" type="number" min="0" step="any" value="${Number(stock.price) || ""}"></label>
                            <label><span>Stop</span><input id="plan-stop" type="number" min="0" step="any"></label>
                            <label><span>Target</span><input id="plan-target" type="number" min="0" step="any"></label>
                        </div>
                        <p class="sq-note">For reference: 20-day low ${S.price(stock.low20)}, 20-day high ${S.price(stock.high20)}, last close less 2 ATR ${S.price(Number(stock.price) - 2 * Number(stock.atr14))}.</p>
                    </fieldset>
                    <fieldset class="sq-step"><legend>3. Size</legend>
                        <div class="sq-field-row">
                            <label><span>Account value</span><input id="plan-account" type="${S.hideValues() ? "password" : "number"}" min="0" step="any" value="${account.accountValue || ""}"></label>
                            <label><span>Risk per trade %</span><input id="plan-risk" type="number" min="0" step="0.05" value="${account.riskPercent}"></label>
                        </div>
                        <dl class="sq-size" id="plan-size-output"></dl>
                        <p class="sq-note" id="plan-fee-note"></p>
                    </fieldset>
                    <fieldset class="sq-step"><legend>4. Checks</legend><ul class="sq-checks" id="plan-checks"></ul></fieldset>
                    <fieldset class="sq-step"><legend>5. Record</legend>
                        <div class="sq-mode-row">
                            <label><input type="radio" name="plan-mode" value="paper" checked><span>Paper</span></label>
                            <label><input type="radio" name="plan-mode" value="live"><span>Live</span></label>
                        </div>
                        <button class="button-primary" id="plan-save" type="submit" disabled>Record plan</button>
                        <p class="sq-note" id="plan-save-hint"></p>
                        <p class="form-message" id="stock-plan-message" role="status"></p>
                    </fieldset>
                </form>
            </div>`;
        const form = byId("stock-plan-form");
        form.addEventListener("input", event => {
            // Tick boxes are handled on change. Redrawing here would remove the box
            // before its change event fires, and the tick would be lost.
            if (event.target.matches("[data-manual-check]")) return;
            renderOutputs();
            renderChart();
        });
        form.addEventListener("change", event => {
            const box = event.target.closest("[data-manual-check]");
            if (box) {
                if (box.checked) manualDone.add(box.dataset.manualCheck);
                else manualDone.delete(box.dataset.manualCheck);
                const id = box.dataset.manualCheck;
                renderOutputs();
                // The list is redrawn, so put keyboard focus back on this box.
                form.querySelector(`[data-manual-check="${id}"]`)?.focus();
            } else if (event.target.name === "plan-mode") {
                renderOutputs();
            }
        });
        form.addEventListener("submit", savePlan);
        renderOutputs();
        renderChart();
    }

    function savePlan(event) {
        event.preventDefault();
        const stock = selectedStock();
        const { input, size, checks, fees } = currentCalc();
        if (!stock || !SQ.checksPass(checks, [...manualDone])) return;
        const trade = SQ.normalizeStockTrade({
            id: SQ.tradeId(),
            symbol: stock.symbol, name: stock.name, sector: stock.sector, market: stock.exchange || "ASX",
            mode: input.mode, status: "planned", state: stock.signalState,
            whyNow: input.whyNow.trim(), thesis: input.whyNow.trim(), entryTrigger: input.trigger.trim(),
            referencePrice: Number(input.entry), invalidationPrice: Number(input.stop), targetPrice: Number(input.target),
            invalidation: `Close at or below ${S.price(input.stop)}`,
            units: size.units, positionSize: size.position, accountValue: Number(input.account), riskPercent: Number(input.riskPercent),
            brokerageFee: fees.brokerageFee, feePercent: fees.feePercent, spreadPercent: fees.spreadPercent,
            totalCosts: size.roundTripCost, netProfit: size.netReward, breakevenPrice: size.breakeven, plannedRewardRisk: size.rewardRisk,
            feedSession: feed.lastSessionDate || "", checksAtPlan: checks.filter(c => c.status !== "manual").map(c => `${c.id}:${c.status}`).join(","),
            fromSixQuant: true, recordedAt: new Date().toISOString()
        });
        S.upsertTrade(trade);
        if (S.isPrivate()) S.saveAccount({ accountValue: Number(input.account), riskPercent: Number(input.riskPercent) });
        selected = "";
        renderAll();
        byId("stock-analysis-panel").insertAdjacentHTML("afterbegin", `<p class="sq-saved" role="status">${e(trade.symbol)} plan recorded. <a href="today.html">See it on Today</a></p>`);
    }

    function renderAll() {
        renderSummary();
        renderQueue();
        renderPlanner();
    }

    function choose(symbol) {
        selected = symbol;
        renderQueue();
        renderPlanner();
        if (document.documentElement.dataset.device !== "desktop") byId("stock-analysis-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function checkHeartbeat() {
        const beat = await S.loadHeartbeat("asx");
        const warning = byId("stock-heartbeat-warning");
        const status = String(beat?.status || "").toLowerCase();
        if (beat && status && !["ok", "seed"].includes(status)) {
            byId("stock-heartbeat-detail").textContent = `Last pipeline run reported "${beat.status}"${beat.detail ? ` (${beat.detail})` : ""}. The last good feed is showing.`;
            warning.hidden = false;
        }
    }

    async function init() {
        S.initTopbarControls(renderAll);
        document.querySelectorAll("[data-stock-filter]").forEach(btn => btn.addEventListener("click", () => {
            filter = btn.dataset.stockFilter;
            renderSummary();
            renderQueue();
        }));
        byId("stock-opportunities-body").addEventListener("click", event => {
            const btn = event.target.closest("[data-analyse-stock]");
            if (btn) choose(btn.dataset.analyseStock);
        });
        renderAll();
        [feed, history] = await Promise.all([S.loadFeed(), S.loadHistory()]);
        freshness = SQ.asxFreshness(feed);
        S.renderDataBar(byId("sq-asx-bar"), freshness);
        const wanted = new URLSearchParams(window.location.search).get("symbol");
        if (wanted && stocks().some(s => s.symbol === wanted.toUpperCase())) selected = wanted.toUpperCase();
        renderAll();
        checkHeartbeat();
    }
    init();
})();
