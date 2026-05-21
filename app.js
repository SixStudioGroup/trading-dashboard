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

const FALLBACK_SPARKLINE = [12, 12.4, 12.8, 13, 13.4, 14.2, 14.8, 15.1, 15.4];
const FALLBACK_STATUS = "Live API unavailable - fallback snapshot";
let fallbackWarningShown = false;

const DEFAULT_HOLDINGS = [
    { symbol: "FET", name: "Artificial Superintelligence Alliance", balance: 0, note: "Default manual holding seed", updatedAt: "2026-05-22T00:00:00+10:00" }
];

const LEGACY_DEFAULT_HOLDINGS = [
    { symbol: "BTC", balance: 0.0001393, note: "Default sample holding" },
    { symbol: "LTC", balance: 0, note: "Default sample holding" },
    { symbol: "ETH", balance: 0, note: "Default sample holding" },
    { symbol: "ETC", balance: 0, note: "Default sample holding" },
    { symbol: "BNB", balance: 0, note: "Default sample holding" },
    { symbol: "TRB", balance: 0, note: "Default sample holding" }
];

const COINSPOT_SYMBOLS = {
    ADA: "https://www.coinspot.com.au/buy/ada",
    BNB: "https://www.coinspot.com.au/buy/bnb",
    BTC: "https://www.coinspot.com.au/buy/btc",
    DOGE: "https://www.coinspot.com.au/buy/doge",
    DOT: "https://www.coinspot.com.au/buy/dot",
    ETH: "https://www.coinspot.com.au/buy/eth",
    FET: "https://www.coinspot.com.au/buy/fet",
    LTC: "https://www.coinspot.com.au/buy/ltc",
    NEAR: "https://www.coinspot.com.au/buy/near",
    THETA: "https://www.coinspot.com.au/buy/theta",
    XLM: "https://www.coinspot.com.au/buy/xlm"
};

const page = document.body.dataset.page;
const HOLDINGS_STORAGE_KEY = "zencloud.manualHoldings.v1";
let holdingsStorageInitialized = false;
let usingDefaultHoldings = false;
let selectedAssetId = null;
let currentDashboardModel = null;
let manualHoldings = loadHoldings();

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

function finiteNumber(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function safeText(value, fallback) {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    }[char]));
}

function storageAvailable() {
    try {
        const key = "__zencloud_storage_test__";
        window.localStorage.setItem(key, key);
        window.localStorage.removeItem(key);
        return true;
    } catch (error) {
        return false;
    }
}

function normalizeHolding(holding = {}) {
    const symbol = safeText(holding.symbol, "").toUpperCase();
    const name = safeText(holding.name, symbol || "Unknown Asset");
    return {
        symbol,
        name,
        balance: Math.max(0, finiteNumber(holding.balance)),
        note: safeText(holding.note, ""),
        updatedAt: safeText(holding.updatedAt, new Date().toISOString())
    };
}

function defaultHoldings() {
    return DEFAULT_HOLDINGS.map(normalizeHolding);
}

function isDefaultSampleSet(holdings) {
    if (!Array.isArray(holdings) || holdings.length !== DEFAULT_HOLDINGS.length) return false;
    const defaults = defaultHoldings();
    return defaults.every(defaultHolding => {
        const match = holdings.find(holding => holding.symbol === defaultHolding.symbol);
        return match
            && match.note === defaultHolding.note
            && match.balance === defaultHolding.balance;
    });
}

function isLegacyDefaultSampleSet(holdings) {
    if (!Array.isArray(holdings) || holdings.length !== LEGACY_DEFAULT_HOLDINGS.length) return false;
    return LEGACY_DEFAULT_HOLDINGS.every(defaultHolding => {
        const match = holdings.find(holding => holding.symbol === defaultHolding.symbol);
        return match
            && match.note === defaultHolding.note
            && match.balance === defaultHolding.balance;
    });
}

function loadHoldings() {
    if (!storageAvailable()) {
        usingDefaultHoldings = true;
        return defaultHoldings();
    }
    try {
        const stored = window.localStorage.getItem(HOLDINGS_STORAGE_KEY);
        if (stored === null) {
            usingDefaultHoldings = true;
            return defaultHoldings();
        }
        holdingsStorageInitialized = true;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
            const normalized = parsed.map(normalizeHolding).filter(holding => holding.symbol);
            if (isLegacyDefaultSampleSet(normalized)) {
                usingDefaultHoldings = true;
                return defaultHoldings();
            }
            usingDefaultHoldings = false;
            return normalized;
        }
        usingDefaultHoldings = true;
        return defaultHoldings();
    } catch (error) {
        usingDefaultHoldings = true;
        return defaultHoldings();
    }
}

function saveHoldings(holdings) {
    manualHoldings = Array.isArray(holdings)
        ? holdings.map(normalizeHolding).filter(holding => holding.symbol)
        : [];
    holdingsStorageInitialized = true;
    usingDefaultHoldings = false;
    if (storageAvailable()) {
        try {
            window.localStorage.setItem(HOLDINGS_STORAGE_KEY, JSON.stringify(manualHoldings));
        } catch (error) {
            setHoldingsMessage("Holdings updated for this session only.");
        }
    }
}

function setHoldingsMessage(message, isError = false) {
    const el = document.getElementById("holdings-message");
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("error", isError);
}

function formatBalance(value) {
    const numeric = finiteNumber(value);
    return numeric.toLocaleString("en-AU", { maximumFractionDigits: 10 });
}

function formatTimestamp(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not recorded";
    return date.toLocaleString("en-AU", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function percentClass(value) {
    const numeric = Number(value);
    if (numeric > 0) return "positive";
    if (numeric < 0) return "negative";
    return "neutral";
}

function byId(markets, id) {
    return Array.isArray(markets) ? markets.find(item => item.id === id) : undefined;
}

function marketForHolding(markets, holding) {
    const symbol = safeText(holding.symbol, "").toLowerCase();
    const name = safeText(holding.name, "").toLowerCase();
    if (!Array.isArray(markets)) return null;
    return markets.find(coin => coin.symbol.toLowerCase() === symbol)
        || markets.find(coin => coin.id.toLowerCase() === symbol || coin.id.toLowerCase() === name)
        || markets.find(coin => coin.name.toLowerCase() === name)
        || null;
}

function holdingDisplayCoin(markets, holding) {
    const market = marketForHolding(markets, holding);
    return market || {
        id: holding.symbol.toLowerCase(),
        symbol: holding.symbol.toLowerCase(),
        name: holding.name,
        current_price: 0,
        market_cap: 0,
        total_volume: 0,
        price_change_percentage_24h: 0,
        price_change_percentage_1h_in_currency: 0,
        image: "",
        sparkline_in_7d: { price: FALLBACK_SPARKLINE }
    };
}

function holdingValuation(markets, holding) {
    const market = marketForHolding(markets, holding);
    if (!market || !Number.isFinite(market.current_price) || market.current_price <= 0) {
        return { market: null, value: null };
    }
    return { market, value: holding.balance * market.current_price };
}

function coinspotUrl(coin) {
    const symbol = safeText(coin?.symbol, "").toUpperCase();
    return COINSPOT_SYMBOLS[symbol] || null;
}

function coinspotStatus(coin) {
    return coinspotUrl(coin) ? "Supported" : "Watch only";
}

function coinCell(coin) {
    const safeCoin = normalizeMarket(coin);
    const icon = safeCoin.image
        ? `<img class="coin-icon" src="${safeCoin.image}" alt="">`
        : `<span class="coin-icon"></span>`;
    return `<span class="coin">${icon}${escapeHtml(safeCoin.name)}</span>`;
}

function normalizeSparkline(coin) {
    const prices = coin?.sparkline_in_7d?.price;
    if (!Array.isArray(prices)) return { price: FALLBACK_SPARKLINE };
    const cleanPrices = prices.map(value => Number(value)).filter(Number.isFinite);
    return { price: cleanPrices.length ? cleanPrices : FALLBACK_SPARKLINE };
}

function normalizeMarket(coin = {}, index = 0) {
    const idSeed = safeText(coin.id, safeText(coin.symbol, `asset-${index}`)).toLowerCase();
    const symbol = safeText(coin.symbol, idSeed || `asset-${index}`).toLowerCase();
    const name = safeText(coin.name, symbol.toUpperCase());
    return {
        ...coin,
        id: idSeed,
        name,
        symbol,
        current_price: finiteNumber(coin.current_price),
        market_cap: finiteNumber(coin.market_cap),
        total_volume: finiteNumber(coin.total_volume),
        price_change_percentage_24h: finiteNumber(coin.price_change_percentage_24h),
        price_change_percentage_1h_in_currency: finiteNumber(coin.price_change_percentage_1h_in_currency),
        image: typeof coin.image === "string" ? coin.image : "",
        sparkline_in_7d: normalizeSparkline(coin)
    };
}

function normalizeMarkets(markets) {
    const source = Array.isArray(markets) && markets.length ? markets : FALLBACK_MARKETS;
    return source.map(normalizeMarket);
}

function fallbackMarkets() {
    return normalizeMarkets(FALLBACK_MARKETS);
}

function warnFallbackOnce() {
    if (fallbackWarningShown) return;
    fallbackWarningShown = true;
    console.warn("Live API unavailable; rendering fallback snapshot.");
}

function shouldForceFallback() {
    return new URLSearchParams(window.location.search).has("forceFallback");
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
        per_page: "250",
        page: "1",
        sparkline: "true",
        price_change_percentage: "1h,24h"
    });

    try {
        if (shouldForceFallback()) throw new Error("Forced fallback snapshot");
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?${params.toString()}`, {
            headers: { "accept": "application/json" },
            cache: "no-store"
        });
        if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data) || !data.length) throw new Error("Empty market payload");
        setStatus(`Live data updated ${new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`);
        return normalizeMarkets(data);
    } catch (error) {
        warnFallbackOnce();
        setStatus(FALLBACK_STATUS, false);
        return fallbackMarkets();
    }
}

function sellPrice(price) {
    return finiteNumber(price) * 0.99015;
}

function renderChart(coin) {
    const svg = document.getElementById("portfolio-chart");
    if (!svg) return;
    const prices = normalizeSparkline(coin).price.slice(-32);
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
    currentDashboardModel = model;
    const { markets, rankedAssets } = model;
    const watchlist = rankedAssets.filter(item => WATCHLIST_IDS.includes(item.coin.id));
    const opportunityRows = rankedAssets.slice(0, 10);
    const selected = rankedAssets.find(item => item.coin.id === selectedAssetId);
    const holdingRows = manualHoldings.map(holding => {
        const displayCoin = holdingDisplayCoin(markets, holding);
        const valuation = holdingValuation(markets, holding);
        return { holding, displayCoin, ...valuation };
    });
    const portfolioValue = holdingRows.reduce((total, row) => total + (row.value ?? 0), 0);
    const pricedRows = holdingRows.filter(row => row.value !== null && row.holding.balance > 0);
    const chartCoin = pricedRows[0]?.market || byId(markets, "bitcoin") || watchlist[0]?.coin;

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
    renderTradeGuide(opportunityRows);

    const selectedCoinspotUrl = selected ? coinspotUrl(selected.coin) : null;
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
                ${selectedCoinspotUrl
                    ? `<a class="button-primary" href="${selectedCoinspotUrl}" target="_blank" rel="noopener noreferrer">Open CoinSpot</a>`
                    : `<span class="watch-only">Watch only</span>`}
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

    document.getElementById("wallets-body").innerHTML = holdingRows.length ? holdingRows.map(row => `
        <tr>
            <td>${coinCell(row.displayCoin)}</td>
            <td class="num">${formatBalance(row.holding.balance)}</td>
            <td class="num">${row.value === null ? "Price unavailable" : formatPrice(row.value)}</td>
        </tr>
    `).join("") : `<tr><td colspan="3" class="loading-cell">No manual holdings saved.</td></tr>`;

    document.getElementById("portfolio-value").textContent = formatPrice(portfolioValue);
    renderHoldingsAllocation(holdingRows, portfolioValue);
    renderHoldingsManager(markets, holdingRows);
    renderChart(chartCoin);

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

function guideStateFor(item) {
    if (item.state.trendState === "trend_breakout") return { label: "Breakout", klass: "strong" };
    if (item.state.trendState === "trend_downside") return { label: "Sell Risk", klass: "sell" };
    if (item.state.trendState === "trend_positive") return { label: "Watch", klass: "watch" };
    if (item.state.alertTrigger === "volume_spike") return { label: "Volume Spike", klass: "volume" };
    return { label: "No Action", klass: "wait" };
}

function confirmationFor(item, stateLabel) {
    const oneHour = finiteNumber(item.coin.price_change_percentage_1h_in_currency);
    const day = finiteNumber(item.coin.price_change_percentage_24h);
    const volume = finiteNumber(item.coin.total_volume);
    let score = 0;
    if (oneHour > 0) score += 1;
    if (day > 2) score += 1;
    if (volume > 1000000000) score += 1;
    if (stateLabel === "Breakout") score += 1;
    if (stateLabel === "Sell Risk") score += 1;
    if (score >= 3) return "Strong";
    if (score >= 2) return "Medium";
    return "Weak";
}

function riskFor(item) {
    const move = Math.abs(finiteNumber(item.coin.price_change_percentage_24h));
    const hour = Math.abs(finiteNumber(item.coin.price_change_percentage_1h_in_currency));
    if (move >= 8 || hour >= 4) return "High";
    if (move >= 3 || hour >= 1.5) return "Medium";
    return "Low";
}

function liquidityFor(item) {
    const volume = finiteNumber(item.coin.total_volume);
    if (volume >= 100000000) return "Suitable";
    if (volume >= 25000000) return "Caution";
    return "Avoid";
}

function signalAgeFor(stateLabel) {
    return stateLabel === "No Action" ? "Unknown" : "Fresh";
}

function invalidationFor(stateLabel) {
    const invalidations = {
        Breakout: "1hr momentum turns negative",
        Watch: "24hr move falls below 2%",
        "Sell Risk": "Risk threshold clears",
        "Volume Spike": "Volume drops below threshold",
        "No Action": "New threshold state appears"
    };
    return invalidations[stateLabel] || "Unknown";
}

function renderTradeGuide(items) {
    const body = document.getElementById("trade-guide-body");
    if (!body) return;
    body.innerHTML = items.slice(0, 10).map((item, index) => {
        const state = guideStateFor(item);
        const supported = coinspotStatus(item.coin);
        const analysed = item.coin.id === selectedAssetId;
        const handoffUrl = analysed ? coinspotUrl(item.coin) : null;
        const action = handoffUrl
            ? `<a class="table-action" href="${handoffUrl}" target="_blank" rel="noopener noreferrer">CoinSpot</a>`
            : supported === "Supported" && !analysed
                ? `<button class="table-action" type="button" data-asset-id="${item.coin.id}">Analyse</button>`
                : "Watch only";
        return `
            <tr>
                <td class="num">${index + 1}</td>
                <td>${coinCell(item.coin)}</td>
                <td><span class="badge ${state.klass}">${state.label}</span></td>
                <td>${confirmationFor(item, state.label)}</td>
                <td>${riskFor(item)}</td>
                <td>${liquidityFor(item)}</td>
                <td>${signalAgeFor(state.label)}</td>
                <td>${invalidationFor(state.label)}</td>
                <td>${supported}</td>
                <td>${action}</td>
            </tr>
        `;
    }).join("");
}

function renderHoldingsAllocation(holdingRows, portfolioValue) {
    const pie = document.getElementById("holdings-pie");
    const body = document.getElementById("holdings-body");
    if (!pie || !body) return;

    const activeRows = holdingRows.filter(row => row.holding.balance > 0);
    const valuedRows = activeRows.filter(row => row.value !== null);
    const lead = valuedRows.sort((a, b) => b.value - a.value)[0] || activeRows[0];
    const leadPercent = lead && portfolioValue > 0 && lead.value !== null
        ? Math.round((lead.value / portfolioValue) * 100)
        : activeRows.length === 1 ? 100 : 0;
    pie.innerHTML = lead ? `${lead.holding.symbol}<br>${leadPercent}%` : "0%";

    if (!activeRows.length) {
        body.innerHTML = `<tr><td colspan="3" class="loading-cell">No active holdings.</td></tr>`;
        return;
    }

    body.innerHTML = activeRows.map(row => {
        const allocation = row.value !== null && portfolioValue > 0
            ? `${((row.value / portfolioValue) * 100).toFixed(1)}%`
            : "Price unavailable";
        return `
            <tr>
                <td>${coinCell(row.displayCoin)}</td>
                <td class="num">${allocation}</td>
                <td class="num">${row.value === null ? "Price unavailable" : formatPrice(row.value)}</td>
            </tr>
        `;
    }).join("");
}

function renderHoldingsManager(markets, holdingRows) {
    const body = document.getElementById("manage-holdings-body");
    if (!body) return;

    body.innerHTML = holdingRows.length ? holdingRows.map(row => `
        <tr>
            <td>${coinCell(row.displayCoin)}</td>
            <td class="num"><input class="inline-balance" type="number" min="0" step="any" value="${row.holding.balance}" data-balance-symbol="${escapeHtml(row.holding.symbol)}"></td>
            <td class="num">${row.value === null ? "Price unavailable" : formatPrice(row.value)}</td>
            <td><input class="inline-note" type="text" value="${escapeHtml(row.holding.note)}" data-note-symbol="${escapeHtml(row.holding.symbol)}" placeholder="None"></td>
            <td>${formatTimestamp(row.holding.updatedAt)}</td>
            <td>
                <button class="table-action" type="button" data-save-holding="${escapeHtml(row.holding.symbol)}">Save</button>
                <button class="table-action danger-action" type="button" data-remove-holding="${escapeHtml(row.holding.symbol)}">Remove</button>
            </td>
        </tr>
    `).join("") : `<tr><td colspan="6" class="loading-cell">No manual holdings saved.</td></tr>`;

    body.querySelectorAll("[data-save-holding]").forEach(button => {
        button.addEventListener("click", event => {
            const symbol = event.currentTarget.dataset.saveHolding;
            const balanceInput = body.querySelector(`[data-balance-symbol="${symbol}"]`);
            const noteInput = body.querySelector(`[data-note-symbol="${symbol}"]`);
            updateHoldingBalance(symbol, balanceInput?.value, noteInput?.value);
        });
    });

    body.querySelectorAll("[data-remove-holding]").forEach(button => {
        button.addEventListener("click", event => {
            removeHolding(event.currentTarget.dataset.removeHolding);
        });
    });
}

function rerenderDashboard() {
    if (currentDashboardModel) renderDashboard(currentDashboardModel);
}

function upsertHolding({ symbol, name, balance, note }) {
    const cleanSymbol = safeText(symbol, "").toUpperCase();
    const cleanName = safeText(name, cleanSymbol);
    const cleanBalance = Number(balance);
    if (!cleanSymbol) {
        setHoldingsMessage("Enter a coin symbol.", true);
        return;
    }
    if (!/^[A-Z0-9.-]+$/.test(cleanSymbol)) {
        setHoldingsMessage("Symbol can use letters, numbers, dots, or hyphens.", true);
        return;
    }
    if (!Number.isFinite(cleanBalance) || cleanBalance < 0) {
        setHoldingsMessage("Balance must be a non-negative number.", true);
        return;
    }

    const nextHolding = normalizeHolding({
        symbol: cleanSymbol,
        name: cleanName,
        balance: cleanBalance,
        note: safeText(note, ""),
        updatedAt: new Date().toISOString()
    });
    const sourceHoldings = usingDefaultHoldings || isDefaultSampleSet(manualHoldings) ? [] : manualHoldings;
    const remaining = sourceHoldings.filter(holding => holding.symbol !== cleanSymbol);
    saveHoldings([...remaining, nextHolding]);
    setHoldingsMessage(`${cleanSymbol} holding saved.`);
    rerenderDashboard();
}

function updateHoldingBalance(symbol, balance, note) {
    const cleanSymbol = safeText(symbol, "").toUpperCase();
    const existing = manualHoldings.find(holding => holding.symbol === cleanSymbol);
    if (!existing) return;
    upsertHolding({
        ...existing,
        balance,
        note
    });
}

function removeHolding(symbol) {
    const cleanSymbol = safeText(symbol, "").toUpperCase();
    saveHoldings(manualHoldings.filter(holding => holding.symbol !== cleanSymbol));
    setHoldingsMessage(`${cleanSymbol} holding removed.`);
    rerenderDashboard();
}

function resetHoldings() {
    saveHoldings(defaultHoldings());
    setHoldingsMessage("Default holdings restored.");
    rerenderDashboard();
}

function initHoldingsControls() {
    const form = document.getElementById("holdings-form");
    if (form) {
        form.addEventListener("submit", event => {
            event.preventDefault();
            const formData = new FormData(form);
            upsertHolding({
                symbol: formData.get("symbol"),
                name: formData.get("name"),
                balance: formData.get("balance"),
                note: formData.get("note")
            });
            if (!document.getElementById("holdings-message")?.classList.contains("error")) {
                form.reset();
            }
        });
    }

    const resetButton = document.getElementById("reset-holdings");
    if (resetButton) {
        resetButton.addEventListener("click", resetHoldings);
    }
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
    const safeCoin = normalizeMarket(coin);
    return `
        <span class="coin-tile">
            ${safeCoin.image ? `<img class="coin-icon" src="${safeCoin.image}" alt="">` : `<span class="coin-icon"></span>`}
            <span>${safeCoin.symbol.toUpperCase()}</span>
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
    const safeMarkets = normalizeMarkets(markets);
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
if (page === "dashboard") initHoldingsControls();
setInterval(boot, 60000);
