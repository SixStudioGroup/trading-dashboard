(() => {
  const PLAN_KEY = 'zencloud.stocks.tradeJournal.v1';
  const FEE_DEFAULTS_KEY = 'sixsignal.stocks.auBrokerDefaults.v2';
  const PRIVATE_MODE_KEY = 'zencloud.portalMode.v1';
  const PRIVATE_MODE = 'private';
  const FEED_URL = 'data/asx-feed.json';
  const MAX_FEED_AGE_HOURS = 36;

  let asxFeed = null;
  let selectedSymbol = '';

  const DEMO_ASX = [
    { symbol: 'BHP', name: 'BHP Group', exchange: 'ASX', sector: 'Materials', price: 43.2, change1d: 1.4, change5d: 4.8, relativeVolume: 1.7, marketRegime: 'Constructive', region: 'Australia', currency: 'AUD', signalState: 'Breakout', riskState: 'Controlled' },
    { symbol: 'CBA', name: 'Commonwealth Bank of Australia', exchange: 'ASX', sector: 'Financials', price: 128.4, change1d: 0.6, change5d: 2.1, relativeVolume: 1.2, marketRegime: 'Constructive', region: 'Australia', currency: 'AUD', signalState: 'Watch', riskState: 'Normal' },
    { symbol: 'CSL', name: 'CSL', exchange: 'ASX', sector: 'Health Care', price: 284.1, change1d: -1.1, change5d: -3.6, relativeVolume: 1.4, marketRegime: 'Mixed', region: 'Australia', currency: 'AUD', signalState: 'Sell Risk', riskState: 'Elevated' }
  ];

  function storageAvailable() {
    try {
      window.localStorage.setItem('__sixsignal_r2_test__', '1');
      window.localStorage.removeItem('__sixsignal_r2_test__');
      return true;
    } catch (_error) {
      return false;
    }
  }

  function isPrivateMode() {
    if (!storageAvailable()) return false;
    return window.localStorage.getItem(PRIVATE_MODE_KEY) === PRIVATE_MODE;
  }

  function safeText(value, fallback = '') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  function finiteNumber(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function money(value) {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(finiteNumber(value));
  }

  function signedMoney(value) {
    const numeric = finiteNumber(value);
    return `${numeric > 0 ? '+' : ''}${money(numeric)}`;
  }

  function signedPct(value) {
    const numeric = finiteNumber(value);
    return `${numeric > 0 ? '+' : ''}${numeric.toFixed(2)}%`;
  }

  function formatTime(value) {
    if (!value) return 'Not populated';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Invalid timestamp';
    return date.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
  }

  function readJson(key, fallback) {
    if (!storageAvailable()) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    if (!storageAvailable() || !isPrivateMode()) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function brokerDefaults() {
    return { brokerageFee: 5, feePercent: 0, spreadPercent: 0.10, ...readJson(FEE_DEFAULTS_KEY, {}) };
  }

  function saveBrokerDefaultsFromForm() {
    const next = {
      brokerageFee: finiteNumber(document.getElementById('stock-fee-brokerage')?.value, 5),
      feePercent: finiteNumber(document.getElementById('stock-fee-percent')?.value, 0),
      spreadPercent: finiteNumber(document.getElementById('stock-fee-spread')?.value, 0.10)
    };
    writeJson(FEE_DEFAULTS_KEY, next);
  }

  function loadPlans() {
    return readJson(PLAN_KEY, []);
  }

  function savePlans(rows) {
    writeJson(PLAN_KEY, rows);
  }

  function feedAgeHours() {
    if (!asxFeed?.lastUpdated) return Infinity;
    const updated = new Date(asxFeed.lastUpdated);
    if (Number.isNaN(updated.getTime())) return Infinity;
    return (Date.now() - updated.getTime()) / 36e5;
  }

  function feedMode() {
    if (!asxFeed) return 'offline';
    if (asxFeed.mode === 'delayed' && Array.isArray(asxFeed.assets) && asxFeed.assets.length && feedAgeHours() <= MAX_FEED_AGE_HOURS) return 'delayed';
    if (asxFeed.mode === 'delayed' && Array.isArray(asxFeed.assets) && asxFeed.assets.length) return 'fallback';
    if (asxFeed.mode === 'snapshot' && Array.isArray(asxFeed.assets) && asxFeed.assets.length) return 'snapshot';
    return asxFeed.mode || 'offline';
  }

  function normaliseAsset(asset) {
    const symbol = safeText(asset.symbol).replace(/\.AX$/i, '').toUpperCase();
    return {
      symbol,
      name: safeText(asset.name, symbol),
      exchange: safeText(asset.exchange, 'ASX'),
      sector: safeText(asset.sector, 'Unknown'),
      price: finiteNumber(asset.price),
      change1d: finiteNumber(asset.change1d),
      change5d: finiteNumber(asset.change5d),
      relativeVolume: finiteNumber(asset.relativeVolume, 1),
      marketRegime: safeText(asset.marketRegime, 'Mixed'),
      region: safeText(asset.region, 'Australia'),
      currency: safeText(asset.currency, 'AUD'),
      signalState: safeText(asset.signalState, 'No Action'),
      riskState: safeText(asset.riskState, 'Normal')
    };
  }

  function assets() {
    const feedAssets = Array.isArray(asxFeed?.assets) ? asxFeed.assets.map(normaliseAsset) : [];
    return feedAssets.length ? feedAssets : DEMO_ASX.map(normaliseAsset);
  }

  function score(asset) {
    const signal = { Breakout: 12, 'Volume Spike': 9, Watch: 5, 'No Action': 0, 'Sell Risk': -10 }[asset.signalState] || 0;
    const risk = { Controlled: 6, Normal: 4, Review: 1, Elevated: -8, Low: 4 }[asset.riskState] || 0;
    const regime = { Constructive: 6, Mixed: 2, Defensive: -4 }[asset.marketRegime] || 0;
    return signal + risk + regime + (asset.change1d * 4) + (asset.change5d * 2) + Math.max(0, asset.relativeVolume - 1) * 10;
  }

  function rankedAssets() {
    return assets().map(asset => ({ ...asset, rankingScore: score(asset) })).sort((a, b) => b.rankingScore - a.rankingScore);
  }

  function badgeClass(state) {
    return { Breakout: 'strong', Watch: 'watch', 'Sell Risk': 'risk', 'Volume Spike': 'volume', 'No Action': 'wait', Controlled: 'strong', Normal: 'watch', Review: 'volume', Elevated: 'risk' }[state] || 'wait';
  }

  function calculateNetOutcome(input = {}) {
    const entryPrice = Math.max(0, finiteNumber(input.entryPrice));
    const targetPrice = Math.max(0, finiteNumber(input.targetPrice));
    const positionSize = Math.max(0, finiteNumber(input.positionSize));
    const brokerageFee = Math.max(0, finiteNumber(input.brokerageFee));
    const feePercent = Math.max(0, finiteNumber(input.feePercent));
    const spreadPercent = Math.max(0, finiteNumber(input.spreadPercent));
    const units = entryPrice > 0 ? positionSize / entryPrice : 0;
    const grossProfit = targetPrice > 0 ? (targetPrice - entryPrice) * units : 0;
    const brokerageTotal = brokerageFee * 2;
    const percentageFees = positionSize * (feePercent / 100) * 2;
    const spreadCost = positionSize * (spreadPercent / 100);
    const totalCosts = brokerageTotal + percentageFees + spreadCost;
    const netProfit = grossProfit - totalCosts;
    const grossReturnPct = positionSize > 0 ? (grossProfit / positionSize) * 100 : 0;
    const netReturnPct = positionSize > 0 ? (netProfit / positionSize) * 100 : 0;
    const breakevenPrice = units > 0 ? entryPrice + (totalCosts / units) : 0;
    return { entryPrice, targetPrice, positionSize, brokerageFee, feePercent, spreadPercent, units, grossProfit, brokerageTotal, percentageFees, spreadCost, totalCosts, netProfit, grossReturnPct, netReturnPct, breakevenPrice };
  }

  function renderFeePanel() {
    const output = document.getElementById('stock-fee-output');
    if (!output) return;
    const result = calculateNetOutcome({
      entryPrice: document.getElementById('stock-risk-entry')?.value,
      targetPrice: document.getElementById('stock-fee-target')?.value,
      positionSize: document.getElementById('stock-plan-position-size')?.value,
      brokerageFee: document.getElementById('stock-fee-brokerage')?.value,
      feePercent: document.getElementById('stock-fee-percent')?.value,
      spreadPercent: document.getElementById('stock-fee-spread')?.value
    });
    if (!result.entryPrice || !result.targetPrice || !result.positionSize) {
      output.textContent = 'Enter position size, entry, target, brokerage, and spread assumptions.';
      return;
    }
    output.innerHTML = `<span>Gross outcome <strong>${signedMoney(result.grossProfit)} / ${signedPct(result.grossReturnPct)}</strong></span><span>Total costs <strong>${money(result.totalCosts)}</strong></span><span>Net outcome <strong>${signedMoney(result.netProfit)} / ${signedPct(result.netReturnPct)}</strong></span><span>Breakeven price <strong>${money(result.breakevenPrice)}</strong></span>`;
  }

  function hydrateFeeDefaults() {
    const defaults = brokerDefaults();
    const mapping = { 'stock-fee-brokerage': defaults.brokerageFee, 'stock-fee-percent': defaults.feePercent, 'stock-fee-spread': defaults.spreadPercent };
    Object.entries(mapping).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input && input.value === '') input.value = value;
      if (input && id === 'stock-fee-brokerage') input.value = value;
    });
  }

  function renderSourceState() {
    const mode = feedMode();
    const badge = document.getElementById('stock-source-badge');
    const subtitle = document.getElementById('stock-queue-subtitle');
    const warning = document.getElementById('stock-staleness-warning');
    if (badge) badge.textContent = mode === 'delayed' ? 'ASX delayed feed' : mode === 'fallback' ? 'ASX stale fallback' : mode === 'snapshot' ? 'ASX snapshot' : 'ASX offline';
    if (subtitle) subtitle.textContent = `Source: ${asxFeed?.source || 'Offline fallback'} | Mode: ${mode} | Last updated: ${formatTime(asxFeed?.lastUpdated)} | Errors: ${(asxFeed?.fetchErrors || []).length}`;
    if (warning) {
      warning.hidden = mode === 'delayed';
      warning.innerHTML = `<span><strong>ASX feed mode: ${escapeHtml(mode)}</strong> — ${escapeHtml(mode === 'offline' ? 'provider feed not populated yet; run GitHub Action before production stock use.' : 'confirm price in broker before execution.')} Last updated: ${escapeHtml(formatTime(asxFeed?.lastUpdated))}</span>`;
    }
  }

  function renderAsxQueue() {
    const body = document.getElementById('stock-opportunities-body');
    if (!body) return;
    const rows = rankedAssets();
    const best = rows[0];
    const bestEl = document.getElementById('stock-best-setup');
    if (bestEl) bestEl.textContent = best ? `${best.symbol} / ${best.signalState}` : 'No ASX data';
    body.innerHTML = rows.map((asset, index) => `<tr><td class="num">${index + 1}</td><td><strong>${escapeHtml(asset.symbol)}</strong><br><span class="muted">${escapeHtml(asset.exchange)}</span></td><td>${escapeHtml(asset.name)}</td><td>${escapeHtml(asset.sector)}</td><td class="num">${money(asset.price)}</td><td class="num ${asset.change1d > 0 ? 'positive' : asset.change1d < 0 ? 'negative' : 'neutral'}">${signedPct(asset.change1d)}</td><td class="num ${asset.change5d > 0 ? 'positive' : asset.change5d < 0 ? 'negative' : 'neutral'}">${signedPct(asset.change5d)}</td><td class="num">${asset.relativeVolume.toFixed(2)}x</td><td><span class="badge ${badgeClass(asset.signalState)}">${escapeHtml(asset.signalState)}</span></td><td>${escapeHtml(asset.riskState)}</td><td><button class="table-action" type="button" data-r2-analyse="${escapeHtml(asset.symbol)}">Analyse</button></td></tr>`).join('');
    document.querySelectorAll('[data-r2-analyse]').forEach(button => button.addEventListener('click', event => selectAsset(event.currentTarget.dataset.r2Analyse)));
  }

  function renderAnalysis(asset) {
    const panel = document.getElementById('stock-analysis-panel');
    if (!panel) return;
    if (!asset) {
      panel.innerHTML = '<div class="empty-analysis">Select an ASX ticker from the queue. Production stock use requires delayed feed mode and current broker confirmation.</div>';
      return;
    }
    panel.innerHTML = `<div class="stock-analysis-card"><div><span class="eyebrow">ASX Decision Cockpit</span><h3>${escapeHtml(asset.symbol)} / ${escapeHtml(asset.name)}</h3><p>Provider-backed delayed/snapshot data is used for review only. Broker price, order book, fees, and execution remain external checks.</p></div><div class="rules-grid stock-rules-grid"><div class="rule-card">Exchange<span>${escapeHtml(asset.exchange)}</span></div><div class="rule-card">Currency<span>${escapeHtml(asset.currency)}</span></div><div class="rule-card">Sector<span>${escapeHtml(asset.sector)}</span></div><div class="rule-card">Price<span>${money(asset.price)}</span></div><div class="rule-card ${asset.change1d >= 0 ? 'strong' : 'risk'}">1D<span>${signedPct(asset.change1d)}</span></div><div class="rule-card ${asset.change5d >= 0 ? 'strong' : 'risk'}">5D<span>${signedPct(asset.change5d)}</span></div><div class="rule-card volume">Relative Volume<span>${asset.relativeVolume.toFixed(2)}x</span></div><div class="rule-card ${badgeClass(asset.signalState)}">Signal<span>${escapeHtml(asset.signalState)}</span></div><div class="rule-card ${badgeClass(asset.riskState)}">Risk<span>${escapeHtml(asset.riskState)}</span></div><div class="rule-card">Regime<span>${escapeHtml(asset.marketRegime)}</span></div></div><p class="helper-output">Feed mode: ${escapeHtml(feedMode())}. Last updated: ${escapeHtml(formatTime(asxFeed?.lastUpdated))}. This is not financial advice and does not unlock broker execution.</p></div>`;
  }

  function selectAsset(symbol) {
    selectedSymbol = symbol;
    const asset = rankedAssets().find(row => row.symbol === symbol);
    if (!asset) return;
    const fields = {
      'stock-plan-symbol': asset.symbol,
      'stock-plan-name': asset.name,
      'stock-plan-market': asset.exchange,
      'stock-plan-state': asset.signalState,
      'stock-plan-why-now': `${asset.marketRegime} ASX review candidate; 1D ${signedPct(asset.change1d)}, 5D ${signedPct(asset.change5d)}, relative volume ${asset.relativeVolume.toFixed(2)}x`,
      'stock-plan-entry-trigger': 'Manual broker confirmation of price, spread, liquidity, and order type',
      'stock-plan-invalidation': `Review if ${asset.symbol} loses thesis support or feed/broker price diverges materially`,
      'stock-plan-review-target': 'Set target price before saving plan',
      'stock-plan-holding-window': '2-10 trading days',
      'stock-risk-entry': asset.price,
      'stock-risk-invalidation-price': Math.max(0, asset.price * 0.95).toFixed(3),
      'stock-fee-target': Math.max(0, asset.price * 1.03).toFixed(3)
    };
    Object.entries(fields).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) input.value = value;
    });
    renderAnalysis(asset);
    renderFeePanel();
  }

  function patchPlanSubmit() {
    const form = document.getElementById('stock-plan-form');
    if (!form || form.dataset.release2Patched) return;
    form.dataset.release2Patched = 'true';
    form.addEventListener('submit', () => {
      if (!isPrivateMode()) return;
      saveBrokerDefaultsFromForm();
      const data = new FormData(form);
      const fees = calculateNetOutcome({
        entryPrice: data.get('entryPrice'),
        targetPrice: data.get('targetPrice'),
        positionSize: data.get('positionSize'),
        brokerageFee: data.get('brokerageFee'),
        feePercent: data.get('feePercent'),
        spreadPercent: data.get('spreadPercent')
      });
      const symbol = safeText(data.get('symbol')).toUpperCase();
      const existing = loadPlans();
      const updated = existing.map(plan => safeText(plan.symbol).toUpperCase() === symbol ? { ...plan, targetPrice: fees.targetPrice, brokerageFee: fees.brokerageFee, feePercent: fees.feePercent, spreadPercent: fees.spreadPercent, grossProfit: fees.grossProfit, netProfit: fees.netProfit, totalCosts: fees.totalCosts, grossReturnPct: fees.grossReturnPct, netReturnPct: fees.netReturnPct, breakevenPrice: fees.breakevenPrice, feeModelVersion: 'release2' } : plan);
      savePlans(updated);
      setTimeout(renderJournalFees, 0);
    });
  }

  function renderJournalFees() {
    const body = document.getElementById('stock-journal-body');
    if (!body) return;
    const plans = loadPlans();
    body.querySelectorAll('tr').forEach(row => {
      const symbol = row.querySelector('td:nth-child(2) strong')?.textContent?.trim()?.toUpperCase();
      const plan = plans.find(item => safeText(item.symbol).toUpperCase() === symbol);
      const feeCell = row.querySelector('td:nth-child(6)');
      if (feeCell && plan?.feeModelVersion === 'release2') {
        feeCell.innerHTML = `<strong>${signedMoney(plan.netProfit)}</strong><br><span class="muted">Costs ${money(plan.totalCosts)} / Net ${signedPct(plan.netReturnPct)}</span>`;
      } else if (feeCell && symbol) {
        feeCell.innerHTML = '<span class="muted">Not calculated</span>';
      }
    });
  }

  function bindFeeInputs() {
    ['stock-plan-position-size', 'stock-risk-entry', 'stock-fee-target', 'stock-fee-brokerage', 'stock-fee-percent', 'stock-fee-spread'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', renderFeePanel);
      document.getElementById(id)?.addEventListener('change', () => { saveBrokerDefaultsFromForm(); renderFeePanel(); });
    });
  }

  async function loadAsxFeed() {
    try {
      const response = await fetch(FEED_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      asxFeed = await response.json();
    } catch (error) {
      asxFeed = { schema: 'sixsignal.asx.feed.v2', source: 'offline fallback', mode: 'offline', lastUpdated: null, symbols: [], fetchErrors: [{ symbol: 'FEED', message: error.message }], marketRegimes: {}, assets: [] };
    }
    renderSourceState();
    renderAsxQueue();
    renderAnalysis(rankedAssets().find(asset => asset.symbol === selectedSymbol));
  }

  function initRelease2Stocks() {
    hydrateFeeDefaults();
    bindFeeInputs();
    patchPlanSubmit();
    renderFeePanel();
    renderJournalFees();
    loadAsxFeed();
    const observer = new MutationObserver(renderJournalFees);
    const journal = document.getElementById('stock-journal-body');
    if (journal) observer.observe(journal, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initRelease2Stocks);
  else initRelease2Stocks();
})();
