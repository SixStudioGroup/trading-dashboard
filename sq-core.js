// SixQuant core: pure trading maths, data-age rules, trade lifecycle and backup
// helpers. No DOM access, so the same file runs in the browser (window.SQ) and
// in Node tests (scripts/test_core.mjs). Decision support only: nothing here
// places, routes or prepares an order.
(function (root, factory) {
    if (typeof module === "object" && module.exports) module.exports = factory();
    else root.SQ = factory();
})(typeof self !== "undefined" ? self : this, function () {
    const KEYS = {
        portalMode: "sixquant.portalMode.v1",
        hideValues: "sixquant.hideValues.v1",
        stockPlans: "sixquant.stocks.tradeJournal.v1",
        cryptoTrades: "sixquant.tradeJournal.v1",
        riskRules: "sixquant.riskRules.v1",
        feeDefaults: "sixquant.stocks.auBrokerDefaults.v2",
        account: "sixquant.account.v1",
        preImport: "sixquant.preImportBackup.v1",
        githubPat: "sixquant.githubPat.v1"
    };
    const DEFAULT_RULES = { maxPositionPct: 8, cashReservePct: 20, exitAlertPct: 8, maxOpenRiskPct: 6 };
    const DEFAULT_FEES = { brokerageFee: 5, feePercent: 0, spreadPercent: 0.10 };
    const DEFAULT_ACCOUNT = { accountValue: 0, riskPercent: 1, setupDone: false, lastBackupAt: "" };
    const GRADUATION = { minTrades: 30, minExpectancyR: 0, minAdherencePct: 90 };
    const SYDNEY = "Australia/Sydney";
    // Data for a session is expected on the feed from this Sydney hour onward.
    const SESSION_DATA_READY_HOUR = 17;

    const num = (value, fallback = 0) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    };
    const pos = value => Math.max(0, num(value));

    // ---- Sydney calendar -------------------------------------------------
    function sydneyParts(date) {
        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: SYDNEY, year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", hour12: false
        }).formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
        return {
            key: `${parts.year}-${parts.month}-${parts.day}`,
            hour: Number(parts.hour === "24" ? "0" : parts.hour),
            minute: Number(parts.minute)
        };
    }
    function shiftDay(key, days) {
        const d = new Date(`${key}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() + days);
        return d.toISOString().slice(0, 10);
    }
    function isTradingDay(key, holidays = []) {
        const day = new Date(`${key}T12:00:00Z`).getUTCDay();
        return day !== 0 && day !== 6 && !holidays.includes(key);
    }
    // Latest session whose closing data should be on the feed by `now`.
    function expectedSession(now, holidays = []) {
        const { key, hour } = sydneyParts(now);
        let cursor = isTradingDay(key, holidays) && hour >= SESSION_DATA_READY_HOUR ? key : shiftDay(key, -1);
        while (!isTradingDay(cursor, holidays)) cursor = shiftDay(cursor, -1);
        return cursor;
    }
    function sessionsBehind(lastSession, expected, holidays = []) {
        if (!lastSession) return Infinity;
        let count = 0;
        let cursor = lastSession;
        while (cursor < expected && count < 400) {
            cursor = shiftDay(cursor, 1);
            if (isTradingDay(cursor, holidays)) count += 1;
        }
        return count;
    }
    function formatSessionDate(key) {
        if (!key) return "unknown";
        return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
    }
    function formatAge(hours) {
        if (!Number.isFinite(hours)) return "unknown age";
        if (hours < 1) return "under 1h old";
        if (hours < 48) return `${Math.round(hours)}h old`;
        return `${Math.round(hours / 24)} days old`;
    }

    // ---- Data trust -------------------------------------------------------
    // state: current | behind | stale | offline. Only stale/offline block plans.
    function asxFreshness(feed, now = new Date()) {
        const assets = Array.isArray(feed?.assets) ? feed.assets : [];
        if (!assets.length || feed?.mode === "offline") {
            return { state: "offline", blocks: true, label: "ASX data offline", detail: "No feed is available. Do not plan from this page." };
        }
        const holidays = Array.isArray(feed.asxHolidays) ? feed.asxHolidays : [];
        const lastSession = feed.lastSessionDate || "";
        const expected = expectedSession(now, holidays);
        const behind = sessionsBehind(lastSession, expected, holidays);
        const { key: todayKey, hour } = sydneyParts(now);
        const intraday = lastSession === todayKey && hour < SESSION_DATA_READY_HOUR;
        const when = formatSessionDate(lastSession);
        if (!lastSession || behind >= 2) {
            return { state: "stale", blocks: true, lastSession, behind, label: `ASX data STALE: last close ${when}`, detail: `The feed is ${Number.isFinite(behind) ? behind : "several"} sessions behind. New plans are blocked until it refreshes.` };
        }
        if (behind === 1) {
            return { state: "behind", blocks: false, lastSession, behind, label: `ASX last close ${when}: next update pending`, detail: "Today's close has not reached the feed yet. Levels may be one session old." };
        }
        if (intraday) {
            return { state: "current", blocks: false, intraday: true, lastSession, behind: 0, label: `ASX part-session ${when}, delayed`, detail: "Today's bar is incomplete, so volume and signals are provisional until the close." };
        }
        return { state: "current", blocks: false, lastSession, behind: 0, label: `ASX last close ${when}, delayed`, detail: "End-of-day data. Confirm live price and spread at your broker before any order." };
    }
    function cryptoFreshness(lastUpdated, now = new Date()) {
        const at = new Date(lastUpdated);
        if (!lastUpdated || Number.isNaN(at.getTime())) {
            return { state: "offline", blocks: true, ageHours: Infinity, label: "Crypto data offline", detail: "The snapshot has no timestamp." };
        }
        const ageHours = (now.getTime() - at.getTime()) / 36e5;
        const age = formatAge(ageHours);
        if (ageHours > 24) return { state: "stale", blocks: true, ageHours, label: `Crypto snapshot STALE: ${age}`, detail: "Prices are too old to plan from. New plans are blocked." };
        if (ageHours > 12) return { state: "behind", blocks: false, ageHours, label: `Crypto snapshot ${age}: refresh overdue`, detail: "Expected a refresh within 12 hours." };
        return { state: "current", blocks: false, ageHours, label: `Crypto snapshot ${age}`, detail: "Refreshed about three times a day. This is never a live price." };
    }

    // ---- Sizing -----------------------------------------------------------
    // Fee-aware: a stop-out realises price risk plus round-trip costs, so both
    // must fit inside the risk budget. Then the position cap may cut it further.
    function sizePosition(input = {}) {
        const account = pos(input.account);
        const riskPercent = pos(input.riskPercent);
        const entry = pos(input.entry);
        const stop = pos(input.stop);
        const target = pos(input.target);
        const brokerageFee = pos(input.brokerageFee);
        const feePercent = pos(input.feePercent);
        const spreadPercent = pos(input.spreadPercent);
        const maxPositionPct = input.maxPositionPct === undefined ? DEFAULT_RULES.maxPositionPct : pos(input.maxPositionPct);
        const riskBudget = account * (riskPercent / 100);
        const perUnitRisk = entry > 0 && stop > 0 ? Math.max(0, entry - stop) : 0;
        const varRate = (2 * feePercent + spreadPercent) / 100;
        const fixedRoundTrip = 2 * brokerageFee;
        const denom = perUnitRisk + entry * varRate;
        const budgetAfterFixed = riskBudget - fixedRoundTrip;
        const riskUnits = perUnitRisk > 0 && denom > 0 && budgetAfterFixed > 0 ? Math.floor(budgetAfterFixed / denom) : 0;
        const capValue = account * (maxPositionPct / 100);
        const capUnits = entry > 0 ? Math.floor(capValue / entry) : 0;
        const units = Math.min(riskUnits, capUnits);
        const cappedByPosition = units > 0 && capUnits < riskUnits;
        const position = units * entry;
        const roundTripCost = units > 0 ? fixedRoundTrip + position * varRate : 0;
        const priceRisk = units * perUnitRisk;
        const worstCaseLoss = priceRisk + roundTripCost;
        const grossReward = target > entry ? units * (target - entry) : 0;
        const netReward = grossReward - roundTripCost;
        return {
            units, position, riskBudget, perUnitRisk, roundTripCost, priceRisk, worstCaseLoss,
            grossReward, netReward, cappedByPosition, capValue,
            rewardRisk: worstCaseLoss > 0 && target > entry ? netReward / worstCaseLoss : 0,
            breakeven: units > 0 ? entry + roundTripCost / units : 0,
            allocationPct: account > 0 ? (position / account) * 100 : 0,
            actualRiskPct: account > 0 ? (worstCaseLoss / account) * 100 : 0,
            costShareOfRisk: worstCaseLoss > 0 ? roundTripCost / worstCaseLoss : 0
        };
    }

    // ---- Trade lifecycle --------------------------------------------------
    // Records keep every field so nothing is lost across versions. Earlier stock
    // plans have no status: they load as "planned", never as filled trades.
    const STATUSES = ["planned", "open", "closed", "cancelled"];
    let idCounter = 0;
    function tradeId(prefix = "STOCK") {
        idCounter += 1;
        return `${prefix}-${Date.now().toString(36).toUpperCase()}-${idCounter}${Math.floor(Math.random() * 1296).toString(36).toUpperCase()}`;
    }
    function normalizeStockTrade(raw = {}) {
        const status = STATUSES.includes(raw.status) ? raw.status : "planned";
        return {
            ...raw,
            id: typeof raw.id === "string" && raw.id ? raw.id : tradeId(),
            assetClass: "stock",
            symbol: String(raw.symbol || "").trim().toUpperCase(),
            mode: raw.mode === "live" ? "live" : "paper",
            status,
            referencePrice: pos(raw.referencePrice ?? raw.entryPrice),
            invalidationPrice: pos(raw.invalidationPrice),
            targetPrice: pos(raw.targetPrice),
            units: pos(raw.units),
            positionSize: pos(raw.positionSize ?? raw.allocation),
            recordedAt: raw.recordedAt || new Date().toISOString()
        };
    }
    function markEntered(trade, { fillPrice, units, fillDate } = {}) {
        const price = pos(fillPrice);
        const qty = pos(units) || pos(trade.units);
        if (!(price > 0) || !(qty > 0)) return { error: "Enter the fill price and number of shares." };
        return { trade: { ...trade, status: "open", fillPrice: price, units: qty, positionSize: price * qty, fillDate: fillDate || new Date().toISOString() } };
    }
    function closeResult(input = {}) {
        const entry = pos(input.entry);
        const units = pos(input.units);
        const exit = pos(input.exit);
        const fees = pos(input.fees);
        const stop = pos(input.stop);
        const gross = (exit - entry) * units;
        const net = gross - fees;
        const risk = stop > 0 && entry > stop ? (entry - stop) * units : 0;
        const cost = entry * units;
        return {
            grossAud: gross,
            resultAud: net,
            resultPercent: cost > 0 ? (net / cost) * 100 : 0,
            rMultiple: risk > 0 ? net / risk : null
        };
    }
    function estimatedFees(position, fees = DEFAULT_FEES) {
        return 2 * pos(fees.brokerageFee) + pos(position) * ((2 * pos(fees.feePercent) + pos(fees.spreadPercent)) / 100);
    }
    function closeTrade(trade, { exitPrice, exitDate, feesPaid, exitReason, ruleFollowed, mistakeType, lessonLearned } = {}) {
        const exit = pos(exitPrice);
        if (trade.status !== "open") return { error: "Only an open trade can be closed." };
        if (!(exit > 0)) return { error: "Enter the exit price." };
        const entry = pos(trade.fillPrice) || pos(trade.referencePrice);
        const units = pos(trade.units);
        const position = entry * units;
        const fees = feesPaid === "" || feesPaid === undefined || feesPaid === null
            ? estimatedFees(position, { brokerageFee: trade.brokerageFee, feePercent: trade.feePercent, spreadPercent: trade.spreadPercent })
            : pos(feesPaid);
        return {
            trade: {
                ...trade,
                status: "closed",
                exitPrice: exit,
                exitDate: exitDate || new Date().toISOString(),
                feesPaid: fees,
                exitReason: exitReason || "Manual close",
                ruleFollowed: ruleFollowed === true,
                mistakeType: mistakeType || "None",
                lessonLearned: lessonLearned || "",
                ...closeResult({ entry, units, exit, fees, stop: trade.invalidationPrice })
            }
        };
    }
    // Position against the last known close. Delayed data: a prompt to check the
    // broker, never proof a stop was or was not hit.
    function positionStatus(trade, lastClose) {
        const entry = pos(trade.fillPrice) || pos(trade.referencePrice);
        const stop = pos(trade.invalidationPrice);
        const target = pos(trade.targetPrice);
        const price = pos(lastClose);
        if (!(price > 0)) return { state: "unknown", label: "No price", openR: null, stopDistancePct: null };
        const risk = entry - stop;
        const openR = risk > 0 ? (price - entry) / risk : null;
        const stopDistancePct = stop > 0 ? ((price - stop) / price) * 100 : null;
        if (stop > 0 && price <= stop) return { state: "stop", label: "Stop level breached", openR, stopDistancePct };
        if (target > 0 && price >= target) return { state: "target", label: "Target reached", openR, stopDistancePct };
        if (stopDistancePct !== null && stopDistancePct < 1) return { state: "near", label: "Near stop", openR, stopDistancePct };
        return { state: "ok", label: "In plan", openR, stopDistancePct };
    }

    // ---- Portfolio limits -------------------------------------------------
    function openExposure(trades = []) {
        return trades.filter(t => t.status === "open" || t.status === "planned").reduce((acc, t) => {
            const entry = pos(t.fillPrice) || pos(t.referencePrice);
            const units = pos(t.units);
            const stop = pos(t.invalidationPrice);
            acc.capital += entry * units;
            acc.risk += stop > 0 && entry > stop ? (entry - stop) * units : 0;
            acc.count += 1;
            return acc;
        }, { capital: 0, risk: 0, count: 0 });
    }

    // Checks the app can answer itself. Only "manual" items need the trader.
    function planChecks(plan = {}, ctx = {}) {
        const rules = { ...DEFAULT_RULES, ...(ctx.rules || {}) };
        const account = pos(plan.account);
        const size = plan.size || {};
        const entry = pos(plan.entry);
        const stop = pos(plan.stop);
        const target = pos(plan.target);
        const others = (ctx.trades || []).filter(t => t.status === "open" || t.status === "planned");
        const exposure = openExposure(others);
        const out = [];
        const add = (id, status, label, detail = "") => out.push({ id, status, label, detail });

        add("data", ctx.freshness?.blocks ? "fail" : ctx.freshness?.state === "behind" ? "warn" : "pass",
            "Data is recent enough", ctx.freshness?.label || "Unknown data state");
        add("thesis", String(plan.whyNow || "").trim().length >= 10 ? "pass" : "fail", "Thesis written in your own words", "At least a short sentence.");
        add("trigger", String(plan.trigger || "").trim() ? "pass" : "fail", "Entry trigger defined");
        add("stop", stop > 0 && entry > stop ? "pass" : "fail", "Stop is a price below entry");
        add("target", target > entry && entry > 0 ? "pass" : "fail", "Target is a price above entry");
        add("account", account > 0 ? "pass" : "fail", "Account value set");
        add("size", pos(size.units) > 0 ? "pass" : "fail", "Risk budget buys at least one share",
            pos(size.units) > 0 ? `${size.units} shares` : "Fees or the stop distance use up the whole risk budget.");
        if (size.cappedByPosition) add("cap", "pass", `Size cut to the ${rules.maxPositionPct}% position cap`, "You are risking less than your budget.");
        else add("cap", "pass", `Within the ${rules.maxPositionPct}% position cap`);
        const rr = num(size.rewardRisk);
        add("rr", rr >= 1.5 ? "pass" : "warn", "Reward at least 1.5x risk after costs", `${rr.toFixed(2)}R net`);
        const costShare = num(size.costShareOfRisk);
        add("fees", costShare > 0.25 ? "warn" : "pass", "Costs under 25% of the amount at risk", `${(costShare * 100).toFixed(0)}% of the loss if stopped`);
        const totalRisk = exposure.risk + pos(size.priceRisk);
        const riskPct = account > 0 ? (totalRisk / account) * 100 : 0;
        add("heat", riskPct <= rules.maxOpenRiskPct ? "pass" : "fail", `Open risk within ${rules.maxOpenRiskPct}% of account`, `${riskPct.toFixed(1)}% with this trade`);
        const capitalAfter = exposure.capital + pos(size.position);
        const maxCapital = account * (1 - rules.cashReservePct / 100);
        add("reserve", account > 0 && capitalAfter <= maxCapital ? "pass" : "fail", `Keeps the ${rules.cashReservePct}% cash reserve`, `${account > 0 ? ((capitalAfter / account) * 100).toFixed(0) : 0}% of account deployed`);
        const duplicate = others.some(t => t.symbol === String(plan.symbol || "").toUpperCase());
        add("duplicate", duplicate ? "fail" : "pass", "No other plan or position in this ticker");
        const sectorCount = others.filter(t => plan.sector && t.sector === plan.sector).length;
        add("sector", sectorCount >= 2 ? "warn" : "pass", "Not concentrated in one sector", plan.sector ? `${sectorCount} other in ${plan.sector}` : "");
        const stock = ctx.stock || {};
        if (num(stock.ma50) > 0) {
            add("trend", num(stock.price) >= num(stock.ma50) ? "pass" : "warn", "Price is above its 50-day average", `50-day ${num(stock.ma50).toFixed(2)}`);
        }
        if (stock.signalState === "Sell Risk") add("signal", "warn", "Signal is not Sell Risk", "Sell Risk showing on this ticker.");
        add("live-price", "manual", "Live price and spread checked at my broker");
        add("news", "manual", "Announcements and results dates checked");
        return out;
    }
    function checksPass(checks, manualDone = []) {
        return checks.every(c => c.status === "manual" ? manualDone.includes(c.id) : c.status !== "fail");
    }

    // ---- Review -----------------------------------------------------------
    function tradeStats(trades = []) {
        const closed = trades.filter(t => t.status === "closed");
        const withR = closed.filter(t => Number.isFinite(t.rMultiple));
        const wins = closed.filter(t => num(t.resultAud) > 0);
        const rs = withR.map(t => t.rMultiple);
        const sum = rs.reduce((a, b) => a + b, 0);
        const winRs = rs.filter(r => r > 0);
        const lossRs = rs.filter(r => r <= 0);
        let peak = 0;
        let equity = 0;
        let maxDrawdownR = 0;
        const ordered = [...withR].sort((a, b) => String(a.exitDate).localeCompare(String(b.exitDate)));
        ordered.forEach(t => {
            equity += t.rMultiple;
            peak = Math.max(peak, equity);
            maxDrawdownR = Math.max(maxDrawdownR, peak - equity);
        });
        const followed = closed.filter(t => t.ruleFollowed === true).length;
        return {
            count: closed.length,
            rCount: rs.length,
            winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
            expectancyR: rs.length ? sum / rs.length : 0,
            totalR: sum,
            avgWinR: winRs.length ? winRs.reduce((a, b) => a + b, 0) / winRs.length : 0,
            avgLossR: lossRs.length ? lossRs.reduce((a, b) => a + b, 0) / lossRs.length : 0,
            netAud: closed.reduce((a, t) => a + num(t.resultAud), 0),
            feesAud: closed.reduce((a, t) => a + num(t.feesPaid), 0),
            adherencePct: closed.length ? (followed / closed.length) * 100 : 0,
            maxDrawdownR,
            reliable: closed.length >= GRADUATION.minTrades
        };
    }
    function graduation(trades = []) {
        const paper = trades.filter(t => t.mode !== "live");
        const stats = tradeStats(paper);
        const criteria = [
            { label: `${GRADUATION.minTrades} closed paper trades`, met: stats.count >= GRADUATION.minTrades, value: `${stats.count} / ${GRADUATION.minTrades}` },
            { label: "Positive expectancy after costs", met: stats.rCount > 0 && stats.expectancyR > GRADUATION.minExpectancyR, value: stats.rCount ? `${stats.expectancyR.toFixed(2)}R` : "No data" },
            { label: `${GRADUATION.minAdherencePct}% of trades followed the plan`, met: stats.count > 0 && stats.adherencePct >= GRADUATION.minAdherencePct, value: stats.count ? `${stats.adherencePct.toFixed(0)}%` : "No data" }
        ];
        return { met: criteria.every(c => c.met), criteria, stats };
    }

    // ---- Chart ------------------------------------------------------------
    function movingAverage(values, period) {
        return values.map((_, i) => {
            if (i + 1 < period) return null;
            let total = 0;
            for (let j = i - period + 1; j <= i; j += 1) total += values[j];
            return total / period;
        });
    }
    // series: [[date, close], ...]. Returns inline SVG, or "" with too few points.
    function chartSvg(series, levels = {}, opts = {}) {
        const rows = Array.isArray(series) ? series.filter(r => Number.isFinite(r?.[1])) : [];
        if (rows.length < 2) return "";
        const width = opts.width || 520;
        const height = opts.height || 190;
        const padRight = 56;
        const padY = 10;
        const closes = rows.map(r => r[1]);
        const ma20 = movingAverage(closes, 20);
        const ma50 = movingAverage(closes, 50);
        const visible = closes.length > 90 ? closes.length - 90 : 0;
        const shown = closes.slice(visible);
        const lines = [levels.entry, levels.stop, levels.target].map(pos).filter(v => v > 0);
        const min = Math.min(...shown, ...lines);
        const max = Math.max(...shown, ...lines);
        const span = max - min || 1;
        const x = i => (i / (shown.length - 1)) * (width - padRight);
        const y = v => padY + (1 - (v - min) / span) * (height - padY * 2);
        const path = values => {
            let d = "";
            values.slice(visible).forEach((v, i) => {
                if (v === null) return;
                d += `${d ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
            });
            return d;
        };
        const level = (value, cls, label) => {
            const v = pos(value);
            if (!(v > 0)) return "";
            const yy = y(v).toFixed(1);
            return `<line class="sq-level ${cls}" x1="0" x2="${width - padRight}" y1="${yy}" y2="${yy}"/><text class="sq-level-text ${cls}" x="${width - padRight + 4}" y="${yy}" dy="3.5">${label} ${v.toFixed(2)}</text>`;
        };
        const lastDate = rows[rows.length - 1][0];
        const firstDate = rows[visible][0];
        return `<svg class="sq-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Closing prices ${firstDate} to ${lastDate} with 20 and 50 day averages">`
            + `<path class="sq-ma50" d="${path(ma50)}"/><path class="sq-ma20" d="${path(ma20)}"/><path class="sq-close" d="${path(closes)}"/>`
            + level(levels.target, "target", "T") + level(levels.entry, "entry", "E") + level(levels.stop, "stop", "S")
            + `</svg>`;
    }

    // ---- Backup -----------------------------------------------------------
    const BACKUP_SCHEMA = "sixquant.backup.v1";
    function backupKeyAllowed(key) {
        return key.startsWith("sixquant.") && key !== KEYS.githubPat && key !== KEYS.preImport && !key.includes("__");
    }
    function buildBackup(storage, now = new Date()) {
        const data = {};
        for (let i = 0; i < storage.length; i += 1) {
            const key = storage.key(i);
            if (backupKeyAllowed(key)) data[key] = storage.getItem(key);
        }
        return { schema: BACKUP_SCHEMA, exportedAt: now.toISOString(), data };
    }
    function parseBackup(text) {
        let parsed;
        try { parsed = JSON.parse(text); } catch { return { error: "This file is not valid JSON." }; }
        if (parsed?.schema !== BACKUP_SCHEMA || typeof parsed.data !== "object" || parsed.data === null) {
            return { error: "This is not a SixQuant backup file." };
        }
        const entries = Object.entries(parsed.data).filter(([key, value]) => backupKeyAllowed(key) && typeof value === "string");
        const countRows = key => {
            try { const rows = JSON.parse(parsed.data[key] || "[]"); return Array.isArray(rows) ? rows.length : 0; } catch { return 0; }
        };
        return { entries, exportedAt: parsed.exportedAt || "", stockTrades: countRows(KEYS.stockPlans), cryptoTrades: countRows(KEYS.cryptoTrades) };
    }
    function restoreBackup(storage, entries, now = new Date()) {
        storage.setItem(KEYS.preImport, JSON.stringify(buildBackup(storage, now)));
        entries.forEach(([key, value]) => storage.setItem(key, value));
        return entries.length;
    }
    function csvCell(value) {
        const text = value === null || value === undefined ? "" : String(value);
        // Leading = + - @ would run as a formula in a spreadsheet.
        const safe = /^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text) ? `'${text}` : text;
        return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    }
    const CSV_COLUMNS = ["id", "assetClass", "mode", "status", "symbol", "name", "state", "recordedAt", "fillDate", "fillPrice", "units", "positionSize", "referencePrice", "invalidationPrice", "targetPrice", "exitDate", "exitPrice", "feesPaid", "grossAud", "resultAud", "resultPercent", "rMultiple", "ruleFollowed", "mistakeType", "exitReason", "whyNow", "entryTrigger", "lessonLearned"];
    function tradesToCsv(trades = []) {
        return [CSV_COLUMNS.join(","), ...trades.map(t => CSV_COLUMNS.map(c => csvCell(t[c])).join(","))].join("\r\n");
    }

    return {
        KEYS, DEFAULT_RULES, DEFAULT_FEES, DEFAULT_ACCOUNT, GRADUATION,
        sydneyParts, expectedSession, sessionsBehind, isTradingDay, formatSessionDate, formatAge,
        asxFreshness, cryptoFreshness,
        sizePosition, estimatedFees,
        tradeId, normalizeStockTrade, markEntered, closeResult, closeTrade, positionStatus, openExposure,
        planChecks, checksPass, tradeStats, graduation,
        movingAverage, chartSvg,
        buildBackup, parseBackup, restoreBackup, tradesToCsv
    };
});
