(() => {
  const PLAN_KEY = 'sixquant.stocks.tradeJournal.v1';
  const FEE_DEFAULTS_KEY = 'sixquant.stocks.auBrokerDefaults.v2';
  // Pre-rebrand key; migrated to FEE_DEFAULTS_KEY on load so saved fee defaults survive.
  const LEGACY_FEE_DEFAULTS_KEY = 'sixsignal.stocks.auBrokerDefaults.v2';
  const PRIVATE_MODE_KEY = 'sixquant.portalMode.v1';
  const PRIVATE_MODE = 'private';
  const FEED_URL = 'data/asx-feed.json';
  const MAX_FEED_AGE_HOURS = 36;

  let asxFeed = null;

  function storageAvailable() {
    try {
      window.localStorage.setItem('__sixquant_r2_test__', '1');
      window.localStorage.removeItem('__sixquant_r2_test__');
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

  function migrateLegacyFeeDefaults() {
    if (!storageAvailable()) return;
    try {
      const legacy = window.localStorage.getItem(LEGACY_FEE_DEFAULTS_KEY);
      if (legacy && !window.localStorage.getItem(FEE_DEFAULTS_KEY)) {
        window.localStorage.setItem(FEE_DEFAULTS_KEY, legacy);
      }
      if (legacy) window.localStorage.removeItem(LEGACY_FEE_DEFAULTS_KEY);
    } catch (_error) { /* storage unavailable mid-session */ }
  }

  function brokerDefaults() {
    migrateLegacyFeeDefaults();
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

  // Observer must be detached while this function mutates the journal rows:
  // it observes the same subtree it rewrites, and innerHTML assignment is a
  // childList mutation even when the markup is unchanged — observing our own
  // writes re-fires this callback forever and freezes the renderer.
  let journalObserver = null;

  function observeJournal() {
    const journal = document.getElementById('stock-journal-body');
    if (journal && journalObserver) journalObserver.observe(journal, { childList: true, subtree: true });
  }

  function renderJournalFees() {
    const body = document.getElementById('stock-journal-body');
    if (!body) return;
    if (journalObserver) journalObserver.disconnect();
    try {
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
    } finally {
      observeJournal();
    }
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
      asxFeed = { schema: 'sixquant.asx.feed.v2', source: 'offline fallback', mode: 'offline', lastUpdated: null, symbols: [], fetchErrors: [{ symbol: 'FEED', message: error.message }], marketRegimes: {}, assets: [] };
    }
    // Feed ASX data into stocks.js rendering pipeline (stocks.js owns all rendering)
    const mode = feedMode();
    if (Array.isArray(asxFeed?.assets) && asxFeed.assets.length && mode !== 'offline') {
      snapshotData = { ...asxFeed, displayMode: mode };
      snapshotSource = 'snapshot';
    }
    if (typeof renderAll === 'function') renderAll();
  }

  // ASX feed runs weekdays only — the allowed age must span a weekend gap
  // (Friday 16:15 capture to Monday 10:00 open is ~66h).
  const HEARTBEAT_MAX_AGE_HOURS = 76;

  async function checkAsxHeartbeat() {
    const warning = document.getElementById('stock-heartbeat-warning');
    const detail = document.getElementById('stock-heartbeat-detail');
    if (!warning || !detail) return;
    try {
      const resp = await fetch('data/heartbeat-asx.json', { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const beat = await resp.json();
      const last = new Date(beat.lastRun);
      if (Number.isNaN(last.getTime())) throw new Error('bad timestamp');
      const ageHours = (Date.now() - last.getTime()) / 3600000;
      // Surface BOTH a stale run (age) AND an unhealthy status. The generator
      // writes status 'degraded'/'failed' (with a detail) when validation or a
      // fetch fails and it refuses to overwrite the last-good feed.
      const status = typeof beat.status === 'string' ? beat.status.toLowerCase() : '';
      const unhealthy = status && status !== 'ok' && status !== 'seed';
      if (unhealthy) {
        const reason = typeof beat.detail === 'string' && beat.detail ? ` (${beat.detail})` : '';
        detail.textContent = `last ASX pipeline run reported "${beat.status}"${reason}. The last good feed is being shown; check the GitHub Action before relying on feed state.`;
        warning.hidden = false;
      } else if (ageHours > HEARTBEAT_MAX_AGE_HOURS) {
        detail.textContent = `last ASX pipeline run ${Math.round(ageHours)}h ago (expected under ${HEARTBEAT_MAX_AGE_HOURS}h). Check the GitHub Action before relying on feed state.`;
        warning.hidden = false;
      } else {
        warning.hidden = true;
      }
    } catch (_error) {
      warning.hidden = true;
    }
  }

  function initRelease2Stocks() {
    hydrateFeeDefaults();
    bindFeeInputs();
    patchPlanSubmit();
    renderFeePanel();
    renderJournalFees();
    loadAsxFeed();
    checkAsxHeartbeat();
    journalObserver = new MutationObserver(renderJournalFees);
    observeJournal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initRelease2Stocks);
  else initRelease2Stocks();
})();
