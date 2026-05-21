const WATCHLIST_IDS = [
    "cardano",
    "binancecoin",
    "bitcoin",
    "dogecoin",
    "polkadot",
    "ethereum",
    "litecoin",
    "stellar",
    "theta-token"
];

const FALLBACK_MARKETS = [
    { id: "bitcoin", name: "Bitcoin", symbol: "btc", current_price: 110537.56, market_cap: 2200000000000, total_volume: 38100000000, price_change_percentage_24h: -0.08, price_change_percentage_1h_in_currency: 0.16, image: "" },
    { id: "ethereum", name: "Ethereum", symbol: "eth", current_price: 3068.5, market_cap: 363100000000, total_volume: 17100000000, price_change_percentage_24h: -0.41, price_change_percentage_1h_in_currency: 0.11, image: "" },
    { id: "binancecoin", name: "BNB", symbol: "bnb", current_price: 941.81, market_cap: 123700000000, total_volume: 1600000000, price_change_percentage_24h: 1.1, price_change_percentage_1h_in_currency: 0.23, image: "" },
    { id: "dogecoin", name: "Dogecoin", symbol: "doge", current_price: 0.151801, market_cap: 25200000000, total_volume: 1000000000, price_change_percentage_24h: 1.2, price_change_percentage_1h_in_currency: 0.38, image: "" },
    { id: "cardano", name: "Cardano", symbol: "ada", current_price: 0.358968, market_cap: 12800000000, total_volume: 514000000, price_change_percentage_24h: -0.41, price_change_percentage_1h_in_currency: -0.08, image: "" },
    { id: "stellar", name: "Stellar", symbol: "xlm", current_price: 0.208954, market_cap: 6900000000, total_volume: 151100000, price_change_percentage_24h: 1.24, price_change_percentage_1h_in_currency: 0.32, image: "" },
    { id: "litecoin", name: "Litecoin", symbol: "ltc", current_price: 77.95, market_cap: 5900000000, total_volume: 346700000, price_change_percentage_24h: -0.44, price_change_percentage_1h_in_currency: -0.04, image: "" },
    { id: "polkadot", name: "Polkadot", symbol: "dot", current_price: 1.83, market_cap: 3000000000, total_volume: 137400000, price_change_percentage_24h: 1.96, price_change_percentage_1h_in_currency: 0.51, image: "" },
    { id: "theta-token", name: "Theta", symbol: "theta", current_price: 0.294, market_cap: 289600000, total_volume: 13000000, price_change_percentage_24h: 2.12, price_change_percentage_1h_in_currency: 0.62, image: "" }
];

const HOLDINGS = [
    { id: "bitcoin", symbol: "BTC", balance: 0.0001393 },
    { id: "litecoin", symbol: "LTC", balance: 0 },
    { id: "ethereum", symbol: "ETH", balance: 0 },
    { id: "ethereum-classic", symbol: "ETC", balance: 0 },
    { id: "binancecoin", symbol: "BNB", balance: 0 },
    { id: "tellor", symbol: "TRB", balance: 0 }
];

const page = document.body.dataset.page;
let selectedAssetId = null;

const compactMoney = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    notation: "compact",
    maximumFractionDigits: 1
});

function formatPrice(value) {
    if (!Number.isFinite(value)) return "$0.00";
    return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: value >= 1 ? 2 : 6,
        maximumFractionDigits: value >= 1 ? 2 : 6
    }).format(value);
}

function formatBig(value) {
    if (!Number.isFinite(value)) return "$0.00";
    return compactMoney.format(value);
}

function formatPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "0.00%";
    return `${numeric.toFixed(2)}%`;
}

function percentClass(value) {
    const numeric = Number(value);
    if (numeric > 0) return "positive";
    if (numeric < 0) return "negative";
    return "neutral";
}

function byId(markets, id) {
    return markets.find(item => item.id === id);
}

function coinspotUrl(coin) {
    const symbol = coin.symbol ? coin.symbol.toUpperCase() : "";
    return `https://www.coinspot.com.au/buy/${symbol}`;
}

function coinCell(coin) {
    const icon = coin.image
        ? `<img class="coin-icon" src="${coin.image}" alt="">`
        : `<span class="coin-icon"></span>`;
    return `<span class="coin">${icon}${coin.name}</span>`;
}

function setStatus(message, isLive = true) {
    document.querySelectorAll("#market-status").forEach(el => {
        el.textContent = message;
    });
    document.querySelectorAll(".status-dot").forEach(el => {
        el.style.background = isLive ? "var(--green)" : "var(--orange)";
    });
}

async function getMarkets() {
    const params = new URLSearchParams({
        vs_currency: "aud",
        order: "market_cap_desc",
        per_page: "100",
        page: "1",
        sparkline: "true",
        price_change_percentage: "1h,24h"
    });

    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?${params.toString()}`, {
            headers: { "accept": "application/json" },
            cache: "no-store"
        });
        if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
        const data = await response.json();
        setStatus(`Live data updated ${new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`);
        return Array.isArray(data) && data.length ? data : FALLBACK_MARKETS;
    } catch (error) {
        setStatus("Live API unavailable - showing fallback snapshot", false);
        return FALLBACK_MARKETS;
    }
}

function sellPrice(price) {
    return price * 0.99015;
}

function renderChart(coin) {
    const svg = document.getElementById("portfolio-chart");
    if (!svg) return;
    const prices = coin?.sparkline_in_7d?.price?.slice(-32) || [12, 12.4, 12.8, 13, 13.4, 14.2, 14.8, 15.1, 15.4];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const width = 420;
    const height = 172;
    const padX = 28;
    const padTop = 20;
    const padBottom = 24;
    const plotW = width - 56;
    const plotH = height - padTop - padBottom;
    const points = prices.map((price, index) => {
        const x = padX + (index / Math.max(prices.length - 1, 1)) * plotW;
        const y = padTop + (1 - ((price - min) / Math.max(max - min, 0.000001))) * plotH;
        return [x, y];
    });
    const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const area = `${line} L${points[points.length - 1][0].toFixed(1)} ${height - padBottom} L${padX} ${height - padBottom} Z`;

    svg.innerHTML = `
        <line x1="28" y1="24" x2="392" y2="24" stroke="#edf1f4"/>
        <line x1="28" y1="55" x2="392" y2="55" stroke="#edf1f4"/>
        <line x1="28" y1="86" x2="392" y2="86" stroke="#edf1f4"/>
        <line x1="28" y1="117" x2="392" y2="117" stroke="#edf1f4"/>
        <line x1="28" y1="148" x2="392" y2="148" stroke="#edf1f4"/>
        <path d="${area}" fill="rgba(8,120,186,0.10)"/>
        <path d="${line}" fill="none" stroke="#0878ba" stroke-width="3"/>
        <text x="30" y="166" fill="#8794a0" font-size="11">7D</text>
        <text x="180" y="166" fill="#8794a0" font-size="11">Live AUD</text>
        <text x="342" y="166" fill="#8794a0" font-size="11">Now</text>
    `;
}

function renderDashboard(model) {
    const { markets, rankedAssets } = model;
    const watchlist = rankedAssets.filter(item => WATCHLIST_IDS.includes(item.coin.id));
    const opportunityRows = rankedAssets.slice(0, 10);
    const selected = rankedAssets.find(item => item.coin.id === selectedAssetId);
    const btc = byId(markets, "bitcoin") || watchlist[0]?.coin;
    const portfolioValue = HOLDINGS.reduce((total, holding) => {
        const coin = byId(markets, holding.id);
        return total + (coin ? coin.current_price * holding.balance : 0);
    }, 0);

    document.getElementById("opportunities-body").innerHTML = opportunityRows.map(item => `
        <tr class="${item.coin.id === selectedAssetId ? "selected-row" : ""}">
            <td>${coinCell(item.coin)}</td>
            <td><span class="badge ${item.decision.klass}">${item.decision.label}</span></td>
            <td class="num">${item.decision.score}</td>
            <td class="num">${formatPrice(item.coin.current_price)}</td>
            <td class="num ${percentClass(item.coin.price_change_percentage_1h_in_currency)}">${formatPercent(item.coin.price_change_percentage_1h_in_currency)}</td>
            <td class="num ${percentClass(item.coin.price_change_percentage_24h)}">${formatPercent(item.coin.price_change_percentage_24h)}</td>
            <td><button class="table-action" type="button" data-asset-id="${item.coin.id}">Analyse</button></td>
        </tr>
    `).join("");

    document.getElementById("analysis-panel").innerHTML = selected ? `
            <div class="analysis-heading">
                ${coinCell(selected.coin)}
                <span class="badge ${selected.decision.klass}">${selected.decision.label}</span>
            </div>
            <dl class="metric-grid">
                <div><dt>Score</dt><dd>${selected.decision.score}</dd></div>
                <div><dt>Price</dt><dd>${formatPrice(selected.coin.current_price)}</dd></div>
                <div><dt>1hr</dt><dd class="${percentClass(selected.coin.price_change_percentage_1h_in_currency)}">${formatPercent(selected.coin.price_change_percentage_1h_in_currency)}</dd></div>
                <div><dt>24hr</dt><dd class="${percentClass(selected.coin.price_change_percentage_24h)}">${formatPercent(selected.coin.price_change_percentage_24h)}</dd></div>
                <div><dt>Volume</dt><dd>${formatBig(selected.coin.total_volume)}</dd></div>
                <div><dt>Sell Est.</dt><dd>${formatPrice(sellPrice(selected.coin.current_price))}</dd></div>
            </dl>
            <div class="execution-bar">
                <span>Execution opens only for the selected asset.</span>
                <a class="button-primary" href="${coinspotUrl(selected.coin)}" target="_blank" rel="noopener noreferrer">Open CoinSpot</a>
            </div>
        ` : `<div class="empty-analysis">Select an asset from the opportunity queue to inspect price action, score context, and execution.</div>`;

    document.querySelectorAll("[data-asset-id]").forEach(button => {
        button.addEventListener("click", event => {
            selectedAssetId = event.currentTarget.dataset.assetId;
            renderDashboard(model);
        });
    });

    document.getElementById("watchlist-body").innerHTML = watchlist.map(item => `
        <tr>
            <td>${coinCell(item.coin)}</td>
            <td><span class="badge ${item.decision.klass}">${item.decision.label}</span></td>
            <td class="num">${item.decision.score}</td>
            <td class="num">${formatPrice(item.coin.current_price)}</td>
            <td class="num">${formatPrice(sellPrice(item.coin.current_price))}</td>
            <td class="num ${percentClass(item.coin.price_change_percentage_24h)}">${formatPercent(item.coin.price_change_percentage_24h)}</td>
        </tr>
    `).join("");

    document.getElementById("wallets-body").innerHTML = HOLDINGS.map(holding => {
        const coin = byId(markets, holding.id) || { name: holding.symbol, current_price: 0, image: "" };
        return `
            <tr>
                <td>${coinCell({ ...coin, name: coin.name || holding.symbol })}</td>
                <td class="num">${holding.balance}</td>
                <td class="num">${formatPrice(holding.balance * (coin.current_price || 0))}</td>
            </tr>
        `;
    }).join("");

    document.getElementById("portfolio-value").textContent = formatPrice(portfolioValue);
    document.getElementById("holdings-body").innerHTML = `
        <tr><td>${coinCell({ ...btc, name: "BTC" })}</td><td class="num">${formatPrice(portfolioValue)}</td></tr>
    `;
    renderChart(btc);

    const highVolume = [...markets].sort((a, b) => b.total_volume - a.total_volume).slice(0, 8);
    document.getElementById("popular-now").innerHTML = highVolume.map(tile).join("");

    const recent = [...markets].sort((a, b) =>
        Math.abs(b.price_change_percentage_1h_in_currency || 0) - Math.abs(a.price_change_percentage_1h_in_currency || 0)
    ).slice(0, 6);
    document.getElementById("recent-movers-body").innerHTML = recent.map(coin => `
        <tr>
            <td>${coinCell(coin)}</td>
            <td class="num">${formatPrice(coin.current_price)}</td>
            <td class="num ${percentClass(coin.price_change_percentage_1h_in_currency)}">${formatPercent(coin.price_change_percentage_1h_in_currency)}</td>
        </tr>
    `).join("");

    renderTodayMovers(markets);
}

function renderTodayMovers(markets) {
    const sorted = [...markets].filter(coin => Number.isFinite(coin.price_change_percentage_24h));
    const up = sorted.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 5);
    const down = [...sorted].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 5);
    const row = coin => `
        <tr>
            <td>${coinCell(coin)}</td>
            <td class="num">${formatPrice(coin.current_price)}</td>
            <td class="num ${percentClass(coin.price_change_percentage_24h)}">${formatPercent(coin.price_change_percentage_24h)}</td>
        </tr>
    `;
    document.getElementById("today-up-body").innerHTML = up.map(row).join("");
    document.getElementById("today-down-body").innerHTML = down.map(row).join("");
}

function tile(coin) {
    return `
        <span class="coin-tile">
            ${coin.image ? `<img class="coin-icon" src="${coin.image}" alt="">` : `<span class="coin-icon"></span>`}
            <span>${coin.symbol.toUpperCase()}</span>
        </span>
    `;
}

function marketStateFor(coin, volumeThreshold) {
    const oneHour = Number(coin.price_change_percentage_1h_in_currency) || 0;
    const day = Number(coin.price_change_percentage_24h) || 0;
    const volume = Number(coin.total_volume) || 0;
    const absoluteMove = Math.abs(day);
    const momentumScore = Math.round((day * 12) + (oneHour * 30) + Math.min(volume / Math.max(volumeThreshold, 1), 2) * 10);
    const trendState = day >= 5 && oneHour > 0
        ? "trend_breakout"
        : day <= -3
            ? "trend_downside"
            : day >= 2
                ? "trend_positive"
                : day <= -1
                    ? "trend_softening"
                    : "trend_neutral";
    const volatilityState = absoluteMove >= 5
        ? "volatility_high"
        : absoluteMove >= 2
            ? "volatility_medium"
            : "volatility_low";
    const alertTrigger = trendState === "trend_breakout"
        ? "breakout_event"
        : trendState === "trend_downside"
            ? "risk_threshold_breach"
            : volume >= volumeThreshold
                ? "volume_spike"
                : "none";

    return { trendState, momentumScore, volatilityState, alertTrigger };
}

function decisionForState(state) {
    if (state.trendState === "trend_breakout") return { label: "Breakout", klass: "strong", score: state.momentumScore };
    if (state.trendState === "trend_downside") return { label: "Sell Risk", klass: "sell", score: state.momentumScore };
    if (state.trendState === "trend_positive") return { label: "Watch", klass: "watch", score: state.momentumScore };
    return { label: "Watch", klass: "wait", score: state.momentumScore };
}

function eventForState(item) {
    const eventMap = {
        breakout_event: { type: "Breakout Event", klass: "strong", value: item.coin.price_change_percentage_24h, rule: "24hr above 5% with positive 1hr", triggerState: "breakout_event" },
        risk_threshold_breach: { type: "Sell Risk", klass: "risk", value: item.coin.price_change_percentage_24h, rule: "24hr below -3%", triggerState: "risk_threshold_breach" },
        volume_spike: { type: "Volume Spike", klass: "volume", value: item.coin.total_volume, rule: "Top live AUD volume band", triggerState: "volume_spike" }
    };
    if (item.state.trendState === "trend_positive") {
        return { type: "Watch Event", klass: "watch", value: item.coin.price_change_percentage_24h, rule: "24hr above 2%", triggerState: "trend_positive" };
    }
    return eventMap[item.state.alertTrigger] || null;
}

function buildDecisionPipeline(markets) {
    const safeMarkets = Array.isArray(markets) ? markets : FALLBACK_MARKETS;
    const volumeThreshold = [...safeMarkets]
        .map(coin => Number(coin.total_volume) || 0)
        .sort((a, b) => b - a)[4] || 0;
    const assets = safeMarkets.map(coin => {
        const state = marketStateFor(coin, volumeThreshold);
        return { coin, state, decision: decisionForState(state) };
    });
    const rankedAssets = [...assets].sort((a, b) => b.decision.score - a.decision.score);
    const alertEvents = assets
        .map(item => ({ item, event: eventForState(item) }))
        .filter(row => row.event)
        .sort((a, b) => {
            const eventOrder = { "Sell Risk": 0, "Breakout Event": 1, "Watch Event": 2, "Volume Spike": 3 };
            return eventOrder[a.event.type] - eventOrder[b.event.type] || Math.abs(b.event.value) - Math.abs(a.event.value);
        });

    return { markets: safeMarkets, assets, rankedAssets, alertEvents };
}

function observationFor(item) {
    const signalMap = {
        trend_breakout: { label: "Breakout", klass: "strong", note: "24hr breakout threshold met with positive 1hr confirmation." },
        trend_positive: { label: "Watch", klass: "watch", note: "24hr watch threshold met." },
        trend_downside: { label: "Sell Risk", klass: "sell", note: "24hr downside threshold met." },
        trend_softening: { label: "Softening", klass: "wait", note: "24hr change is below neutral band." },
        trend_neutral: { label: "Neutral", klass: "wait", note: "No threshold state transition." }
    };
    if (item.state.alertTrigger === "volume_spike" && item.state.trendState === "trend_neutral") {
        return { label: "Volume Spike", klass: "volume", note: "Asset is inside the top live AUD volume band." };
    }
    return signalMap[item.state.trendState] || signalMap.trend_neutral;
}

function renderLogs(model) {
    const rows = model.assets.slice(0, 16).map(item => {
        const observation = observationFor(item);
        return `
            <tr>
                <td>${new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Brisbane" })}</td>
                <td>${coinCell(item.coin)}</td>
                <td class="num">${formatPrice(item.coin.current_price)}</td>
                <td class="num ${percentClass(item.coin.price_change_percentage_1h_in_currency)}">${formatPercent(item.coin.price_change_percentage_1h_in_currency)}</td>
                <td class="num ${percentClass(item.coin.price_change_percentage_24h)}">${formatPercent(item.coin.price_change_percentage_24h)}</td>
                <td><span class="badge ${observation.klass}">${observation.label}</span></td>
                <td>${observation.note}</td>
            </tr>
        `;
    }).join("");
    document.getElementById("logs-body").innerHTML = rows;

    const { markets } = model;
    const watchlist = WATCHLIST_IDS.map(id => byId(markets, id)).filter(Boolean);
    document.getElementById("logs-watchlist-body").innerHTML = watchlist.map(coin => `
        <tr>
            <td>${coinCell(coin)}</td>
            <td class="num">${formatPrice(coin.current_price)}</td>
            <td class="num">${formatPrice(sellPrice(coin.current_price))}</td>
            <td class="num">${formatBig(coin.total_volume)}</td>
            <td class="num ${percentClass(coin.price_change_percentage_24h)}">${formatPercent(coin.price_change_percentage_24h)}</td>
        </tr>
    `).join("");
}

function renderAlerts(model) {
    const rows = model.alertEvents.slice(0, 18).map(({ item, event }) => `
            <tr>
                <td><span class="badge ${event.klass}">${event.type}</span></td>
                <td>${coinCell(item.coin)}</td>
                <td><span class="state-token">${event.triggerState}</span></td>
                <td class="num">${event.type === "Volume Spike" ? formatBig(event.value) : formatPercent(event.value)}</td>
                <td class="num">${formatPrice(item.coin.current_price)}</td>
                <td>${event.rule}</td>
            </tr>
    `).join("");
    document.getElementById("alerts-body").innerHTML = rows || `<tr><td colspan="6" class="loading-cell">No threshold events in the current market state.</td></tr>`;
}

async function boot() {
    const markets = await getMarkets();
    const model = buildDecisionPipeline(markets);
    if (page === "dashboard") renderDashboard(model);
    if (page === "logs") renderLogs(model);
    if (page === "alerts") renderAlerts(model);
}

boot();
setInterval(boot, 60000);
