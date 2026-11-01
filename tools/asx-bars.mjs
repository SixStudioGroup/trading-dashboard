// Pure ASX bar handling, shared by tools/generate-asx-feed.mjs and its tests.
//
// Yahoo's daily chart appends a "current" bar for the latest session alongside
// the session's daily bar. Treating that pair as two closes made change1d zero
// for the whole universe after every close. Bars are therefore merged by Sydney
// calendar date, so one session is always exactly one bar.

export function sydneyDateFromEpoch(seconds) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date(seconds * 1000)).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function dailyBarsFromYahoo(result) {
  const timestamps = result?.timestamp || [];
  const quote = result?.indicators?.quote?.[0] || {};
  const byDate = new Map();
  timestamps.forEach((ts, i) => {
    const close = quote.close?.[i];
    if (!Number.isFinite(close) || close <= 0) return;
    const date = sydneyDateFromEpoch(ts);
    const open = Number.isFinite(quote.open?.[i]) ? quote.open[i] : close;
    const high = Number.isFinite(quote.high?.[i]) ? quote.high[i] : close;
    const low = Number.isFinite(quote.low?.[i]) ? quote.low[i] : close;
    const volume = Number.isFinite(quote.volume?.[i]) ? quote.volume[i] : 0;
    const seen = byDate.get(date);
    if (!seen) {
      byDate.set(date, { date, open, high, low, close, volume });
      return;
    }
    // Same session reported twice: keep the first open, the latest close, the
    // widest range and the larger volume (the snapshot bar can lag the daily).
    seen.close = close;
    seen.high = Math.max(seen.high, high);
    seen.low = Math.min(seen.low, low);
    seen.volume = Math.max(seen.volume, volume);
  });
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

const pct = (now, before) => (Number.isFinite(now) && Number.isFinite(before) && before > 0 ? ((now - before) / before) * 100 : 0);

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function averageClose(bars, period) {
  return bars.length >= period ? mean(bars.slice(-period).map(b => b.close)) : null;
}

// Average true range over the last `period` sessions.
function atr(bars, period = 14) {
  if (bars.length < period + 1) return null;
  const ranges = [];
  for (let i = bars.length - period; i < bars.length; i += 1) {
    const prev = bars[i - 1].close;
    ranges.push(Math.max(bars[i].high - bars[i].low, Math.abs(bars[i].high - prev), Math.abs(bars[i].low - prev)));
  }
  return mean(ranges);
}

export function barMetrics(bars) {
  if (!Array.isArray(bars) || bars.length < 2) throw new Error('insufficient provider history');
  const last = bars.at(-1);
  const prior = bars.at(-2);
  // change5d is only a true 5-session change with at least 6 sessions; with
  // fewer it uses the earliest close and is flagged partial for the UI.
  const hasFullFiveDay = bars.length >= 6;
  const fivePrior = hasFullFiveDay ? bars.at(-6) : bars[0];
  // Canonical relVol: mean of the PRIOR up-to-20 sessions, EXCLUDING the
  // current bar, so a fresh spike isn't diluted into its own baseline.
  const priorVolumes = bars.slice(0, -1).slice(-20).map(b => b.volume).filter(v => v > 0);
  const avgVolume = mean(priorVolumes) || 0;
  const ma20 = averageClose(bars, 20);
  const ma50 = averageClose(bars, 50);
  const ma200 = averageClose(bars, 200);
  const prior20 = bars.slice(0, -1).slice(-20);
  let trend = 'Unknown';
  if (ma50 !== null && ma200 !== null) {
    if (last.close > ma50 && ma50 > ma200) trend = 'Up';
    else if (last.close < ma50 && ma50 < ma200) trend = 'Down';
    else trend = 'Mixed';
  }
  return {
    price: last.close,
    lastBarDate: last.date,
    change1d: pct(last.close, prior.close),
    change5d: pct(last.close, fivePrior.close),
    change5dPartial: !hasFullFiveDay,
    relativeVolume: avgVolume > 0 ? last.volume / avgVolume : 1,
    ma20, ma50, ma200,
    atr14: atr(bars),
    high20: prior20.length ? Math.max(...prior20.map(b => b.high)) : null,
    low20: prior20.length ? Math.min(...prior20.map(b => b.low)) : null,
    trend
  };
}

// The most common last-bar date: one thin stock must not set the session.
export function sessionDateOf(assets) {
  const counts = {};
  assets.forEach(a => { if (a.lastBarDate) counts[a.lastBarDate] = (counts[a.lastBarDate] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0]?.[0] || null;
}
