import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'asx-feed.json');
const HEARTBEAT_PATH = path.join(process.cwd(), 'data', 'heartbeat-asx.json');
const USER_AGENT = 'SixQuant-Terminal-ASX-Feed/2.0';

// ===========================================================================
// ASX LIQUID SWING-TRADING UNIVERSE  (static, documented — NOT a live feed)
//
//   Definition : the most liquid, large-capitalisation ASX-listed equities
//                across every GICS sector — the names an Australian swing
//                trader can realistically enter and exit without paying a
//                large spread. Constituents and sector tags are a point-in-time
//                editorial list maintained in THIS file; they are NOT pulled
//                from a paid index-membership feed.
//   Selection  : ASX 50 core + the most-traded ASX 51-100 names, filtered to
//                exclude illiquid microcaps per docs/ASX-LIVE-FEED-CONTRACT.md.
//   Source     : SixQuant editorial (see UNIVERSE_META.source) — maintained by
//                hand. Prices/changes ARE pulled live per-run from the provider;
//                the *membership list* is the static, version-stamped part.
//   Freshness  : bump UNIVERSE_META.revision + asOf whenever the list changes.
//                The UI shows this so the operator knows the universe vintage.
//   Boundary   : decision-support only. No order execution, no broker POST.
// ===========================================================================
const UNIVERSE_META = {
  name: 'ASX liquid large-cap swing-trading universe',
  source: 'SixQuant editorial static list (ASX 50 core + liquid ASX 51-100)',
  basis: 'Large-cap, multi-sector, liquidity-filtered. Point-in-time editorial — not a paid index-membership feed.',
  revision: 2,
  asOf: '2026-06-23',
  note: 'Membership is static and version-stamped; per-symbol prices are pulled live each run. Illiquid microcaps are intentionally excluded.'
};

const ASX_UNIVERSE = [
  // Financials — banks, insurers, diversified financials
  ['CBA', 'Commonwealth Bank of Australia', 'Financials'],
  ['NAB', 'National Australia Bank', 'Financials'],
  ['WBC', 'Westpac Banking Corporation', 'Financials'],
  ['ANZ', 'ANZ Group Holdings', 'Financials'],
  ['MQG', 'Macquarie Group', 'Financials'],
  ['QBE', 'QBE Insurance Group', 'Financials'],
  ['SUN', 'Suncorp Group', 'Financials'],
  ['IAG', 'Insurance Australia Group', 'Financials'],
  ['ASX', 'ASX Limited', 'Financials'],
  ['MFG', 'Magellan Financial Group', 'Financials'],
  // Materials — miners, gold, lithium, building materials
  ['BHP', 'BHP Group', 'Materials'],
  ['RIO', 'Rio Tinto', 'Materials'],
  ['FMG', 'Fortescue', 'Materials'],
  ['NST', 'Northern Star Resources', 'Materials'],
  ['EVN', 'Evolution Mining', 'Materials'],
  ['MIN', 'Mineral Resources', 'Materials'],
  ['S32', 'South32', 'Materials'],
  ['PLS', 'Pilbara Minerals', 'Materials'],
  ['IGO', 'IGO Limited', 'Materials'],
  ['JHX', 'James Hardie Industries', 'Materials'],
  ['AMC', 'Amcor', 'Materials'],
  ['SFR', 'Sandfire Resources', 'Materials'],
  // Health Care
  ['CSL', 'CSL', 'Health Care'],
  ['RMD', 'ResMed', 'Health Care'],
  ['COH', 'Cochlear', 'Health Care'],
  ['SHL', 'Sonic Healthcare', 'Health Care'],
  ['FPH', 'Fisher & Paykel Healthcare', 'Health Care'],
  ['PME', 'Pro Medicus', 'Health Care'],
  // Energy
  ['WDS', 'Woodside Energy Group', 'Energy'],
  ['STO', 'Santos', 'Energy'],
  ['WHC', 'Whitehaven Coal', 'Energy'],
  ['NHC', 'New Hope Corporation', 'Energy'],
  // Consumer Discretionary
  ['WES', 'Wesfarmers', 'Consumer Discretionary'],
  ['ALL', 'Aristocrat Leisure', 'Consumer Discretionary'],
  ['JBH', 'JB Hi-Fi', 'Consumer Discretionary'],
  ['DMP', 'Domino’s Pizza Enterprises', 'Consumer Discretionary'],
  ['HVN', 'Harvey Norman Holdings', 'Consumer Discretionary'],
  ['LOV', 'Lovisa Holdings', 'Consumer Discretionary'],
  ['TWE', 'Treasury Wine Estates', 'Consumer Discretionary'],
  // Consumer Staples
  ['WOW', 'Woolworths Group', 'Consumer Staples'],
  ['COL', 'Coles Group', 'Consumer Staples'],
  ['A2M', 'The a2 Milk Company', 'Consumer Staples'],
  ['EDV', 'Endeavour Group', 'Consumer Staples'],
  // Communication Services
  ['TLS', 'Telstra Group', 'Communication Services'],
  ['REA', 'REA Group', 'Communication Services'],
  ['CAR', 'CAR Group', 'Communication Services'],
  ['SEK', 'SEEK', 'Communication Services'],
  ['TPG', 'TPG Telecom', 'Communication Services'],
  // Information Technology
  ['XRO', 'Xero', 'Information Technology'],
  ['WTC', 'WiseTech Global', 'Information Technology'],
  ['NXT', 'NextDC', 'Information Technology'],
  ['TNE', 'Technology One', 'Information Technology'],
  // Industrials
  ['TCL', 'Transurban Group', 'Industrials'],
  ['BXB', 'Brambles', 'Industrials'],
  ['CPU', 'Computershare', 'Industrials'],
  ['QAN', 'Qantas Airways', 'Industrials'],
  ['REH', 'Reece', 'Industrials'],
  ['ALX', 'Atlas Arteria', 'Industrials'],
  // Real Estate
  ['GMG', 'Goodman Group', 'Real Estate'],
  ['SCG', 'Scentre Group', 'Real Estate'],
  ['SGP', 'Stockland', 'Real Estate'],
  ['GPT', 'GPT Group', 'Real Estate'],
  // Utilities
  ['ORG', 'Origin Energy', 'Utilities'],
  ['APA', 'APA Group', 'Utilities'],
  ['AGL', 'AGL Energy', 'Utilities']
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

// ---------------------------------------------------------------------------
// ASX trading-holiday calendar (national + NSW public holidays the exchange
// observes as a full closure). Keyed by Sydney-local YYYY-MM-DD. Maintained by
// hand — extend each year from the official ASX trading-calendar publication.
// Used so "market open" and freshness are correct on holidays. This is the
// authoritative closure list; the time-of-day window stays in sydneyStamp().
// ---------------------------------------------------------------------------
const ASX_HOLIDAYS = {
  // 2026
  '2026-01-01': "New Year's Day",
  '2026-01-26': 'Australia Day',
  '2026-04-03': 'Good Friday',
  '2026-04-06': 'Easter Monday',
  '2026-04-25': 'Anzac Day',
  '2026-06-08': "King's Birthday",
  '2026-12-25': 'Christmas Day',
  '2026-12-28': 'Boxing Day (observed)',
  // 2027
  '2027-01-01': "New Year's Day",
  '2027-01-26': 'Australia Day',
  '2027-03-26': 'Good Friday',
  '2027-03-29': 'Easter Monday',
  '2027-04-26': 'Anzac Day (observed)',
  '2027-06-14': "King's Birthday",
  '2027-12-27': 'Christmas Day (observed)',
  '2027-12-28': 'Boxing Day (observed)'
};

function sydneyDateKey(date) {
  // YYYY-MM-DD in Sydney local time.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function asxHolidayToday(date = new Date()) {
  return ASX_HOLIDAYS[sydneyDateKey(date)] || null;
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

// ---------------------------------------------------------------------------
// Feed validation — detect empty asset sets, stale prices, schema drift, and
// obvious anomalies BEFORE the feed is committed. Returns a list of problem
// strings; a non-empty list means the run is unhealthy and must NOT overwrite
// the last-good feed (we exit non-zero and write a degraded heartbeat instead).
// ---------------------------------------------------------------------------
const REQUIRED_ASSET_FIELDS = [
  'symbol', 'name', 'exchange', 'sector', 'price', 'change1d', 'change5d',
  'relativeVolume', 'marketRegime', 'region', 'currency', 'signalState', 'riskState'
];
const MIN_HEALTHY_ASSETS = 20;       // ASX-LIVE-FEED-CONTRACT.md MVP minimum
const MAX_ABS_DAILY_MOVE = 60;       // % — a single-session move beyond this is almost
                                     // certainly a bad tick / split, not a real swing.

function validateFeed(feed) {
  const problems = [];
  if (!feed || typeof feed !== 'object') return ['feed object missing'];
  if (feed.schema !== 'sixquant.asx.feed.v2') problems.push(`unexpected schema "${feed.schema}"`);
  const assets = Array.isArray(feed.assets) ? feed.assets : null;
  if (!assets) {
    problems.push('assets is not an array');
    return problems;
  }
  if (assets.length === 0) problems.push('asset set is EMPTY (no symbols fetched)');
  else if (assets.length < MIN_HEALTHY_ASSETS) {
    problems.push(`only ${assets.length} assets fetched (MVP minimum ${MIN_HEALTHY_ASSETS})`);
  }
  let pricedCount = 0;
  for (const asset of assets) {
    const sym = asset?.symbol || '(no symbol)';
    for (const field of REQUIRED_ASSET_FIELDS) {
      if (asset[field] === undefined || asset[field] === null) problems.push(`${sym}: missing field "${field}"`);
    }
    if (Number.isFinite(asset.price) && asset.price > 0) pricedCount += 1;
    else problems.push(`${sym}: non-positive or non-finite price (${asset.price})`);
    if (Number.isFinite(asset.change1d) && Math.abs(asset.change1d) > MAX_ABS_DAILY_MOVE) {
      problems.push(`${sym}: anomalous 1D move ${asset.change1d}% (> ${MAX_ABS_DAILY_MOVE}% — likely bad tick)`);
    }
  }
  // Stale-price guard: if EVERY priced asset reports an identical price the
  // provider is almost certainly serving a frozen/cached page.
  const distinctPrices = new Set(assets.map(a => a.price).filter(p => Number.isFinite(p)));
  if (pricedCount >= MIN_HEALTHY_ASSETS && distinctPrices.size === 1) {
    problems.push('all assets share one identical price (frozen/stale provider response)');
  }
  return problems;
}

async function writeHeartbeat(status, detail) {
  const beat = {
    feed: 'asx',
    lastRun: new Date().toISOString(),
    status,                       // 'ok' | 'degraded' | 'failed'
    ...(detail ? { detail } : {})
  };
  try {
    await mkdir(path.dirname(HEARTBEAT_PATH), { recursive: true });
    await writeFile(HEARTBEAT_PATH, `${JSON.stringify(beat, null, 2)}\n`, 'utf8');
  } catch (error) {
    console.error(`heartbeat write failed: ${error.message}`);
  }
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
  const holiday = asxHolidayToday(now);
  const feed = {
    schema: 'sixquant.asx.feed.v2',
    source: 'Yahoo Finance chart endpoint via GitHub Action',
    mode: assets.length ? 'delayed' : 'offline',
    dataClass: 'delayed-unlicensed',         // NEVER 'live'/'licensed' — this is a
                                             // delayed, non-licensed provider snapshot.
    lastUpdated: now.toISOString(),
    lastUpdatedSydney: sydney.label,         // e.g. "23/06/2026 16:15 AEST"
    sydneyTimezone: sydney.abbr,             // "AEST" | "AEDT"
    asxSessionOpen: sydney.isOpen && !holiday, // open flag now respects ASX holidays
    asxHoliday: holiday || null,             // holiday name when today is a closure
    freshnessSLAHours: 36,                   // see docs/ASX-LIVE-FEED-CONTRACT.md
    universeMeta: UNIVERSE_META,             // static universe vintage shown in UI
    symbols: ASX_UNIVERSE.map(([symbol]) => symbol),
    fetchErrors,
    marketRegimes: {
      Constructive: assets.filter(asset => asset.marketRegime === 'Constructive').length,
      Mixed: assets.filter(asset => asset.marketRegime === 'Mixed').length,
      Defensive: assets.filter(asset => asset.marketRegime === 'Defensive').length
    },
    assets
  };

  // Validate BEFORE committing. On failure we refuse to overwrite the last-good
  // feed and record a degraded heartbeat the UI already surfaces.
  const problems = validateFeed(feed);
  if (problems.length) {
    console.error('ASX feed validation FAILED — not writing data/asx-feed.json:');
    for (const p of problems) console.error(`  - ${p}`);
    await writeHeartbeat('degraded', problems.slice(0, 8).join('; '));
    process.exit(1);
  }

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');
  await writeHeartbeat('ok', `${assets.length} assets, ${fetchErrors.length} fetch errors`);
  console.log(`ASX feed generated: ${assets.length} assets, ${fetchErrors.length} errors`);
}

buildFeed().catch(async error => {
  console.error(error);
  await writeHeartbeat('failed', String(error?.message || error).slice(0, 200));
  process.exit(1);
});
