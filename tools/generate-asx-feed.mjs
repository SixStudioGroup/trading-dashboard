import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'asx-feed.json');
const USER_AGENT = 'SixQuant-Terminal-ASX-Feed/2.0';

const ASX_UNIVERSE = [
  ['BHP', 'BHP Group', 'Materials'],
  ['CBA', 'Commonwealth Bank of Australia', 'Financials'],
  ['CSL', 'CSL', 'Health Care'],
  ['NAB', 'National Australia Bank', 'Financials'],
  ['WBC', 'Westpac Banking Corporation', 'Financials'],
  ['ANZ', 'ANZ Group Holdings', 'Financials'],
  ['MQG', 'Macquarie Group', 'Financials'],
  ['WES', 'Wesfarmers', 'Consumer Discretionary'],
  ['WOW', 'Woolworths Group', 'Consumer Staples'],
  ['TLS', 'Telstra Group', 'Communication Services'],
  ['RIO', 'Rio Tinto', 'Materials'],
  ['FMG', 'Fortescue', 'Materials'],
  ['GMG', 'Goodman Group', 'Real Estate'],
  ['TCL', 'Transurban Group', 'Industrials'],
  ['ALL', 'Aristocrat Leisure', 'Consumer Discretionary'],
  ['QBE', 'QBE Insurance Group', 'Financials'],
  ['COL', 'Coles Group', 'Consumer Staples'],
  ['STO', 'Santos', 'Energy'],
  ['WDS', 'Woodside Energy Group', 'Energy'],
  ['XRO', 'Xero', 'Information Technology'],
  ['REA', 'REA Group', 'Communication Services'],
  ['RMD', 'ResMed', 'Health Care'],
  ['SUN', 'Suncorp Group', 'Financials'],
  ['IAG', 'Insurance Australia Group', 'Financials'],
  ['BXB', 'Brambles', 'Industrials'],
  ['CPU', 'Computershare', 'Industrials'],
  ['COH', 'Cochlear', 'Health Care'],
  ['SHL', 'Sonic Healthcare', 'Health Care'],
  ['NST', 'Northern Star Resources', 'Materials'],
  ['EVN', 'Evolution Mining', 'Materials'],
  ['ORG', 'Origin Energy', 'Utilities'],
  ['APA', 'APA Group', 'Utilities'],
  ['DMP', 'Domino’s Pizza Enterprises', 'Consumer Discretionary'],
  ['JBH', 'JB Hi-Fi', 'Consumer Discretionary'],
  ['CAR', 'CAR Group', 'Communication Services'],
  ['SEK', 'SEEK', 'Communication Services'],
  ['MIN', 'Mineral Resources', 'Materials'],
  ['S32', 'South32', 'Materials'],
  ['QAN', 'Qantas Airways', 'Industrials'],
  ['A2M', 'The a2 Milk Company', 'Consumer Staples']
];

function pctChange(now, before) {
  if (!Number.isFinite(now) || !Number.isFinite(before) || before <= 0) return 0;
  return ((now - before) / before) * 100;
}

function marketRegime(change5d) {
  if (change5d >= 1.5) return 'Constructive';
  if (change5d <= -1.5) return 'Defensive';
  return 'Mixed';
}

// ---------------------------------------------------------------------------
// ASX session / Sydney-time helper (Australia/Sydney handles AEST/AEDT DST
// automatically via the IANA tz database — no hard-coded UTC offset).
// ---------------------------------------------------------------------------
function sydneyStamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'short',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  }).formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  // tzName is 'GMT+10'/'GMT+11' on some Node ICU builds; derive AEST/AEDT
  // from the actual Sydney offset so the label is unambiguous.
  const offsetMinutes = sydneyOffsetMinutes(date);
  const abbr = offsetMinutes === 660 ? 'AEDT' : offsetMinutes === 600 ? 'AEST' : (parts.timeZoneName || '');
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  const weekday = parts.weekday;
  const isWeekday = !['Sat', 'Sun'].includes(weekday);
  // ASX continuous trading: 10:00–16:00 Sydney local, Mon–Fri (ignores
  // public holidays — this is a staleness label, not a trading calendar).
  const minutesOfDay = hour * 60 + minute;
  const isOpen = isWeekday && minutesOfDay >= 600 && minutesOfDay < 960;
  const label = `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute} ${abbr}`.trim();
  return { label, abbr, isOpen, weekday };
}

function sydneyOffsetMinutes(date) {
  // Compute the Australia/Sydney UTC offset for `date` (handles DST).
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Australia/Sydney',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  const parts = dtf.formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  const asUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour === '24' ? '0' : parts.hour), Number(parts.minute), Number(parts.second)
  );
  return Math.round((asUtc - date.getTime()) / 60000);
}

// ===========================================================================
// CANONICAL SIGNAL SPEC v1  (single source of truth — mirror in
// scripts/fetch_stocks.py and docs/RESPONSE-MATRIX-STANDARD.md)
//
// Inputs (percentages except relativeVolume, a ratio):
//   change1d        = (close[-1] - close[-2]) / close[-2] * 100
//   change5d        = (close[-1] - close[-6]) / close[-6] * 100  (5 sessions)
//   relativeVolume  = volume[-1] / mean(volume of the PRIOR up-to-20 sessions,
//                     EXCLUDING the current bar)
//
// signalState — top-to-bottom, FIRST match wins. Every label is reachable:
//   1. Breakout     : change1d >= 2  AND relativeVolume >= 1.5 AND change5d > 0
//   2. Volume Spike : relativeVolume >= 2.0 AND change1d > 0
//   3. Watch        : change1d > 0   AND change5d > 0
//   4. Sell Risk    : change1d <= -2 OR  change5d <= -5
//   5. No Action    : (default)
//   Watch precedes Sell Risk but never masks it (Watch needs both changes
//   positive; Sell Risk needs a negative move — they cannot overlap).
//
// riskState — top-to-bottom, FIRST match wins:
//   1. Elevated : signalState === 'Sell Risk' OR change1d <= -3 OR change5d <= -7
//   2. Review   : relativeVolume >= 2.0 OR abs(change1d) >= 3
//   3. Normal   : (default)
// ===========================================================================

function signalState(change1d, change5d, relativeVolume) {
  if (change1d >= 2 && relativeVolume >= 1.5 && change5d > 0) return 'Breakout';
  if (relativeVolume >= 2.0 && change1d > 0) return 'Volume Spike';
  if (change1d > 0 && change5d > 0) return 'Watch';
  if (change1d <= -2 || change5d <= -5) return 'Sell Risk';
  return 'No Action';
}

function riskState(change1d, change5d, relativeVolume, signal) {
  if (signal === 'Sell Risk' || change1d <= -3 || change5d <= -7) return 'Elevated';
  if (relativeVolume >= 2.0 || Math.abs(change1d) >= 3) return 'Review';
  return 'Normal';
}

async function fetchYahooChart(symbol) {
  const yahooSymbol = `${symbol}.AX`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=10d&interval=1d`;
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${symbol}: provider HTTP ${response.status}`);
  const payload = await response.json();
  const result = payload?.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const closes = (quote?.close || []).filter(Number.isFinite);
  const volumes = (quote?.volume || []).filter(Number.isFinite);
  if (closes.length < 2) throw new Error(`${symbol}: insufficient provider history`);
  const price = closes.at(-1);
  const prior = closes.at(-2);
  // change5d is only a true 5-session change when we have >= 6 closes.
  // With fewer bars we fall back to the earliest close but flag the window
  // as partial so downstream logic/UI don't treat it as a real 5-day move.
  const hasFullFiveDay = closes.length >= 6;
  const fivePrior = hasFullFiveDay ? closes.at(-6) : closes[0];
  // Canonical relVol: mean of the PRIOR up-to-20 sessions, EXCLUDING the
  // current bar, so a fresh spike isn't diluted into its own baseline.
  const priorVolumes = volumes.slice(0, -1).slice(-20);
  const avgVolume = priorVolumes.length ? priorVolumes.reduce((a, b) => a + b, 0) / priorVolumes.length : 0;
  const latestVolume = volumes.at(-1) || 0;
  const relativeVolume = avgVolume > 0 ? latestVolume / avgVolume : 1;
  return {
    price,
    change1d: pctChange(price, prior),
    change5d: pctChange(price, fivePrior),
    change5dPartial: !hasFullFiveDay,
    relativeVolume
  };
}

async function buildFeed() {
  const assets = [];
  const fetchErrors = [];
  for (const [symbol, name, sector] of ASX_UNIVERSE) {
    try {
      const data = await fetchYahooChart(symbol);
      const change1d = Number(data.change1d.toFixed(2));
      const change5d = Number(data.change5d.toFixed(2));
      const relativeVolume = Number(data.relativeVolume.toFixed(2));
      const signal = signalState(change1d, change5d, relativeVolume);
      assets.push({
        symbol,
        name,
        exchange: 'ASX',
        sector,
        price: Number(data.price.toFixed(3)),
        change1d,
        change5d,
        // True 5-session change only when >= 6 closes were available;
        // otherwise change5d is computed from the earliest bar and this
        // flag tells the UI/downstream not to treat it as a full window.
        change5dPartial: Boolean(data.change5dPartial),
        relativeVolume,
        marketRegime: marketRegime(change5d),
        region: 'Australia',
        currency: 'AUD',
        signalState: signal,
        riskState: riskState(change1d, change5d, relativeVolume, signal)
      });
    } catch (error) {
      fetchErrors.push({ symbol, message: error.message });
    }
  }

  const now = new Date();
  const sydney = sydneyStamp(now);
  const feed = {
    schema: 'sixquant.asx.feed.v2',
    source: 'Yahoo Finance chart endpoint via GitHub Action',
    mode: assets.length ? 'delayed' : 'offline',
    lastUpdated: now.toISOString(),
    lastUpdatedSydney: sydney.label,         // e.g. "23/06/2026 16:15 AEST"
    sydneyTimezone: sydney.abbr,             // "AEST" | "AEDT"
    asxSessionOpen: sydney.isOpen,           // best-effort (ignores holidays)
    symbols: ASX_UNIVERSE.map(([symbol]) => symbol),
    fetchErrors,
    marketRegimes: {
      Constructive: assets.filter(asset => asset.marketRegime === 'Constructive').length,
      Mixed: assets.filter(asset => asset.marketRegime === 'Mixed').length,
      Defensive: assets.filter(asset => asset.marketRegime === 'Defensive').length
    },
    assets
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');
  console.log(`ASX feed generated: ${assets.length} assets, ${fetchErrors.length} errors`);
  if (!assets.length) process.exitCode = 1;
}

buildFeed().catch(error => {
  console.error(error);
  process.exit(1);
});
