// SixQuant Today: the daily home. Data trust, setup, open positions against their
// stops, plans waiting for a decision, candidates, and progress out of paper.
(function () {
    const SQ = window.SQ;
    const S = SQ.store;
    const e = S.escapeHtml;
    let feed = { mode: "offline", assets: [] };
    let freshness = SQ.asxFreshness(feed);
    let activeForm = "";
    const byId = id => document.getElementById(id);
    const assetFor = symbol => (feed.assets || []).find(a => a.symbol === symbol) || null;

    function renderSetup() {
        const el = byId("sq-setup");
        const account = S.account();
        const needed = !(S.isPrivate() && account.setupDone);
        el.hidden = !needed;
        if (!needed) return;
        const fees = S.fees();
        el.innerHTML = `
            <div class="panel-header"><h2 class="panel-title">Set up your workspace</h2><p class="panel-subtitle">${S.isPrivate() ? "Finish these basics to size trades." : "You are viewing demo data. Nothing you enter is saved until you start."}</p></div>
            <form class="sq-setup-form panel-body" id="sq-setup-form">
                <label><span>Account value (AUD)</span><input id="setup-account" type="number" min="1" step="any" required value="${account.accountValue || ""}" placeholder="Paper or real starting value"></label>
                <label><span>Risk per trade %</span><input id="setup-risk" type="number" min="0.05" max="5" step="0.05" required value="${account.riskPercent}"></label>
                <label><span>Brokerage per side (AUD)</span><input id="setup-brokerage" type="number" min="0" step="any" required value="${fees.brokerageFee}"></label>
                <label><span>Spread / slippage %</span><input id="setup-spread" type="number" min="0" step="any" required value="${fees.spreadPercent}"></label>
                <button class="button-primary" type="submit">Start in paper mode</button>
                <p class="sq-note">Records are saved only in this browser. New trades default to paper. Check brokerage against your own broker's price list.</p>
            </form>`;
        byId("sq-setup-form").addEventListener("submit", event => {
            event.preventDefault();
            S.setPrivate(true);
            S.setHideValues(false);
            S.saveAccount({ accountValue: Number(byId("setup-account").value), riskPercent: Number(byId("setup-risk").value), setupDone: true });
            S.write(SQ.KEYS.feeDefaults, { ...S.fees(), brokerageFee: Number(byId("setup-brokerage").value), spreadPercent: Number(byId("setup-spread").value) });
            window.location.reload();
        });
    }

    function renderAttention(trades) {
        const items = [];
        trades.filter(t => t.status === "open").forEach(t => {
            const status = SQ.positionStatus(t, assetFor(t.symbol)?.price);
            if (status.state === "stop") items.push(["sq-alert-risk", `${t.symbol}: last close is at or below your stop. Check your broker and act on your plan.`]);
            if (status.state === "target") items.push(["sq-alert-good", `${t.symbol}: last close reached your target. Review your exit plan.`]);
        });
        if (S.backupOverdue()) items.push(["sq-alert-warn", `Your records are only in this browser and have no recent backup. <button class="table-action" type="button" id="sq-backup-now">Download backup</button>`]);
        const el = byId("sq-attention");
        el.hidden = !items.length;
        el.innerHTML = items.map(([cls, html]) => `<div class="sq-alert ${cls}">${html}</div>`).join("");
        byId("sq-backup-now")?.addEventListener("click", () => { S.downloadBackup(); renderAll(); });
    }

    function closeForm(t) {
        const position = (t.fillPrice || t.referencePrice) * t.units;
        const est = SQ.estimatedFees(position, t);
        return `<form class="sq-inline-form" data-close-form="${e(t.id)}">
            <label><span>Exit price</span><input name="exitPrice" type="number" min="0" step="any" required></label>
            <label><span>Fees paid, both sides</span><input name="feesPaid" type="number" min="0" step="any" value="${est.toFixed(2)}"></label>
            <label><span>Exit reason</span><select name="exitReason"><option>Stop hit</option><option>Target hit</option><option>Plan changed</option><option>Time exit</option><option>Discretionary</option></select></label>
            <label><span>Followed the plan?</span><select name="ruleFollowed" required><option value="">Choose</option><option value="true">Yes</option><option value="false">No</option></select></label>
            <label><span>Mistake</span><select name="mistakeType"><option>None</option><option>No plan</option><option>Entered too late</option><option>Exited too early</option><option>Ignored invalidation</option><option>Oversized position</option><option>Chased movement</option><option>Other</option></select></label>
            <label class="sq-wide"><span>Lesson</span><input name="lessonLearned" type="text" placeholder="Optional"></label>
            <button class="button-primary" type="submit">Close trade</button>
            <p class="form-message" role="status"></p>
        </form>`;
    }

    function enterForm(t) {
        return `<form class="sq-inline-form" data-enter-form="${e(t.id)}">
            <label><span>Fill price</span><input name="fillPrice" type="number" min="0" step="any" required value="${t.referencePrice || ""}"></label>
            <label><span>Shares</span><input name="units" type="number" min="1" step="1" required value="${t.units || ""}"></label>
            <button class="button-primary" type="submit">Record entry</button>
            <p class="form-message" role="status"></p>
        </form>`;
    }

    function modeBadge(t) {
        return `<span class="badge ${t.mode === "live" ? "risk" : "wait"}">${t.mode === "live" ? "Live" : "Paper"}</span>`;
    }

    function renderOpen(trades) {
        const rows = trades.filter(t => t.status === "open");
        const el = byId("sq-open");
        byId("sq-open-count").textContent = rows.length;
        if (!rows.length) {
            el.innerHTML = `<p class="compact-empty">No open trades.</p>`;
            return;
        }
        el.innerHTML = rows.map(t => {
            const asset = assetFor(t.symbol);
            const status = SQ.positionStatus(t, asset?.price);
            const cls = { stop: "risk", target: "strong", near: "watch", ok: "wait", unknown: "wait" }[status.state];
            return `<article class="sq-trade">
                <div class="sq-trade-head"><strong>${e(t.symbol)}</strong> ${modeBadge(t)} <span class="badge ${cls}">${e(status.label)}</span></div>
                <dl class="sq-trade-grid">
                    <div><dt>Entry</dt><dd>${S.price(t.fillPrice || t.referencePrice)}</dd></div>
                    <div><dt>Stop</dt><dd>${S.price(t.invalidationPrice)}</dd></div>
                    <div><dt>Target</dt><dd>${S.price(t.targetPrice)}</dd></div>
                    <div><dt>Last close</dt><dd>${S.price(asset?.price)}</dd></div>
                    <div><dt>To stop</dt><dd>${status.stopDistancePct === null ? "n/a" : `${status.stopDistancePct.toFixed(1)}%`}</dd></div>
                    <div><dt>Open R</dt><dd class="${status.openR > 0 ? "positive" : status.openR < 0 ? "negative" : ""}">${S.rText(status.openR)}</dd></div>
                </dl>
                <button class="table-action" type="button" data-toggle-form="close-${e(t.id)}">Close trade</button>
                ${activeForm === `close-${t.id}` ? closeForm(t) : ""}
            </article>`;
        }).join("");
    }

    function renderPlanned(trades) {
        const rows = trades.filter(t => t.status === "planned");
        const el = byId("sq-planned");
        byId("sq-planned-count").textContent = rows.length;
        if (!rows.length) {
            el.innerHTML = `<p class="compact-empty">No plans waiting. Find a candidate in <a href="planner.html">the planner</a>.</p>`;
            return;
        }
        el.innerHTML = rows.map(t => `<article class="sq-trade">
            <div class="sq-trade-head"><strong>${e(t.symbol)}</strong> ${modeBadge(t)} <span class="muted">planned ${S.shortDate(t.recordedAt)}</span></div>
            <p class="sq-trade-why">${e(t.entryTrigger || "No trigger recorded")}</p>
            <dl class="sq-trade-grid">
                <div><dt>Entry</dt><dd>${S.price(t.referencePrice)}</dd></div>
                <div><dt>Stop</dt><dd>${S.price(t.invalidationPrice)}</dd></div>
                <div><dt>Target</dt><dd>${S.price(t.targetPrice)}</dd></div>
                <div><dt>Last close</dt><dd>${S.price(assetFor(t.symbol)?.price)}</dd></div>
                <div><dt>Shares</dt><dd>${S.hideValues() ? "...." : t.units || "n/a"}</dd></div>
                <div><dt>Position</dt><dd>${S.money(t.positionSize)}</dd></div>
            </dl>
            <div class="form-actions">
                <button class="table-action" type="button" data-toggle-form="enter-${e(t.id)}">${t.mode === "live" ? "I was filled" : "Paper fill"}</button>
                <button class="table-action danger-action" type="button" data-cancel-trade="${e(t.id)}">Cancel plan</button>
            </div>
            ${activeForm === `enter-${t.id}` ? enterForm(t) : ""}
        </article>`).join("");
    }

    function renderCandidates() {
        const el = byId("sq-candidates");
        if (freshness.blocks) {
            el.innerHTML = `<p class="compact-empty">Candidates are hidden while the data is stale or offline.</p>`;
            return;
        }
        const order = { Breakout: 0, "Volume Spike": 1 };
        const rows = (feed.assets || [])
            .filter(a => a.signalState in order && a.trend !== "Down")
            .sort((a, b) => order[a.signalState] - order[b.signalState] || b.relativeVolume - a.relativeVolume)
            .slice(0, 6);
        el.innerHTML = rows.length
            ? `<ul class="sq-candidate-list">${rows.map(a => `<li><a href="planner.html?symbol=${encodeURIComponent(a.symbol)}"><strong>${e(a.symbol)}</strong> <span class="muted">${e(a.name)}</span></a><span class="sq-cand-meta">${S.price(a.price)} · ${a.change1d > 0 ? "+" : ""}${Number(a.change1d).toFixed(1)}% · ${e(a.trend)} trend</span><span class="badge ${a.signalState === "Breakout" ? "strong" : "volume"}">${e(a.signalState)}</span></li>`).join("")}</ul>`
            : `<p class="compact-empty">No rule matches at the last close. Doing nothing is a valid result.</p>`;
    }

    function renderProgress(trades) {
        const account = S.account();
        const exposure = SQ.openExposure(trades);
        const value = account.accountValue || 0;
        const rules = S.rules();
        const grad = SQ.graduation(trades);
        const live = SQ.tradeStats(trades.filter(t => t.mode === "live"));
        byId("sq-risk").innerHTML = `
            <div class="sq-meter"><span>Open risk</span><strong>${value ? `${((exposure.risk / value) * 100).toFixed(1)}%` : "n/a"}</strong><small>limit ${rules.maxOpenRiskPct}%</small></div>
            <div class="sq-meter"><span>Capital committed</span><strong>${value ? `${((exposure.capital / value) * 100).toFixed(0)}%` : "n/a"}</strong><small>keep ${rules.cashReservePct}% in cash</small></div>
            <div class="sq-meter"><span>Paper expectancy</span><strong>${grad.stats.rCount ? S.rText(grad.stats.expectancyR) : "No data"}</strong><small>${grad.stats.count} closed${grad.stats.reliable ? "" : ", too few to judge"}</small></div>
            <div class="sq-meter"><span>Live result</span><strong>${live.count ? S.money(live.netAud, { signed: true }) : "None"}</strong><small>${live.count} closed</small></div>`;
        byId("sq-graduation").innerHTML = `
            <p class="sq-grad-verdict ${grad.met ? "positive" : ""}">${grad.met ? "Paper criteria met. That is a process milestone, not proof of an edge, and this data is not live-trade-ready." : "Stay on paper until all three are met."}</p>
            <ul class="sq-checks">${grad.criteria.map(c => `<li class="sq-check ${c.met ? "pass" : "manual"}"><span class="sq-check-mark">${c.met ? "Met" : "Open"}</span><span>${e(c.label)}</span><small>${e(c.value)}</small></li>`).join("")}</ul>`;
    }

    function renderAll() {
        const trades = S.stockTrades();
        renderSetup();
        S.renderDataBar(byId("sq-asx-bar"), freshness);
        renderAttention(trades);
        renderOpen(trades);
        renderPlanned(trades);
        renderCandidates();
        renderProgress(trades);
        byId("sq-demo-note").hidden = S.isPrivate();
    }

    function onClick(event) {
        const toggle = event.target.closest("[data-toggle-form]");
        if (toggle) {
            activeForm = activeForm === toggle.dataset.toggleForm ? "" : toggle.dataset.toggleForm;
            renderAll();
            return;
        }
        const cancel = event.target.closest("[data-cancel-trade]");
        if (cancel) {
            const trade = S.stockTrades().find(t => t.id === cancel.dataset.cancelTrade);
            if (trade) S.upsertTrade({ ...trade, status: "cancelled", cancelledAt: new Date().toISOString() });
            renderAll();
        }
    }

    function onSubmit(event) {
        const form = event.target;
        const say = text => { const m = form.querySelector(".form-message"); if (m) m.textContent = text; };
        const data = new FormData(form);
        const trades = S.stockTrades();
        if (form.dataset.enterForm) {
            event.preventDefault();
            const trade = trades.find(t => t.id === form.dataset.enterForm);
            const result = SQ.markEntered(trade, { fillPrice: data.get("fillPrice"), units: data.get("units") });
            if (result.error) return say(result.error);
            S.upsertTrade(result.trade);
        } else if (form.dataset.closeForm) {
            event.preventDefault();
            const trade = trades.find(t => t.id === form.dataset.closeForm);
            const followed = data.get("ruleFollowed");
            if (!followed) return say("Say whether you followed the plan.");
            const result = SQ.closeTrade(trade, {
                exitPrice: data.get("exitPrice"), feesPaid: data.get("feesPaid"), exitReason: data.get("exitReason"),
                ruleFollowed: followed === "true", mistakeType: data.get("mistakeType"), lessonLearned: data.get("lessonLearned")
            });
            if (result.error) return say(result.error);
            S.upsertTrade(result.trade);
        } else {
            return undefined;
        }
        activeForm = "";
        renderAll();
        return undefined;
    }

    async function init() {
        S.initTopbarControls(() => window.location.reload());
        const main = byId("main-content");
        main.addEventListener("click", onClick);
        main.addEventListener("submit", onSubmit);
        renderAll();
        feed = await S.loadFeed();
        freshness = SQ.asxFreshness(feed);
        const beat = await S.loadHeartbeat("asx");
        const unhealthy = beat && !["ok", "seed"].includes(String(beat.status).toLowerCase());
        renderAll();
        if (unhealthy) S.renderDataBar(byId("sq-asx-bar"), freshness, `Last pipeline run reported "${beat.status}".`);
        try {
            const crypto = await (await fetch("data/crypto-snapshot.json", { cache: "no-cache" })).json();
            const c = SQ.cryptoFreshness(crypto.lastUpdated);
            byId("sq-crypto-line").textContent = c.label;
            byId("sq-crypto-line").classList.toggle("negative", c.blocks);
        } catch {
            byId("sq-crypto-line").textContent = "Crypto data UNAVAILABLE";
        }
    }
    init();
})();
