// SixQuant Copilot: AI chat, ranked shortlist and a brief on each symbol.
(() => {
    "use strict";
    const API = "https://sixquant-copilot.phil-448.workers.dev";
    const CODE_KEY = "sixquant.copilot.code.v1";
    const CHAT_KEY = "sixquant.copilot.chat.v1";
    const COINSPOT = new Set(["ADA", "BNB", "BTC", "DOGE", "DOT", "ETH", "FET", "LTC", "NEAR", "THETA", "XLM"]);
    const STALE_HOURS = 36;
    const SUGGESTIONS = ["What's worth looking at on the ASX today?", "Which crypto looks strongest right now, and would you touch it?", "Is there anything you would avoid this week?"];
    const SQ = window.SQ;
    const S = SQ.store;
    const e = S.escapeHtml;
    const byId = id => document.getElementById(id);

    let feed = { assets: [] };
    let evidence = null;
    let tab = "ASX";
    let selected = null;
    let search = "";
    let busy = false;
    let ready = null;
    let messages = [];

    const store = {
        get(key) { try { return window.localStorage.getItem(key); } catch { return null; } },
        set(key, value) { try { window.localStorage.setItem(key, value); } catch { /* storage off */ } },
        remove(key) { try { window.localStorage.removeItem(key); } catch { /* storage off */ } }
    };
    const code = () => store.get(CODE_KEY) || "";
    const num = (v, digits = 2) => (Number.isFinite(Number(v)) && v !== null ? Number(v).toFixed(digits) : "n/a");
    const signed = v => (Number.isFinite(Number(v)) && v !== null ? `${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(2)}%` : "n/a");
    const price = v => (Number(v) < 1 ? `$${Number(v).toFixed(4)}` : `$${Number(v).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    const callClass = call => (call === "Strongest setup" ? "strong" : call === "Building" ? "building" : "weak");

    // ---- Formatting AI text. Everything is escaped first, so a reply can never add markup.
    function formatReply(text) {
        const inline = s => e(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\bhttps:\/\/[^\s<)]+/g, u => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
        const out = [];
        let list = false;
        String(text).split("\n").forEach(line => {
            const item = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
            if (item) {
                if (!list) { out.push("<ul>"); list = true; }
                out.push(`<li>${inline(item[1])}</li>`);
                return;
            }
            if (list) { out.push("</ul>"); list = false; }
            const heading = line.match(/^#{1,4}\s+(.*)$/);
            if (heading) out.push(`<h4>${inline(heading[1])}</h4>`);
            else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
        });
        if (list) out.push("</ul>");
        return out.join("");
    }

    // ---- Data
    async function loadJson(path) {
        const response = await fetch(path, { cache: "no-cache" });
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
    }

    function renderStatus() {
        const el = byId("cp-status");
        if (!feed.lastUpdated) {
            el.className = "sq-data-bar sq-data-offline";
            el.innerHTML = "<strong>Copilot data unavailable</strong><span>The shortlist can't load right now. Don't plan from it.</span>";
            return;
        }
        const hours = (Date.now() - new Date(feed.lastUpdated).getTime()) / 36e5;
        const stale = hours > STALE_HOURS;
        const when = new Date(feed.lastUpdated).toLocaleString("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium", timeStyle: "short" });
        el.className = `sq-data-bar sq-data-${stale ? "stale" : "current"}`;
        el.innerHTML = `<strong>${stale ? "STALE" : "DELAYED"}: updated ${e(when)} Sydney</strong><span>${e(feed.source)}. Unlicensed and not real-time, so confirm the live price in nabtrade or CoinSpot before any order.${feed.missing?.length ? ` No data for ${e(feed.missing.join(", "))}.` : ""}</span>`;
    }

    function renderEvidence() {
        const el = byId("cp-evidence");
        if (!evidence?.asx) { el.textContent = "Backtest results unavailable."; return; }
        const line = (label, m) => {
            const top = m.thresholds["7"];
            return `<strong>${label}:</strong> Strongest setups averaged ${signed(top.avgReturnPct)} a trade after costs (95% range ${signed(top.low95)} to ${signed(top.high95)}) over ${Number(top.trades).toLocaleString("en-AU")} trades.`;
        };
        el.innerHTML = `<strong>How far to trust these calls: no reliable edge so far.</strong> ${line("ASX", evidence.asx)} ${line("Crypto", evidence.crypto)} Tested ${e(evidence.asx.from)} to ${e(evidence.asx.to)} on today's surviving symbols, which flatters results. The score is a starting point, not proof.`;
    }

    function renderShortlist() {
        const q = search.trim().toUpperCase();
        const rows = feed.assets.filter(a => a.market === tab && (!q || a.symbol.includes(q) || a.name.toUpperCase().includes(q)));
        document.querySelectorAll("[data-cp-tab]").forEach(b => {
            const on = b.dataset.cpTab === tab;
            b.classList.toggle("active", on);
            b.setAttribute("aria-pressed", String(on));
        });
        byId("cp-rows").innerHTML = rows.length ? rows.map((a, i) => `
            <tr class="${selected === a.symbol ? "cp-selected" : ""}">
                <td class="num">${i + 1}</td>
                <td><button class="cp-symbol" type="button" data-cp-pick="${e(a.symbol)}">${e(a.symbol)}</button></td>
                <td class="cp-name">${e(a.name)}</td>
                <td class="num">${price(a.price)}</td>
                <td class="num ${Number(a.changePct) > 0 ? "positive" : Number(a.changePct) < 0 ? "negative" : ""}">${signed(a.changePct)}</td>
                <td class="num">${num(a.score)}</td>
                <td><span class="cp-call ${callClass(a.call)}">${e(a.call)}</span></td>
                <td class="num">${num(a.rsi, 0)}</td>
                <td class="num">${a.plan ? price(a.plan.stop) : "n/a"}</td>
                <td class="num">${a.plan ? price(a.plan.target) : "n/a"}</td>
            </tr>`).join("") : `<tr><td colspan="10" class="loading-cell">No matching symbols.</td></tr>`;
    }

    function sizing(asset) {
        const account = S.account();
        const value = Number(byId("cp-account")?.value) || Number(account.accountValue) || 0;
        const risk = Number(byId("cp-risk")?.value) || Number(account.riskPercent) || 1;
        if (!asset.plan || !value) return null;
        const fees = asset.market === "ASX" ? S.fees() : { brokerageMode: "manual", brokerageFee: 0, feePercent: Number(store.get("sixquant.cryptoFeePct.v1")) || 1, spreadPercent: 0.5 };
        return SQ.sizePosition({ account: value, riskPercent: risk, entry: asset.plan.entry, stop: asset.plan.stop, target: asset.plan.target, ...fees, maxPositionPct: S.rules().maxPositionPct });
    }

    function renderSize(asset) {
        const el = byId("cp-size");
        if (!el) return;
        const size = sizing(asset);
        if (!size) { el.innerHTML = `<p class="sq-note">Enter your account value to size this trade.</p>`; return; }
        if (!(size.units > 0)) { el.innerHTML = `<p class="sq-note">Costs are too big for this risk budget, so there's no sensible size.</p>`; return; }
        el.innerHTML = `<dl class="cp-facts">
            <div><dt>Units</dt><dd>${size.units.toLocaleString("en-AU")}</dd></div>
            <div><dt>Position</dt><dd>${price(size.position)}</dd></div>
            <div><dt>Costs, both sides</dt><dd>${price(size.roundTripCost)}</dd></div>
            <div><dt>Loss if stopped</dt><dd class="negative">${price(size.worstCaseLoss)}</dd></div>
            <div><dt>Net at target</dt><dd class="${size.netReward > 0 ? "positive" : "negative"}">${price(size.netReward)}</dd></div>
            <div><dt>Breakeven</dt><dd>${price(size.breakeven)}</dd></div>
        </dl>`;
    }

    function renderBrief() {
        const el = byId("cp-brief");
        const a = feed.assets.find(x => x.symbol === selected);
        if (!a) {
            el.innerHTML = `<div class="panel-header"><h2 class="panel-title">Brief</h2><p class="panel-subtitle">Pick a symbol from the shortlist.</p></div>`;
            return;
        }
        const account = S.account();
        const f = a.fundamentals || {};
        const r = a.risk || {};
        const venue = a.market === "ASX"
            ? `<a class="table-action" href="https://www.nabtrade.com.au/" target="_blank" rel="noopener noreferrer" title="Opens nabtrade. No order details are sent.">Open nabtrade</a>`
            : COINSPOT.has(a.symbol) ? `<a class="table-action" href="https://www.coinspot.com.au/buy/${e(a.symbol.toLowerCase())}" target="_blank" rel="noopener noreferrer" title="Opens CoinSpot's page for this coin. No order details are sent.">Open CoinSpot</a>` : "";
        el.innerHTML = `
            <div class="panel-header"><h2 class="panel-title">${e(a.symbol)} <span class="cp-call ${callClass(a.call)}">${e(a.call)}</span></h2><p class="panel-subtitle">${e(a.name)} · ${e(a.sector)} · last bar ${e(a.lastBar)}</p></div>
            <div class="panel-body cp-brief-body">
                <div class="cp-actions"><button class="button-primary" type="button" data-cp-ask="${e(a.symbol)}">Ask Copilot about ${e(a.symbol)}</button>${venue}</div>
                <dl class="cp-facts">
                    <div><dt>Price</dt><dd>${price(a.price)}</dd></div>
                    <div><dt>1 day</dt><dd>${signed(a.changePct)}</dd></div>
                    <div><dt>3 months</dt><dd>${signed(a.return3mPct)}</dd></div>
                    <div><dt>Score</dt><dd>${num(a.score)}</dd></div>
                    <div><dt>RSI</dt><dd>${num(a.rsi, 0)}</dd></div>
                    <div><dt>ADX</dt><dd>${num(a.adx, 0)}</dd></div>
                </dl>
                <h3 class="mini-title">Levels (stop 2 ATR, target 4 ATR)</h3>
                ${a.plan ? `<dl class="cp-facts"><div><dt>Entry</dt><dd>${price(a.plan.entry)}</dd></div><div><dt>Stop</dt><dd class="negative">${price(a.plan.stop)}</dd></div><div><dt>Target</dt><dd class="positive">${price(a.plan.target)}</dd></div></dl>` : `<p class="sq-note">Not enough data for levels.</p>`}
                <h3 class="mini-title">Size for your account</h3>
                <div class="cp-size-inputs">
                    <label><span>Account (AUD)</span><input id="cp-account" type="number" min="0" step="any" value="${account.accountValue || ""}" placeholder="10000"></label>
                    <label><span>Risk %</span><input id="cp-risk" type="number" min="0.05" max="5" step="0.05" value="${account.riskPercent || 1}"></label>
                </div>
                <div id="cp-size"></div>
                <h3 class="mini-title">Why this score</h3>
                <ul class="cp-signals">${a.signals.map(s => `<li>${e(s)}</li>`).join("") || "<li>No signals.</li>"}</ul>
                <h3 class="mini-title">Risk and value</h3>
                <dl class="cp-facts">
                    <div><dt>Volatility, 1 yr</dt><dd>${r.annualVolPct !== undefined ? `${num(r.annualVolPct, 0)}%` : "n/a"}</dd></div>
                    <div><dt>Worst drawdown</dt><dd>${r.maxDrawdownPct !== undefined ? `${num(r.maxDrawdownPct, 0)}%` : "n/a"}</dd></div>
                    <div><dt>Return, 1 yr</dt><dd>${r.return1yPct !== undefined ? signed(r.return1yPct) : "n/a"}</dd></div>
                    ${a.market === "ASX" ? `<div><dt>P/E</dt><dd>${num(f.trailingPE, 1)}</dd></div><div><dt>Dividend yield</dt><dd>${f.dividendYield !== undefined ? `${num(f.dividendYield, 1)}%` : "n/a"}</dd></div><div><dt>Next earnings</dt><dd>${e(a.nextEarnings || "n/a")}</dd></div>` : ""}
                </dl>
                <h3 class="mini-title">News</h3>
                <ul class="cp-news">${a.news.map(n => `<li><a href="${e(n.link)}" target="_blank" rel="noopener noreferrer">${e(n.title || "Article")}</a><small>${e(n.publisher || "")} ${e(n.date || "")}</small></li>`).join("") || "<li>No recent headlines.</li>"}</ul>
            </div>`;
        renderSize(a);
        ["cp-account", "cp-risk"].forEach(id => byId(id).addEventListener("input", () => renderSize(a)));
    }

    // ---- Chat
    function saveChat() { store.set(CHAT_KEY, JSON.stringify(messages.slice(-40))); }
    function loadChat() {
        try {
            const rows = JSON.parse(store.get(CHAT_KEY) || "[]");
            messages = Array.isArray(rows) ? rows.filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string") : [];
        } catch { messages = []; }
    }

    function renderChat(streaming = "") {
        const el = byId("cp-messages");
        const bubbles = messages.map(m => `<div class="cp-msg ${m.role}">${m.role === "assistant" ? formatReply(m.content) : `<p>${e(m.content)}</p>`}</div>`);
        if (streaming !== "") bubbles.push(`<div class="cp-msg assistant">${streaming ? formatReply(streaming) : `<p class="cp-thinking">Thinking...</p>`}</div>`);
        el.innerHTML = bubbles.join("") || `<div class="cp-empty"><p>Ask me anything about the market, a stock, a coin or a trade you're weighing up.</p><div class="cp-suggestions">${SUGGESTIONS.map(s => `<button class="table-action" type="button" data-cp-suggest="${e(s)}">${e(s)}</button>`).join("")}</div></div>`;
        el.scrollTop = el.scrollHeight;
    }

    function setBusy(value) {
        busy = value;
        byId("cp-send").disabled = value;
    }

    const ERRORS = {
        bad_code: "That access code is wrong.",
        needs_setup: "The AI key isn't connected yet.",
        bad_key: "Anthropic rejected the API key, so it may have been revoked.",
        no_credit: "Your Anthropic account has run out of credit.",
        rate_limited: "Anthropic is rate-limiting requests. Try again shortly.",
        daily_limit: "The daily limit of 300 questions has been reached. It resets at 10 or 11am Sydney time.",
        refusal: "The AI declined to answer that question.",
        ai_failed: "The AI request failed. Try again."
    };

    async function ask(text) {
        if (busy || !text.trim()) return;
        messages.push({ role: "user", content: text.trim() });
        byId("cp-input").value = "";
        setBusy(true);
        renderChat("");
        let reply = "";
        let failure = "";
        try {
            const account = S.account();
            const open = S.isPrivate() ? S.stockTrades().filter(t => t.status === "open").map(t => ({ symbol: t.symbol, units: t.units, entry: t.fillPrice, stop: t.invalidationPrice, mode: t.mode })) : [];
            const response = await fetch(`${API}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Copilot-Code": code() },
                body: JSON.stringify({ messages: messages.filter(m => m.content), profile: { accountValue: account.accountValue || null, riskPercent: account.riskPercent || null, openTrades: open, selectedSymbol: selected } })
            });
            if (!response.ok) {
                failure = (await response.json().catch(() => ({}))).error || "ai_failed";
            } else {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                for (;;) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop();
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        const event = JSON.parse(line);
                        if (event.text) { reply += event.text; renderChat(reply); }
                        if (event.error) failure = event.error;
                    }
                }
            }
        } catch {
            failure = "ai_failed";
        }
        setBusy(false);
        if (failure === "bad_code") store.remove(CODE_KEY);
        if (failure === "bad_code" || failure === "needs_setup") { messages.pop(); await checkAccess(); return; }
        if (reply) messages.push({ role: "assistant", content: reply });
        else messages.pop();
        saveChat();
        renderChat();
        if (failure) byId("cp-chat-message").textContent = ERRORS[failure] || ERRORS.ai_failed;
        else byId("cp-chat-message").textContent = "";
    }

    // ---- Connecting the AI
    function renderGate(state, message = "") {
        const gate = byId("cp-gate");
        const chat = byId("cp-chat");
        gate.hidden = state === "ready";
        chat.hidden = state !== "ready";
        byId("cp-clear").hidden = state !== "ready";
        if (state === "ready") return;
        const codeStep = state === "code";
        gate.innerHTML = `<form id="cp-gate-form" class="cp-gate-form">
            <h3>${codeStep ? "Unlock Copilot" : "Connect the AI"}</h3>
            <p>${codeStep ? "Enter your access code once. This browser remembers it." : "Paste your Anthropic API key once. It's stored on the Copilot server, not in this page. Anthropic bills usage to you, so set a spend limit in its console."}</p>
            <label><span>${codeStep ? "Access code" : "Anthropic API key"}</span><input id="cp-gate-value" type="password" autocomplete="off" required placeholder="${codeStep ? "" : "sk-ant-..."}"></label>
            <button class="button-primary" type="submit">${codeStep ? "Unlock" : "Connect"}</button>
            <p class="form-message" id="cp-gate-message" role="alert">${e(message)}</p>
        </form>`;
        byId("cp-gate-form").addEventListener("submit", async event => {
            event.preventDefault();
            const value = byId("cp-gate-value").value.trim();
            if (codeStep) { store.set(CODE_KEY, value); await checkAccess(); return; }
            byId("cp-gate-message").textContent = "Checking the key...";
            try {
                const response = await fetch(`${API}/setup`, { method: "POST", headers: { "Content-Type": "application/json", "X-Copilot-Code": code() }, body: JSON.stringify({ key: value }) });
                const body = await response.json().catch(() => ({}));
                if (response.ok) { await checkAccess(); return; }
                byId("cp-gate-message").textContent = { bad_key_format: "That doesn't look like an Anthropic API key.", bad_key: "Anthropic rejected that key.", key_check_failed: "Anthropic couldn't confirm that key. Check its credit and try again." }[body.error] || "That didn't work. Try again.";
            } catch { byId("cp-gate-message").textContent = "Couldn't reach the Copilot server. Try again."; }
        });
    }

    async function checkAccess() {
        if (!code()) { renderGate("code"); return; }
        try {
            const response = await fetch(`${API}/status`, { headers: { "X-Copilot-Code": code() } });
            if (response.status === 401) { store.remove(CODE_KEY); renderGate("code", "That access code is wrong."); return; }
            if (!response.ok) throw new Error(String(response.status));
            ready = (await response.json()).ready;
            renderGate(ready ? "ready" : "key");
            if (ready) renderChat();
        } catch {
            renderGate("code", "Couldn't reach the Copilot server. Try again.");
        }
    }

    // ---- Events
    document.addEventListener("click", event => {
        const pick = event.target.closest("[data-cp-pick]");
        if (pick) { selected = pick.dataset.cpPick; renderShortlist(); renderBrief(); byId("cp-brief").scrollIntoView({ block: "nearest" }); return; }
        const switchTab = event.target.closest("[data-cp-tab]");
        if (switchTab) { tab = switchTab.dataset.cpTab; renderShortlist(); return; }
        const suggest = event.target.closest("[data-cp-suggest]");
        if (suggest) { ask(suggest.dataset.cpSuggest); return; }
        const askBtn = event.target.closest("[data-cp-ask]");
        if (askBtn) { ask(`Analyse ${askBtn.dataset.cpAsk} for me. Give me your view, the levels you'd use and the case against it.`); byId("cp-chat-panel").scrollIntoView({ block: "nearest" }); return; }
        if (event.target.closest("#cp-clear")) { messages = []; saveChat(); renderChat(); byId("cp-chat-message").textContent = ""; }
    });

    async function init() {
        S.initTopbarControls();
        loadChat();
        byId("cp-form").addEventListener("submit", event => { event.preventDefault(); ask(byId("cp-input").value); });
        byId("cp-input").addEventListener("keydown", event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(byId("cp-input").value); } });
        byId("cp-search").addEventListener("input", event => { search = event.target.value; renderShortlist(); });
        const [feedResult, evidenceResult] = await Promise.allSettled([loadJson("data/copilot.json"), loadJson("data/copilot-evidence.json")]);
        if (feedResult.status === "fulfilled") feed = feedResult.value;
        if (evidenceResult.status === "fulfilled") evidence = evidenceResult.value;
        renderStatus();
        renderEvidence();
        renderShortlist();
        renderBrief();
        await checkAccess();
    }
    init();
})();
